/** The app's mark: a stacked worksheet with three AI sparkles, matching
 * public/favicon.svg and public/icons/icon.svg pixel-for-pixel so the
 * browser tab, home-screen icon, and in-app header always show the same
 * logo. Colors are intentionally static (not theme tokens) — a printed
 * mark doesn't change hue when the UI switches to dark mode. */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      <rect x="4" y="4" width="88" height="88" rx="20" fill="#7935c6" />
      <rect x="30" y="30" width="40" height="50" rx="4" fill="#ffffff" opacity="0.5" />
      <rect x="22" y="20" width="40" height="50" rx="4" fill="#ffffff" />
      <path d="M30 36 L54 36" stroke="#7935c6" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M30 46 L54 46" stroke="#7935c6" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M30 56 L46 56" stroke="#7935c6" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M69 7 C71.6 13.4 71.6 13.4 78 16 C71.6 18.6 71.6 18.6 69 25 C66.4 18.6 66.4 18.6 60 16 C66.4 13.4 66.4 13.4 69 7 Z"
        fill="#ffffff"
      />
      <path
        d="M18 8.5 C19.6 12.4 19.6 12.4 23.5 14 C19.6 15.6 19.6 15.6 18 19.5 C16.4 15.6 16.4 15.6 12.5 14 C16.4 12.4 16.4 12.4 18 8.5 Z"
        fill="#ffffff"
      />
      <path
        d="M78 60 C79.1 62.9 79.1 62.9 82 64 C79.1 65.1 79.1 65.1 78 68 C76.9 65.1 76.9 65.1 74 64 C76.9 62.9 76.9 62.9 78 60 Z"
        fill="#ffffff"
      />
    </svg>
  )
}
