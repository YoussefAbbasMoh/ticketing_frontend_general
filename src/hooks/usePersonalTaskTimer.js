import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  computeRemainingMs,
  defaultTimerState,
  loadTimerState,
  personalTaskTimerStorageKey,
  PERSONAL_TASK_TIMER_SYNC,
  saveTimerState,
} from '../utils/personalTaskTimerStorage';

const freezeRunningToPaused = (s) => {
  if (s.status !== 'running' || s.runAnchorAt == null) return s;
  const remaining = s.remainingAtAnchorMs - (Date.now() - s.runAnchorAt);
  return {
    ...s,
    status: 'paused',
    runAnchorAt: null,
    remainingAtAnchorMs: remaining,
  };
};

/**
 * Per-task wall-clock timer: survives refresh, supports negative overrun, one interval only while running.
 * @param {string} taskId
 * @param {number} totalDurationMs — from task estimate
 * @param {string} column — when `done`, timer auto-pauses
 */
export function usePersonalTaskTimer(taskId, totalDurationMs, column) {
  const [state, setState] = useState(() => loadTimerState(taskId, totalDurationMs));
  const [, bump] = useReducer((n) => n + 1, 0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const persist = useCallback(
    (next) => {
      setState(next);
      saveTimerState(taskId, next);
    },
    [taskId]
  );

  /* Budget (estimate) changed from server — reset stored timer when not running */
  useEffect(() => {
    setState((prev) => {
      if (prev.status === 'running') return prev;
      if (prev.totalDurationMs === totalDurationMs) return prev;
      const next = defaultTimerState(totalDurationMs);
      saveTimerState(taskId, next);
      return next;
    });
  }, [taskId, totalDurationMs]);

  /* Completed column → auto pause at current remaining */
  useEffect(() => {
    if (column !== 'done') return;
    setState((prev) => {
      if (prev.status === 'idle') return prev;
      const frozen = freezeRunningToPaused(prev);
      if (frozen === prev) return prev;
      saveTimerState(taskId, frozen);
      return frozen;
    });
  }, [column, taskId]);

  const reloadFromStorage = useCallback(() => {
    setState(loadTimerState(taskId, totalDurationMs));
  }, [taskId, totalDurationMs]);

  /* Same-tab + cross-tab sync */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== personalTaskTimerStorageKey(taskId) || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && parsed.v === 1) setState(parsed);
      } catch {
        /* ignore */
      }
    };
    const onSync = (e) => {
      if (e.detail?.taskId === String(taskId)) reloadFromStorage();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(PERSONAL_TASK_TIMER_SYNC, onSync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(PERSONAL_TASK_TIMER_SYNC, onSync);
    };
  }, [taskId, reloadFromStorage]);

  /* One-second UI tick only while running */
  useEffect(() => {
    if (state.status !== 'running') return undefined;
    const id = window.setInterval(() => bump(), 1000);
    return () => clearInterval(id);
  }, [state.status, state.runAnchorAt]);

  const start = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'running') return;
    if (s.status === 'idle') {
      persist({
        ...s,
        status: 'running',
        runAnchorAt: Date.now(),
        remainingAtAnchorMs: s.totalDurationMs,
      });
      return;
    }
    if (s.status === 'paused') {
      persist({
        ...s,
        status: 'running',
        runAnchorAt: Date.now(),
        remainingAtAnchorMs: s.remainingAtAnchorMs,
      });
    }
  }, [persist]);

  const pause = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== 'running') return;
    const remaining = s.remainingAtAnchorMs - (Date.now() - s.runAnchorAt);
    persist({
      ...s,
      status: 'paused',
      runAnchorAt: null,
      remainingAtAnchorMs: remaining,
    });
  }, [persist]);

  const reset = useCallback(() => {
    const s = stateRef.current;
    const next = defaultTimerState(s.totalDurationMs);
    persist(next);
  }, [persist]);

  const remainingMs = computeRemainingMs(state);
  const isRunning = state.status === 'running';
  const isIdle = state.status === 'idle';

  return {
    state,
    remainingMs,
    isRunning,
    isIdle,
    start,
    pause,
    reset,
  };
}
