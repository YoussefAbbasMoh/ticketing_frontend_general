import { TikLogoFull } from '@/landing/components/ui/TikLogo';
import { useLandingLang } from '@/landing/LandingLangContext';

export function Footer() {
  const { copy } = useLandingLang();
  const f = copy.footer;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-navy-dark py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <TikLogoFull />
            <p className="mt-4 font-cairo text-sm text-white/55">{f.blurb}</p>
          </div>
          <div>
            <p className="font-cairo text-sm font-semibold uppercase tracking-wider text-white">
              {f.product}
            </p>
            <ul className="mt-4 space-y-2 font-cairo text-sm text-white/65">
              <li>
                <a href="#features" className="hover:text-orange">
                  {f.linkFeatures}
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-orange">
                  {f.linkPricing}
                </a>
              </li>
              <li>
                <a href="#platform" className="hover:text-orange">
                  {f.linkMobile}
                </a>
              </li>
              <li>
                <span className="cursor-not-allowed text-white/35">{f.linkChangelog}</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-cairo text-sm font-semibold uppercase tracking-wider text-white">
              {f.company}
            </p>
            <ul className="mt-4 space-y-2 font-cairo text-sm text-white/65">
              <li>
                <span className="text-white/35">{f.linkAbout}</span>
              </li>
              <li>
                <span className="text-white/35">{f.linkBlog}</span>
              </li>
              <li>
                <span className="text-white/35">{f.linkCareers}</span>
              </li>
              <li>
                <a href="mailto:info@absai.dev" className="hover:text-orange">
                  {f.linkContact}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-cairo text-sm font-semibold uppercase tracking-wider text-white">
              {f.support}
            </p>
            <ul className="mt-4 space-y-2 font-cairo text-sm text-white/65">
              <li>
                <span className="text-white/35">{f.linkHelp}</span>
              </li>
              <li>
                <span className="text-white/35">{f.linkOnboarding}</span>
              </li>
              <li>
                <span className="text-white/35">{f.linkStatus}</span>
              </li>
              <li>
                <span className="text-white/35">{f.linkApi}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="font-cairo text-sm text-white/45">
            © {year} Tik. {f.rights}
          </p>
          <div className="flex flex-wrap gap-4 font-cairo text-sm text-white/55">
            <span className="cursor-pointer hover:text-white">{f.privacy}</span>
            <span className="cursor-pointer hover:text-white">{f.terms}</span>
            <span className="cursor-pointer hover:text-white">{f.cookies}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
