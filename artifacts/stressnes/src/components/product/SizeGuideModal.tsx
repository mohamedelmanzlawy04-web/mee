/**
 * SizeGuideModal
 *
 * Reusable size guide popup keyed by fit type.
 *
 * To wire up a real image for a fit that currently shows "coming soon":
 *   1. Add the image to public/images/
 *   2. Add one entry to SIZE_GUIDE_IMAGES below — nothing else changes.
 *
 * To add a brand-new fit type entirely:
 *   Add it to FIT_LABELS (display name) and optionally SIZE_GUIDE_IMAGES (image).
 *   If no image is provided the modal shows the "coming soon" message automatically.
 *
 * Usage:
 *   <SizeGuideModal fitType="BOXY_FIT" open={open} onClose={() => setOpen(false)} />
 */

import { useEffect, useRef } from 'react';
import { X, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Registry: image paths ─────────────────────────────────────────────────────
// Fits listed here have a real size chart. Fits NOT listed show "coming soon".
// To connect a new chart: add `FIT_KEY: '/images/size-guide-xxx.png'` here.
const SIZE_GUIDE_IMAGES: Partial<Record<FitType, string>> = {
  BOXY_FIT: '/images/size-guide-boxy-fit.png',
  // REGULAR_FIT: '/images/size-guide-regular-fit.png',  ← uncomment when ready
};

// ─── Registry: human-readable fit labels ──────────────────────────────────────
const FIT_LABELS: Record<FitType, string> = {
  BOXY_FIT:    'Boxy Fit',
  REGULAR_FIT: 'Regular Fit',
};

// ─── All supported fit types ───────────────────────────────────────────────────
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
  open: boolean;
  onClose: () => void;
}

export function SizeGuideModal({ fitType, open, onClose }: SizeGuideModalProps) {
  const imgSrc = SIZE_GUIDE_IMAGES[fitType] ?? null;
  const label  = FIT_LABELS[fitType];
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    // Backdrop
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Size Guide"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/60 backdrop-blur-sm',
        'transition-opacity duration-300',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
    >
      {/* Panel */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full shadow-2xl',
          imgSrc ? 'max-w-sm rounded-sm overflow-hidden' : 'max-w-xs rounded-sm bg-background',
          'transition-all duration-300',
          open ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4',
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close size guide"
          className={cn(
            'absolute top-3 right-3 z-10',
            'w-8 h-8 flex items-center justify-center rounded-full',
            'transition-colors duration-150',
            imgSrc
              ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
              : 'bg-muted hover:bg-secondary text-foreground',
          )}
        >
          <X className="size-4" />
        </button>

        {imgSrc ? (
          /* ── Real size chart image ── */
          <img
            src={imgSrc}
            alt={`${label} Size Chart`}
            className="w-full h-auto block"
            draggable={false}
          />
        ) : (
          /* ── Coming soon placeholder ── */
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
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
