# GeoConnect PWA + Push Notifications Implementation Plan

## 0. Constraints for Friday Demo

- **Do NOT replace the 30-second polling system** in `Dashboard.jsx`. Keep it as the primary real-time mechanism; push notifications are an additive layer, not a replacement.
- **Do NOT introduce Django Channels or WebSockets** in this phase. The existing HTTP-based architecture is stable and sufficient for the demo.
- **Goal**: A stable, installable PWA with push notification support and the "Request Live Location" workflow. WebSockets can be added after the presentation.

---

## 1. Current Architecture Summary

### Backend (Django)
- **Django 6.0.6** with DRF, SimpleJWT auth, MySQL, Cloudinary storage
- **Installed apps**: accounts (active), friends (stub), notifications (stub), location/messaging/premium (commented out)
- **Key models**: `User` (has `latitude`, `longitude` fields), `FriendRequest`
- **Key views**: `UpdateLocationView` (POST `update-location/`), `FriendsListView`, `SendFriendRequestView`, etc.
- **URLs**: `accounts/urls.py` is mounted at `/api/`; `friends/urls.py` does NOT exist; `notifications` is not routed
- **ASGI**: Minimal (`asgi.py` just wraps Django's ASGI app); no WebSocket routing
- **CORS**: Configured for `http://localhost:5173` only
- **Notifications app**: Completely stubbed (empty models, views, admin)

### Frontend (React + Vite)
- **React 19** with `react-router-dom` v7, `react-leaflet` v5, `framer-motion`, `axios`
- **Build**: Vite (`vite.config.js` is minimal, no PWA plugin)
- **Pages**: Register, Login, Dashboard, SearchUsers, Friends, FriendRequests, Settings, FriendDetails, FriendMap, Premium
- **Services**: `authService`, `friendService`, `locationService`, `profileService`, `api` (axios instance with JWT interceptors)
- **AuthContext**: Empty file (0 bytes) -- no auth state management
- **Dashboard**: Has live location polling every 30s, a FloatingActionButton for manual refresh
- **Navbar**: Has a notifications icon with hardcoded badge count of 3; TODO comment for fetching real notifications
- **index.html**: No PWA meta tags (no `theme-color`, `apple-mobile-web-app-capable`, `manifest` link)
- **public/**: Exists but contains no `manifest.json` or service worker

### What Already Exists for the Workflow
- `UpdateLocationView` (POST `/api/update-location/`) -- sends lat/long to Django, saves to User model
- `FriendsListView` -- returns accepted friends with their lat/long
- Dashboard already polls location every 30s and updates the map
- FriendMap page displays a friend's location on a Leaflet map
- `FriendDetails` page shows friend info including coordinates

---

## 2. Prerequisites (Must Be Done First)

These gaps block all subsequent work and must be resolved before any PWA or push notification code is written.

1. **Create `friends/urls.py`** -- the friends app has no URL routes despite being referenced in `accounts/urls.py` imports. Create the file with routes for friend request list and status endpoints.
2. **Uncomment `notifications` in `INSTALLED_APPS`** in `settings.py` so the app is active and migrations can run.
3. **Uncomment `friends` in `INSTALLED_APPS`** in `settings.py` if location request features require friend relationship validation.
4. **Create `notifications/migrations/__init__.py`** (already exists) and add initial migration after models are defined.
5. **Standardize import paths** in frontend services -- `locationService.js` and `friendService.js` import from `../api/axios` while `api.js` uses `./api`. Verify both resolve correctly and align them.
6. **Implement `AuthContext.js`** -- the empty file must provide auth state (user, token, login/logout) so the app can protect routes and attach JWT tokens to push subscription requests.
7. **Verify MySQL is accessible** -- `settings.py` configures MySQL but `db.sqlite3` exists in the repo root. Confirm the database is actually MySQL and the credentials in `.env` are valid.

---

## 3. Implementation Phases

### Phase 1: PWA Foundation

Make the React frontend installable as a PWA with offline support.

1. Install `vite-plugin-pwa` in the frontend (`npm install vite-plugin-pwa`)
2. Configure `vite-plugin-pwa` in `vite.config.js`:
   - Generate service worker (`registerType: 'prompt'`)
   - Generate manifest automatically or use a custom `public/manifest.json`
   - Set `workbox` caching strategy: `CacheFirst` for static assets, `NetworkFirst` for API calls
3. Create `public/manifest.json` with GeoConnect metadata:
   - `name`: "GeoConnect"
   - `short_name`: "GeoConnect"
   - `display`: "standalone"
   - `theme_color` and `background_color`
   - Icon references (use existing favicon.svg and icons.svg as starting points)
4. Add PWA meta tags to `index.html`:
   - `theme-color`
   - `apple-mobile-web-app-capable`
   - `mobile-web-app-capable` (new — addresses Chrome deprecation warning for `apple-mobile-web-app-capable`)
   - `apple-mobile-web-app-status-bar-style`
   - `apple-mobile-web-app-title`
   - `<link rel="manifest" href="/manifest.json">`
5. Register the service worker in `src/main.jsx` using the official `vite-plugin-pwa` API:
   - Import `registerSW` from `'virtual:pwa-register'`
   - Call `registerSW()` with `onNeedRefresh` and `onOfflineReady` callbacks
   - **Do NOT** use `navigator.serviceWorker.register("/sw.js")` directly — vite-plugin-pwa manages the service worker and serves it with the correct MIME type only through its virtual module
6. Verify the app is installable via Lighthouse PWA audit
7. **Keep the 30-second polling in `Dashboard.jsx` intact** — do not modify or remove it

### Phase 2 Backend: Push Notification Subscription Storage

Enable the notifications app and create the infrastructure to store browser push subscriptions.

#### Files to Modify

1. **`backend/config/settings.py`**
   - Uncomment `'notifications'` in `INSTALLED_APPS`
   - Why: Activates the notifications app so Django recognizes it and can run its migrations

2. **`backend/notifications/models.py`**
   - Replace stub with `PushSubscription` model:
     - `user` — ForeignKey to `settings.AUTH_USER_MODEL`, `on_delete=models.CASCADE`, `related_name='push_subscriptions'`
     - `endpoint` — TextField, unique together with endpoint for deduplication
     - `p256dh` — TextField
     - `auth` — TextField
     - `created_at` — DateTimeField, `auto_now_add=True`
   - Why: Stores browser push subscription data linked to the authenticated user

3. **`backend/notifications/views.py`**
   - Create `PushSubscriptionView` (APIView, JWT-authenticated):
     - `post()` — saves a push subscription for the authenticated user
       - Reads `endpoint`, `p256dh`, `auth` from request data
       - Uses `get_or_create` on `PushSubscription` with `user=request.user` and `endpoint`
       - Returns 201 on create, 200 on existing
     - `delete()` — removes a push subscription for the authenticated user
       - Reads `endpoint` from request data
       - Deletes matching subscription for `request.user`
       - Returns 204 on success
   - Why: JWT-protected endpoints to save and delete browser push subscriptions

4. **`backend/notifications/urls.py`** (new file)
   - `POST /api/notifications/subscribe/` — save push subscription
   - `POST /api/notifications/unsubscribe/` — remove push subscription
   - Why: Routes for the push subscription API endpoints

5. **`backend/config/urls.py`**
   - Add `path("api/notifications/", include("notifications.urls"))` to urlpatterns
   - Why: Mounts the notifications URLs under `/api/`

#### Files to Create

6. **`backend/notifications/urls.py`** (new file)
   - URL patterns for subscribe and unsubscribe endpoints

7. **`backend/notifications/migrations/0001_initial.py`** (generated)
   - Run `python manage.py makemigrations notifications`

#### Steps to Execute

1. Edit `settings.py` — uncomment `'notifications'` in `INSTALLED_APPS`
2. Write `notifications/models.py` with `PushSubscription` model
3. Write `notifications/views.py` with `PushSubscriptionView`
4. Write `notifications/urls.py` with routes
5. Edit `config/urls.py` — add notifications URL include
6. Run `python manage.py makemigrations notifications`
7. Run `python manage.py migrate`
8. Verify the API endpoints work with a test request

#### What NOT to do

- Do NOT implement push sending yet (no `send_push_notification` utility)
- Do NOT implement `LocationRequest` model yet
- Do NOT touch `accounts/views.py`, `accounts/urls.py`, or any existing accounts workflow
- Do NOT modify friends or location update workflow

#### Frontend (React)

1. Create `src/services/pushNotificationService.js`:
   - `requestPermission()` -- asks user for notification permission (must be triggered by user gesture)
   - `subscribeUser()` -- calls `PushManager.subscribe()`, sends subscription to backend
   - `unsubscribeUser()` -- removes subscription from backend
   - `handleNotificationClick()` -- handles notification tap (opens app, navigates to relevant page)
2. Register the service worker with push event listeners in the service worker file
3. Add a "Enable Notifications" UI flow (e.g., a banner or settings toggle)
4. Update `Navbar.jsx` to fetch real notification count from backend instead of hardcoded "3"
5. Add "Request Live Location" button to `FriendDetails.jsx`
6. Add "Request Live Location" button to `Friends.jsx`
7. Create `src/services/locationRequestService.js` to call the new backend endpoint
8. **Keep the 30-second polling in `Dashboard.jsx` intact** -- do not modify or remove it

### Phase 3: Notification Tap Flow

When User B taps a push notification, open GeoConnect, obtain current GPS, and send coordinates to Django to update User A.

1. **Service worker `notificationclick` handler**:
   - When User B taps a "Location Request" notification, the service worker opens the app
   - The service worker navigates to the dashboard or a dedicated location-respond page
   - Pass the `locationRequestId` in the notification data so the frontend knows which request to respond to

2. **Frontend notification click handling** (`pushNotificationService.js`):
   - Listen for `notificationclick` events on the service worker
   - When a location request notification is clicked, navigate to the relevant page
   - Check for pending location requests for the current user

3. **Location respond flow** (User B taps notification):
   - Frontend checks for pending location requests
   - User B is prompted to grant location access via `navigator.geolocation.getCurrentPosition()`
   - Frontend gets GPS coordinates
   - Frontend calls `updateLocation()` (existing `locationService.js`) to send coordinates to Django
   - Django updates User B's location and sends a push notification to User A
   - User A's dashboard receives the update via the existing 30-second polling fallback
   - **The 30-second polling continues to work as the fallback mechanism** -- no WebSocket replacement

4. **Update `LocationRequest` model status**:
   - When User B grants location access, update the `LocationRequest` status to `accepted`
   - When User B declines or the request expires (24 hours), update status to `rejected` or `expired`

5. **Add `GET /api/location-requests/` endpoint** in `accounts/views.py`:
   - Returns pending location requests for the authenticated user
   - Used by the frontend to check for outstanding requests when the app opens

---

## 4. Recommended Libraries and Technologies

### PWA
| Library | Purpose |
|---------|---------|
| `vite-plugin-pwa` (v1.x) | Generates service worker, manifest, and handles PWA scaffolding for Vite |
| `workbox` (bundled with vite-plugin-pwa) | Caching strategies for offline support |

### Push Notifications (Backend)
| Library | Purpose |
|---------|---------|
| `webpush` | Send Web Push notifications via VAPID from Django |
| `pywebpush` | Python library for generating VAPID keys and sending push requests |

### Push Notifications (Frontend)
| Library | Purpose |
|---------|---------|
| Native `PushManager` API | Browser-native push subscription |
| Native `ServiceWorker` API | Handle push events and notification clicks |

---

## 5. Browser Limitations and Security Considerations

### Browser Limitations
- **Push notifications require HTTPS** (or localhost for development). The service worker will not register on HTTP in production.
- **Safari has limited PWA support**: No service worker push notifications on older versions; manifest support is partial. Safari on iOS does not support Web Push notifications (this is a known limitation -- Apple has not implemented the Web Push standard for Safari).
- **Service worker scope**: The service worker only controls pages within its scope. It must be served from the root (`/sw.js`) to control all pages.
- **Notification permission**: Must be triggered by a user gesture (click). Cannot be auto-prompted on page load.
- **VAPID keys**: The public key is sent to the browser; the private key must never leave the server.
- **Push subscription expiration**: Subscriptions can expire or become invalid (e.g., user clears browser data). The backend must handle `410 Gone` responses when sending notifications.
- **Background sync**: Not all browsers support Background Sync API. Push notifications are the reliable fallback for delivering updates when the app is not open.

### Security Considerations
- **VAPID private key**: Must be stored in environment variables (`.env`), never committed to source control.
- **Push subscription endpoint URLs**: Contain user-specific identifiers; treat them as sensitive data.
- **Location data**: GPS coordinates are personally identifiable information (PII). Ensure HTTPS everywhere, encrypt sensitive fields at rest, and implement proper access controls.
- **Friend request authorization**: The "Request Live Location" endpoint must verify that the sender and receiver are accepted friends before allowing the request.
- **CSRF protection**: Django's CSRF middleware is active; ensure API endpoints use JWT auth (already the case) and exempt push subscription endpoints from CSRF if needed.
- **CORS**: The current CORS config only allows `localhost:5173`. For production, add the production domain.
- **Service worker cache poisoning**: Use versioned cache names and clean up old caches on activation.

---

## 6. Open Questions

1. **Production deployment**: The plan assumes a production deployment with HTTPS. The VAPID keys and push notification service will need to be configured for the production domain.
2. **iOS Safari support**: Safari on iOS does not support Web Push notifications. A fallback strategy (e.g., in-app notifications when the app is open) is needed for iOS users.
3. **Location request expiration**: A 24-hour expiration window is recommended for location requests.
4. **Multiple device support**: Should a user be able to have push subscriptions on multiple devices? The current design supports this (one subscription per device per user).
5. **Testing push notifications locally**: Push notifications cannot be tested on `localhost` in all browsers. Chrome supports them on localhost; Firefox requires a secure context. A staging environment with HTTPS is recommended for testing.