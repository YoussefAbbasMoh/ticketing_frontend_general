import { lazy, Suspense, useEffect, useState } from 'react';

import { Navbar } from '@/landing/components/layout/Navbar';

import { Hero } from '@/landing/components/sections/Hero';

import { fetchSubscriptionPlans } from '@/landing/lib/plans';

import { LandingLangProvider, useLandingLang } from '@/landing/LandingLangContext';



const LandingBelowFold = lazy(() =>

  import('./LandingBelowFold').then((m) => ({ default: m.LandingBelowFold }))

);



const noiseSvg = encodeURIComponent(
  `<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.04'/></svg>`
);

function BelowFoldFallback() {
  return <div className="min-h-screen w-full bg-navy-dark" aria-hidden />;
}

function LandingPageInner() {

  const { lang, copy } = useLandingLang();

  const [plansFromApi, setPlansFromApi] = useState(null);



  useEffect(() => {

    document.title = copy.meta.title;

    let script = document.getElementById('tik-jsonld');

    if (!script) {

      script = document.createElement('script');

      script.id = 'tik-jsonld';

      script.type = 'application/ld+json';

      document.head.appendChild(script);

    }

    script.textContent = JSON.stringify({

      '@context': 'https://schema.org',

      '@type': 'SoftwareApplication',

      name: 'Tik',

      applicationCategory: 'BusinessApplication',

      operatingSystem: 'Web, iOS, Android',

      description: copy.meta.jsonLdDescription,

    });

    fetchSubscriptionPlans(lang).then(setPlansFromApi);

  }, [lang, copy.meta.title, copy.meta.jsonLdDescription]);



  useEffect(() => {

    void import('./LandingBelowFold');

  }, []);



  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const htmlLang = lang === 'ar' ? 'ar' : 'en';



  return (

    <div

      className="tik-marketing min-h-screen bg-navy-dark font-cairo text-white antialiased"

      dir={dir}

      lang={htmlLang}

    >

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

export function LandingPage() {

  return (

    <LandingLangProvider>

      <LandingPageInner />

    </LandingLangProvider>

  );

}


