interface BrandLogoProps {
  size?: number;
  /** Adds animation hooks (classes) used by the cinematic intro. */
  animated?: boolean;
  className?: string;
}

/**
 * Original VidKing brand mark: a rounded badge enclosing the "VK" monogram with
 * a play-triangle accent. Pure SVG/CSS — lightweight, sharp at any size, and
 * theme-aware (uses the brand color token). Not derived from any existing brand.
 */
export const BrandLogo = ({ size = 96, animated = false, className = '' }: BrandLogoProps) => (
  <svg
    viewBox="0 0 120 120"
    width={size}
    height={size}
    role="img"
    aria-label="VidKing"
    className={className}
  >
    <defs>
      <linearGradient id="vk-badge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--color-brand)" />
        <stop offset="100%" stopColor="#7a0009" />
      </linearGradient>
    </defs>

    {/* Badge */}
    <rect
      x="6"
      y="6"
      width="108"
      height="108"
      rx="30"
      fill="url(#vk-badge)"
      className={animated ? 'bi-badge' : ''}
    />
    <rect
      x="6"
      y="6"
      width="108"
      height="108"
      rx="30"
      fill="none"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="1.5"
    />

    {/* Monogram "VK" with an integrated play triangle in the V */}
    <g className={animated ? 'bi-mark' : ''} fill="#fff">
      {/* V */}
      <path d="M30 38 L44 38 L52 70 L60 38 L74 38 L60 86 L44 86 Z" opacity="0.96" />
      {/* K */}
      <path d="M78 38 L90 38 L90 56 L101 38 L101 86 L90 86 L90 66 L86 72 L86 86 L78 86 Z" opacity="0.96" />
    </g>
  </svg>
);
