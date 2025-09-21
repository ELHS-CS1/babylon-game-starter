# PWA & Push Notifications Setup

This document explains the Progressive Web App (PWA) and push notification features implemented in the Babylon Multiplayer Game.

## 🚀 PWA Features

### Installation
- **Mobile**: Users can install the app directly from their mobile browser
- **Desktop**: Chrome/Edge users can install via the browser's install prompt
- **Offline**: Basic functionality works offline with cached resources

### PWA Components
- **Manifest**: `/public/manifest.json` - Defines app metadata and icons
- **Service Worker**: `/public/sw.js` - Handles caching and offline functionality
- **Icons**: Sigma Toons branded icons in `/public/icons/`

## 📱 Push Notifications

### Features
- **Real-time Alerts**: Get notified when players join the game
- **Native Notifications**: Works on mobile devices even when app is closed
- **VAPID Keys**: Secure server-to-client push messaging
- **Action Buttons**: Notifications include "Join Game" action

### Technical Implementation

#### Server Side (`src/server/services/PushNotificationService.ts`)
- VAPID key management
- Subscription storage
- Push notification broadcasting
- REST API endpoints:
  - `GET /api/push/vapid-key` - Get public VAPID key
  - `POST /api/push/subscribe` - Subscribe user to notifications
  - `DELETE /api/push/subscribe` - Unsubscribe user
  - `POST /api/push/notify` - Send notification to all users

#### Client Side (`src/client/services/PushNotificationClient.ts`)
- Automatic subscription on app load
- VAPID key fetching
- Service worker integration
- User ID generation and persistence

#### Service Worker (`public/sw.js`)
- Push event handling
- Notification display
- Click action handling
- Background sync for offline actions

## 🧪 Testing

### Local Testing
```bash
# Start the development server
npm run dev:full

# Test push notifications (in another terminal)
npm run test:push
```

### Mobile Testing
1. Open the app in a mobile browser (Chrome/Safari)
2. Look for the "Install App" prompt or use browser menu
3. Install the PWA
4. Allow notifications when prompted
5. Open another browser tab and join the game
6. You should receive a push notification!

### Browser Testing
1. Open Chrome DevTools
2. Go to Application tab → Service Workers
3. Check that the service worker is registered
4. Go to Application tab → Storage → IndexedDB
5. Verify push subscriptions are stored

## 🔧 Configuration

### VAPID Keys
- Generated automatically on first run
- Stored in `src/server/vapid-keys.json`
- **Important**: Keep private key secure, add to `.gitignore`

### Notification Settings
- Icons: Uses Sigma Toons branding
- Actions: "Join Game" and "Close" buttons
- Vibration: Mobile vibration pattern
- Badge: Small icon for notification count

### PWA Manifest
- App name: "Babylon Multiplayer Game"
- Short name: "Babylon Game"
- Theme: Dark mode with blue accent
- Orientation: Landscape (optimized for gaming)
- Icons: 64x64, 192x192, 512x512 sizes

## 📊 Monitoring

### Server Logs
- Push subscription events
- Notification delivery status
- VAPID key operations
- Error handling and retry logic

### Client Logs
- Service worker registration
- Push subscription status
- Notification permission requests
- VAPID key fetching

## 🚨 Troubleshooting

### Common Issues

#### Notifications Not Working
1. Check browser notification permissions
2. Verify service worker is registered
3. Check VAPID keys are properly configured
4. Ensure HTTPS in production (required for push notifications)

#### PWA Not Installing
1. Check manifest.json is accessible
2. Verify all required icons exist
3. Ensure service worker is registered
4. Check browser compatibility

#### Service Worker Issues
1. Clear browser cache and storage
2. Check service worker registration in DevTools
3. Verify sw.js file is accessible
4. Check for JavaScript errors in service worker

### Debug Commands
```bash
# Check push notification system
npm run test:push

# View service worker status
# Open DevTools → Application → Service Workers

# Test offline functionality
# Disconnect internet and try using the app
```

## 🔒 Security

### VAPID Keys
- Private key must be kept secure
- Public key is safe to expose to clients
- Keys are generated per deployment

### HTTPS Requirement
- Push notifications require HTTPS in production
- Local development works with HTTP
- Service workers require secure context

### Data Privacy
- User IDs are generated locally and stored in localStorage
- No personal information is collected
- Push subscriptions are stored server-side temporarily

## 📈 Performance

### Caching Strategy
- **Static files**: Cache first (icons, manifest, etc.)
- **API calls**: Network first with cache fallback
- **HTML pages**: Network first with offline fallback

### Notification Limits
- Browser-imposed rate limits apply
- Automatic cleanup of invalid subscriptions
- Background sync for failed notifications

## 🎯 Future Enhancements

### Planned Features
- Custom notification sounds
- Rich notification content (images, videos)
- Notification scheduling
- User preference management
- Analytics and metrics

### Integration Opportunities
- Game state notifications (level changes, achievements)
- Social features (friend requests, invites)
- Tournament announcements
- Maintenance notifications
