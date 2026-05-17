/* eslint-disable react/prop-types */
import { useMemo } from 'react';
import { Maximize2, Timer } from 'lucide-react';
import { t } from '../../i18n';
import { usePersonalTaskTimer } from '../../hooks/usePersonalTaskTimer';
import { estimatedMinutesToMs, formatTimerHms } from '../../utils/personalTaskTimerStorage';
import { focusPersonalTaskPopup } from '../../utils/personalTaskFocusWindow';

/** Minimized chip to reopen the focus dock while timer is active. */
export default function PersonalTaskFocusPill({
  taskId,
  taskTitle,
  estimatedMinutes,
  column,
  lang,
  onExpand,
}) {
  const totalMs = useMemo(() => estimatedMinutesToMs(estimatedMinutes), [estimatedMinutes]);
  const { remainingMs, isRunning, isIdle } = usePersonalTaskTimer(taskId, totalMs, column);

  if (isIdle) return null;

  const display = formatTimerHms(remainingMs);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <button
      type="button"
      dir={dir}
      onClick={() => {
        if (!focusPersonalTaskPopup()) onExpand?.();
      }}
      className="fixed bottom-4 z-[44] flex max-w-[min(calc(100vw-2rem),280px)] items-center gap-2.5 overflow-hidden rounded-full border border-app-divider bg-app-surface py-2 ps-2 pe-3 font-cairo shadow-app-card transition-shadow hover:shadow-app-soft end-3 sm:end-5"
      aria-label={t(lang, 'tasksFocusExpand')}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-app-primary to-app-primary-soft text-app-on-primary">
        <Timer className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-start text-xs font-semibold text-app-text">
        {taskTitle}
      </span>
      <span
        className={`font-mono text-sm font-bold tabular-nums ${
          isRunning ? 'text-app-primary' : 'text-app-text-secondary'
        }`}
      >
        {display}
      </span>
      <Maximize2 className="h-3.5 w-3.5 shrink-0 text-app-text-tertiary" aria-hidden />
    </button>
  );
}
