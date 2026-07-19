import { useState, useMemo, useCallback, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronLeft, Lock, MapPin, Clock, Banknote, Smartphone, Wallet, Upload, X, CheckCircle, ImageIcon } from 'lucide-react';
import {
  useGetCart,
  useCreateOrder,
  useListGovernorates,
  useGetPaymentSettings,
  type Governorate,
} from '@workspace/api-client-react';
import { useCart } from '@/context/cart';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { formatPrice, getProductImage } from '@/lib/utils';
import { toast } from 'sonner';

type PaymentMethod = 'COD' | 'INSTAPAY' | 'EWALLET';

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  governorateId: string;
  cityId: string;
  notes: string;
  couponCode: string;
}

const EMPTY: FormState = {
  fullName: '',
  phone: '',
  email: '',
  line1: '',
  line2: '',
  governorateId: '',
  cityId: '',
  notes: '',
  couponCode: '',
};

const inputCls = 'w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring';
const labelCls = 'font-sans text-xs text-muted-foreground block mb-1.5';
const errorCls = 'font-sans text-xs text-destructive mt-1';

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

async function uploadScreenshot(file: File): Promise<string> {
  // Step 1: request presigned URL
  const metaRes = await fetch('/api/storage/uploads/request-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || 'application/octet-stream' }),
  });
  if (!metaRes.ok) throw new Error('Could not get upload URL');
  const { uploadURL, objectPath } = await metaRes.json();

  // Step 2: PUT file directly to GCS
  const putRes = await fetch(uploadURL, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });
  if (!putRes.ok) throw new Error('Upload failed');

  return objectPath as string;
}

export default function CheckoutPage() {
  const { clearCart, cartId } = useCart();
  const [, navigate] = useLocation();
  const { data: cart } = useGetCart({ query: { retry: false } });
  const { data: governoratesRaw = [] } = useListGovernorates();
  const { data: paymentSettings } = useGetPaymentSettings();
  const createOrder = useCreateOrder();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'paymentMethod' | 'screenshot', string>>>({});
  const [placing, setPlacing] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const governorates: Governorate[] = Array.isArray(governoratesRaw) ? governoratesRaw : [];
  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;

  const selectedGovernorate = useMemo(
    () => governorates.find((g) => g.id === form.governorateId) ?? null,
    [governorates, form.governorateId],
  );
  const citiesForGov = selectedGovernorate?.cities ?? [];
  const shippingCost = selectedGovernorate ? Number(selectedGovernorate.shippingPrice) : null;
  const total = shippingCost !== null ? subtotal + shippingCost : null;

  const needsScreenshot = paymentMethod === 'INSTAPAY' || paymentMethod === 'EWALLET';

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'governorateId') next.cityId = '';
      return next;
    });
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const handleFile = useCallback((file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or PDF file');
      return;
    }
    setScreenshotFile(file);
    setErrors((e) => ({ ...e, screenshot: '' }));
    if (file.type !== 'application/pdf') {
      const url = URL.createObjectURL(file);
      setScreenshotPreview(url);
    } else {
      setScreenshotPreview(null);
    }
  }, []);

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.line1.trim()) errs.line1 = 'Address Line 1 is required';
    if (!form.line2.trim()) errs.line2 = 'Address Line 2 is required';
    if (!form.governorateId) errs.governorateId = 'Governorate is required';
    if (!form.cityId) errs.cityId = 'City is required';
    if (needsScreenshot && !screenshotFile) errs.screenshot = 'Please upload a payment screenshot';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    if (!cartId) { toast.error('Cart not ready. Please try again.'); return; }
    if (!validate()) { toast.error('Please fill in all required fields'); return; }

    const nameParts = form.fullName.trim().split(/\s+/);
    const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const selectedCity = citiesForGov.find((c) => c.id === form.cityId);

    setPlacing(true);
    try {
      let paymentScreenshotUrl: string | undefined;

      if (needsScreenshot && screenshotFile) {
        setUploading(true);
        try {
          paymentScreenshotUrl = await uploadScreenshot(screenshotFile);
        } finally {
          setUploading(false);
        }
      }

      await createOrder.mutateAsync({
        data: {
          shippingAddress: {
            firstName,
            lastName,
            line1: form.line1,
            line2: form.line2,
            city: selectedCity?.name ?? '',
            state: selectedGovernorate?.name ?? '',
            country: 'Egypt',
            phone: form.phone,
            email: form.email || undefined,
          },
          governorateId: form.governorateId || undefined,
          couponCode: form.couponCode || undefined,
          notes: form.notes || undefined,
          paymentMethod,
          paymentScreenshotUrl,
        },
        params: { cartId },
      });
      await clearCart();
      const msg = paymentMethod === 'COD'
        ? "Order placed! We'll confirm via phone."
        : "Order placed! We'll verify your payment and confirm shortly.";
      toast.success(msg);
      navigate('/');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Could not place order. Try again.');
    } finally {
      setPlacing(false);
    }
  };

  const paymentNumber = paymentMethod === 'INSTAPAY'
    ? (paymentSettings?.instapayNumber ?? '01030076090')
    : (paymentSettings?.ewalletNumber ?? '01030076090');

  const paymentInstructions = paymentMethod === 'INSTAPAY'
    ? (paymentSettings?.instapayInstructions ?? '')
    : paymentMethod === 'EWALLET'
    ? (paymentSettings?.ewalletInstructions ?? '')
    : null;

  const PAYMENT_METHODS: { id: PaymentMethod; label: string; description: string; icon: React.ElementType; enabled: boolean }[] = [
    {
      id: 'COD',
      label: 'Cash on Delivery',
      description: 'Pay in cash when your order arrives',
      icon: Banknote,
      enabled: paymentSettings?.codEnabled ?? true,
    },
    {
      id: 'INSTAPAY',
      label: 'InstaPay',
      description: 'Transfer via InstaPay then upload screenshot',
      icon: Smartphone,
      enabled: paymentSettings?.instapayEnabled ?? true,
    },
    {
      id: 'EWALLET',
      label: 'E-Wallet',
      description: 'Transfer via Vodafone Cash / Orange Money then upload screenshot',
      icon: Wallet,
      enabled: paymentSettings?.ewalletEnabled ?? true,
    },
  ].filter((m) => m.enabled);

  return (
    <Layout noFooter>
      <div className="container-site py-8">
        <Link href="/products" className="flex items-center gap-1 font-sans text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ChevronLeft className="size-3" /> Continue Shopping
        </Link>

        <h1 className="font-serif text-3xl mb-8">Checkout</h1>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-2xl mb-3">Your cart is empty</p>
            <Button asChild><Link href="/products">Shop Now</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* ── Form ─────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate className="lg:col-span-3 space-y-6">

              {/* Shipping Address */}
              <section>
                <h2 className="font-sans text-xs tracking-widest uppercase mb-4">Shipping Address</h2>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputCls} placeholder="Ahmed Mohamed" />
                    {errors.fullName && <p className={errorCls}>{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number *</label>
                    <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="+20 10 0000 0000" />
                    {errors.phone && <p className={errorCls}>{errors.phone}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Email (optional)</label>
                    <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Address Line 1 *</label>
                    <input value={form.line1} onChange={(e) => set('line1', e.target.value)} className={inputCls} placeholder="Street name and building number" />
                    {errors.line1 && <p className={errorCls}>{errors.line1}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Address Line 2 *</label>
                    <input value={form.line2} onChange={(e) => set('line2', e.target.value)} className={inputCls} placeholder="Apartment, floor, landmark…" />
                    {errors.line2 && <p className={errorCls}>{errors.line2}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Governorate *</label>
                    <select value={form.governorateId} onChange={(e) => set('governorateId', e.target.value)} className={inputCls}>
                      <option value="">Select governorate…</option>
                      {governorates.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}{g.nameAr ? ` — ${g.nameAr}` : ''}</option>
                      ))}
                    </select>
                    {errors.governorateId && <p className={errorCls}>{errors.governorateId}</p>}
                  </div>
                  {form.governorateId && (
                    <div>
                      <label className={labelCls}>City *</label>
                      <select value={form.cityId} onChange={(e) => set('cityId', e.target.value)} className={inputCls}>
                        <option value="">Select city…</option>
                        {citiesForGov.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}{c.nameAr ? ` — ${c.nameAr}` : ''}</option>
                        ))}
                      </select>
                      {errors.cityId && <p className={errorCls}>{errors.cityId}</p>}
                    </div>
                  )}
                  {selectedGovernorate && (
                    <div className="flex items-start gap-3 bg-accent/50 border border-border rounded-sm px-4 py-3">
                      <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-sans text-sm">
                          Shipping to <strong>{selectedGovernorate.name}</strong>:{' '}
                          <span className="font-medium">{formatPrice(Number(selectedGovernorate.shippingPrice))}</span>
                        </p>
                        <p className="font-sans text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="size-3" />
                          Estimated delivery: {selectedGovernorate.estimatedDays} business day{selectedGovernorate.estimatedDays !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Payment Method */}
              <section>
                <h2 className="font-sans text-xs tracking-widest uppercase mb-4">Payment Method</h2>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(({ id, label, description, icon: Icon }) => {
                    const selected = paymentMethod === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setPaymentMethod(id); setErrors((e) => ({ ...e, screenshot: '' })); }}
                        className={[
                          'w-full flex items-center gap-4 px-4 py-3.5 rounded-sm border text-left transition-all',
                          selected
                            ? 'border-foreground bg-foreground/[0.03] shadow-sm'
                            : 'border-border hover:border-foreground/40',
                        ].join(' ')}
                      >
                        <div className={['size-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
                          selected ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'].join(' ')}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1">
                          <p className={['font-sans text-sm font-medium', selected ? 'text-foreground' : 'text-foreground/80'].join(' ')}>
                            {label}
                          </p>
                          <p className="font-sans text-xs text-muted-foreground">{description}</p>
                        </div>
                        <div className={['size-4 rounded-full border-2 shrink-0 transition-all',
                          selected ? 'border-foreground bg-foreground' : 'border-border'].join(' ')} />
                      </button>
                    );
                  })}
                </div>
                {errors.paymentMethod && <p className={errorCls}>{errors.paymentMethod}</p>}

                {/* Transfer instructions + screenshot upload */}
                {needsScreenshot && (
                  <div className="mt-4 space-y-4">
                    {/* Account info card */}
                    <div className="bg-accent/60 border border-border rounded-sm px-4 py-3.5 space-y-1">
                      <p className="font-sans text-xs text-muted-foreground tracking-wider uppercase">
                        {paymentMethod === 'INSTAPAY' ? 'InstaPay Number' : 'Wallet Number'}
                      </p>
                      <p className="font-sans text-xl font-semibold tracking-widest">{paymentNumber}</p>
                      {paymentInstructions && (
                        <p className="font-sans text-xs text-muted-foreground pt-1">{paymentInstructions}</p>
                      )}
                    </div>

                    {/* Screenshot upload */}
                    <div>
                      <p className="font-sans text-xs text-muted-foreground mb-2">Upload Payment Screenshot *</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={onFilePick}
                      />

                      {!screenshotFile ? (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={onDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={[
                            'border-2 border-dashed rounded-sm px-6 py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors',
                            dragOver ? 'border-foreground bg-accent/40' : 'border-border hover:border-foreground/40 hover:bg-accent/20',
                          ].join(' ')}
                        >
                          <Upload className="size-6 text-muted-foreground" />
                          <p className="font-sans text-sm text-center text-muted-foreground">
                            Drag & drop or <span className="text-foreground underline">browse</span>
                          </p>
                          <p className="font-sans text-xs text-muted-foreground/70">JPG, JPEG, PNG, PDF accepted</p>
                        </div>
                      ) : (
                        <div className="border border-border rounded-sm overflow-hidden">
                          {screenshotPreview ? (
                            <img src={screenshotPreview} alt="Screenshot preview" className="w-full max-h-48 object-contain bg-muted" />
                          ) : (
                            <div className="h-24 flex items-center justify-center gap-2 bg-muted">
                              <ImageIcon className="size-5 text-muted-foreground" />
                              <span className="font-sans text-sm text-muted-foreground">{screenshotFile.name}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between px-3 py-2 bg-card border-t border-border">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="size-3.5 text-green-600" />
                              <span className="font-sans text-xs text-muted-foreground truncate max-w-[180px]">{screenshotFile.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      {errors.screenshot && <p className={errorCls}>{errors.screenshot}</p>}
                    </div>
                  </div>
                )}
              </section>

              {/* Coupon */}
              <section>
                <h2 className="font-sans text-xs tracking-widest uppercase mb-4">Coupon Code</h2>
                <div className="flex gap-2">
                  <input
                    value={form.couponCode}
                    onChange={(e) => set('couponCode', e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button type="button" variant="outline" size="sm">Apply</Button>
                </div>
              </section>

              {/* Notes */}
              <section>
                <h2 className="font-sans text-xs tracking-widest uppercase mb-4">Order Notes</h2>
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  placeholder="Any special instructions…"
                  className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </section>

              <Button type="submit" size="lg" className="w-full" disabled={placing || uploading}>
                <Lock className="size-4 mr-2" />
                {uploading ? 'Uploading screenshot…' : placing ? 'Placing Order…' : 'Place Order'}
              </Button>
              <p className="font-sans text-xs text-muted-foreground text-center">
                {paymentMethod === 'COD'
                  ? 'Your order will be confirmed by our team. Pay cash on delivery.'
                  : 'We will verify your payment screenshot and confirm your order shortly.'}
              </p>
            </form>

            {/* ── Order Summary ───────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-sm p-6 sticky top-24">
                <h2 className="font-sans text-xs tracking-widest uppercase mb-4">Order Summary</h2>
                <div className="space-y-3 mb-5">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-16 flex-shrink-0 bg-muted rounded-sm overflow-hidden">
                        <img src={getProductImage(item.product?.images)} alt={item.product?.title ?? ''} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm truncate">{item.product?.title}</p>
                        {item.variant && <p className="font-sans text-xs text-muted-foreground">Size: {item.variant.label}</p>}
                        <p className="font-sans text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="font-sans text-sm">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4 space-y-2.5">
                  <div className="flex justify-between font-sans text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-sans text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    {shippingCost !== null ? (
                      <span className="font-medium">{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">Select governorate</span>
                    )}
                  </div>
                  <div className="flex justify-between font-sans text-sm font-medium pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{total !== null ? formatPrice(total) : formatPrice(subtotal)}</span>
                  </div>
                  {selectedGovernorate && (
                    <div className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground pt-1">
                      <Clock className="size-3 shrink-0" />
                      <span>Est. delivery: {selectedGovernorate.estimatedDays} business day{selectedGovernorate.estimatedDays !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
