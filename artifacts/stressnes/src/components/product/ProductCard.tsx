/**
 * ProductCard
 *
 * Standard product card used across collection/search/related sections.
 * Size selection is intentionally absent here — it lives on the product page only.
 */
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { type Product } from '@workspace/api-client-react';
import { cn, formatPrice, getProductImage } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
}

export function ProductCard({ product, index = 0, className }: ProductCardProps) {
  const primaryImage = getProductImage(product.images, index);
  const secondImage  = product.images?.[1]?.url;
  const hasDiscount  = product.comparePrice && product.comparePrice > product.price;
  const discountPct  = hasDiscount
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

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
              secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-105',
            )}
          />
        ) : (
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

        {/* Select Size — slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 font-sans text-xs tracking-widest uppercase">
            <ArrowRight className="size-3.5" />
            Select Size
          </div>
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
    </article>
  );
}
