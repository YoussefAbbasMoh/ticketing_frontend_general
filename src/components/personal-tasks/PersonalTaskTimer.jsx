/* eslint-disable react/prop-types -- props are stable primitives from parent Kanban card */
import { memo, useMemo } from 'react';
import { t } from '../../i18n';
import { usePersonalTaskTimer } from '../../hooks/usePersonalTaskTimer';
import { estimatedMinutesToMs } from '../../utils/personalTaskTimerStorage';

/** @param {number} ms */
function formatRemaining(ms) {
  const sec = Math.round(ms / 1000);
  const neg = sec < 0;
  const a = Math.abs(sec);
  const m = Math.floor(a / 60);
  const s2 = a % 60;
  const mm = String(m).padStart(2, '0');
  return `${neg ? '-' : ''}${mm}:${String(s2).padStart(2, '0')}`;
}

function PersonalTaskTimerInner({ taskId, estimatedMinutes, column, lang }) {
  const totalMs = useMemo(() => estimatedMinutesToMs(estimatedMinutes), [estimatedMinutes]);
  const { remainingMs, isRunning, isIdle, start, pause, reset } = usePersonalTaskTimer(
    taskId,
    totalMs,
    column
  );

  const over = remainingMs < 0;
  const display = formatRemaining(remainingMs);

  return (
    <div
      className="mt-3 rounded-app-input border border-app-border/80 bg-app-background/90 px-2.5 py-2"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-app-text-tertiary">
          {t(lang, 'taskCardTimerLabel')}
        </span>
        {column === 'done' && (
          <span className="text-[10px] font-semibold text-app-text-tertiary">{t(lang, 'taskTimerStoppedDone')}</span>
        )}
      </div>
      <div
        className={`mt-1 font-mono text-xl font-bold tabular-nums sm:text-2xl ${over ? 'text-app-error' : 'text-app-text'}`}
        aria-live="polite"
      >
        {display}
        {over && (
          <span className="ms-1 text-[10px] font-semibold normal-case text-app-error sm:text-xs">
            ({t(lang, 'tasksTimerOverrun')})
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {!isRunning && (
          <button
            type="button"
            onClick={start}
            disabled={column === 'done'}
            className="rounded-md bg-app-primary px-2.5 py-1 text-[11px] font-semibold text-app-on-primary hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isIdle ? t(lang, 'tasksTimerStart') : t(lang, 'tasksTimerResume')}
          </button>
        )}
        {isRunning && (
          <button
            type="button"
            onClick={pause}
            className="rounded-md border border-app-border bg-app-surface-variant px-2.5 py-1 text-[11px] font-semibold text-app-text hover:bg-app-primary/[0.06]"
          >
            {t(lang, 'tasksTimerPause')}
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-app-divider px-2.5 py-1 text-[11px] font-semibold text-app-text-secondary hover:bg-app-surface-variant"
        >
          {t(lang, 'tasksTimerReset')}
        </button>
      </div>
    </div>
  );
}

const PersonalTaskTimer = memo(PersonalTaskTimerInner, (prev, next) => {
  return (
    prev.taskId === next.taskId &&
    prev.estimatedMinutes === next.estimatedMinutes &&
    prev.column === next.column &&
    prev.lang === next.lang
  );
});

export default PersonalTaskTimer;
