interface HeartIconProps {
  filled: boolean;
  className?: string;
}

/**
 * Custom VidKing "like" mark — a crisp heart that fills on the active state.
 * Uses currentColor so it inherits the button's color transitions. Original
 * geometry (not a stock icon).
 */
export const HeartIcon = ({ filled, className = 'w-6 h-6' }: HeartIconProps) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20s-7-4.35-9.2-8.2C1.3 9 2.4 5.8 5.5 5.1c1.9-.4 3.7.5 4.5 2.1.8-1.6 2.6-2.5 4.5-2.1 3.1.7 4.2 3.9 2.7 6.7C19 15.65 12 20 12 20Z" />
  </svg>
);
