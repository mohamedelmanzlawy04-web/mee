/**
 * CollectionProductCard
 *
 * Premium product card for the home-page "All Pieces" section.
 * Design language: Represent / Nude Project / Axel Arigato — minimal, luxury.
 *
 * Features over the base ProductCard:
 *  - Short description beneath the name
 *  - Available sizes pill row
 *  - Soft drop-shadow on hover
 *  - "Quick View" overlay (fade-in on hover) — links to product page
 *  - Image zoom (1.03×) on hover with smooth transition
 *  - Lazy-loaded image, aspect ratio preserved
 */
import { useState } from 'react';
import { Link } from 'wouter';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
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

const SIZES = ['S', 'M', 'L', 'XL'];

interface CollectionProductCardProps {
  product: Product;
  index?: number;
  className?: string;
}

export function CollectionProductCard({
  product,
  index = 0,
  className,
}: CollectionProductCardProps) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const { data: wishlist } = useGetWishlist({
    query: { enabled: isAuthenticated, retry: false, staleTime: 60_000 },
  });

  const wishlistItem = wishlist?.items?.find((i) => i.productId === product.id);
  const isWishlisted = !!wishlistItem;

  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const primaryImage = getProductImage(product.images, index);
  const secondImage   = product.images?.[1]?.url;
  const hasDiscount   = product.comparePrice && product.comparePrice > product.price;
  const discountPct   = hasDiscount
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
      await queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
    } catch {
      toast.error('Could not update wishlist');
    } finally {
      setWishlistPending(false);
    }
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col',
        'transition-shadow duration-400 ease-out',
        'hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18)]',
        className,
      )}
    >
      {/* ── Image container ──────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#f4f3f1] aspect-[3/4] rounded-[2px]">

        {/* Primary image */}
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className={cn(
              'absolute inset-0 w-full h-full object-cover object-top',
              'transition-all duration-700 ease-out will-change-transform',
              secondImage
                ? 'group-hover:opacity-0'
                : 'group-hover:scale-[1.03]',
            )}
          />
        ) : (
          <div className="absolute inset-0 bg-[#f4f3f1]" />
        )}

        {/* Secondary image (hover swap) */}
        {secondImage && (
          <img
            src={secondImage}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700 ease-out will-change-transform"
          />
        )}

        {/* ── Badges ──────────────────────────────────────────── */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.featured && (
            <span className="bg-foreground text-background font-sans text-[9px] tracking-[0.18em] uppercase px-2 py-[3px] leading-none">
              New
            </span>
          )}
          {hasDiscount && (
            <span className="bg-[#c8a96e] text-white font-sans text-[9px] tracking-[0.18em] uppercase px-2 py-[3px] leading-none">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* ── Wishlist ─────────────────────────────────────────── */}
        <button
          onClick={handleWishlist}
          disabled={wishlistPending}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute top-3 right-3 z-10',
            'w-8 h-8 flex items-center justify-center',
            'bg-background/80 backdrop-blur-[4px] rounded-full shadow-sm',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'disabled:opacity-40',
            isWishlisted ? 'text-[#c8a96e]' : 'text-foreground hover:text-[#c8a96e]',
            'transition-colors duration-200',
          )}
        >
          <Heart className={cn('size-3.5', isWishlisted && 'fill-current')} />
        </button>

        {/* ── Quick View overlay (centre-fade on hover) ────────── */}
        <div
          className={cn(
            'absolute inset-0 z-10 flex flex-col items-center justify-center gap-2',
            'bg-black/0 group-hover:bg-black/[0.08]',
            'transition-colors duration-400',
          )}
        >
          <Link
            href={`/products/${product.slug}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'inline-flex items-center gap-2',
              'px-5 py-2.5 bg-background/90 backdrop-blur-[6px]',
              'font-sans text-[9px] tracking-[0.25em] uppercase text-foreground',
              'border border-foreground/10 rounded-[1px]',
              'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0',
              'transition-all duration-300 ease-out',
              'hover:bg-foreground hover:text-background',
              'shadow-sm',
            )}
          >
            <Eye className="size-3.5 shrink-0" />
            Quick View
          </Link>
        </div>

        {/* ── Add to Bag — slides up from bottom ──────────────── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'bg-foreground text-background py-3',
              'font-sans text-[10px] tracking-[0.25em] uppercase',
              'hover:bg-foreground/90 transition-colors duration-200',
              'disabled:opacity-60',
            )}
          >
            <ShoppingBag className="size-3.5 shrink-0" />
            {isAddingToCart ? 'Adding…' : 'Add to Bag'}
          </button>
        </div>
      </div>

      {/* ── Product info ─────────────────────────────────────── */}
      <Link href={`/products/${product.slug}`} className="flex flex-col flex-1 mt-4 gap-1.5">

        {/* Category label */}
        {product.category && (
          <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-muted-foreground">
            {product.category.name}
          </p>
        )}

        {/* Name */}
        <h3 className="font-sans text-sm font-medium leading-snug text-foreground group-hover:text-foreground/70 transition-colors duration-200 line-clamp-1">
          {product.title}
        </h3>

        {/* Short description */}
        {product.shortDescription && (
          <p className="font-sans text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-sans text-sm text-foreground">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="font-sans text-xs text-muted-foreground line-through">
              {formatPrice(product.comparePrice!)}
            </span>
          )}
        </div>

        {/* ── Size pills ──────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 mt-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedSize(s === selectedSize ? null : s);
              }}
              aria-label={`Select size ${s}`}
              className={cn(
                'h-6 min-w-[26px] px-1.5',
                'font-sans text-[9px] tracking-[0.1em] uppercase',
                'border transition-colors duration-150',
                'rounded-[1px]',
                selectedSize === s
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Link>
    </article>
  );
}
