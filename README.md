# 241Runners Mobile (Android + iOS)

**Official mobile app for [241RunnersAwareness.org](https://241runnersawareness.org).**  
Web repo: https://github.com/DekuWorks/241RunnersAwareness  
API (shared with web): https://241runners-api-v2.azurewebsites.net/swagger/index.html

## Overview

- **Framework:** Expo (React Native + TypeScript)
- **Platforms:** iOS (App Store), Android (Google Play)
- **Backend:** Azure App Service (.NET 8 Web API) — same DB & users as the static site
- **Auth:** Email/Password, 2FA (TOTP + backup codes) via .NET API (JWT)
- **Dual Role System:** Supports users with multiple roles (e.g., Runner + Admin)
- **Push:** Expo Notifications → `POST /api/Devices/register`
- **Realtime:** SignalR (`/hubs/alerts`)
- **Observability:** Sentry
- **Supabase:** Optional client for storage/realtime (auth stays on .NET API)

## Progress Tracker

See **[PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md)** for current implementation status, completed milestones, and next steps.


## Environment Configuration

### Local Development

Create `.env` from example:

```bash
cp .env.example .env
```

**Required Variables:**

- `EXPO_PUBLIC_API_URL=https://241runners-api-v2.azurewebsites.net`
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (optional)
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (for map screen)
- `EXPO_PUBLIC_SENTRY_DSN` (production error tracking)

### EAS Build (Preview/Production)

Environment variables are configured per profile in EAS:

- **Preview:** `EXPO_PUBLIC_API_URL` set in EAS secrets
- **Production:** `EXPO_PUBLIC_API_URL` set in EAS secrets

**Important:** Never commit `.env` files. Only `EXPO_PUBLIC_*` variables are exposed to the client. Use EAS secrets for sensitive values.

## Scripts

```bash
# Development
npm i
npm run start          # Metro on :8081 (dev client) — keep this exclusive
npm run ios            # builds + launches with its own bundler
npm run start:8082     # use when :8081 is already taken by another Expo app
npm run android

# Code Quality
npm run lint          # ESLint check
npm run lint:fix      # ESLint fix
npm run format        # Prettier format
npm run format:check  # Prettier check
npm run typecheck     # TypeScript check

# Testing
npm run test          # Run tests
npm run test:watch    # Watch mode

# Building
npm run build:preview # EAS preview build
npm run build:prod    # EAS production build
npm run clean         # Clear Expo cache
```

## Bundle IDs

- **iOS:** `org.runners241.app`
- **Android:** `org.runners241.app`

## Permissions

- **Camera:** capture evidence for sightings
- **Location (When In Use):** attach coordinates to reports; enable nearby alerts

## Security

- **Token Storage:** SecureStore (iOS Keychain, Android Keystore)
- **API Client:** Centralized with 401 interceptor and token refresh
- **Error Handling:** Production errors redacted, sensitive data filtered
- **TLS:** All API communication encrypted
- **Observability:** Sentry integration for production error tracking

## Cross-Platform Integration

The mobile app is fully integrated with the main repository backend and supports the dual role system:

- **[🔗 Cross-Platform Integration Summary](docs/CROSS_PLATFORM_INTEGRATION_SUMMARY.md)** - Complete dual role system implementation
- **[🔧 Integration with Main Repo](docs/INTEGRATION_WITH_MAIN_REPO.md)** - Backend integration details
- **Test Credentials**: `lthomas3350@gmail.com` / `Lisa2025!` (works for both user and admin flows)

### Dual Role System Features
- **Multiple Roles**: Users can have both regular and admin roles
- **Seamless Access**: Same credentials work across web and mobile platforms
- **Clean UX**: Role information displayed appropriately for each context
- **Admin Portal**: Dual-role users can access admin functionality

## Documentation

All project documentation has been organized in the [`docs/`](./docs/) folder:

- **📱 App Store & Distribution** - Store submission guides and checklists
- **🔧 Backend & API** - API documentation and integration guides  
- **🚀 Deployment & Infrastructure** - Build, deployment, and CI/CD guides
- **📊 Implementation & Development** - Development status and progress
- **🔐 Privacy & Compliance** - Privacy policy and compliance documentation
- **🏗️ Platform & Architecture** - Authentication and platform-specific guides

See [docs/README.md](./docs/README.md) for a complete index of all documentation.

## Notes

- Same users, roles, and database as the static site
- Feature parity delivered in phases; see project board for roadmap

### Dev client / Metro troubleshooting

If the simulator shows errors that do **not** exist in this repo — e.g. `FloatingTabBar.tsx`, `useAuthStore`, `import "../global.css"`, `[Worklets] Native part of Worklets doesn't seem to be initialized`, or `RNGestureHandlerModule` — Metro is serving a **different Expo project** (commonly another app on `:8081`), or Expo Go is open to that project.

This app’s root layout is `src/app/_layout.tsx` and already wraps routes in `QueryClientProvider`. It does not use Reanimated tab bars or Zustand auth stores.

Fix:

1. Confirm Metro status: open `http://127.0.0.1:8081` (or `:8082`) and check `extra.expoClient.name` is **241 Runners**, not another app.
2. Prefer `npm run ios` (starts the matching bundler) over `expo run:ios --no-bundler` when another Metro is already on `:8081`.
3. Or attach the installed dev client explicitly:
   `xcrun simctl openurl booted 'exp+241runners://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'`
4. Native rebuild is only needed after adding native modules (Maps, SecureStore plugins, etc.):
   `npx expo prebuild --clean && npx expo run:ios`

---

## 6) Expo/EAS Accounts & App IDs

- [ ] Apple Developer ($99/yr) + connect in EAS
- [ ] Google Play Developer ($25 one-off) + connect in EAS
- [ ] iOS bundle ID: `org.runners241.app`
- [ ] Android package: `org.runners241.app`

---

## 7) Keys & Permissions

- [ ] **Maps:** set Google Maps API key (Android & iOS)
- [ ] **Notifications:** configure Expo push (device token → your API)

---

## 8) Minimal E2E Smoke Test (must pass)

- [ ] Existing web user logs into mobile (email/2FA)
- [ ] Cases list loads (from v2 API)
- [ ] Case detail opens
- [ ] Report a sighting (camera + location) submits successfully
- [ ] Push test delivers and deep-links to a case

---

## 9) First Builds

```bash
# Internal preview builds
npm run build:preview

# Production builds
npm run build:prod
npm run submit:ios
npm run submit:android
```

## 10) Store Metadata (later)

- Icons (1024 px), splash, 6–8 screenshots (Home, Cases, Map, Report, Admin)
- Privacy Policy & Terms → static site URLs
- Data Safety (Play) & Privacy Labels (Apple): camera + location (when in use)
