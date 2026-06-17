interface AudioIconProps {
  muted: boolean;
  className?: string;
}

/**
 * Custom VidKing audio control mark. A clean speaker with two sound arcs when
 * active, collapsing to a single muted dot + slash when off — drawn with
 * `currentColor` so it inherits button color/states. Not a stock icon.
 */
export const AudioIcon = ({ muted, className = 'w-6 h-6' }: AudioIconProps) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* Speaker body */}
    <path d="M4 9v6h3.5L13 19V5L7.5 9H4Z" fill="currentColor" stroke="none" />
    {muted ? (
      // Muted: slash
      <path d="M17 9.5l4 5m0-5l-4 5" />
    ) : (
      // Active: two sound arcs
      <>
        <path d="M16.5 8.5a5 5 0 0 1 0 7" />
        <path d="M19 6a8.5 8.5 0 0 1 0 12" opacity="0.7" />
      </>
    )}
  </svg>
);
