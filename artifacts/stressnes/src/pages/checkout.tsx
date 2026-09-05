import { useState, useMemo, useCallback, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ChevronLeft, Lock, MapPin, Clock, Banknote, Smartphone,
  Wallet, Upload, X, CheckCircle, ImageIcon, Shield, Package,
} from 'lucide-react';
import {
  useGetCart,
  useCreateOrder,
  useListGovernorates,
  useGetPaymentSettings,
  type Governorate,
} from '@workspace/api-client-react';
import { useCart } from '@/context/cart';
import { Button } from '@/components/ui/button';

import { BrandMark } from '@/components/BrandMark';
import { formatPrice, getProductImage, cn } from '@/lib/utils';
import { siteConfig } from '@/config/site';
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

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

async function uploadScreenshot(file: File): Promise<string> {
  const metaRes = await fetch('/api/storage/uploads/request-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || 'application/octet-stream' }),
  });
  if (!metaRes.ok) throw new Error('Could not get upload URL');
  const { uploadURL, objectPath } = await metaRes.json();
  const putRes = await fetch(uploadURL, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });
  if (!putRes.ok) throw new Error('Upload failed');
  return objectPath as string;
}

// ── Shared input classes ──────────────────────────────────────────────────────
const inputCls =
  'w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent ' +
  'focus:outline-none focus:ring-2 focus:ring-[#C8A96E]/60 focus:border-[#C8A96E] transition-colors';
const labelCls = 'font-sans text-[11px] tracking-widest uppercase text-muted-foreground block mb-1.5';
const errorCls = 'font-sans text-xs text-destructive mt-1';

// ── Step header ───────────────────────────────────────────────────────────────
function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="flex-shrink-0 size-7 rounded-full flex items-center justify-center text-xs font-semibold font-sans"
        style={{ background: '#C8A96E', color: '#1A1814' }}
      >
        {n}
      </span>
      <h2 className="font-serif text-lg tracking-wide">{title}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function CheckoutPage() {
  const { clearCart, cartId, pendingCheckoutItem } = useCart();
  const [, navigate] = useLocation();
  const { data: cart } = useGetCart({ query: { retry: false, staleTime: 30_000 } });
  const { data: governoratesRaw = [], isLoading: governoratesLoading } = useListGovernorates();
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

  // Real cart items once they've synced, or the client-side placeholder from
  // "Buy Now" while that sync is still in flight. Never shown at the same time
  // — the cart context clears the placeholder the moment real items arrive.
  const realItems = cart?.items ?? [];
  const items = realItems.length > 0
    ? realItems
    : pendingCheckoutItem
    ? [pendingCheckoutItem]
    : [];

  const realSubtotal = cart?.subtotal ?? 0;
  const subtotal = realItems.length > 0
    ? realSubtotal
    : pendingCheckoutItem
    ? pendingCheckoutItem.price * pendingCheckoutItem.quantity
    : 0;

  // The order can only actually be placed once the server-side cart is
  // confirmed to exist — the placeholder is display-only.
  const cartReady = !!cartId && realItems.length > 0;

  const selectedGovernorate = useMemo(
    () => governorates.find((g) => g.id === form.governorateId) ?? null,
    [governorates, form.governorateId],
  );
  const citiesForGov = selectedGovernorate?.cities ?? [];
  const selectedCity = useMemo(
    () => citiesForGov.find((c) => c.id === form.cityId) ?? null,
    [citiesForGov, form.cityId],
  );
  const shippingCost = selectedGovernorate
    ? Number(selectedGovernorate.shippingPrice) || 0
    : null;
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
      setScreenshotPreview(URL.createObjectURL(file));
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
    if (!form.governorateId) errs.governorateId = 'Governorate is required';
    if (!form.cityId) errs.cityId = 'City is required';
    if (needsScreenshot && !screenshotFile) errs.screenshot = 'Please upload a payment screenshot';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartReady) {
      toast.error('Still preparing your order — please wait a moment and try again');
      return;
    }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    if (!cartId) { toast.error('Cart not ready. Please try again.'); return; }
    if (!validate()) { toast.error('Please fill in all required fields'); return; }

    const nameParts = form.fullName.trim().split(/\s+/);
    const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    setPlacing(true);
    try {
      let paymentScreenshotUrl: string | undefined;
      if (needsScreenshot && screenshotFile) {
        setUploading(true);
        try {
          paymentScreenshotUrl = await uploadScreenshot(screenshotFile);
        } catch (uploadErr) {
          // Screenshot upload failed (e.g. storage not configured).
          // The order is still placed — the admin can request the screenshot
          // manually. We warn but do NOT block the customer.
          console.warn('[checkout] screenshot upload failed, proceeding without it:', uploadErr);
          toast.warning('Could not attach screenshot — your order will still be placed. Please send your payment proof to our team directly.');
        } finally {
          setUploading(false);
        }
      }

      const createdOrder = await createOrder.mutateAsync({
        data: {
          shippingAddress: {
            firstName, lastName,
            line1: form.line1,
            line2: form.line2,
            city: selectedCity?.name ?? '',
            state: selectedGovernorate?.name ?? '',
            country: 'Egypt',
            phone: form.phone,
            email: form.email || undefined,
          },
          governorateId: form.governorateId || undefined,
          cityId: form.cityId || undefined,
          couponCode: form.couponCode || undefined,
          notes: form.notes || undefined,
          paymentMethod,
          paymentScreenshotUrl,
        },
        params: { cartId },
      });

      // Real Meta Pixel Purchase event — only fires here, once, right after
      // the order is confirmed created server-side. This is what was missing:
      // Ads Manager was showing modeled/estimated purchases, not real ones,
      // which is why they never matched a real order or a Telegram message.
      (window as any).fbq?.('track', 'Purchase', {
        value: total ?? subtotal,
        currency: 'EGP',
        content_ids: items.map((item: any) => item.product?.id).filter(Boolean),
        content_type: 'product',
        num_items: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      }, { eventID: createdOrder?.orderNumber ?? createdOrder?.id });

      // Cart is already cleared server-side by the time we get here — don't
      // make the customer wait on the client-side cache reset too.
      clearCart().catch((err) => console.warn('[checkout] clearCart failed (non-blocking):', err));
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
    ? siteConfig.payment.instapayLink
    : (paymentSettings?.ewalletNumber ?? '01030076090');

  const paymentInstructions = paymentMethod === 'INSTAPAY'
    ? (paymentSettings?.instapayInstructions ?? '')
    : paymentMethod === 'EWALLET'
    ? (paymentSettings?.ewalletInstructions ?? '')
    : null;

  const PAYMENT_METHODS: {
    id: PaymentMethod; label: string; description: string; icon: React.ElementType; enabled: boolean;
  }[] = [
    { id: 'COD', label: 'Cash on Delivery', description: 'Pay in cash when your order arrives', icon: Banknote, enabled: paymentSettings?.codEnabled ?? true },
    { id: 'INSTAPAY', label: 'InstaPay', description: 'Transfer via InstaPay then upload screenshot', icon: Smartphone, enabled: paymentSettings?.instapayEnabled ?? true },
    { id: 'EWALLET', label: 'E-Wallet', description: 'Vodafone Cash / Orange Money', icon: Wallet, enabled: paymentSettings?.ewalletEnabled ?? true },
  ].filter((m) => m.enabled);

  // Truly empty only when there's no real cart AND no pending Buy Now item.
  const showEmptyState = items.length === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Brand header ─────────────────────────────────────────────── */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-40">
        <div className="container-site">
          <div className="h-14 flex items-center justify-between">

            {/* Left — back link; text hidden on mobile to avoid overlap */}
            <Link
              href="/products"
              className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground hover:text-foreground transition-colors min-w-[32px]"
            >
              <ChevronLeft className="size-4 shrink-0" />
              <span className="hidden sm:inline">Continue Shopping</span>
            </Link>

            {/* Centre — logo + title, absolutely centred so it never gets pushed */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              <BrandMark
                size={20}
                style={{ color: '#C8A96E' }}
                aria-hidden
              />
              <span className="font-sans text-[11px] tracking-[0.25em] uppercase font-medium whitespace-nowrap">
                Secure Checkout
              </span>
            </Link>

            {/* Right — SSL badge; text hidden on mobile */}
            <div className="flex items-center gap-1.5 min-w-[32px] justify-end">
              <Lock className="size-3.5 shrink-0" style={{ color: '#C8A96E' }} />
              <span className="font-sans text-[10px] tracking-wider uppercase text-muted-foreground hidden sm:block">
                SSL Encrypted
              </span>
            </div>

          </div>
        </div>

        {/* Gold accent rule */}
        <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, #C8A96E 30%, #C8A96E 70%, transparent)' }} />
      </header>

      {/* ── Page body ────────────────────────────────────────────────── */}
      <div className="flex-1 container-site py-10">

        {showEmptyState ? (
          <div className="text-center py-24">
            <BrandMark size={40} style={{ color: '#C8A96E' }} className="mx-auto mb-5" />
            <p className="font-serif text-2xl mb-2">Your cart is empty</p>
            <p className="font-sans text-sm text-muted-foreground mb-6">Add something beautiful before checking out.</p>
            <Button asChild><Link href="/products">Shop Now</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 xl:gap-16">

            {/* ── Left: Form ───────────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate className="order-2 lg:order-1 lg:col-span-3 space-y-10">

              {/* Step 1 — Shipping */}
              <section>
                <StepHeader n={1} title="Shipping Address" />
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Full Name *</label>
                      <input
                        value={form.fullName}
                        onChange={(e) => set('fullName', e.target.value)}
                        className={inputCls}
                        placeholder="Ahmed Mohamed"
                      />
                      {errors.fullName && <p className={errorCls}>{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set('phone', e.target.value)}
                        className={inputCls}
                        placeholder="+20 10 0000 0000"
                      />
                      {errors.phone && <p className={errorCls}>{errors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Email (optional)</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      className={inputCls}
                      placeholder="you@example.com"
                    />
                  </div>

                  {/* Governorate + City row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Governorate *</label>
                      <select
                        value={form.governorateId}
                        onChange={(e) => set('governorateId', e.target.value)}
                        disabled={governoratesLoading}
                        className={inputCls + ' cursor-pointer'}
                        style={{ appearance: 'auto' }}
                      >
                        <option value="">
                          {governoratesLoading ? 'Loading governorates…' : 'Select governorate…'}
                        </option>
                        {governorates.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}{g.nameAr ? ` — ${g.nameAr}` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.governorateId && <p className={errorCls}>{errors.governorateId}</p>}
                    </div>

                    <div>
                      <label className={labelCls}>City *</label>
                      <select
                        value={form.cityId}
                        onChange={(e) => set('cityId', e.target.value)}
                        disabled={governoratesLoading || !form.governorateId}
                        className={inputCls + ' cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'}
                        style={{ appearance: 'auto' }}
                      >
                        <option value="">
                          {governoratesLoading
                            ? 'Loading…'
                            : form.governorateId
                            ? citiesForGov.length === 0
                              ? 'No cities available'
                              : 'Select city…'
                            : 'Select governorate first'}
                        </option>
                        {citiesForGov.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}{c.nameAr ? ` — ${c.nameAr}` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.cityId && <p className={errorCls}>{errors.cityId}</p>}
                    </div>
                  </div>

                  {/* Shipping confirmation card */}
                  {selectedGovernorate && (
                    <div
                      className="flex items-start gap-3 rounded-sm px-4 py-3.5 border"
                      style={{ background: '#C8A96E14', borderColor: '#C8A96E55' }}
                    >
                      <MapPin className="size-4 shrink-0 mt-0.5" style={{ color: '#C8A96E' }} />
                      <div className="flex-1">
                        <p className="font-sans text-sm">
                          Shipping to{' '}
                          <strong>
                            {selectedCity
                              ? `${selectedCity.name}, ${selectedGovernorate.name}`
                              : selectedGovernorate.name}
                          </strong>
                          {' '}—{' '}
                          <span className="font-semibold" style={{ color: '#C8A96E' }}>
                            {shippingCost === 0 ? 'Free' : formatPrice(shippingCost ?? 0)}
                          </span>
                        </p>
                        <p className="font-sans text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Clock className="size-3" />
                          Estimated delivery: {selectedGovernorate.estimatedDays} business day
                          {selectedGovernorate.estimatedDays !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={labelCls}>Address Line 1 *</label>
                    <input
                      value={form.line1}
                      onChange={(e) => set('line1', e.target.value)}
                      className={inputCls}
                      placeholder="Street name and building number"
                    />
                    {errors.line1 && <p className={errorCls}>{errors.line1}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Address Line 2 <span className="normal-case text-muted-foreground/60">(optional)</span></label>
                    <input
                      value={form.line2}
                      onChange={(e) => set('line2', e.target.value)}
                      className={inputCls}
                      placeholder="Apartment, floor, landmark…"
                    />
                  </div>
                </div>
              </section>

              {/* Step 2 — Payment */}
              <section>
                <StepHeader n={2} title="Payment Method" />
                <div className="space-y-2.5">
                  {PAYMENT_METHODS.map(({ id, label, description, icon: Icon }) => {
                    const selected = paymentMethod === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setPaymentMethod(id); setErrors((e) => ({ ...e, screenshot: '' })); }}
                        className={cn(
                          'w-full flex items-center gap-4 px-4 py-4 rounded-sm border text-left transition-all duration-200',
                          selected
                            ? 'shadow-sm'
                            : 'border-border hover:border-foreground/30',
                        )}
                        style={selected ? { borderColor: '#C8A96E', background: '#C8A96E08' } : {}}
                      >
                        {/* Icon circle */}
                        <div
                          className="size-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
                          style={
                            selected
                              ? { background: '#C8A96E', color: '#1A1814' }
                              : {}
                          }
                          // fallback classes when not selected
                          {...(!selected && { className: 'size-10 rounded-full flex items-center justify-center shrink-0 bg-muted text-muted-foreground' })}
                        >
                          <Icon className="size-4" />
                        </div>

                        <div className="flex-1">
                          <p className={cn('font-sans text-sm font-semibold', selected ? '' : 'text-foreground/80')}>
                            {label}
                          </p>
                          <p className="font-sans text-xs text-muted-foreground mt-0.5">{description}</p>
                        </div>

                        {/* Radio dot */}
                        <div
                          className="size-4 rounded-full border-2 shrink-0 transition-all duration-200 flex items-center justify-center"
                          style={selected ? { borderColor: '#C8A96E', background: '#C8A96E' } : {}}
                          {...(!selected && { className: 'size-4 rounded-full border-2 shrink-0 border-border' })}
                        >
                          {selected && <div className="size-1.5 rounded-full bg-[#1A1814]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Transfer instructions + screenshot */}
                {needsScreenshot && (
                  <div className="mt-5 space-y-4">
                    <div
                      className="rounded-sm px-4 py-4 space-y-1.5 border"
                      style={{ background: '#C8A96E10', borderColor: '#C8A96E40' }}
                    >
                      <p className="font-sans text-[10px] tracking-widest uppercase" style={{ color: '#C8A96E' }}>
                        {paymentMethod === 'INSTAPAY' ? 'InstaPay Payment Link' : 'Wallet Number'}
                      </p>
                      {paymentMethod === 'INSTAPAY' && paymentNumber.startsWith('https://') ? (
                        <a
                          href={paymentNumber}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Press here to pay with InstaPay"
                          className="block font-sans text-sm sm:text-base font-semibold break-all underline underline-offset-4 hover:opacity-80 transition-opacity"
                          style={{ color: '#1A1814' }}
                        >
                          Press here to pay with InstaPay
                        </a>
                      ) : (
                        <p className="font-sans text-2xl font-semibold tracking-widest break-all">{paymentNumber}</p>
                      )}
                      {(paymentMethod === 'INSTAPAY' ? siteConfig.payment.instapayAccountName : paymentSettings?.accountName) && (
                        <p className="font-sans text-xs text-muted-foreground">
                          Account name:{' '}
                          <span className="font-medium text-foreground">
                            {paymentMethod === 'INSTAPAY' ? siteConfig.payment.instapayAccountName : paymentSettings?.accountName}
                          </span>
                        </p>
                      )}
                      {paymentInstructions && (
                        <p className="font-sans text-xs text-muted-foreground pt-0.5">{paymentInstructions}</p>
                      )}
                    </div>

                    <div>
                      <p className={labelCls}>Upload Payment Screenshot *</p>
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
                          className={cn(
                            'border-2 border-dashed rounded-sm px-6 py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors',
                            dragOver ? 'border-[#C8A96E] bg-[#C8A96E08]' : 'border-border hover:border-[#C8A96E]/50',
                          )}
                        >
                          <Upload className="size-6 text-muted-foreground" />
                          <p className="font-sans text-sm text-center text-muted-foreground">
                            Drag & drop or <span className="underline" style={{ color: '#C8A96E' }}>browse</span>
                          </p>
                          <p className="font-sans text-xs text-muted-foreground/60">JPG, PNG, PDF accepted</p>
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
                              <CheckCircle className="size-3.5" style={{ color: '#C8A96E' }} />
                              <span className="font-sans text-xs text-muted-foreground truncate max-w-[200px]">{screenshotFile.name}</span>
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

              {/* Step 3 — Extras */}
              <section>
                <StepHeader n={3} title="Extras" />
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Coupon Code</label>
                    <div className="flex gap-2">
                      <input
                        value={form.couponCode}
                        onChange={(e) => set('couponCode', e.target.value)}
                        placeholder="Enter coupon code"
                        className={inputCls + ' flex-1'}
                      />
                      <Button type="button" variant="outline" size="sm" className="shrink-0">Apply</Button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Order Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => set('notes', e.target.value)}
                      rows={3}
                      placeholder="Any special instructions…"
                      className={inputCls + ' resize-none'}
                    />
                  </div>
                </div>
              </section>

              {/* Place order CTA */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={placing || uploading}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-sm font-sans text-sm font-semibold tracking-widest uppercase transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: '#1A1814', color: '#FAF8F5' }}
                  onMouseEnter={(e) => { if (!placing && !uploading) (e.currentTarget as HTMLButtonElement).style.background = '#C8A96E'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1A1814'; }}
                  onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#1A1814'; }}
                  onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FAF8F5'; }}
                >
                  <Lock className="size-3.5" />
                  {uploading ? 'Uploading…' : placing ? 'Placing Order…' : !cartReady ? 'Preparing Order…' : 'Place Order'}
                </button>

                {/* Trust row */}
                <div className="flex items-center justify-center gap-5 pt-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Shield className="size-3.5" style={{ color: '#C8A96E' }} />
                    <span className="font-sans text-[10px] tracking-wider uppercase">SSL Secured</span>
                  </div>
                  <div className="w-px h-3 bg-border" />
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Package className="size-3.5" style={{ color: '#C8A96E' }} />
                    <span className="font-sans text-[10px] tracking-wider uppercase">
                      {paymentMethod === 'COD' ? 'Pay on Delivery' : 'Verified on Receipt'}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-border" />
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BrandMark size={12} style={{ color: '#C8A96E' }} aria-hidden />
                    <span className="font-sans text-[10px] tracking-wider uppercase">STRESSNES</span>
                  </div>
                </div>
              </div>
            </form>

            {/* ── Right: Order Summary (dark panel) ───────────────── */}
            <div className="order-1 lg:order-2 lg:col-span-2">
              <div
                className="rounded-sm overflow-hidden lg:sticky lg:top-24"
                style={{ background: '#1A1814', color: '#F2EDE5' }}
              >
                {/* Panel header */}
                <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: '#C8A96E33' }}>
                  <div className="flex items-center gap-2.5 mb-1">
                    <BrandMark size={14} style={{ color: '#C8A96E' }} aria-hidden />
                    <p className="font-sans text-[10px] tracking-[0.25em] uppercase" style={{ color: '#C8A96E' }}>
                      Order Summary
                    </p>
                  </div>
                  <p className="font-serif text-xl" style={{ color: '#F2EDE5' }}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                {/* Items */}
                <div className="px-6 py-4 space-y-4">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-16 flex-shrink-0 rounded-sm overflow-hidden" style={{ background: '#2A2520' }}>
                        <img
                          src={getProductImage(item.product?.images)}
                          alt={item.product?.title ?? ''}
                          className="w-full h-full object-cover opacity-90"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm truncate" style={{ color: '#F2EDE5' }}>
                          {item.product?.title}
                        </p>
                        {item.variant && (
                          <p className="font-sans text-xs mt-0.5" style={{ color: '#8A8070' }}>
                            {(item.variant as any).size ?? (item.variant as any).label ?? ''}
                          </p>
                        )}
                        <p className="font-sans text-xs mt-0.5" style={{ color: '#8A8070' }}>
                          Qty: {item.quantity}
                        </p>
                        <p className="font-sans text-sm font-medium mt-1" style={{ color: '#C8A96E' }}>
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="px-6 pb-6 pt-4 border-t space-y-3" style={{ borderColor: '#C8A96E33' }}>
                  <div className="flex justify-between font-sans text-sm">
                    <span style={{ color: '#8A8070' }}>Subtotal</span>
                    <span style={{ color: '#F2EDE5' }}>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-sans text-sm">
                    <span style={{ color: '#8A8070' }}>Shipping</span>
                    {shippingCost !== null ? (
                      <span className="font-semibold" style={{ color: '#C8A96E' }}>
                        {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                      </span>
                    ) : (
                      <span className="text-xs italic" style={{ color: '#8A8070' }}>
                        Select governorate
                      </span>
                    )}
                  </div>

                  {/* Gold divider */}
                  <div className="h-px" style={{ background: '#C8A96E33' }} />

                  <div className="flex justify-between font-sans text-base font-semibold">
                    <span style={{ color: '#F2EDE5' }}>Total</span>
                    <span style={{ color: '#C8A96E' }}>
                      {total !== null ? formatPrice(total) : formatPrice(subtotal)}
                    </span>
                  </div>

                  {selectedGovernorate && (
                    <div className="flex items-center gap-1.5 font-sans text-xs pt-1" style={{ color: '#8A8070' }}>
                      <Clock className="size-3 shrink-0" />
                      <span>
                        Est. delivery: {selectedGovernorate.estimatedDays} business day
                        {selectedGovernorate.estimatedDays !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
