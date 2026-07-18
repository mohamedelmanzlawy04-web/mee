/**
 * SizeGuideModal
 *
 * Reusable size guide popup keyed by fit type, with optional per-product
 * image overrides so a single product can have its own size chart without
 * affecting any other product.
 *
 * To wire up a real image for a fit type:
 *   1. Add the image to public/images/
 *   2. Add one entry to SIZE_GUIDE_IMAGES below.
 *
 * To wire up a per-product override (takes priority over fit-type image):
 *   1. Add the image to public/images/
 *   2. Add one entry to PRODUCT_SIZE_GUIDE_OVERRIDES below, keyed by product slug.
 *
 * To add a brand-new fit type entirely:
 *   Add it to FIT_LABELS (display name) and optionally SIZE_GUIDE_IMAGES.
 *   If no image is provided the modal shows the "coming soon" message.
 *
 * Usage:
 *   <SizeGuideModal fitType="BOXY_FIT" productSlug="lobster-tee" open={open} onClose={() => setOpen(false)} />
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Ruler, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Per-product image overrides (highest priority) ───────────────────────────
// Keyed by product slug. When a slug is found here its image is used regardless
// of the fit-type map below — no other product is affected.
const PRODUCT_SIZE_GUIDE_OVERRIDES: Record<string, string> = {
  'bonna-appetit-tee': '/images/size-guide-bonna-appetit.png',
};

// ─── Fit-type image registry (fallback when no product override exists) ────────
const SIZE_GUIDE_IMAGES: Partial<Record<FitType, string>> = {
  BOXY_FIT: '/images/size-guide-boxy-fit.png',
  // REGULAR_FIT: '/images/size-guide-regular-fit.png',  ← uncomment when ready
};

// ─── Human-readable fit labels ────────────────────────────────────────────────
const FIT_LABELS: Record<FitType, string> = {
  BOXY_FIT:    'Boxy Fit',
  REGULAR_FIT: 'Regular Fit',
};

// ─── All supported fit types ──────────────────────────────────────────────────
export type FitType = 'BOXY_FIT' | 'REGULAR_FIT';

// Helper — derive FitType from a product's shortDescription string.
// "BOXY FIT" → "BOXY_FIT", "REGULAR FIT" → "REGULAR_FIT", unknown → null.
export function fitTypeFromDescription(description: string | null | undefined): FitType | null {
  if (!description) return null;
  const key = description.trim().replace(/\s+/g, '_').toUpperCase() as FitType;
  return key in FIT_LABELS ? key : null;
}

interface SizeGuideModalProps {
  fitType: FitType;
  /** Product slug — used to look up per-product image overrides. */
  productSlug?: string;
  open: boolean;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export function SizeGuideModal({ fitType, productSlug, open, onClose }: SizeGuideModalProps) {
  // Resolve image: product-slug override first, then fit-type map, then null (coming soon)
  const imgSrc =
    (productSlug && PRODUCT_SIZE_GUIDE_OVERRIDES[productSlug]) ??
    SIZE_GUIDE_IMAGES[fitType] ??
    null;
  const label = FIT_LABELS[fitType];

  const backdropRef = useRef<HTMLDivElement>(null);
  const imageRef    = useRef<HTMLImageElement>(null);

  // ── Zoom state (desktop buttons + pinch) ──────────────────────────────────
  const [zoom, setZoom] = useState(1);

  const zoomIn  = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);
  const zoomOut = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(z => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);
  const resetZoom = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
  }, []);

  // Reset zoom whenever the modal is closed
  useEffect(() => {
    if (!open) setZoom(1);
  }, [open]);

  // ── Keyboard: Escape to close ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // ── Backdrop click to close (only when clicking the backdrop itself) ───────
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label="Size Guide"
      onClick={handleBackdropClick}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/65 backdrop-blur-sm',
        'transition-opacity duration-300',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        // Safe area padding on all sides
        'p-4 sm:p-6',
        '[padding-top:max(1rem,env(safe-area-inset-top))]',
        '[padding-bottom:max(1rem,env(safe-area-inset-bottom))]',
        '[padding-left:max(1rem,env(safe-area-inset-left))]',
        '[padding-right:max(1rem,env(safe-area-inset-right))]',
      )}
    >
      {/* Panel */}
      <div
        className={cn(
          'relative flex flex-col',
          'w-full max-w-sm',
          // Full height on mobile so it fills the safe area; auto on desktop
          'max-h-[calc(100dvh-2rem)] sm:max-h-[90vh]',
          'rounded-sm shadow-2xl overflow-hidden',
          'bg-background',
          'transition-all duration-300',
          open ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4',
        )}
        onClick={e => e.stopPropagation()}
      >
        {imgSrc ? (
          <>
            {/* ── Header bar ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0 bg-background">
              <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-muted-foreground">
                Size Guide
              </p>

              {/* Zoom controls — desktop-first, still available on mobile */}
              <div className="flex items-center gap-1">
                <button
                  onClick={zoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label="Zoom out"
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-sm',
                    'border border-border/60 text-muted-foreground',
                    'hover:bg-secondary hover:text-foreground transition-colors',
                    'disabled:opacity-30 disabled:cursor-not-allowed',
                  )}
                >
                  <ZoomOut className="size-3.5" />
                </button>

                <button
                  onClick={resetZoom}
                  disabled={zoom === MIN_ZOOM}
                  aria-label="Reset zoom"
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-sm',
                    'border border-border/60 text-muted-foreground',
                    'hover:bg-secondary hover:text-foreground transition-colors',
                    'disabled:opacity-30 disabled:cursor-not-allowed',
                  )}
                >
                  <RotateCcw className="size-3" />
                </button>

                <button
                  onClick={zoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label="Zoom in"
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-sm',
                    'border border-border/60 text-muted-foreground',
                    'hover:bg-secondary hover:text-foreground transition-colors',
                    'disabled:opacity-30 disabled:cursor-not-allowed',
                  )}
                >
                  <ZoomIn className="size-3.5" />
                </button>

                {/* Divider */}
                <span className="w-px h-5 bg-border/60 mx-1" />

                {/* Close */}
                <button
                  onClick={onClose}
                  aria-label="Close size guide"
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-sm',
                    'border border-border/60 text-muted-foreground',
                    'hover:bg-secondary hover:text-foreground transition-colors',
                  )}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/*
             * ── Scrollable image container ────────────────────────────
             *
             * overflow-auto + touch-action: pinch-zoom lets the user
             * use two-finger pinch natively on iOS/Android without any
             * JS gesture library. The zoomed image overflows the
             * container and the container scrolls to let them pan.
             *
             * The image is scaled via CSS transform (transform-origin
             * top-left) so it grows from the top-left corner, which
             * matches what users expect when pinch-zooming.
             */}
            <div
              className="overflow-auto overscroll-contain flex-1 bg-[#1a1a18]"
              style={{ touchAction: 'pinch-zoom' }}
            >
              <div
                style={{
                  width:  `${zoom * 100}%`,
                  height: `${zoom * 100}%`,
                  minWidth: '100%',
                  minHeight: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                }}
              >
                <img
                  ref={imageRef}
                  src={imgSrc}
                  alt={`${label} Size Chart`}
                  draggable={false}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                />
              </div>
            </div>

            {/* ── Pinch hint — mobile only ──────────────────────────── */}
            <p className="sm:hidden text-center font-sans text-[9px] tracking-[0.3em] uppercase text-muted-foreground py-2 shrink-0 border-t border-border/40 bg-background">
              Pinch to zoom · Scroll to pan
            </p>
          </>
        ) : (
          /* ── Coming soon placeholder ── */
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center relative">
            <button
              onClick={onClose}
              aria-label="Close size guide"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-secondary text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Ruler className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-2">
                Size Guide
              </p>
              <p className="font-serif text-xl text-foreground mb-1">{label}</p>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                Size Guide will be available soon.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 font-sans text-xs tracking-widest uppercase border border-border rounded-sm px-6 py-2.5 hover:bg-secondary transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
