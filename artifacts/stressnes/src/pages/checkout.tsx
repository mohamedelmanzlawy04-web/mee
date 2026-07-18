import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronLeft, Lock } from 'lucide-react';
import { useGetCart, useCreateOrder, type OrderInputShippingAddress } from '@workspace/api-client-react';
import { useCart } from '@/context/cart';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { formatPrice, getProductImage } from '@/lib/utils';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { clearCart, cartId } = useCart();
  const [, navigate] = useLocation();

  const { data: cart } = useGetCart({ query: { retry: false } });
  const createOrder = useCreateOrder();

  const [form, setForm] = useState<OrderInputShippingAddress>({
    firstName: '',
    lastName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Egypt',
    phone: '',
  });
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;

  const update = (key: keyof OrderInputShippingAddress, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!cartId) {
      toast.error('Cart not ready. Please try again.');
      return;
    }
    setPlacing(true);
    try {
      await createOrder.mutateAsync({
        data: {
          shippingAddress: form,
          couponCode: couponCode || undefined,
          notes: notes || undefined,
        },
        params: { cartId },
      });
      await clearCart();
      toast.success("Order placed successfully! We'll be in touch to confirm your order.");
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
            {/* Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
              <div>
                <h2 className="font-sans text-xs tracking-widest uppercase mb-4">Shipping Address</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-sans text-xs text-muted-foreground block mb-1.5">First Name *</label>
                    <input required value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="font-sans text-xs text-muted-foreground block mb-1.5">Last Name *</label>
                    <input required value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="font-sans text-xs text-muted-foreground block mb-1.5">Address Line 1 *</label>
                    <input required value={form.line1} onChange={(e) => update('line1', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="font-sans text-xs text-muted-foreground block mb-1.5">Address Line 2</label>
                    <input value={form.line2 ?? ''} onChange={(e) => update('line2', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="font-sans text-xs text-muted-foreground block mb-1.5">City *</label>
                    <input required value={form.city} onChange={(e) => update('city', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="font-sans text-xs text-muted-foreground block mb-1.5">State / Governorate</label>
                    <input value={form.state ?? ''} onChange={(e) => update('state', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="font-sans text-xs text-muted-foreground block mb-1.5">Postal Code</label>
                    <input value={form.postalCode ?? ''} onChange={(e) => update('postalCode', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="font-sans text-xs text-muted-foreground block mb-1.5">Country *</label>
                    <input required value={form.country} onChange={(e) => update('country', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="col-span-2">
                    <label className="font-sans text-xs text-muted-foreground block mb-1.5">Phone</label>
                    <input type="tel" value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)}
                      className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-sans text-xs tracking-widest uppercase mb-4">Coupon Code</h2>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon code"
                    className="flex-1 border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring" />
                  <Button type="button" variant="outline" size="sm">Apply</Button>
                </div>
              </div>

              <div>
                <h2 className="font-sans text-xs tracking-widest uppercase mb-4">Order Notes</h2>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                  placeholder="Any special instructions..."
                  className="w-full border border-border rounded-sm px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={placing}>
                <Lock className="size-4 mr-2" />
                {placing ? 'Placing Order…' : 'Place Order'}
              </Button>
              <p className="font-sans text-xs text-muted-foreground text-center">
                Your order will be confirmed by our team. Payment collected upon delivery or via invoice.
              </p>
            </form>

            {/* Order summary */}
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
                        <p className="font-sans text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="font-sans text-sm">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between font-sans text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-sans text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-muted-foreground">Calculated after order</span>
                  </div>
                  <div className="flex justify-between font-sans text-sm font-medium pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatPrice(subtotal)}</span>
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
