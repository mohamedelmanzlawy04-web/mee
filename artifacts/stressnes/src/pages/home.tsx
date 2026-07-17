import { useRef } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useListProducts } from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/product/ProductGrid';

// ─── Shared easing ───────────────────────────────────────────────────────────
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// ─── Scroll indicator ────────────────────────────────────────────────────────
function ScrollCue() {
  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.8, duration: 1, ease: 'easeOut' }}
    >
      <motion.div
        className="w-px bg-white/50"
        animate={{ height: [14, 36, 14], opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-white/35 select-none">
        Scroll
      </span>
    </motion.div>
  );
}

// ─── Animated product card (viewport-triggered) ───────────────────────────────
function AnimatedCard({ product, index }: { product: Product; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px 0px' });
  const col = index % 3; // stagger by column, not pure index

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: EASE, delay: col * 0.1 }}
    >
      <ProductCard product={product} index={index} />
    </motion.div>
  );
}

// ─── Collection section header ────────────────────────────────────────────────
function CollectionHeader() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px 0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: EASE }}
      className="mb-12 md:mb-16"
    >
      <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3">
        The Collection
      </p>
      <h2 className="font-serif text-3xl md:text-4xl tracking-tight">All Pieces</h2>
    </motion.div>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { data: products, isLoading } = useListProducts({
    status: 'ACTIVE',
    pageSize: 12,
  });

  // Page-level scroll — no DOM ref needed, always available
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 440], [1, 0]);
  const heroY      = useTransform(scrollY, [0, 700], ['0%', '-16%']);

  return (
    <Layout heroMode>
      {/* ── Hero: full-viewport video ──────────────────────────────────────── */}
      <section
        className="relative h-dvh w-full overflow-hidden bg-black"
        aria-label="Hero — Escape The Stress"
      >
        {/* Background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
        >
          <source src="/images/hero-landing.mp4" type="video/mp4" />
        </video>

        {/* Gradient — top for navbar legibility, bottom for scroll cue */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/55 pointer-events-none" />

        {/* Centered headline — fades & lifts as user scrolls */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-center"
          style={{
            opacity: heroOpacity,
            y: heroY,
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft:  'max(1.5rem, env(safe-area-inset-left))',
            paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
          }}
        >
          <div className="flex flex-col items-center gap-6 md:gap-8">
            {/* Season tag */}
            <motion.p
              className="font-sans text-[10px] tracking-[0.5em] uppercase text-white/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: EASE }}
            >
              New Season · 2026
            </motion.p>

            {/* Main headline */}
            <motion.h1
              className="font-serif text-white leading-[1.06] tracking-[0.06em] text-balance"
              style={{
                fontSize: 'clamp(2.5rem, 9vw, 8.5rem)',
                textShadow: '0 2px 48px rgba(0,0,0,0.25)',
              }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.9, ease: EASE }}
            >
              ESCAPE<br className="sm:hidden" />{' '}
              THE STRESS
            </motion.h1>

            {/* CTA link */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.8, ease: EASE }}
            >
              <Link
                href="/products"
                className="inline-flex items-center gap-2.5 font-sans text-[11px] tracking-[0.35em] uppercase text-white/75 hover:text-white border-b border-white/25 hover:border-white/65 pb-0.5 transition-colors duration-300"
              >
                Shop the Collection
                <ArrowRight className="size-3 shrink-0" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <ScrollCue />
      </section>

      {/* ── Product collection ─────────────────────────────────────────────── */}
      <section id="collection" className="container-site pt-20 pb-28 md:pt-28 md:pb-36">
        <CollectionHeader />

        {isLoading ? (
          <ProductGridSkeleton count={6} columns={3} />
        ) : products?.data && products.data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-10 md:gap-x-6 md:gap-y-14">
              {products.data.map((product, i) => (
                <AnimatedCard key={product.id} product={product} index={i} />
              ))}
            </div>

            <motion.div
              className="mt-16 text-center"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <Link
                href="/products"
                className="inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.35em] uppercase border-b border-foreground/40 hover:border-foreground pb-0.5 transition-colors duration-300"
              >
                View All Pieces
                <ArrowRight className="size-3 shrink-0" />
              </Link>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-center py-20 border border-border"
          >
            <p className="font-sans text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
              New pieces arriving soon
            </p>
          </motion.div>
        )}
      </section>

      {/* ── Brand story split ──────────────────────────────────────────────── */}
      <motion.section
        className="border-t border-border"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[70vh]">
          <div className="relative overflow-hidden bg-muted order-last lg:order-first min-h-[70vw] lg:min-h-0">
            <img
              src="/images/lifestyle-lobster-tee.jpg"
              alt="STRESSNES lifestyle"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>
          <div className="flex items-center justify-center px-8 py-20 lg:px-16">
            <div className="max-w-sm">
              <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-6">
                The STRESSNES Story
              </p>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">
                Fashion that demands attention
              </h2>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-10">
                STRESSNES was born from a simple belief: that luxury is not about excess,
                but about intention. Every piece is chosen with care — for those who dress
                with purpose.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.3em] uppercase border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors duration-300"
              >
                Explore the Collection <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Features strip ─────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary">
        <div className="container-site py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { title: 'Free Shipping',   subtitle: 'On orders over 2,000 EGP' },
              { title: 'Easy Returns',    subtitle: '30-day return window'      },
              { title: 'Secure Payment',  subtitle: 'All major cards accepted'  },
              { title: 'Customer Care',   subtitle: 'support@stressnes.com'     },
            ].map((item) => (
              <div key={item.title}>
                <p className="font-sans text-[10px] tracking-widest uppercase mb-1">{item.title}</p>
                <p className="font-sans text-[11px] text-muted-foreground">{item.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
