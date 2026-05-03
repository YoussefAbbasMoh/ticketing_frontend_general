import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

const EASE_OUT = [0.16, 1, 0.3, 1];

const defaultHidden = {
  opacity: 0,
  y: 20,
  filter: 'blur(6px)',
};

const defaultVisibleBase = {
  opacity: 1,
  y: 0,
  filter: 'blur(0px)',
};

/**
 * Split `text` into words (preserving whitespace tokens) or Unicode code points.
 * @param {string} text
 * @param {'letters' | 'words'} splitBy
 * @returns {string[]}
 */
function splitIntoItems(text, splitBy) {
  if (!text) return [];
  if (splitBy === 'words') {
    return text.split(/(\s+)/);
  }
  return Array.from(text);
}

/**
 * Premium staggered text: blur + fade + slide, viewport-triggered, once.
 *
 * @example
 * import { StaggeredText } from '@/components/ui/StaggeredText';
 *
 * <StaggeredText
 *   text="Ship faster with clarity"
 *   splitBy="words"
 *   delay={0.1}
 *   stagger={0.05}
 *   duration={0.55}
 *   className="text-2xl font-semibold text-white"
 * />
 *
 * @example Replay (bump replayKey to re-run while in view)
 * <StaggeredText text="Replay me" replayKey={nonce} splitBy="letters" />
 *
 * @example Custom child variants (merged onto defaults)
 * <StaggeredText
 *   text="Custom"
 *   childVariants={{ visible: { y: 0, transition: { duration: 0.8 } } }}
 * />
 */
function StaggeredTextInner({
  text,
  splitBy = 'words',
  delay = 0,
  stagger = 0.04,
  duration = 0.5,
  className = '',
  once = true,
  replayKey = 0,
  childVariants: childVariantsProp = null,
  viewport: viewportProp,
}) {
  const items = useMemo(() => splitIntoItems(text, splitBy), [text, splitBy]);

  const childVariants = useMemo(() => {
    const custom = childVariantsProp || {};
    const customHidden = custom.hidden || {};
    const customVisible = custom.visible || {};
    const customTransition = customVisible.transition;

    return {
      hidden: { ...defaultHidden, ...customHidden },
      visible: {
        ...defaultVisibleBase,
        ...customVisible,
        transition: {
          duration,
          ease: EASE_OUT,
          ...customTransition,
        },
      },
    };
  }, [childVariantsProp, duration]);

  const containerVariants = useMemo(
    () => ({
      hidden: {},
      visible: {
        transition: {
          delayChildren: delay,
          staggerChildren: stagger,
        },
      },
    }),
    [delay, stagger],
  );

  const viewport = useMemo(
    () => ({
      once,
      amount: 0.35,
      margin: '0px 0px -8% 0px',
      ...viewportProp,
    }),
    [once, viewportProp],
  );

  if (!text) {
    return null;
  }

  return (
    <span className="inline align-baseline">
      <span className="sr-only">{text}</span>
      <motion.span
        key={replayKey}
        className={`inline align-baseline ${className}`.trim()}
        aria-hidden="true"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        {items.map((item, i) => {
          if (splitBy === 'words' && item === '') return null;
          const isWhitespaceOnly = splitBy === 'words' && /^\s+$/.test(item);
          return (
            <motion.span
              key={`stagger-${splitBy}-${i}-${isWhitespaceOnly ? 'ws' : item.slice(0, 16)}`}
              variants={childVariants}
              className={
                isWhitespaceOnly
                  ? 'inline whitespace-pre'
                  : 'inline-block will-change-[transform,opacity,filter]'
              }
            >
              {item}
            </motion.span>
          );
        })}
      </motion.span>
    </span>
  );
}

export const StaggeredText = memo(StaggeredTextInner);
StaggeredText.displayName = 'StaggeredText';
