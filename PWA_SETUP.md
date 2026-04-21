# Progressive Web App (PWA) Setup Guide

## What This Does

This setup transforms your ABSAI Ticket Management System into a Progressive Web App (PWA) that can:

1. **Install on devices** - Users can install it on their phones, tablets, and desktops
2. **Run in background** - The app stays active even when the browser tab is closed
3. **Receive notifications** - Notifications work even when the app is in the background
4. **Work offline** - Basic functionality works without internet connection
5. **Fast loading** - Cached assets load instantly

## Files Created/Modified

### 1. `public/manifest.json`
- Defines app metadata, icons, and display settings
- Enables "Add to Home Screen" functionality

### 2. `public/service-worker.js`
- Handles background tasks
- Manages caching for offline support
- Processes push notifications
- Keeps the app running in the background

### 3. `src/index.js`
- Registers the service worker on app load
- Checks for service worker updates

### 4. `src/contexts/NotificationContext.jsx`
- Enhanced to use service worker for background notifications
- Includes navigation data in notifications

### 5. `public/index.html`
- Added PWA meta tags for mobile devices
- Configured for iOS and Android

## How to Use

### For Users:

1. **Install the App:**
   - **Desktop (Chrome/Edge):** Look for the install icon in the address bar
   - **Mobile (Android):** Browser will prompt "Add to Home Screen"
   - **Mobile (iOS Safari):** Tap Share → Add to Home Screen

2. **Enable Notifications:**
   - When you first open the app, allow notification permissions
   - Notifications will work even when the app is closed

3. **Use Offline:**
   - The app caches important files
   - You can view previously loaded pages offline

### For Developers:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Test locally:**
   ```bash
   npm run preview
   ```

3. **Deploy:**
   - Make sure `service-worker.js` is accessible at `/service-worker.js`
   - Ensure HTTPS is enabled (required for service workers)
   - The service worker will automatically register on first visit

## Testing

1. **Check Service Worker:**
   - Open DevTools → Application → Service Workers
   - You should see the service worker registered

2. **Test Notifications:**
   - Close the browser tab
   - Send a test notification from another device
   - You should receive a notification even with the tab closed

3. **Test Offline:**
   - Open DevTools → Network → Offline
   - The app should still load cached pages

## Troubleshooting

### Service Worker Not Registering:
- Ensure you're using HTTPS (or localhost for development)
- Check browser console for errors
- Clear browser cache and reload

### Notifications Not Working:
- Check notification permissions in browser settings
- Ensure service worker is active
- Check browser console for errors

### App Not Installing:
- Ensure manifest.json is valid
- Check that icons are accessible
- Verify HTTPS is enabled

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Samsung Internet
- ⚠️ Safari (Desktop) - Limited support

## Next Steps

1. **Add Push Notifications:** Configure a push service (Firebase Cloud Messaging, etc.)
2. **Offline Forms:** Cache form submissions when offline, sync when online
3. **Background Sync:** Sync data when connection is restored
4. **Update Notifications:** Notify users when a new version is available

## Security Notes

- Service workers only work over HTTPS (or localhost)
- Always validate data from service worker messages
- Keep service worker code secure and up-to-date

