import { Link } from 'wouter';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useListProducts, useListCategories, useListCollections } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { data: featured, isLoading: loadingFeatured } = useListProducts({
    featured: true,
    pageSize: 6,
    status: 'ACTIVE',
  });
  const { data: newArrivals, isLoading: loadingNew } = useListProducts({
    pageSize: 4,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    status: 'ACTIVE',
  });
  const { data: categories } = useListCategories();
  const { data: collections } = useListCollections();

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center bg-foreground text-background overflow-hidden">
        {/* Video background */}
        <video
          className="absolute inset-0 w-full h-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/hero-coastal-steps.jpg"
        >
          <source src="/images/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay — preserves luxury contrast for text legibility */}
        <div className="absolute inset-0 bg-foreground/70" />

        {/* Content */}
        <div className="container-site relative z-10 py-20">
          <div className="max-w-2xl animate-slide-up">
            <p className="font-sans text-xs tracking-[0.4em] uppercase text-background/60 mb-6">
              New Season · 2026
            </p>
            <h1 className="font-serif text-6xl md:text-8xl leading-[1.05] tracking-tight mb-8">
              Dressed
              <br />
              <em className="text-gradient-gold not-italic">Differently.</em>
            </h1>
            <p className="font-sans text-base text-background/70 leading-relaxed max-w-md mb-10">
              Curated pieces for the discerning wardrobe. Luxury that speaks without words.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 border-transparent"
                asChild
              >
                <Link href="/products">
                  Shop the Collection <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-background/30 text-background hover:bg-background/10"
                asChild
              >
                <Link href="/collections">Our Collections</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories strip ──────────────────────────────── */}
      {categories && categories.length > 0 && (
        <section className="border-b border-border">
          <div className="container-site py-4">
            <div className="flex items-center gap-6 overflow-x-auto pb-1">
              <Link
                href="/products"
                className="font-sans text-xs tracking-widest uppercase whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
              >
                All
              </Link>
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="font-sans text-xs tracking-widest uppercase whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured products ─────────────────────────────── */}
      <section className="container-site py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">
              Curated Selection
            </p>
            <h2 className="font-serif text-4xl">Featured Pieces</h2>
          </div>
          <Link
            href="/products?featured=true"
            className="hidden sm:flex items-center gap-1 font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ChevronRight className="size-3.5" />
          </Link>
        </div>
        {loadingFeatured ? (
          <ProductGridSkeleton count={6} />
        ) : featured?.data && featured.data.length > 0 ? (
          <ProductGrid products={featured.data} />
        ) : (
          <div className="text-center py-16">
            <p className="font-sans text-muted-foreground">New arrivals coming soon.</p>
          </div>
        )}
      </section>

      {/* ── Collections ───────────────────────────────────── */}
      {collections && collections.length > 0 && (
        <section className="bg-secondary py-20">
          <div className="container-site">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">
                  Explore
                </p>
                <h2 className="font-serif text-4xl">Collections</h2>
              </div>
              <Link
                href="/collections"
                className="hidden sm:flex items-center gap-1 font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                All collections <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.slice(0, 3).map((col) => (
                <Link key={col.id} href={`/collections/${col.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-muted mb-4">
                    {col.image ? (
                      <img
                        src={col.image}
                        alt={col.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent group-hover:from-foreground/60 transition-colors duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="font-serif text-2xl text-background">{col.name}</p>
                      {col.description && (
                        <p className="font-sans text-xs text-background/70 mt-1 line-clamp-2">
                          {col.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── New Arrivals ──────────────────────────────────── */}
      {!loadingNew && newArrivals?.data && newArrivals.data.length > 0 && (
        <section className="container-site py-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">
                Just In
              </p>
              <h2 className="font-serif text-4xl">New Arrivals</h2>
            </div>
            <Link
              href="/products?sortBy=createdAt&sortOrder=desc"
              className="hidden sm:flex items-center gap-1 font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See all <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <ProductGrid products={newArrivals.data} columns={4} />
        </section>
      )}

      {/* ── Editorial split — brand story ─────────────────── */}
      <section className="border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh]">
          {/* Image */}
          <div className="relative overflow-hidden bg-muted order-last lg:order-first min-h-[50vw] lg:min-h-0">
            <img
              src="/images/lifestyle-lobster-tee.jpg"
              alt="STRESSNES lifestyle — seaside editorial"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Subtle vignette */}
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/10 via-transparent to-transparent" />
          </div>

          {/* Text */}
          <div className="flex items-center justify-center px-10 py-20 lg:px-16">
            <div className="max-w-sm">
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
                The STRESSNES Story
              </p>
              <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-6">
                Fashion that demands&nbsp;attention
              </h2>
              <p className="font-sans text-base text-muted-foreground leading-relaxed mb-10">
                STRESSNES was born from a simple belief: that luxury is not about excess, but
                about intention. Every piece in our collection is chosen with care — for those
                who dress with purpose.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 font-sans text-sm tracking-widest uppercase border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors"
              >
                Explore the Collection <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ────────────────────────────────── */}
      <section className="border-t border-border bg-secondary">
        <div className="container-site py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { title: 'Free Shipping', subtitle: 'On orders over 2,000 EGP' },
              { title: 'Easy Returns', subtitle: '30-day return window' },
              { title: 'Secure Payment', subtitle: 'All major cards accepted' },
              { title: 'Customer Care', subtitle: 'support@stressnes.com' },
            ].map((item) => (
              <div key={item.title}>
                <p className="font-sans text-xs tracking-widest uppercase mb-1">{item.title}</p>
                <p className="font-sans text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
