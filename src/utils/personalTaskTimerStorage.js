/** localStorage persistence for per-task Pomodoro-style timers (wall-clock based, survives refresh). */

const PREFIX = 'personalTaskTimer:v1:';

export const personalTaskTimerStorageKey = (taskId) => `${PREFIX}${String(taskId)}`;

export const estimatedMinutesToMs = (minutes) => {
  const m = Math.round(Number(minutes));
  if (!Number.isFinite(m)) return 30 * 60 * 1000;
  return Math.min(1440, Math.max(1, m)) * 60 * 1000;
};

/** @typedef {{ v: 1, totalDurationMs: number, status: 'idle'|'running'|'paused', runAnchorAt: number|null, remainingAtAnchorMs: number }} PersonalTaskTimerPersisted */

/** @returns {PersonalTaskTimerPersisted} */
export const defaultTimerState = (totalDurationMs) => ({
  v: 1,
  totalDurationMs,
  status: 'idle',
  runAnchorAt: null,
  remainingAtAnchorMs: totalDurationMs,
});

/**
 * Remaining time from persisted anchor model (no interval drift).
 * @param {PersonalTaskTimerPersisted} s
 */
export const computeRemainingMs = (s) => {
  if (!s || s.v !== 1) return 0;
  if (s.status === 'idle') return s.totalDurationMs;
  if (s.status === 'paused') return s.remainingAtAnchorMs;
  if (s.status === 'running' && s.runAnchorAt != null) {
    return s.remainingAtAnchorMs - (Date.now() - s.runAnchorAt);
  }
  return s.remainingAtAnchorMs;
};

/** @param {string} taskId */
export const loadTimerState = (taskId, totalDurationMs) => {
  const fallback = defaultTimerState(totalDurationMs);
  try {
    const raw = localStorage.getItem(personalTaskTimerStorageKey(taskId));
    if (!raw) return fallback;
    const o = JSON.parse(raw);
    if (!o || o.v !== 1) return fallback;
    const total = Number(o.totalDurationMs);
    const totalMs = Number.isFinite(total) && total > 0 ? total : totalDurationMs;
    const status = ['idle', 'running', 'paused'].includes(o.status) ? o.status : 'idle';
    const runAnchorAt = typeof o.runAnchorAt === 'number' && Number.isFinite(o.runAnchorAt) ? o.runAnchorAt : null;
    let remainingAtAnchorMs =
      typeof o.remainingAtAnchorMs === 'number' && Number.isFinite(o.remainingAtAnchorMs)
        ? o.remainingAtAnchorMs
        : totalMs;
    if (status === 'idle') {
      remainingAtAnchorMs = totalMs;
    }
    return {
      v: 1,
      totalDurationMs: totalMs,
      status,
      runAnchorAt,
      remainingAtAnchorMs,
    };
  } catch {
    return fallback;
  }
};

/** @param {string} taskId @param {PersonalTaskTimerPersisted} state */
export const saveTimerState = (taskId, state) => {
  try {
    localStorage.setItem(personalTaskTimerStorageKey(taskId), JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
};

export const removeTimerState = (taskId) => {
  try {
    localStorage.removeItem(personalTaskTimerStorageKey(taskId));
  } catch {
    /* ignore */
  }
};
