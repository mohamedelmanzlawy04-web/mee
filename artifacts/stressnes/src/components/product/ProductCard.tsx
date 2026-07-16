import { Link } from 'wouter';
import { Heart, ShoppingBag } from 'lucide-react';
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useGetWishlist,
  getGetWishlistQueryKey,
  type Product,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn, formatPrice, getProductImage } from '@/lib/utils';
import { useCart } from '@/context/cart';
import { useAuth } from '@/context/auth';
import { toast } from 'sonner';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
}

export function ProductCard({ product, index = 0, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);

  // Fetch wishlist only for authenticated users — React Query caches this globally
  const { data: wishlist } = useGetWishlist({
    query: { enabled: isAuthenticated, retry: false, staleTime: 60_000 },
  });

  const wishlistItem = wishlist?.items?.find((item) => item.productId === product.id);
  const isWishlisted = !!wishlistItem;

  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const primaryImage = getProductImage(product.images, index);
  const secondImage = product.images?.[1]?.url;
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      await addItem({ productId: product.id, quantity: 1 }, product.title);
    } catch {
      toast.error('Could not add to bag');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Sign in to save to your wishlist');
      return;
    }
    if (wishlistPending) return;
    setWishlistPending(true);
    try {
      if (isWishlisted && wishlistItem) {
        await removeFromWishlist.mutateAsync({ itemId: wishlistItem.id });
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist.mutateAsync({ data: { productId: product.id } });
        toast.success('Saved to wishlist');
      }
      // Refresh wishlist cache so all cards reflect the new state
      await queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
    } catch {
      toast.error('Could not update wishlist');
    } finally {
      setWishlistPending(false);
    }
  };

  return (
    <article className={cn('group relative', className)}>
      <Link href={`/products/${product.slug}`}>
        {/* Image */}
        <div className="relative overflow-hidden rounded-sm bg-muted aspect-[3/4]">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.title}
              loading="lazy"
              className={cn(
                'w-full h-full object-cover transition-all duration-700',
                secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
              )}
            />
          ) : (
            /* No image uploaded — clean muted block, no placeholder */
            <div className="w-full h-full bg-muted" />
          )}
          {secondImage && (
            <img
              src={secondImage}
              alt={product.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.featured && (
              <span className="bg-foreground text-background font-sans text-[10px] tracking-widest uppercase px-2 py-0.5">
                Featured
              </span>
            )}
            {hasDiscount && (
              <span className="bg-accent text-accent-foreground font-sans text-[10px] tracking-widest uppercase px-2 py-0.5">
                -{discountPct}%
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleWishlist}
              disabled={wishlistPending}
              className={cn(
                'w-8 h-8 flex items-center justify-center bg-background rounded-full shadow-sm transition-colors disabled:opacity-50',
                isWishlisted ? 'text-accent' : 'text-foreground hover:text-accent'
              )}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={cn('size-3.5', isWishlisted && 'fill-current')} />
            </button>
          </div>

          {/* Quick add */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 font-sans text-xs tracking-widest uppercase hover:bg-foreground/90 transition-colors disabled:opacity-70"
            >
              <ShoppingBag className="size-3.5" />
              {isAddingToCart ? 'Adding…' : 'Add to Bag'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 space-y-1">
          {product.category && (
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground">
              {product.category.name}
            </p>
          )}
          <h3 className="font-sans text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
            {product.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm text-foreground">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="font-sans text-xs text-muted-foreground line-through">
                {formatPrice(product.comparePrice!)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
