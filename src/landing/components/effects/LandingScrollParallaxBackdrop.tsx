import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Fixed ambient layer with scroll-linked drift on large shapes (pairs with CSS `LandingAmbientBackdrop`).
 */
export function LandingScrollParallaxBackdrop() {
  const reduce = useReducedMotion() === true;
  const { scrollYProgress } = useScroll();

  const ySlow = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const xDrift = useTransform(scrollYProgress, [0, 1], [0, 36]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 12]);

  if (reduce) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -left-[15%] top-[40%] h-[min(480px,55vh)] w-[min(480px,55vh)] rounded-full bg-orange/[0.06] blur-[100px]"
        style={{ y: ySlow, x: xDrift }}
      />
      <motion.div
        className="absolute -right-[12%] top-[55%] h-[min(400px,48vh)] w-[min(400px,48vh)] rounded-full bg-white/[0.05] blur-[90px]"
        style={{ y: yFast }}
      />
      <motion.div
        className="absolute left-[50%] top-[70%] h-24 w-24 -translate-x-1/2 rounded-2xl border border-white/[0.08] bg-white/[0.02] shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        style={{ y: ySlow, rotate }}
      />
    </div>
  );
}
