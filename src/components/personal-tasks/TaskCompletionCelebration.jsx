/* eslint-disable react/prop-types */
import { X } from 'lucide-react';
import { t } from '../../i18n';

/**
 * Full-screen celebration after marking a personal task done.
 * @param {{ url: string, label?: string | null } | null} gif
 */
export default function TaskCompletionCelebration({ gif, taskTitle, lang, onDismiss, onGifError }) {
  if (!gif?.url) return null;

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const handleImgError = () => {
    onGifError?.(gif.id);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-app-text/45 p-4 backdrop-blur-[3px] font-cairo"
      dir={dir}
      role="dialog"
      aria-modal
      aria-labelledby="task-completion-title"
    >
      <div
        className="relative w-full max-w-[min(100%,22rem)] overflow-hidden rounded-app border border-app-divider bg-app-surface shadow-app-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="relative overflow-hidden px-4 py-3 text-app-on-primary">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-app-primary via-app-primary-soft to-[#1A5278]"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p id="task-completion-title" className="text-base font-bold leading-tight">
                {t(lang, 'taskCompletionTitle')}
              </p>
              {taskTitle ? (
                <p className="mt-0.5 truncate text-xs text-white/80">{taskTitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-app-input bg-white/10 text-white hover:bg-white/20"
              aria-label={t(lang, 'taskCompletionDismiss')}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        <div className="bg-app-surface-variant/40 p-3">
          <img
            key={gif.id}
            src={gif.url}
            alt={gif.label || t(lang, 'taskCompletionGifAlt')}
            className="mx-auto max-h-[min(50vh,280px)] w-full rounded-app object-contain"
            loading="eager"
            onError={handleImgError}
          />
        </div>

        <div className="border-t border-app-divider bg-app-background px-4 py-3">
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-app-btn bg-app-primary py-2.5 text-sm font-semibold text-app-on-primary hover:opacity-92"
          >
            {t(lang, 'taskCompletionContinue')}
          </button>
        </div>
      </div>
    </div>
  );
}

