import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronLeft, Lock, MapPin, Clock } from 'lucide-react';
import {
  useGetCart,
  useCreateOrder,
  useListGovernorates,
  type Governorate,
} from '@workspace/api-client-react';
import { useCart } from '@/context/cart';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { formatPrice, getProductImage } from '@/lib/utils';
import { toast } from 'sonner';

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

export default function CheckoutPage() {
  const { clearCart, cartId } = useCart();
  const [, navigate] = useLocation();
  const { data: cart } = useGetCart({ query: { retry: false } });
  const { data: governoratesRaw = [] } = useListGovernorates();
  const createOrder = useCreateOrder();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [placing, setPlacing] = useState(false);

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

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Reset city when governorate changes
      if (key === 'governorateId') next.cityId = '';
      return next;
    });
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.line1.trim()) errs.line1 = 'Address Line 1 is required';
    if (!form.line2.trim()) errs.line2 = 'Address Line 2 is required';
    if (!form.governorateId) errs.governorateId = 'Governorate is required';
    if (!form.cityId) errs.cityId = 'City is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    if (!cartId) { toast.error('Cart not ready. Please try again.'); return; }
    if (!validate()) { toast.error('Please fill in all required fields'); return; }

    // Split full name into first / last
    const nameParts = form.fullName.trim().split(/\s+/);
    const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    // Look up selected city name and governorate name
    const selectedCity = citiesForGov.find((c) => c.id === form.cityId);

    setPlacing(true);
    try {
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
        },
        params: { cartId },
      });
      await clearCart();
      toast.success("Order placed! We'll be in touch to confirm.");
      navigate('/');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Could not place order. Try again.');
    } finally {
      setPlacing(false);
    }
  };

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

                  {/* Full Name */}
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

                  {/* Phone */}
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

                  {/* Email */}
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

                  {/* Address Line 1 */}
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

                  {/* Address Line 2 */}
                  <div>
                    <label className={labelCls}>Address Line 2 *</label>
                    <input
                      value={form.line2}
                      onChange={(e) => set('line2', e.target.value)}
                      className={inputCls}
                      placeholder="Apartment, floor, landmark…"
                    />
                    {errors.line2 && <p className={errorCls}>{errors.line2}</p>}
                  </div>

                  {/* Governorate */}
                  <div>
                    <label className={labelCls}>Governorate *</label>
                    <select
                      value={form.governorateId}
                      onChange={(e) => set('governorateId', e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select governorate…</option>
                      {governorates.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}{g.nameAr ? ` — ${g.nameAr}` : ''}</option>
                      ))}
                    </select>
                    {errors.governorateId && <p className={errorCls}>{errors.governorateId}</p>}
                  </div>

                  {/* City — only shown after a governorate is selected */}
                  {form.governorateId && (
                    <div>
                      <label className={labelCls}>City *</label>
                      <select
                        value={form.cityId}
                        onChange={(e) => set('cityId', e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Select city…</option>
                        {citiesForGov.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}{c.nameAr ? ` — ${c.nameAr}` : ''}</option>
                        ))}
                      </select>
                      {errors.cityId && <p className={errorCls}>{errors.cityId}</p>}
                    </div>
                  )}

                  {/* Shipping info banner */}
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

              <Button type="submit" size="lg" className="w-full" disabled={placing}>
                <Lock className="size-4 mr-2" />
                {placing ? 'Placing Order…' : 'Place Order'}
              </Button>
              <p className="font-sans text-xs text-muted-foreground text-center">
                Your order will be confirmed by our team. Payment collected upon delivery or via invoice.
              </p>
            </form>

            {/* ── Order Summary ───────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-sm p-6 sticky top-24">
                <h2 className="font-sans text-xs tracking-widest uppercase mb-4">Order Summary</h2>

                {/* Items */}
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

                {/* Totals */}
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

                  <div className="pt-2">
                    <p className="font-sans text-xs text-muted-foreground">Payment Method</p>
                    <p className="font-sans text-sm">Cash on Delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
