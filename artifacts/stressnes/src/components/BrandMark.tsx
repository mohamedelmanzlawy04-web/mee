/**
 * STRESSNES compass-star logo mark.
 * Renders as an inline SVG so it inherits `currentColor` / `color` from CSS.
 * Use `className` to control color, size, and any other CSS properties.
 */
interface BrandMarkProps {
  /** Tailwind / CSS class — controls size and color */
  className?: string;
  size?: number;
  'aria-label'?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

export function BrandMark({
  className,
  size = 24,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = true,
}: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      focusable="false"
    >
      {/*
        8-pointed compass-star
        Cardinal tips (N/S/E/W): R = 47
        Diagonal tips (NE/SE/SW/NW): R = 24
        Inner notch radius: R = 6
      */}
      <polygon
        points="
          50,3
          52.3,44.5
          66.97,33.03
          55.5,47.7
          97,50
          55.5,52.3
          66.97,66.97
          52.3,55.5
          50,97
          47.7,55.5
          33.03,66.97
          44.5,52.3
          3,50
          44.5,47.7
          33.03,33.03
          47.7,44.5
        "
      />
      {/* Spine lines — visible at ≥ 20 px, create the faceted compass look */}
      <g stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.25">
        <line x1="50" y1="50" x2="50" y2="3"/>
        <line x1="50" y1="50" x2="66.97" y2="33.03"/>
        <line x1="50" y1="50" x2="97" y2="50"/>
        <line x1="50" y1="50" x2="66.97" y2="66.97"/>
        <line x1="50" y1="50" x2="50" y2="97"/>
        <line x1="50" y1="50" x2="33.03" y2="66.97"/>
        <line x1="50" y1="50" x2="3" y2="50"/>
        <line x1="50" y1="50" x2="33.03" y2="33.03"/>
      </g>
    </svg>
  );
}
