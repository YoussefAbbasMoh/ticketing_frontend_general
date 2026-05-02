/**
 * Design tokens — loaded from `designTokens.json` (single source of truth).
 * Mirrors Ticketing-App: app_colors, app_spacing, app_text_styles, app_theme.
 *
 * Tailwind reads the same JSON via `tailwind.config.cjs` (PostCSS cannot load ESM-only config).
 */

import data from './designTokens.json';

export const colors = data.colors;
export const spacing = data.spacing;
export const typography = data.typography;
export const layout = data.layout;
export const radii = data.radii;
export const motion = data.motion;
export const semanticFill = data.semanticFill;
export const shadows = data.shadows;

/** Spacing scale as px strings for Tailwind `extend.spacing` */
export const spacingPx = Object.fromEntries(
  Object.entries(data.spacing).map(([k, v]) => [k, `${v}px`]),
);

const tokens = {
  colors,
  spacing,
  spacingPx,
  typography,
  layout,
  radii,
  motion,
  semanticFill,
  shadows,
};

export default tokens;
