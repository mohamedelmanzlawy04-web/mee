import { useState, useRef, useCallback, useEffect } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { ChevronLeft, Star, Heart, Truck, RotateCcw, Shield, ChevronLeft as Prev, ChevronRight as Next } from 'lucide-react';
import { useGetProduct, useListProducts, useListReviews } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart';
import { cn, formatPrice, getProductImage } from '@/lib/utils';
import { toast } from 'sonner';
import { STATIC_PRODUCTS } from '@/data/static-products';
import { SizeGuideModal, fitTypeFromDescription } from '@/components/product/SizeGuideModal';

// ─── Image Gallery ────────────────────────────────────────────────────────────
interface GalleryImage {
  id: string;
  url: string;
  altText?: string | null;
}

function ProductGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [selected, setSelected] = useState(0);
  // Zoom is desktop-only — no zoom on touch devices
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const prev = () => setSelected((i) => Math.max(0, i - 1));
  const next = () => setSelected((i) => Math.min(images.length - 1, i + 1));

  // Only activate zoom on pointer devices (mouse/trackpad), not touch screens
  const isPointerDevice = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPointerDevice()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isPointerDevice()) setZoomed(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setZoomed(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    if (Math.abs(dx) > 44 && dy < 60) {
      if (dx < 0) next();
      else prev();
    }
    touchStart.current = null;
  };

  const currentImage = images[selected];

  return (
    <div className="space-y-3">
      {/* Main image — shorter aspect ratio brings product info higher on the page.
          object-bottom anchors the image to its bottom edge so any cropping from
          the shorter container removes the top portion only, keeping the full
          bottom of the product in frame at all times. */}
      <div
        className="group relative aspect-[3/3.3] md:aspect-[3/3.5] overflow-hidden rounded-sm bg-muted select-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: zoomed ? 'zoom-in' : 'default' }}
      >
        <img
          key={currentImage?.url}
          src={currentImage?.url}
          alt={currentImage?.altText ?? title}
          draggable={false}
          className="w-full h-full object-cover object-bottom transition-transform duration-200 ease-out will-change-transform"
          style={{
            transform: zoomed ? 'scale(2)' : 'scale(1)',
            transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
          }}
        />

        {/* Prev / Next arrows — always visible on mobile, fade in on desktop hover */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={selected === 0}
              aria-label="Previous image"
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 z-10',
                'w-8 h-8 flex items-center justify-center',
                'bg-background/80 backdrop-blur-sm rounded-full shadow-sm',
                'transition-opacity duration-200',
                selected === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100',
              )}
            >
              <Prev className="size-4" />
            </button>
            <button
              onClick={next}
              disabled={selected === images.length - 1}
              aria-label="Next image"
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 z-10',
                'w-8 h-8 flex items-center justify-center',
                'bg-background/80 backdrop-blur-sm rounded-full shadow-sm',
                'transition-opacity duration-200',
                selected === images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100',
              )}
            >
              <Next className="size-4" />
            </button>
          </>
        )}

        {/* Dot indicators — mobile only; desktop uses the thumbnail strip below */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 md:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                aria-label={`Image ${i + 1}`}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  i === selected ? 'bg-white scale-110' : 'bg-white/50',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip — desktop only; mobile navigates via swipe + dots */}
      {images.length > 1 && (
        <div className="hidden md:flex gap-2.5 overflow-x-auto pb-0.5 snap-x snap-mandatory">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelected(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                'flex-shrink-0 snap-start w-16 h-20 overflow-hidden rounded-sm border-2 transition-all duration-200',
                selected === i
                  ? 'border-foreground opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-90',
              )}
            >
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover object-top"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Product Page ─────────────────────────────────────────────────────────────
export default function ProductPage() {
  const [, params] = useRoute('/products/:slug');
  const slug = params?.slug ?? '';
  const [, navigate] = useLocation();

  // Always open at the very top — never restore scroll position from a previous page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  const { data: apiProduct, isLoading } = useGetProduct(slug, { query: { enabled: !!slug } });

  // Fall back to static data when the API hasn't returned a product yet
  const staticProduct = STATIC_PRODUCTS.find((p) => p.slug === slug) ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product: any = apiProduct ?? staticProduct;

  const { data: reviews } = useListReviews(
    { productId: apiProduct?.id, pageSize: 5 },
    { query: { enabled: !!apiProduct?.id } },
  );
  const { data: related } = useListProducts(
    { categoryId: apiProduct?.category?.id, pageSize: 4, status: 'ACTIVE' },
    { query: { enabled: !!apiProduct?.category?.id } },
  );

  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Derive fit type from shortDescription — validates against known fits automatically.
  // "BOXY FIT" → "BOXY_FIT", "REGULAR FIT" → "REGULAR_FIT", unknown → null (no button shown).
  const fitType = fitTypeFromDescription(product?.shortDescription);

  if (isLoading && !staticProduct) {
    return (
      <Layout>
        <div className="container-site py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-[3/4] bg-muted rounded-sm" />
            <div className="space-y-4 py-4">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-3/4 bg-muted rounded" />
              <div className="h-5 w-24 bg-muted rounded" />
              <div className="h-20 bg-muted rounded mt-4" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-site py-20 text-center">
          <h1 className="font-serif text-4xl mb-4">Product Not Found</h1>
          <p className="font-sans text-muted-foreground mb-6">This piece may have been removed or sold out.</p>
          <Button asChild><Link href="/products">Back to Shop</Link></Button>
        </div>
      </Layout>
    );
  }

  const images: GalleryImage[] = product.images ?? [];
  const variants = product.variants ?? [];
  const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const sizes = [...new Set(variants.filter((v: any) => v.size).map((v: any) => v.size as string))]
    .sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a);
      const bi = SIZE_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;

  const activeVariant = variants.find((v: any) => v.id === selectedVariant);
  const variantPrice = activeVariant?.priceOverride ?? product.price;

  const avgRating =
    reviews?.data?.length
      ? reviews.data.reduce((s: number, r: any) => s + r.rating, 0) / reviews.data.length
      : null;

  const handleAddToCart = async () => {
    if (variants.length > 0 && !selectedVariant) {
      toast.error('Please select a size');
      return false;
    }
    setIsAdding(true);
    try {
      await addItem(
        { productId: product.id, variantId: selectedVariant ?? undefined, quantity },
        product.title,
      );
      return true;
    } catch {
      toast.error('Could not add to cart');
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (variants.length > 0 && !selectedVariant) {
      toast.error('Please select a size');
      return;
    }
    setIsBuying(true);
    try {
      const ok = await handleAddToCart();
      if (ok) navigate('/checkout');
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <Layout>
      <div className="container-site py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 font-sans text-xs text-muted-foreground">
          <Link href="/products" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ChevronLeft className="size-3" /> Shop
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground truncate">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* ── Gallery ──────────────────────────────────────────────────── */}
          <ProductGallery images={images} title={product.title} />

          {/* ── Details ──────────────────────────────────────────────────── */}
          <div className="py-2 space-y-6">
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="font-sans text-xs tracking-widest uppercase text-muted-foreground hover:text-accent transition-colors"
              >
                {product.category.name}
              </Link>
            )}

            <div>
              <h1 className="font-serif text-3xl md:text-4xl leading-tight mb-3">{product.title}</h1>
              {avgRating !== null && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn('size-3.5', i < Math.round(avgRating) ? 'fill-accent text-accent' : 'text-border fill-border')} />
                    ))}
                  </div>
                  <span className="font-sans text-xs text-muted-foreground">
                    {avgRating.toFixed(1)} ({reviews?.data?.length} reviews)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-sans text-2xl font-medium">{formatPrice(variantPrice)}</span>
              {hasDiscount && (
                <>
                  <span className="font-sans text-sm text-muted-foreground line-through">
                    {formatPrice(product.comparePrice!)}
                  </span>
                  <span className="font-sans text-xs text-accent font-medium">
                    Save {Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)}%
                  </span>
                </>
              )}
            </div>

            {product.shortDescription && (
              <p className="font-sans text-xs tracking-[0.25em] uppercase font-bold text-foreground border-t border-border pt-5">
                {product.shortDescription}
              </p>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-sans text-xs tracking-widest uppercase">Size</p>
                  {fitType && (
                    <button
                      onClick={() => setSizeGuideOpen(true)}
                      className="font-sans text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                      Size Guide
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size: string) => {
                    const v = variants.find((vv: any) => vv.size === size);
                    const available = !v || (v.isActive !== false && (v.stockQty === undefined || v.stockQty > 0));
                    return (
                      <button
                        key={size}
                        disabled={!available}
                        onClick={() => { if (v) setSelectedVariant(v.id); }}
                        className={cn(
                          'w-12 h-12 font-sans text-sm border rounded-sm transition-colors',
                          !available && 'opacity-40 cursor-not-allowed line-through',
                          selectedVariant === v?.id
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border hover:border-foreground',
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="font-sans text-xs tracking-widest uppercase mb-3">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center border border-border rounded-sm hover:bg-secondary transition-colors"
                >
                  –
                </button>
                <span className="font-sans text-sm w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 flex items-center justify-center border border-border rounded-sm hover:bg-secondary transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={() => handleAddToCart()}
                disabled={isAdding || isBuying}
              >
                {isAdding ? 'Adding…' : 'Add to Cart'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={handleBuyNow}
                disabled={isAdding || isBuying}
              >
                {isBuying ? 'Processing…' : 'Buy Now'}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="border-t border-border pt-5 space-y-3">
              {[
                { icon: Truck,    text: 'Free shipping on orders over 2,000 EGP' },
                { icon: RotateCcw, text: 'Accepts returns within 14 days' },
                { icon: Shield,   text: 'Secure checkout' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <Icon className="size-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="font-sans text-xs text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>

            {product.description && (
              <div className="border-t border-border pt-5">
                <details>
                  <summary className="font-sans text-xs tracking-widest uppercase cursor-pointer hover:text-accent transition-colors">
                    Product Details
                  </summary>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed mt-3">{product.description}</p>
                </details>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {reviews && reviews.data.length > 0 && (
          <section className="mt-20 border-t border-border pt-12">
            <h2 className="font-serif text-3xl mb-8">Customer Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.data.map((review: any) => (
                <div key={review.id} className="bg-card rounded-sm p-6 border border-border">
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn('size-3', i < review.rating ? 'fill-accent text-accent' : 'fill-muted text-muted')} />
                    ))}
                  </div>
                  {review.title && <p className="font-sans text-sm font-medium mb-1">{review.title}</p>}
                  {review.body && <p className="font-sans text-sm text-muted-foreground leading-relaxed">{review.body}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {related?.data && related.data.filter((p: any) => p.id !== product.id).length > 0 && (
          <section className="mt-20 border-t border-border pt-12">
            <h2 className="font-serif text-3xl mb-8">You May Also Like</h2>
            <ProductGrid products={related.data.filter((p: any) => p.id !== product.id).slice(0, 4)} columns={4} />
          </section>
        )}
      </div>

      {fitType && (
        <SizeGuideModal
          fitType={fitType}
          productSlug={slug}
          open={sizeGuideOpen}
          onClose={() => setSizeGuideOpen(false)}
        />
      )}
    </Layout>
  );
}
