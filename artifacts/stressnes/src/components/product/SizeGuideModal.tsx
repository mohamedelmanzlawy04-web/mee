/**
 * SizeGuideModal
 *
 * Reusable size guide popup keyed by fit type.
 * To add a new fit in the future, add one entry to SIZE_GUIDE_IMAGES.
 *
 * Usage:
 *   <SizeGuideModal fitType="BOXY_FIT" open={open} onClose={() => setOpen(false)} />
 */

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Registry ─────────────────────────────────────────────────────────────────
// Add future fit types here — no other file needs to change.
const SIZE_GUIDE_IMAGES: Record<string, string> = {
  BOXY_FIT: '/images/size-guide-boxy-fit.png',
};

export type FitType = keyof typeof SIZE_GUIDE_IMAGES;

interface SizeGuideModalProps {
  fitType: FitType;
  open: boolean;
  onClose: () => void;
}

export function SizeGuideModal({ fitType, open, onClose }: SizeGuideModalProps) {
  const imgSrc = SIZE_GUIDE_IMAGES[fitType];
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!imgSrc) return null;

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
          'relative max-w-sm w-full rounded-sm overflow-hidden shadow-2xl',
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
            'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm',
            'transition-colors duration-150',
          )}
        >
          <X className="size-4" />
        </button>

        {/* Image — fills the panel, no extra padding needed (chart has its own margins) */}
        <img
          src={imgSrc}
          alt={`${fitType.replace(/_/g, ' ')} Size Chart`}
          className="w-full h-auto block"
          draggable={false}
        />
      </div>
    </div>
  );
}
