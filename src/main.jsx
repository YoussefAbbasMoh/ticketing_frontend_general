import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', {
        updateViaCache: 'none',
      })
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        registration.update();
        setInterval(() => registration.update(), 60 * 60 * 1000);
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker available. Reload to update.');
                if (confirm('A new version is available. Reload now?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

if ('Notification' in window && Notification.permission === 'default') {
  console.log('Notification permission will be requested on first interaction');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
