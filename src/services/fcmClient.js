import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { firebaseWebConfig, firebaseVapidKey, isFirebaseWebConfigured } from '../config/firebaseWeb';
import { userAPI } from './api';

const FCM_TOKEN_STORAGE_KEY = 'fcmToken';

export const getStoredFcmToken = () => localStorage.getItem(FCM_TOKEN_STORAGE_KEY);

const ensureMessagingSw = async () => {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/',
    updateViaCache: 'none',
  });
};

/**
 * Obtain FCM device token from Firebase (does not call backend).
 * @param {{ requestPermission?: boolean }} options
 */
const obtainFcmDeviceToken = async ({ requestPermission = false } = {}) => {
  if (!isFirebaseWebConfigured()) {
    return null;
  }

  if (!(await isSupported())) {
    return null;
  }

  if (!('Notification' in window)) {
    return null;
  }

  let permission = Notification.permission;
  if (permission === 'default' && requestPermission) {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    return null;
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseWebConfig);
  const messaging = getMessaging(app);
  const swRegistration = await ensureMessagingSw();

  return getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: swRegistration,
  });
};

/** Optional on login — only if notifications already allowed (no permission prompt). */
export const getOptionalFcmTokenForLogin = async () => {
  try {
    return await obtainFcmDeviceToken({ requestPermission: false });
  } catch {
    return null;
  }
};

/** Request permission, obtain FCM token, and register it with POST /users/register-fcm-token. */
export const registerFcmWithBackend = async () => {
  if (!isFirebaseWebConfigured()) {
    console.info('[FCM] Skipped — set VITE_FIREBASE_* in .env (see .env.firebase.example)');
    return null;
  }

  try {
    const token = await obtainFcmDeviceToken({ requestPermission: true });
    if (!token) return null;

    const previous = getStoredFcmToken();
    if (previous && previous !== token) {
      try {
        await userAPI.unregisterFcmToken(previous);
      } catch {
        /* ignore */
      }
    }

    await userAPI.registerFcmToken(token);
    localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    console.info('[FCM] Device token registered');
    return token;
  } catch (err) {
    console.warn('[FCM] Registration failed:', err?.message || err);
    return null;
  }
};

export const unregisterFcmFromBackend = async () => {
  const token = getStoredFcmToken();
  if (!token) return;
  try {
    await userAPI.unregisterFcmToken(token);
  } catch {
    /* ignore on logout */
  }
  localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
};
