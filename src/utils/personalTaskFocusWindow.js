/** Cross-window focus timer: popup stays open when the main tab navigates away. */

export const FOCUS_WINDOW_NAME = 'tikPersonalTaskFocus';
export const FOCUS_SESSION_STORAGE_KEY = 'personalTaskFocus:v1:session';
export const FOCUS_BROADCAST_CHANNEL = 'personal-task-focus';

/** @typedef {{ taskId: string, taskTitle: string, estimatedMinutes: number, column: string, lang: string, autoStart?: boolean, todayEstMinutes?: number, todayDoneCount?: number, todayTotalCount?: number }} FocusSessionPayload */

/** @param {FocusSessionPayload} payload */
export function saveFocusSessionPayload(payload) {
  try {
    localStorage.setItem(
      FOCUS_SESSION_STORAGE_KEY,
      JSON.stringify({ ...payload, savedAt: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

/** @returns {FocusSessionPayload | null} */
export function loadFocusSessionPayload() {
  try {
    const raw = localStorage.getItem(FOCUS_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o?.taskId) return null;
    return o;
  } catch {
    return null;
  }
}

export function clearFocusSessionPayload() {
  try {
    localStorage.removeItem(FOCUS_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** @param {object} data */
export function broadcastFocusEvent(data) {
  try {
    const bc = new BroadcastChannel(FOCUS_BROADCAST_CHANNEL);
    bc.postMessage(data);
    bc.close();
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(
      'personalTaskFocus:v1:event',
      JSON.stringify({ ...data, at: Date.now() })
    );
    localStorage.removeItem('personalTaskFocus:v1:event');
  } catch {
    /* storage ping for tabs without BroadcastChannel */
  }
}

let popupRef = null;

function popupFeatures() {
  const w = 320;
  const h = 600;
  const left = Math.max(0, window.screenX + window.outerWidth - w - 20);
  const top = Math.max(0, window.screenY + 72);
  return `popup=yes,width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=no`;
}

function focusUrl(taskId) {
  const url = new URL('/personal-tasks/focus', window.location.origin);
  url.searchParams.set('taskId', String(taskId));
  return url.toString();
}

/**
 * Re-attach to an existing named popup without opening a new blank window.
 * Only call from user gestures (e.g. "show timer" click), never on page load.
 */
function tryReuseNamedPopup() {
  try {
    const existing = window.open('', FOCUS_WINDOW_NAME);
    if (!existing || existing.closed) return null;
    const href = String(existing.location?.href || '');
    if (href.includes('/personal-tasks/focus')) {
      popupRef = existing;
      return existing;
    }
    existing.close();
  } catch {
    /* blocked or cross-origin */
  }
  return null;
}

/**
 * Open focus timer in a separate window. Must run synchronously inside a click handler.
 * @param {FocusSessionPayload} payload
 * @returns {Window | null}
 */
export function openPersonalTaskFocusWindow(payload) {
  saveFocusSessionPayload(payload);

  const url = focusUrl(payload.taskId);
  const features = popupFeatures();

  if (popupRef && !popupRef.closed) {
    try {
      popupRef.location.href = url;
      popupRef.focus();
      return popupRef;
    } catch {
      popupRef = null;
    }
  }

  /* Single window.open with URL — avoid window.open('') first (breaks popup gesture). */
  popupRef = window.open(url, FOCUS_WINDOW_NAME, features);

  if (!popupRef || popupRef.closed) {
    popupRef = null;
    return null;
  }

  try {
    popupRef.focus();
  } catch {
    /* ignore */
  }
  return popupRef;
}

/** @returns {boolean} */
export function isPersonalTaskFocusWindowOpen() {
  return Boolean(popupRef && !popupRef.closed);
}

export function focusPersonalTaskPopup() {
  if (popupRef && !popupRef.closed) {
    popupRef.focus();
    return true;
  }
  const reused = tryReuseNamedPopup();
  if (reused) {
    reused.focus();
    return true;
  }
  return false;
}

/**
 * @param {() => void} onClosed
 * @returns {() => void}
 */
export function watchPersonalTaskFocusWindowClosed(onClosed) {
  const id = window.setInterval(() => {
    if (popupRef && popupRef.closed) {
      popupRef = null;
      onClosed();
    }
  }, 400);
  return () => clearInterval(id);
}
