export function TikLogoIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#0D1B5E" />
      <path d="M8 10H32V16H23V30H17V16H8Z" fill="#FF4E0D" />
      <path d="M17 16H23L26 30H20Z" fill="#CC3A00" />
      <path
        d="M11 22L15 27L22 19"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TikLogoFull() {
  return (
    <div className="flex min-h-10 items-center gap-3">
      <TikLogoIcon size={40} />
      <span className="font-cairo font-extrabold text-2xl tracking-tight text-white">
        tik<span className="text-orange">.</span>
      </span>
    </div>
  );
}
