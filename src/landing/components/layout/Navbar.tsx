import { LinkButton } from '@/landing/components/ui/Button';
import { TikLogoFull } from '@/landing/components/ui/TikLogo';
import { useLandingLang } from '@/landing/LandingLangContext';
import type { LandingLang } from '@/landing/lib/landingCopy';
import { Menu, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export function Navbar() {
  const { lang, setLang, copy } = useLandingLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const links = useMemo(
    () => [
      { href: '#features', label: copy.nav.features },
      { href: '#platform', label: copy.nav.platform },
      { href: '#pricing', label: copy.nav.pricing },
      { href: '#testimonials', label: copy.nav.reviews },
      { href: '#signup', label: copy.nav.getStarted },
    ],
    [copy.nav]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const langBtn = (code: LandingLang, label: string) => (
    <button
      type="button"
      onClick={() => setLang(code)}
      className={`rounded-full px-3 py-1.5 font-cairo text-xs font-semibold transition-colors ${
        lang === code ? 'bg-orange text-white' : 'text-white/65 hover:text-white'
      }`}
      aria-pressed={lang === code}
    >
      {label}
    </button>
  );

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-colors duration-300 ${
        scrolled ? 'bg-navy-dark/[0.97]' : 'bg-navy-dark/85'
      } backdrop-blur-xl border-b border-white/[0.06]`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 lg:px-8">
        <a href="#hero" className="cursor-pointer shrink-0" onClick={() => setOpen(false)}>
          <TikLogoFull />
        </a>

        <nav className="hidden items-center gap-8 lg:flex xl:gap-10">
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

        <div className="hidden items-center gap-2 lg:flex">
          <div
            className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] p-1"
            role="group"
            aria-label="Language"
          >
            {langBtn('en', 'EN')}
            <span className="select-none px-0.5 font-cairo text-xs text-white/35" aria-hidden>
              |
            </span>
            {langBtn('ar', 'AR')}
          </div>
          <a
            href="/login"
            className="font-cairo text-sm font-medium text-white/70 hover:text-white whitespace-nowrap"
          >
            {copy.nav.signIn}
          </a>
          <LinkButton variant="ghost" href="#pricing" className="!py-2.5 !px-4 text-sm whitespace-nowrap">
            {copy.nav.viewPlans}
          </LinkButton>
          <LinkButton variant="primary" href="#signup" className="!py-2.5 !px-4 text-sm whitespace-nowrap">
            {copy.nav.getStartedFree}
          </LinkButton>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <div
            className="flex items-center gap-0.5 rounded-full border border-white/15 bg-white/[0.06] p-1"
            role="group"
            aria-label="Language"
          >
            {langBtn('en', 'EN')}
            <span className="select-none px-0.5 font-cairo text-xs text-white/35" aria-hidden>
              |
            </span>
            {langBtn('ar', 'AR')}
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-white"
            aria-label={open ? copy.nav.closeMenu : copy.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
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
              className="py-2 text-center font-cairo text-sm text-white/85"
              onClick={() => setOpen(false)}
            >
              {copy.nav.signIn}
            </a>
            <LinkButton variant="ghost" href="#pricing" className="w-full justify-center">
              {copy.nav.viewPlans}
            </LinkButton>
            <LinkButton variant="primary" href="#signup" className="w-full justify-center">
              {copy.nav.getStartedFree}
            </LinkButton>
          </div>
        </div>
      ) : null}
    </header>
  );
}
