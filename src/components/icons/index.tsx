/**
 * VidKing custom control icons. A small, original set drawn with `currentColor`
 * so they inherit button color/state transitions. Used for the primary controls
 * (play, add, close, search) to give the UI a branded feel instead of generic
 * stock icons. Audio and Heart live in their own files.
 */
export { AudioIcon } from './AudioIcon';
export { HeartIcon } from './HeartIcon';

interface IconProps {
  className?: string;
}

/** Solid play triangle with crisp rounded corners. */
export const PlayIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M7 4.5c0-1.1 1.2-1.8 2.2-1.2l11 6.5c.9.6.9 1.9 0 2.5l-11 6.5c-1 .6-2.2-.1-2.2-1.2V4.5Z" />
  </svg>
);

/** Add / in-list control: a plus that rotates into an "x"/check feel when active. */
export const AddIcon = ({ active = false, className = 'w-6 h-6' }: IconProps & { active?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} transition-transform duration-300 ${active ? 'rotate-45' : ''}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** Close control. */
export const CloseIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** Search control with a slightly tapered handle. */
export const SearchIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);
