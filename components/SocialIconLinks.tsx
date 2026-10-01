const SOCIAL = {
  facebook: "https://web.facebook.com/personphotographerseye",
  instagram: "https://www.instagram.com/personphotographereye/?hl=en",
} as const;

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.48h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  );
}

/** Icon-only social links for the public navbar. */
export function SocialIconLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      <a
        href={SOCIAL.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
        title="Facebook"
        className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors hover:border-yellow-400/40 hover:text-yellow-400"
      >
        <FacebookIcon className="size-4" />
      </a>
      <a
        href={SOCIAL.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        title="Instagram"
        className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors hover:border-yellow-400/40 hover:text-yellow-400"
      >
        <InstagramIcon className="size-4" />
      </a>
    </div>
  );
}
