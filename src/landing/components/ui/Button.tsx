import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'outline';

const variants: Record<
  Variant,
  string
> = {
  primary:
    'bg-orange text-white hover:bg-orange-dark shadow-[0_0_24px_rgba(255,78,13,0.35)] border border-orange',
  ghost:
    'bg-transparent text-white border border-white/20 hover:border-white/40 hover:bg-white/[0.06]',
  outline:
    'bg-transparent text-white border border-white/25 hover:border-orange/60 hover:text-orange',
};

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-center font-cairo font-semibold transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  variant = 'primary',
  className = '',
  children,
  href,
  ...props
}: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  variant?: Variant;
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-center font-cairo font-semibold transition-colors duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
