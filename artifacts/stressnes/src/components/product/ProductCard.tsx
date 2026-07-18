import { Link } from 'wouter';
import { ShoppingBag } from 'lucide-react';
import { type Product } from '@workspace/api-client-react';
import { cn, formatPrice, getProductImage } from '@/lib/utils';
import { useCart } from '@/context/cart';
import { toast } from 'sonner';
import { useState } from 'react';

const SIZES = ['S', 'M', 'L', 'XL'];

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
}

export function ProductCard({ product, index = 0, className }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const primaryImage = getProductImage(product.images, index);
  const secondImage = product.images?.[1]?.url;
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAddingToCart || !selectedSize) return;
    setIsAddingToCart(true);
    try {
      await addItem({ productId: product.id, quantity: 1 }, product.title);
      setSelectedSize(null);
    } catch (err) {
      console.error('[AddToCart] failed:', err);
      toast.error('Could not add to bag');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <article className={cn('group relative', className)}>
      {/* Image — entire area navigates to product page */}
      <Link href={`/products/${product.slug}`} className="block relative overflow-hidden rounded-sm bg-muted aspect-[3/4]">
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

        {/* Quick add */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 font-sans text-xs tracking-widest uppercase hover:bg-foreground/90 transition-colors disabled:opacity-70"
          >
            <ShoppingBag className="size-3.5" />
            {isAddingToCart ? 'Adding…' : 'Add to Cart'}
          </button>
        </div>
      </Link>

      {/* Info */}
      <Link href={`/products/${product.slug}`} className="block mt-3 space-y-1">
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
      </Link>

      {/* Size pills */}
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
              'border transition-colors duration-150 rounded-[1px]',
              selectedSize === s
                ? 'bg-foreground text-background border-foreground'
                : 'bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Add to Bag — appears when a size is selected */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          selectedSize ? 'max-h-12 opacity-100 mt-2.5' : 'max-h-0 opacity-0 mt-0',
        )}
      >
        <button
          onClick={handleAddToCart}
          onTouchEnd={handleAddToCart}
          disabled={isAddingToCart}
          className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-2.5 font-sans text-[9px] tracking-[0.25em] uppercase hover:bg-foreground/90 active:bg-foreground/80 transition-colors duration-200 disabled:opacity-60"
        >
          <ShoppingBag className="size-3 shrink-0" />
          {isAddingToCart ? 'Adding…' : 'Add to Bag'}
        </button>
      </div>
    </article>
  );
}
