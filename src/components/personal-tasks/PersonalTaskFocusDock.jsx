/* eslint-disable react/prop-types */
import { useEffect, useMemo } from 'react';
import { CheckCircle2, ExternalLink, Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import { t } from '../../i18n';
import { usePersonalTaskTimer } from '../../hooks/usePersonalTaskTimer';
import { estimatedMinutesToMs, formatTimerHms } from '../../utils/personalTaskTimerStorage';

function TimerProgressRing({ percent, isRunning, children }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative mx-auto flex h-[7.5rem] w-[7.5rem] items-center justify-center">
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 120 120"
        aria-hidden
      >
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-app-divider"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-[stroke-dashoffset] duration-1000 ${
            isRunning ? 'text-app-primary' : 'text-app-text-tertiary'
          }`}
        />
      </svg>
      <div className="relative z-[1] text-center">{children}</div>
    </div>
  );
}

/**
 * Floating focus panel — site design tokens (navy / orange / light surfaces).
 */
export default function PersonalTaskFocusDock({
  variant = 'fixed',
  taskId,
  taskTitle,
  estimatedMinutes,
  column,
  columnLabel,
  lang,
  todayEstMinutes = 0,
  todayDoneCount = 0,
  todayTotalCount = 0,
  onMinimize,
  onClose,
  onMarkDone,
  markingDone = false,
  autoStart = false,
  externalFallback = false,
  onOpenExternal,
}) {
  const isPopup = variant === 'popup';
  const handleClose = onClose || onMinimize;
  const totalMs = useMemo(() => estimatedMinutesToMs(estimatedMinutes), [estimatedMinutes]);
  const { remainingMs, isRunning, isIdle, start, pause, reset } = usePersonalTaskTimer(
    taskId,
    totalMs,
    column
  );

  useEffect(() => {
    if (!autoStart || column === 'done') return;
    if (isIdle) start();
  }, [autoStart, taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  const over = remainingMs < 0;
  const display = formatTimerHms(remainingMs);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const ringPercent =
    totalMs > 0 ? Math.min(100, Math.max(0, (remainingMs / totalMs) * 100)) : 0;
  const todayProgress =
    todayTotalCount > 0 ? Math.round((todayDoneCount / todayTotalCount) * 100) : 0;

  return (
    <aside
      dir={dir}
      className={
        isPopup
          ? 'flex h-dvh min-h-[520px] w-full flex-col overflow-hidden bg-app-surface font-cairo'
          : 'pointer-events-auto fixed bottom-4 top-[4.5rem] z-[45] flex w-[min(calc(100vw-1.5rem),300px)] flex-col overflow-hidden rounded-app border border-app-divider bg-app-surface font-cairo shadow-app-card end-3 sm:end-5'
      }
      aria-label={t(lang, 'tasksFocusDockTitle')}
    >
      {externalFallback && (
        <div className="shrink-0 border-b border-app-warning/30 bg-app-warning/10 px-3 py-2 text-[11px] leading-snug text-app-text-secondary">
          <p>{t(lang, 'tasksFocusUsingSidePanel')}</p>
          {onOpenExternal && (
            <button
              type="button"
              onClick={onOpenExternal}
              className="mt-1.5 inline-flex items-center gap-1 font-semibold text-app-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              {t(lang, 'tasksFocusOpenExternal')}
            </button>
          )}
        </div>
      )}

      {/* Header — matches attendance / app navy gradient */}
      <header className="relative shrink-0 overflow-hidden px-4 pb-3 pt-3.5 text-app-on-primary">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-app-primary via-app-primary-soft to-[#1A5278]"
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
              {t(lang, 'tasksFocusDockTitle')}
            </p>
            <p className="mt-0.5 truncate text-base font-bold leading-tight">{columnLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-app-input bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label={isPopup ? t(lang, 'tasksFocusCloseWindow') : t(lang, 'tasksFocusMinimize')}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="relative mt-3">
          <div className="flex items-center justify-between gap-2 text-[11px] text-white/80">
            <span>
              {t(lang, 'tasksFocusEst')}: {todayEstMinutes}
              {t(lang, 'minuteAbbrev')}
            </span>
            <span className="font-semibold text-white">
              {todayDoneCount}/{todayTotalCount} {t(lang, 'tasksFocusDone')}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-orange-dark transition-[width] duration-500"
              style={{ width: `${todayProgress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Task + timer */}
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
        <div
          className={`flex flex-1 flex-col rounded-app border px-3 py-4 transition-shadow ${
            isRunning
              ? 'border-app-primary/35 bg-gradient-to-b from-app-primary/[0.06] to-app-surface-variant/80 shadow-[inset_0_0_0_1px_rgba(8,9,54,0.06)]'
              : 'border-app-border bg-app-surface-variant/60'
          }`}
        >
          <p className="line-clamp-2 text-center text-sm font-semibold leading-snug text-app-text">
            {taskTitle}
          </p>

          <div className="my-4 flex justify-center">
            <TimerProgressRing percent={ringPercent} isRunning={isRunning}>
              <p
                className={`font-mono text-xl font-extrabold tabular-nums tracking-tight sm:text-2xl ${
                  over ? 'text-app-error' : 'text-app-primary'
                }`}
                aria-live="polite"
              >
                {display}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-app-text-tertiary">
                {t(lang, 'taskCardTimerLabel')}
              </p>
            </TimerProgressRing>
          </div>

          {over && (
            <p className="-mt-2 mb-1 text-center text-xs font-semibold text-app-error">
              {t(lang, 'tasksTimerOverrun')}
            </p>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-app-text-secondary">
            <Timer className="h-3.5 w-3.5 text-app-primary" aria-hidden />
            <span>
              ~{estimatedMinutes} {t(lang, 'minuteAbbrev')}
            </span>
            {isRunning && (
              <span className="rounded-full bg-app-success/15 px-2 py-0.5 text-[10px] font-bold text-app-success">
                {t(lang, 'tasksFocusRunning')}
              </span>
            )}
          </div>
        </div>
      </div>

      <footer className="flex shrink-0 flex-col gap-2 border-t border-app-divider bg-app-background/80 p-3">
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              type="button"
              onClick={start}
              disabled={column === 'done'}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-app-btn bg-app-primary px-3 text-sm font-semibold text-app-on-primary shadow-none transition-opacity hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="h-4 w-4" aria-hidden />
              {isIdle ? t(lang, 'tasksTimerStart') : t(lang, 'tasksTimerResume')}
            </button>
          ) : (
            <button
              type="button"
              onClick={pause}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-app-btn border-2 border-app-primary bg-app-surface px-3 text-sm font-semibold text-app-primary transition-colors hover:bg-app-primary/[0.06]"
            >
              <Pause className="h-4 w-4" aria-hidden />
              {t(lang, 'tasksTimerPause')}
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            disabled={markingDone}
            className="inline-flex min-h-[40px] min-w-[44px] items-center justify-center rounded-app-btn border border-app-border bg-app-surface text-app-text-secondary transition-colors hover:border-app-primary/30 hover:bg-app-surface-variant hover:text-app-text disabled:opacity-40"
            aria-label={t(lang, 'tasksTimerReset')}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {onMarkDone && (
          <button
            type="button"
            onClick={onMarkDone}
            disabled={column === 'done' || markingDone}
            className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-app-btn bg-app-success px-3 text-sm font-semibold text-white shadow-none transition-opacity hover:opacity-92 disabled:cursor-not-allowed disabled:bg-app-disabled disabled:text-app-disabled-text"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            {column === 'done' ? t(lang, 'colDone') : t(lang, 'tasksMarkDone')}
          </button>
        )}
      </footer>
    </aside>
  );
}

