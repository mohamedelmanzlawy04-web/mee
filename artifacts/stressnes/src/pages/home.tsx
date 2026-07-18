import { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useListProducts } from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
import { Layout } from '@/components/layout/Layout';
import { CollectionProductCard } from '@/components/product/CollectionProductCard';
import { ProductGridSkeleton } from '@/components/product/ProductGrid';
import { STATIC_PRODUCTS } from '@/data/static-products';

// ─── Shared easing ───────────────────────────────────────────────────────────
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// ─── Hero audio hook (scroll-aware) ─────────────────────────────────────────
// • Starts muted — satisfies browser autoplay policy.
// • Unmutes on the first user gesture (click / touch / key), but only when
//   the hero section is still the primary visible section (≥ 50 % in view).
// • Uses IntersectionObserver to auto-mute when the hero scrolls away and
//   auto-restore when it scrolls back — video is never paused, only muted.
// • User's manual toggle is independent: if the user mutes via the button,
//   scrolling back to the hero will NOT force-unmute them.
function useHeroAudio(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  sectionRef: React.RefObject<HTMLElement | null>,
) {
  const [muted, setMuted] = useState(true);
  const userUnlockedRef = useRef(false); // user gestured → browser permits audio
  const userMutedRef    = useRef(false); // user explicitly muted via the toggle
  const heroVisibleRef  = useRef(true);  // hero is ≥ 50 % visible in viewport

  // Single source of truth — derives and applies the correct muted state.
  const applyMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const shouldMute =
      !userUnlockedRef.current   // audio not yet permitted by browser
      || !heroVisibleRef.current // hero scrolled out of primary view
      || userMutedRef.current;   // user chose to mute manually
    video.muted = shouldMute;
    setMuted(shouldMute);
  }, [videoRef]);

  // Unlock audio on the very first user gesture.
  const unlock = useCallback(() => {
    if (userUnlockedRef.current) return;
    userUnlockedRef.current = true;
    applyMute(); // re-evaluate: if hero still visible, this unmutes
  }, [applyMute]);

  // Manual toggle — preserves user's choice across scroll events.
  const toggleMute = useCallback(() => {
    userUnlockedRef.current = true; // treat toggle as a gesture
    userMutedRef.current = !userMutedRef.current;
    applyMute();
  }, [applyMute]);

  // First-gesture detection (click / touch / key — not scroll, because the
  // IntersectionObserver already handles the scroll-based mute/unmute path).
  useEffect(() => {
    const events = ['click', 'touchstart', 'keydown'] as const;
    const handler = () => unlock();
    events.forEach(e => document.addEventListener(e, handler, { once: true, passive: true }));
    return () => events.forEach(e => document.removeEventListener(e, handler));
  }, [unlock]);

  // IntersectionObserver — mute/unmute based on how much of the hero is visible.
  // threshold [0, 0.5]: fires immediately on mount (with current ratio) and again
  // whenever the ratio crosses the 50 % line in either direction.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        heroVisibleRef.current = entry.intersectionRatio >= 0.5;
        applyMute();
      },
      { threshold: [0, 0.5] },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [sectionRef, applyMute]);

  return { muted, toggleMute };
}

// ─── Scroll indicator ────────────────────────────────────────────────────────
function ScrollCue() {
  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1.2, ease: 'easeOut' }}
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
  const col = index % 4;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: EASE, delay: col * 0.08 }}
    >
      <CollectionProductCard product={product} index={index} />
    </motion.div>
  );
}

// ─── Coming Soon placeholder card ────────────────────────────────────────────
function ComingSoonCard({ index }: { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px 0px' });
  const col = index % 4;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: EASE, delay: col * 0.08 }}
    >
      <article className="group relative flex flex-col">
        {/* Image placeholder */}
        <div className="relative overflow-hidden bg-[#f4f3f1] aspect-[3/4] rounded-[2px] flex flex-col items-center justify-center gap-4">
          {/* Decorative rule */}
          <div className="w-8 h-px bg-foreground/20" />
          <p className="font-sans text-[9px] tracking-[0.4em] uppercase text-foreground/30 select-none">
            Coming Soon
          </p>
          <div className="w-8 h-px bg-foreground/20" />
        </div>

        {/* Info skeleton — same height/spacing as a real card */}
        <div className="flex flex-col flex-1 mt-4 gap-1.5">
          <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-muted-foreground/40">
            &nbsp;
          </p>
          <h3 className="font-sans text-sm font-medium leading-snug text-foreground/20 line-clamp-1">
            Coming Soon
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-sans text-sm text-foreground/20">—</span>
          </div>
          {/* Size pills — same row as real card */}
          <div className="flex items-center gap-1.5 mt-2">
            {['S', 'M', 'L', 'XL'].map((s) => (
              <div
                key={s}
                className="h-6 min-w-[26px] px-1.5 border border-border/30 rounded-[1px] opacity-30"
              />
            ))}
          </div>
        </div>
      </article>
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

// ─── Hero video background ────────────────────────────────────────────────────
function HeroVideo({
  onReady,
  sectionRef,
}: {
  onReady: () => void;
  sectionRef: React.RefObject<HTMLElement | null>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { muted, toggleMute } = useHeroAudio(videoRef, sectionRef);
  const [videoReady, setVideoReady] = useState(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const handleReady = useCallback(() => {
    if (videoReady) return;
    setVideoReady(true);
    onReadyRef.current();
  }, [videoReady]);

  // Fallback: if the video never fires canplay/loadeddata/play within 3 s
  // (e.g. iOS Low Power Mode blocks autoplay silently), reveal the hero anyway
  // so the page isn't stuck showing a black screen.
  useEffect(() => {
    const id = setTimeout(() => {
      handleReady();
    }, 3000);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/*
       * Layer 1 — Blurred background fill.
       * Fills the letterbox areas (left/right on desktop, top/bottom on mobile)
       * when the main video doesn't cover the full viewport.
       * Uses object-cover so it always fills edge-to-edge, then blurs heavily.
       * Separate from the main video so the main video keeps its natural framing.
       *
       * Mobile-re-encoded source (Fast Start, yuv420p, ~1.6 MB) is listed first
       * so mobile browsers pick it up immediately. Original falls back for
       * any edge case where the re-encoded file isn't served.
       */}
      <video
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        style={{
          filter: 'blur(32px) brightness(0.35) saturate(0.8)',
          transform: 'scale(1.08)',   // prevent blur from showing hard edges
          willChange: 'transform',
        }}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
        aria-hidden="true"
      >
        <source src="/images/hero-bg-mobile.mp4" type="video/mp4" />
        <source src="/images/hero-bg.mp4" type="video/mp4" />
      </video>

      {/*
       * Layer 2 — Main video, full composition.
       * object-contain preserves the full frame; no cropping of the subject.
       * The blurred layer behind fills whatever space the contained video leaves.
       *
       * Mobile autoplay contract:
       *  - autoPlay + muted are HTML attributes (required by iOS Safari).
       *  - playsInline prevents full-screen takeover on iOS.
       *  - onCanPlay is the primary ready signal; onLoadedData and onPlay are
       *    secondary fallbacks for browsers that skip/delay canplay.
       *  - A 3-second timeout (above) ensures opacity never stays at 0 even
       *    if the browser never fires any of these events (Low Power Mode, etc.)
       *
       * We intentionally keep motion.video (Framer Motion) for the opacity
       * fade-in — only the opacity animation is applied, so it cannot interfere
       * with playback.
       */}
      <motion.video
        ref={videoRef}
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit: 'contain',
          objectPosition: 'center center',
          willChange: 'opacity',
        }}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        onCanPlay={handleReady}
        onLoadedData={handleReady}
        onPlay={handleReady}
        initial={{ opacity: 0 }}
        animate={{ opacity: videoReady ? 1 : 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <source src="/images/hero-bg-mobile.mp4" type="video/mp4" />
        <source src="/images/hero-bg.mp4" type="video/mp4" />
      </motion.video>

      {/* Dark overlay — 28% keeps text readable without flattening the image */}
      <div className="absolute inset-0 bg-black/[0.28] pointer-events-none" />

      {/* Top gradient — ensures navbar icons stay legible over any frame */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

      {/* Bottom gradient — grounds the scroll cue */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />

      {/* Sound toggle — bottom right */}
      {videoReady && (
        <motion.button
          onClick={toggleMute}
          className={[
            'absolute bottom-10 right-6 md:right-8 z-20',
            'w-10 h-10 flex items-center justify-center',
            'rounded-full border border-white/25 bg-black/20 backdrop-blur-sm',
            'text-white/70 hover:text-white hover:bg-black/40',
            'transition-colors duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          ].join(' ')}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          title={muted ? 'Unmute' : 'Mute'}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.7 }}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </motion.button>
      )}
    </>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { data: products, isLoading } = useListProducts({
    status: 'ACTIVE',
    pageSize: 12,
  });

  // heroReady gates the overlay text — video and text appear together
  const [heroReady, setHeroReady] = useState(false);
  const handleHeroReady = useCallback(() => setHeroReady(true), []);

  // Ref attached to the hero <section> — passed to HeroVideo so the
  // IntersectionObserver can track when the hero leaves / enters the viewport.
  const heroSectionRef = useRef<HTMLElement>(null);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 440], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 700], ['0%', '-16%']);

  return (
    <Layout heroMode>
      {/* ── Hero: full-viewport video ──────────────────────────────────────── */}
      <section
        ref={heroSectionRef}
        className="relative h-dvh w-full overflow-hidden bg-black"
        aria-label="Hero — Escape The Stress"
      >
        <HeroVideo onReady={handleHeroReady} sectionRef={heroSectionRef} />

        {/* Left-aligned headline — fades & lifts as user scrolls.
            Kept in the DOM immediately so scroll transforms initialise,
            but stays invisible (opacity 0) until heroReady fires so video
            and text always appear together with no flicker. */}
        <motion.div
          className="absolute inset-0 flex items-center z-10"
          style={{
            opacity: heroOpacity,
            y: heroY,
            paddingTop:    'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft:   'max(1.75rem, env(safe-area-inset-left))',
            paddingRight:  'max(1.75rem, env(safe-area-inset-right))',
          }}
        >
          {/* Left column — wide enough to keep headline on two clean lines */}
          <div className="w-full md:max-w-[60%] lg:max-w-[52%] flex flex-col items-start gap-5 md:gap-6 md:pl-10 lg:pl-20">

            {/* Season tag */}
            <motion.p
              className="font-sans text-[9px] tracking-[0.5em] uppercase text-white/50"
              initial={{ opacity: 0, y: 10 }}
              animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ delay: 0.15, duration: 0.9, ease: EASE }}
            >
              New Season · 2026
            </motion.p>

            {/* Main headline — ~12% smaller, two lines, left-flush */}
            <motion.h1
              className="font-serif text-white leading-[1.06] tracking-[0.05em] whitespace-nowrap"
              style={{
                fontSize: 'clamp(2rem, 6.5vw, 6.5rem)',
                textShadow: '0 2px 40px rgba(0,0,0,0.55), 0 1px 8px rgba(0,0,0,0.3)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 1, ease: EASE }}
            >
              ESCAPE<br />THE STRESS
            </motion.h1>

            {/* Thin rule — visual breath between headline and CTA */}
            <motion.div
              className="w-8 h-px bg-white/30"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={heroReady ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
              style={{ transformOrigin: 'left' }}
              transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
            />

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={heroReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ delay: 0.58, duration: 0.9, ease: EASE }}
            >
              <Link
                href="/products"
                className="inline-flex items-center gap-2.5 font-sans text-[10px] tracking-[0.35em] uppercase text-white/70 hover:text-white border-b border-white/20 hover:border-white/60 pb-0.5 transition-colors duration-300"
              >
                Shop the Collection
                <ArrowRight className="size-3 shrink-0" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {heroReady && <ScrollCue />}
      </section>

      {/* ── Product collection ─────────────────────────────────────────────── */}
      <section id="collection" className="container-site pt-20 pb-28 md:pt-28 md:pb-36">
        <CollectionHeader />

        {isLoading ? (
          <ProductGridSkeleton count={3} columns={3} />
        ) : (
          <>
            {/* Always exactly 3 slots: real products first, static fallback, then Coming Soon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-10 md:gap-x-5 md:gap-y-14">
              {Array.from({ length: 3 }).map((_, i) => {
                // API product takes priority; fall back to static data; then Coming Soon
                const apiProduct = products?.data?.[i];
                const staticProduct = STATIC_PRODUCTS[i] as unknown as Product;
                const product = apiProduct ?? staticProduct ?? null;
                return product ? (
                  <AnimatedCard key={product.id} product={product} index={i} />
                ) : (
                  <ComingSoonCard key={`coming-soon-${i}`} index={i} />
                );
              })}
            </div>

            {products?.data && products.data.length > 0 && (
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
            )}
          </>
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
              { title: 'Free Shipping',  subtitle: 'On orders over 2,000 EGP' },
              { title: 'Easy Returns',   subtitle: 'Accepts returns within 14 days' },
              { title: 'Secure Payment', subtitle: 'All major cards accepted'  },
              { title: 'Customer Care',  subtitle: 'support@stressnes.com'     },
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
