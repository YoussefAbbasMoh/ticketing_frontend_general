/* eslint-disable react/prop-types -- props are stable primitives from parent Kanban card */
import { memo, useMemo } from 'react';
import { Play } from 'lucide-react';
import { t } from '../../i18n';
import { usePersonalTaskTimer } from '../../hooks/usePersonalTaskTimer';
import { estimatedMinutesToMs, formatTimerHms } from '../../utils/personalTaskTimerStorage';

function PersonalTaskTimerInner({
  taskId,
  estimatedMinutes,
  column,
  lang,
  isFocusOpen,
  onOpenFocus,
}) {
  const totalMs = useMemo(() => estimatedMinutesToMs(estimatedMinutes), [estimatedMinutes]);
  const { remainingMs, isRunning, isIdle, start, pause } = usePersonalTaskTimer(taskId, totalMs, column);

  const over = remainingMs < 0;
  const display = formatTimerHms(remainingMs);
  const active = isRunning || !isIdle;

  const handleStartFocus = () => {
    onOpenFocus?.();
  };

  const handleToggle = () => {
    if (isRunning) pause();
    else start();
  };

  return (
    <div
      className="mt-3 rounded-app-input border border-app-border/80 bg-app-background/90 px-2.5 py-2"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {active && !isFocusOpen ? (
        <button
          type="button"
          onClick={onOpenFocus}
          className="mb-2 flex w-full items-center justify-between gap-2 rounded-app-input border border-app-primary/25 bg-app-primary/[0.08] px-2 py-1.5 text-start transition-colors hover:bg-app-primary/[0.12]"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide text-app-primary">
            {isRunning ? t(lang, 'tasksFocusRunning') : t(lang, 'tasksFocusPaused')}
          </span>
          <span
            className={`font-mono text-sm font-bold tabular-nums ${over ? 'text-app-error' : 'text-app-text'}`}
          >
            {display}
          </span>
        </button>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        {!isFocusOpen && (
          <button
            type="button"
            onClick={handleStartFocus}
            disabled={column === 'done'}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-app-primary px-2.5 py-1.5 text-[11px] font-semibold text-app-on-primary hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play className="h-3 w-3" aria-hidden />
            {t(lang, 'tasksFocusBlitz')}
          </button>
        )}
        {active && (
          <button
            type="button"
            onClick={handleToggle}
            disabled={column === 'done'}
            className="rounded-md border border-app-border bg-app-surface-variant px-2.5 py-1.5 text-[11px] font-semibold text-app-text hover:bg-app-primary/[0.06] disabled:opacity-40"
          >
            {isRunning ? t(lang, 'tasksTimerPause') : t(lang, 'tasksTimerResume')}
          </button>
        )}
        {isFocusOpen && (
          <span className="text-[10px] font-medium text-app-text-tertiary">{t(lang, 'tasksFocusWindowOpen')}</span>
        )}
      </div>

      {column === 'done' && (
        <p className="mt-1.5 text-[10px] text-app-text-tertiary">{t(lang, 'taskTimerStoppedDone')}</p>
      )}
    </div>
  );
}

const PersonalTaskTimer = memo(PersonalTaskTimerInner, (prev, next) => {
  return (
    prev.taskId === next.taskId &&
    prev.estimatedMinutes === next.estimatedMinutes &&
    prev.column === next.column &&
    prev.lang === next.lang &&
    prev.isFocusOpen === next.isFocusOpen
  );
});

export default PersonalTaskTimer;

