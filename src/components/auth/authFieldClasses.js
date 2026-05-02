/**
 * Shared Tailwind classes aligned with AppTheme inputDecoration + AppTextField labels
 * (Flutter `app_theme.dart`, `app_text_field.dart`).
 */

/** Field labels: bodyMedium weight 600, textSecondary */
export const authLabelClass =
  'mb-s8 block text-[13px] font-semibold leading-normal text-app-text-secondary';

/** Filled surface, 12px radius, border — matches Theme inputDecoration */
export const authInputClass =
  'w-full rounded-app-input border border-app-border bg-app-surface px-s16 py-[14px] text-[14px] text-app-text placeholder:text-app-text-tertiary shadow-none transition-colors focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20 disabled:opacity-50';

/** Primary CTA — ElevatedButton: full width, min 40px height, 12 radius, primary fill */
export const authPrimaryButtonClass =
  'flex min-h-[40px] w-full items-center justify-center rounded-app-btn bg-app-primary px-s16 py-3 text-[14px] font-semibold text-app-on-primary shadow-none transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-app-primary focus:ring-offset-2 focus:ring-offset-app-background disabled:cursor-not-allowed disabled:opacity-50';

/** Secondary text links — TextButton uses AppColors.secondary */
export const authLinkSecondaryClass =
  'text-sm font-medium text-orange transition-colors hover:text-orange-dark disabled:opacity-50';

/** Subtle nav link on auth pages */
export const authLinkMutedClass =
  'text-sm font-medium text-app-text-secondary transition-colors hover:text-app-text disabled:opacity-50';
