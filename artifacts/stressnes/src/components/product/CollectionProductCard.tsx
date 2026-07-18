/**
 * CollectionProductCard
 *
 * Premium product card for the home-page "All Pieces" section.
 * Design language: Represent / Nude Project / Axel Arigato — minimal, luxury.
 *
 * Features:
 *  - Entire image area is a clickable link to the product page
 *  - Short description beneath the name
 *  - Soft drop-shadow on hover
 *  - Image zoom (1.03×) on hover with smooth transition
 *  - "View Product" slides up from bottom on hover
 *  - Lazy-loaded image, aspect ratio preserved
 *
 * Size selection is intentionally absent here — it lives on the product page only.
 */
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { type Product } from '@workspace/api-client-react';
import { cn, formatPrice, getProductImage } from '@/lib/utils';

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
  const primaryImage = getProductImage(product.images, index);
  const secondImage  = product.images?.[1]?.url;
  const hasDiscount  = product.comparePrice && product.comparePrice > product.price;
  const discountPct  = hasDiscount
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

  return (
    <article
      className={cn(
        'group relative flex flex-col',
        'transition-shadow duration-400 ease-out',
        'hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18)]',
        className,
      )}
    >
      {/* ── Image container — entire area navigates to product page ── */}
      <Link href={`/products/${product.slug}`} className="block relative overflow-hidden bg-[#f4f3f1] aspect-[3/4] rounded-[2px]">

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
        {hasDiscount && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            <span className="bg-[#c8a96e] text-white font-sans text-[9px] tracking-[0.18em] uppercase px-2 py-[3px] leading-none">
              -{discountPct}%
            </span>
          </div>
        )}

        {/* ── View Product — slides up from bottom on hover ─── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <div
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'bg-foreground text-background py-3',
              'font-sans text-[10px] tracking-[0.25em] uppercase',
            )}
          >
            <ArrowRight className="size-3.5 shrink-0" />
            Select Size
          </div>
        </div>
      </Link>

      {/* ── Product info (link area — navigates to product page) ── */}
      <Link href={`/products/${product.slug}`} className="flex flex-col mt-4 gap-1.5">

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
      </Link>
    </article>
  );
}
