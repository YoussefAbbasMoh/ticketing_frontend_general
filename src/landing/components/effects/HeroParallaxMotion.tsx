/* eslint-disable react/prop-types, react-refresh/only-export-components -- MotionValue + hook pairing */
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { useCallback } from 'react';

const springOpts = { stiffness: 140, damping: 22, mass: 0.45 };

export function useHeroParallaxMotion() {
  const reduce = useReducedMotion() === true;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, springOpts);
  const springY = useSpring(mouseY, springOpts);

  const onPointerMove = useCallback(
    (e) => {
      if (reduce) return;
      const r = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / Math.max(r.width, 1)) * 2 - 1;
      const ny = ((e.clientY - r.top) / Math.max(r.height, 1)) * 2 - 1;
      mouseX.set(Math.max(-1, Math.min(1, nx * 1.15)));
      mouseY.set(Math.max(-1, Math.min(1, ny * 1.15)));
    },
    [reduce, mouseX, mouseY]
  );

  const onPointerLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return { reduce, springX, springY, onPointerMove, onPointerLeave };
}

/**
 * Extra depth layer: follows pointer with varied parallax strength (hero copy / phone stay untouched).
 */
export function HeroParallaxVisuals({ springX, springY, reduce }) {
  const x1 = useTransform(springX, (v) => (reduce ? 0 : v * 48));
  const y1 = useTransform(springY, (v) => (reduce ? 0 : v * 36));
  const x2 = useTransform(springX, (v) => (reduce ? 0 : v * -32));
  const y2 = useTransform(springY, (v) => (reduce ? 0 : v * -28));
  const x3 = useTransform(springX, (v) => (reduce ? 0 : v * 22));
  const y3 = useTransform(springY, (v) => (reduce ? 0 : v * 26));
  const x4 = useTransform(springX, (v) => (reduce ? 0 : v * -18));
  const y4 = useTransform(springY, (v) => (reduce ? 0 : v * 20));
  const tilt = useTransform(springX, (v) => (reduce ? 0 : v * 10));

  if (reduce) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden lg:overflow-visible"
      aria-hidden
    >
      <motion.div
        className="absolute -right-[8%] top-[14%] h-[min(280px,40vw)] w-[min(280px,40vw)] rounded-full bg-orange/[0.12] blur-[70px]"
        style={{ x: x1, y: y1 }}
      />
      <motion.div
        className="absolute left-[5%] top-[48%] h-[min(200px,32vw)] w-[min(200px,32vw)] rounded-full bg-white/[0.05] blur-[56px]"
        style={{ x: x2, y: y2 }}
      />
      <motion.div
        className="absolute right-[20%] top-[58%] h-24 w-24 rounded-2xl border border-orange/25 bg-orange/[0.08] shadow-[0_0_40px_rgba(255,78,13,0.12)] backdrop-blur-sm"
        style={{ x: x3, y: y3, rotate: tilt }}
      />
      <motion.div
        className="absolute left-[38%] top-[20%] h-14 w-14 rounded-full border-2 border-white/15 bg-white/[0.04] shadow-lg backdrop-blur-sm"
        style={{ x: x4, y: y4 }}
      />
    </div>
  );
}
