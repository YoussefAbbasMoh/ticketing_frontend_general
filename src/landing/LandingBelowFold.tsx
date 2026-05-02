import { Footer } from '@/landing/components/layout/Footer';
import { CTA } from '@/landing/components/sections/CTA';
import { Features } from '@/landing/components/sections/Features';
import { Platform } from '@/landing/components/sections/Platform';
import { Pricing } from '@/landing/components/sections/Pricing';
import { Problem } from '@/landing/components/sections/Problem';
import { SignupForm } from '@/landing/components/sections/SignupForm';
import { Testimonials } from '@/landing/components/sections/Testimonials';
import { TrustedTicker } from '@/landing/components/sections/TrustedTicker';
import type { ApiPlan } from '@/landing/lib/plans';

type Props = { plansFromApi: ApiPlan[] | null };

/**
 * Split from `LandingPage` so the hero critical path does not parse framer-motion
 * or full below-the-fold sections until this chunk loads.
 */
export function LandingBelowFold({ plansFromApi }: Props) {
  return (
    <>
      <TrustedTicker />
      <Problem />
      <Features />
      <Platform />
      <Pricing plansFromApi={plansFromApi} />
      <SignupForm />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  );
}
