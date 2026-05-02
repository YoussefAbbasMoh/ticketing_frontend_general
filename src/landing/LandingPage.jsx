import { lazy, Suspense, useEffect, useState } from 'react';
import { Navbar } from '@/landing/components/layout/Navbar';
import { Hero } from '@/landing/components/sections/Hero';
import { fetchSubscriptionPlans } from '@/landing/lib/plans';

const LandingBelowFold = lazy(() =>
  import('./LandingBelowFold').then((m) => ({ default: m.LandingBelowFold }))
);

const noiseSvg = encodeURIComponent(
  `<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.04'/></svg>`
);

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Tik',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  description:
    'All-in-one internal operations platform — ticketing, messaging, attendance.',
};

/** One viewport of matching background — avoids a tall wrong-height spacer swapping for real content (CLS). */
function BelowFoldFallback() {
  return <div className="min-h-screen w-full bg-navy-dark" aria-hidden />;
}

export function LandingPage() {
  const [plansFromApi, setPlansFromApi] = useState(null);

  useEffect(() => {
    document.title = 'Tik — Manage Teams, Tickets & Attendance in One Place';
    let script = document.getElementById('tik-jsonld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'tik-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(JSON_LD);
    fetchSubscriptionPlans('en').then(setPlansFromApi);
  }, []);

  /** Warm the async chunk in parallel with hero paint */
  useEffect(() => {
    void import('./LandingBelowFold');
  }, []);

  return (
    <div className="tik-marketing min-h-screen bg-navy-dark font-cairo text-white antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,${noiseSvg}")`,
        }}
        aria-hidden
      />
      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <Suspense fallback={<BelowFoldFallback />}>
            <LandingBelowFold plansFromApi={plansFromApi} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
