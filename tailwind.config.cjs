const data = require('./src/theme/designTokens.json');
const { colors, spacing, typography, layout, radii, shadows } = data;

const spacingPx = Object.fromEntries(
  Object.entries(spacing).map(([k, v]) => [k, `${v}px`]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          primary: colors.primary,
          'primary-soft': colors.primarySoft,
          secondary: colors.secondary,
          'secondary-soft': colors.secondarySoft,
          background: colors.background,
          surface: colors.surface,
          'surface-variant': colors.surfaceVariant,
          text: colors.text,
          'text-secondary': colors.textSecondary,
          'text-tertiary': colors.textTertiary,
          'on-primary': colors.onPrimary,
          'on-secondary': colors.onSecondary,
          border: colors.border,
          divider: colors.divider,
          success: colors.success,
          warning: colors.warning,
          error: colors.error,
          info: colors.info,
          disabled: colors.disabled,
          'disabled-text': colors.disabledText,
          'shadow-tint': colors.shadowTint,
        },
        navy: {
          DEFAULT: colors.primarySoft,
          dark: colors.primary,
          mid: colors.primarySoft,
        },
        orange: {
          DEFAULT: colors.secondary,
          dark: '#ea580c',
          soft: colors.secondarySoft,
        },
      },
      spacing: spacingPx,
      fontFamily: {
        cairo: ['Cairo', 'Segoe UI', 'system-ui', 'sans-serif'],
        sans: ['Cairo', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'app-display': [`${typography.displayLarge.fontSize}px`, { lineHeight: typography.displayLarge.lineHeight }],
        'app-headline': [`${typography.headlineMedium.fontSize}px`, { lineHeight: typography.headlineMedium.lineHeight }],
        'app-title': [`${typography.titleMedium.fontSize}px`, { lineHeight: typography.titleMedium.lineHeight }],
        'app-body': [`${typography.bodyLarge.fontSize}px`, { lineHeight: typography.bodyLarge.lineHeight }],
        'app-body-sm': [`${typography.bodyMedium.fontSize}px`, { lineHeight: typography.bodyMedium.lineHeight }],
        'app-label': [`${typography.labelLarge.fontSize}px`, { lineHeight: typography.labelLarge.lineHeight }],
      },
      borderRadius: {
        app: `${radii.card}px`,
        'app-input': `${radii.input}px`,
        'app-btn': `${radii.button}px`,
      },
      boxShadow: {
        'app-card': shadows.workspaceCard,
        'app-nav': shadows.bottomNav,
        'app-soft': shadows.soft,
      },
      maxWidth: {
        'app-form': `${layout.contentMaxWidthPx}px`,
      },
      keyframes: {
        'hero-orb-right': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-30px)' },
        },
        'hero-orb-left': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(20px)' },
        },
      },
      animation: {
        'hero-orb-right': 'hero-orb-right 8s ease-in-out infinite',
        'hero-orb-left': 'hero-orb-left 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
