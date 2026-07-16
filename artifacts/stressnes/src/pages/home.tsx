import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { useListProducts } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { data: products, isLoading } = useListProducts({
    status: 'ACTIVE',
    pageSize: 12,
  });

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center bg-foreground text-background overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/hero-coastal-steps.jpg"
        >
          {/* Enhanced high-quality encode — 3.7 MB, 5.3 Mbps, H.264 High */}
          <source src="/images/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-foreground/70" />

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
                <Link href="/products">View All Pieces</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop ─────────────────────────────────────────── */}
      <section className="container-site py-20">
        <div className="mb-12">
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">
            The Collection
          </p>
          <h2 className="font-serif text-4xl">All Pieces</h2>
        </div>
        {isLoading ? (
          <ProductGridSkeleton count={3} />
        ) : products?.data && products.data.length > 0 ? (
          <ProductGrid products={products.data} columns={3} />
        ) : (
          <div className="text-center py-16 border border-border rounded-sm">
            <p className="font-sans text-muted-foreground">New pieces coming soon.</p>
          </div>
        )}
      </section>

      {/* ── Editorial split — brand story ─────────────────── */}
      <section className="border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[70vh]">
          {/* Image */}
          <div className="relative overflow-hidden bg-muted order-last lg:order-first min-h-[60vw] lg:min-h-0">
            <img
              src="/images/lifestyle-lobster-tee.jpg"
              alt="STRESSNES lifestyle — seaside editorial"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
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
