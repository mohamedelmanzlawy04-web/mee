import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { ChevronLeft, Star, Heart, Truck, RotateCcw, Shield } from 'lucide-react';
import { useGetProduct, useListProducts, useListReviews } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart';
import { cn, formatPrice, getProductImage } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProductPage() {
  const [, params] = useRoute('/products/:slug');
  const slug = params?.slug ?? '';

  const { data: product, isLoading } = useGetProduct(slug, { query: { enabled: !!slug } });
  const { data: reviews } = useListReviews(
    { productId: product?.id, pageSize: 5 },
    { query: { enabled: !!product?.id } }
  );
  const { data: related } = useListProducts(
    { categoryId: product?.category?.id, pageSize: 4, status: 'ACTIVE' },
    { query: { enabled: !!product?.category?.id } }
  );

  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  if (isLoading) {
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

  const images = product.images ?? [];
  const variants = product.variants ?? [];
  const sizes = [...new Set(variants.filter((v) => v.size).map((v) => v.size!))];
  const colors = [...new Set(variants.filter((v) => v.color).map((v) => v.color!))];
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;

  const activeVariant = variants.find((v) => v.id === selectedVariant);
  const variantPrice = activeVariant?.priceOverride ?? product.price;

  const handleAddToCart = async () => {
    if (variants.length > 0 && !selectedVariant) {
      toast.error('Please select a size');
      return;
    }
    setIsAdding(true);
    try {
      await addItem(
        { productId: product.id, variantId: selectedVariant ?? undefined, quantity },
        product.title
      );
    } catch {
      toast.error('Could not add to bag');
    } finally {
      setIsAdding(false);
    }
  };

  const avgRating =
    reviews?.data?.length
      ? reviews.data.reduce((s, r) => s + r.rating, 0) / reviews.data.length
      : null;

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
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-[3/4] overflow-hidden rounded-sm bg-muted">
              <img
                src={images[selectedImage]?.url ?? getProductImage(images)}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'flex-shrink-0 w-16 h-20 overflow-hidden rounded-sm border-2 transition-colors',
                      selectedImage === i ? 'border-foreground' : 'border-transparent'
                    )}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="py-2 space-y-6">
            {product.category && (
              <Link href={`/categories/${product.category.slug}`} className="font-sans text-xs tracking-widest uppercase text-muted-foreground hover:text-accent transition-colors">
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
                <span className="font-sans text-sm text-muted-foreground line-through">
                  {formatPrice(product.comparePrice!)}
                </span>
              )}
              {hasDiscount && (
                <span className="font-sans text-xs text-accent font-medium">
                  Save {Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)}%
                </span>
              )}
            </div>

            {product.shortDescription && (
              <p className="font-sans text-sm text-muted-foreground leading-relaxed border-t border-border pt-5">
                {product.shortDescription}
              </p>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <p className="font-sans text-xs tracking-widest uppercase mb-3">Color</p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const v = variants.find((vv) => vv.color === color);
                    return (
                      <button
                        key={color}
                        onClick={() => { if (v) setSelectedVariant(v.id); }}
                        className={cn(
                          'px-4 py-2 font-sans text-sm border rounded-sm transition-colors',
                          activeVariant?.color === color
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border hover:border-foreground'
                        )}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-sans text-xs tracking-widest uppercase">Size</p>
                  <button className="font-sans text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const v = variants.find((vv) => vv.size === size);
                    const available = v?.isActive && (v.stockQty === undefined || v.stockQty > 0);
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
                            : 'border-border hover:border-foreground'
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
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center border border-border rounded-sm hover:bg-secondary transition-colors">–</button>
                <span className="font-sans text-sm w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="w-9 h-9 flex items-center justify-center border border-border rounded-sm hover:bg-secondary transition-colors">+</button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={isAdding}>
                {isAdding ? 'Adding…' : 'Add to Bag'}
              </Button>
              <Button size="lg" variant="outline" className="px-4" aria-label="Save to wishlist">
                <Heart className="size-4" />
              </Button>
            </div>

            <div className="border-t border-border pt-5 space-y-3">
              {[
                { icon: Truck, text: 'Free shipping on orders over 2,000 EGP' },
                { icon: RotateCcw, text: 'Free returns within 30 days' },
                { icon: Shield, text: 'Secure checkout' },
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
              {reviews.data.map((review) => (
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
        {related?.data && related.data.filter((p) => p.id !== product.id).length > 0 && (
          <section className="mt-20 border-t border-border pt-12">
            <h2 className="font-serif text-3xl mb-8">You May Also Like</h2>
            <ProductGrid products={related.data.filter((p) => p.id !== product.id).slice(0, 4)} columns={4} />
          </section>
        )}
      </div>
    </Layout>
  );
}
