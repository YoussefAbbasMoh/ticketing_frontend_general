import { TikLogoFull } from '@/landing/components/ui/TikLogo';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-dark py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <TikLogoFull />
            <p className="mt-4 font-cairo text-sm text-white/55">
              Tickets, team chat, and attendance — one platform for Egyptian and MENA
              SMEs. Replace scattered tools with one source of truth.
            </p>
          </div>
          <div>
            <p className="font-cairo text-sm font-semibold uppercase tracking-wider text-white">
              Product
            </p>
            <ul className="mt-4 space-y-2 font-cairo text-sm text-white/65">
              <li>
                <a href="#features" className="hover:text-orange">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-orange">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#platform" className="hover:text-orange">
                  Mobile App
                </a>
              </li>
              <li>
                <span className="cursor-not-allowed text-white/35">Changelog</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-cairo text-sm font-semibold uppercase tracking-wider text-white">
              Company
            </p>
            <ul className="mt-4 space-y-2 font-cairo text-sm text-white/65">
              <li>
                <span className="text-white/35">About</span>
              </li>
              <li>
                <span className="text-white/35">Blog</span>
              </li>
              <li>
                <span className="text-white/35">Careers</span>
              </li>
              <li>
                <a href="mailto:hello@tik.app" className="hover:text-orange">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-cairo text-sm font-semibold uppercase tracking-wider text-white">
              Support
            </p>
            <ul className="mt-4 space-y-2 font-cairo text-sm text-white/65">
              <li>
                <span className="text-white/35">Help Center</span>
              </li>
              <li>
                <span className="text-white/35">Onboarding Guide</span>
              </li>
              <li>
                <span className="text-white/35">System Status</span>
              </li>
              <li>
                <span className="text-white/35">API Docs</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="font-cairo text-sm text-white/45">
            © {new Date().getFullYear()} Tik. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 font-cairo text-sm text-white/55">
            <span className="cursor-pointer hover:text-white">Privacy Policy</span>
            <span className="cursor-pointer hover:text-white">Terms of Service</span>
            <span className="cursor-pointer hover:text-white">Cookie Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
