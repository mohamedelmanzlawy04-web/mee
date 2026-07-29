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
import { createPortal } from 'react-dom';
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

  // Track whether the image failed to load so we can fall back to a size table
  const [imgError, setImgError] = useState(false);

  // Reset imgError when the modal closes or the image source changes
  useEffect(() => {
    if (!open) setImgError(false);
  }, [open, imgSrc]);

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

  // Decide what to show: image (if src exists and loaded OK) or measurement table
  const showImage = !!imgSrc && !imgError;

  // Measurement data keyed by fit type — used when no image is available
  const MEASUREMENTS: Record<FitType, { size: string; chest: string; length: string; shoulder: string }[]> = {
    BOXY_FIT: [
      { size: 'M',  chest: '116 cm', length: '72 cm', shoulder: '52 cm' },
      { size: 'L',  chest: '122 cm', length: '74 cm', shoulder: '54 cm' },
      { size: 'XL', chest: '128 cm', length: '76 cm', shoulder: '56 cm' },
    ],
    REGULAR_FIT: [
      { size: 'S',  chest: '104 cm', length: '70 cm', shoulder: '46 cm' },
      { size: 'M',  chest: '110 cm', length: '72 cm', shoulder: '48 cm' },
      { size: 'L',  chest: '116 cm', length: '74 cm', shoulder: '50 cm' },
      { size: 'XL', chest: '122 cm', length: '76 cm', shoulder: '52 cm' },
    ],
  };
  const rows = MEASUREMENTS[fitType];

  const modalContent = (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label="Size Guide"
      onClick={handleBackdropClick}
      className={cn(
        // z-[10000] sits above CartSidebar (z-[9999]) and Navbar (z-50)
        'fixed inset-0 z-[10000] flex items-center justify-center',
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
          'max-h-[calc(100dvh-2rem)] sm:max-h-[90vh]',
          'rounded-sm shadow-2xl overflow-hidden',
          'bg-background',
          'transition-all duration-300',
          open ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4',
        )}
        onClick={e => e.stopPropagation()}
      >
        {showImage ? (
          <>
            {/* ── Header bar ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0 bg-background">
              <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-muted-foreground">
                Size Guide
              </p>

              {/* Zoom controls */}
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

                <span className="w-px h-5 bg-border/60 mx-1" />

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
                  src={imgSrc!}
                  alt={`${label} Size Chart`}
                  draggable={false}
                  onError={() => setImgError(true)}
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

            <p className="sm:hidden text-center font-sans text-[9px] tracking-[0.3em] uppercase text-muted-foreground py-2 shrink-0 border-t border-border/40 bg-background">
              Pinch to zoom · Scroll to pan
            </p>
          </>
        ) : (
          /* ── Measurement table (shown when no image or image failed to load) ── */
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
              <div>
                <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-0.5">
                  Size Guide
                </p>
                <p className="font-serif text-lg leading-tight">{label}</p>
              </div>
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

            {/* Hint */}
            <p className="font-sans text-[10px] tracking-wider uppercase text-muted-foreground px-5 pt-4 pb-2">
              All measurements are of the garment (cm)
            </p>

            {/* Table */}
            <div className="overflow-auto flex-1 px-5 pb-5">
              <table className="w-full font-sans text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Size</th>
                    <th className="text-left py-2 pr-4 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Chest</th>
                    <th className="text-left py-2 pr-4 text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Length</th>
                    <th className="text-left py-2     text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Shoulder</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.size} className={cn('border-b border-border/40', i === rows.length - 1 && 'border-0')}>
                      <td className="py-3 pr-4 font-medium">{row.size}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.chest}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.length}</td>
                      <td className="py-3     text-muted-foreground">{row.shoulder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tip */}
            <div className="px-5 pb-5 flex items-start gap-2">
              <Ruler className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
                If you're between sizes, size up for a more relaxed feel.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render via portal so z-index is never affected by parent stacking contexts
  return createPortal(modalContent, document.body);
}
