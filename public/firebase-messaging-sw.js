/* Firebase Cloud Messaging — background push (loaded by fcmClient via getToken) */
importScripts('/firebase-config.js');

importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js');

const config = self.FIREBASE_WEB_CONFIG || {};

if (config.apiKey && config.projectId && config.messagingSenderId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'Tik';
    const options = {
      body: payload.notification?.body || '',
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: payload.data || {},
    };
    return self.registration.showNotification(title, options);
  });
}
