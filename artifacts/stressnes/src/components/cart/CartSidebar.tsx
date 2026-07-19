import { useEffect } from 'react';
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { useCart } from '@/context/cart';
import { useGetCart } from '@workspace/api-client-react';
import { formatPrice, getProductImage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CartSidebar() {
  const { isOpen, closeCart } = useCart();

  // Lock body scroll while cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  const { data: cart, isLoading } = useGetCart({ query: { retry: false, staleTime: 30_000 } });
  const { removeItem, updateQuantity } = useCart();

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[var(--z-overlay)] bg-foreground/20 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-md z-[var(--z-modal)] bg-background border-l border-border flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4" />
            <span className="font-sans text-sm tracking-widest uppercase">
              Your Cart
              {items.length > 0 && (
                <span className="ml-2 text-muted-foreground">({items.length})</span>
              )}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart} aria-label="Close cart">
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <ShoppingBag className="size-10 text-muted-foreground mb-4" strokeWidth={1} />
              <p className="font-serif text-lg mb-2">Your cart is empty</p>
              <p className="font-sans text-sm text-muted-foreground mb-6">
                Discover our curated collection of luxury pieces.
              </p>
              <Button onClick={closeCart} asChild>
                <Link href="/products">Shop Now</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 px-6 py-5">
                  {/* Image */}
                  <div className="w-20 h-24 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                    <img
                      src={getProductImage(item.product?.images)}
                      alt={item.product?.title ?? 'Product'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-medium truncate">
                      {item.product?.title ?? 'Product'}
                    </p>
                    <p className="font-sans text-sm text-muted-foreground mt-0.5">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() =>
                          item.quantity > 1
                            ? updateQuantity(item.id, item.quantity - 1)
                            : removeItem(item.id)
                        }
                        className="w-7 h-7 flex items-center justify-center border border-border rounded-sm hover:bg-secondary transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="font-sans text-sm w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center border border-border rounded-sm hover:bg-secondary transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-muted-foreground">Subtotal</span>
              <span className="font-sans text-sm font-medium">{formatPrice(subtotal)}</span>
            </div>
            <p className="font-sans text-xs text-muted-foreground">
              Shipping and taxes calculated at checkout.
            </p>
            <Button className="w-full" size="lg" asChild onClick={closeCart}>
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={closeCart} asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
