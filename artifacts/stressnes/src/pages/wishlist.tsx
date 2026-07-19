import { useLocation, Link } from 'wouter';
import { Heart, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Layout } from '@/components/layout/Layout';
import { useGetWishlist } from '@workspace/api-client-react';
import { ProductGrid } from '@/components/product/ProductGrid';
import type { Product } from '@workspace/api-client-react';

export default function WishlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: wishlist, isLoading } = useGetWishlist({
    query: { enabled: isAuthenticated, retry: false },
  });

  if (!authLoading && !isAuthenticated) {
    navigate('/login');
    return null;
  }

  const items = Array.isArray(wishlist) ? wishlist : [];
  const products = items.map((item: { product?: Product }) => item.product).filter(Boolean) as Product[];

  return (
    <Layout>
      <div className="container-site py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/account" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">
              Account
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <h1 className="font-serif text-4xl">Wishlist</h1>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] bg-muted rounded-sm" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/3 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 bg-card border border-border rounded-sm">
              <Heart className="size-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
              <p className="font-serif text-2xl mb-2">Your wishlist is empty</p>
              <p className="font-sans text-sm text-muted-foreground mb-6">
                Save pieces you love by clicking the heart icon.
              </p>
              <Link href="/products" className="font-sans text-sm underline underline-offset-2 hover:text-accent transition-colors">
                Start Shopping
              </Link>
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </Layout>
  );
}
