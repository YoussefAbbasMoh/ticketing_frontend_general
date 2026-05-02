import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LinkButton } from '@/landing/components/ui/Button';
import { TikLogoFull } from '@/landing/components/ui/TikLogo';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#platform', label: 'Platform' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#testimonials', label: 'Reviews' },
  { href: '#signup', label: 'Get Started' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-colors duration-300 ${
        scrolled ? 'bg-navy-dark/[0.97]' : 'bg-navy-dark/85'
      } backdrop-blur-xl border-b border-white/[0.06]`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <a href="#hero" className="cursor-pointer" onClick={() => setOpen(false)}>
          <TikLogoFull />
        </a>

        <nav className="hidden items-center gap-10 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-cairo text-sm font-medium text-white/75 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="/login"
            className="font-cairo text-sm font-medium text-white/70 hover:text-white"
          >
            Sign in
          </a>
          <LinkButton variant="ghost" href="#pricing" className="!py-2.5 !px-4 text-sm">
            View Plans
          </LinkButton>
          <LinkButton variant="primary" href="#signup" className="!py-2.5 !px-4 text-sm">
            Get Started Free
          </LinkButton>
        </div>

        <button
          type="button"
          className="cursor-pointer rounded-lg p-2 text-white lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-navy-dark/98 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-cairo py-2 text-white/85"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <a
              href="/login"
              className="py-2 font-cairo text-center text-sm text-white/85"
              onClick={() => setOpen(false)}
            >
              Sign in
            </a>
            <LinkButton variant="ghost" href="#pricing" className="w-full justify-center">
              View Plans
            </LinkButton>
            <LinkButton variant="primary" href="#signup" className="w-full justify-center">
              Get Started Free
            </LinkButton>
          </div>
        </div>
      ) : null}
    </header>
  );
}
