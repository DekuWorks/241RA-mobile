# 241RA Mobile — Progress Tracker

Last updated: **June 23, 2026**

Track implementation status for the official [241RunnersAwareness.org](https://241runnersawareness.org) mobile app.

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ | Complete and verified |
| 🔄 | In progress |
| ⏳ | Not started |
| ⚠️ | Blocked or needs attention |

---

## Platform & Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Expo 54 + React Native 0.81 | ✅ | TypeScript, Expo Router |
| iOS native project (prebuild) | ✅ | `ios/` generated; team `KR52VK4ZKR` |
| Android native project | ⏳ | Run `npx expo prebuild --platform android` when needed |
| EAS project configured | ✅ | Project ID `bb791d4e-1e0d-4c6c-a23d-a619d34d3d7e` |
| Apple Developer account | ✅ | Signing configured in Xcode |
| Google Play Developer account | ⏳ | Required for Android store submission |
| Supabase project | ✅ | `241RunnersAwareness` — URL + anon key in EAS |
| `.env` / EAS secrets | 🔄 | API URL + Supabase set; Maps + Sentry optional |

---

## Authentication & Security

| Item | Status | Notes |
|------|--------|-------|
| Email/password login | ✅ | JWT via .NET API |
| Two-factor authentication (TOTP) | ✅ | Setup flow in profile |
| Google SSO | ✅ | **Removed** (June 2026) |
| Apple Sign-In | ✅ | **Removed** (June 2026) |
| Secure token storage | ✅ | `expo-secure-store` |
| Dual role system | ✅ | Multiple roles per user |
| Admin portal routing | ✅ | Via profile after standard login |

---

## Core Features

| Item | Status | Notes |
|------|--------|-------|
| Cases list & detail | ✅ | TanStack Query + API |
| Map view | 🔄 | Needs `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Report sighting (camera + location) | ✅ | Implemented |
| User profile & settings | ✅ | Notifications toggle, 2FA |
| Admin portal screens | ✅ | Dashboard, users, cases, analytics |
| Offline indicator | ✅ | React Query offline-first |
| SignalR real-time updates | ✅ | `/hubs/alerts` |

---

## Push Notifications

| Item | Status | Notes |
|------|--------|-------|
| Expo push token registration | ✅ | `POST /api/Devices/register` |
| Foreground / tap handlers | ✅ | Deep-link to case detail |
| Topic subscriptions | ✅ | Via backend Topics API |
| Physical device push test | ⏳ | Requires device build + APNs |
| Firebase | ✅ | **Removed** — replaced with Expo push + Sentry |

---

## Backend Integration

| Item | Status | Notes |
|------|--------|-------|
| Auth API (`/api/v1/auth/*`) | ✅ | Shared with web |
| Cases API (`/api/v1/cases`) | ✅ | |
| Public cases API | ✅ | `/api/public/cases` |
| Devices API | ✅ | `/api/Devices/register` |
| Image upload | ✅ | `/api/ImageUpload/upload` |
| SignalR hubs | ✅ | AlertsHub |

---

## Build & CI

| Item | Status | Notes |
|------|--------|-------|
| `npm run typecheck` | ✅ | Passing |
| `npm run ios` (simulator) | ✅ | Auto-signing with Apple team |
| EAS preview build | ⏳ | `npm run build:preview` |
| EAS production build | ⏳ | `npm run build:prod` |
| GitHub Actions CI | 🔄 | Dependency update workflow needs fix |
| App Store submission | ⏳ | See `docs/app-store/` |
| Google Play submission | ⏳ | See `docs/app-store/` |

---

## E2E Smoke Test Checklist

- [ ] Existing web user logs into mobile (email/2FA)
- [ ] Cases list loads from API
- [ ] Case detail opens
- [ ] Map shows case pins (with Maps API key)
- [ ] Report a sighting submits successfully
- [ ] Push notification delivers and deep-links to a case

---

## Recent Milestones

### June 2026
- Removed Firebase; added optional Supabase client
- Removed Google SSO and Apple Sign-In
- Fixed iOS keychain / push entitlements for simulator
- Configured Apple Developer signing (team KR52VK4ZKR)
- Connected Supabase project to `.env` and EAS secrets
- iOS simulator build and launch verified

---

## Next Priorities

1. **E2E smoke test** on simulator with real credentials
2. **Set Google Maps API key** for map screen
3. **EAS preview build** to physical device
4. **Store assets** — 1024px icon, 6–8 screenshots
5. **Fix CI** dependency update workflow
6. **Android prebuild** and Play Store prep

---

## Troubleshooting

### `Global was not installed` / `AppRegistryBinding::startSurface failed`

Usually caused by a **native/JS mismatch** after dependency updates. Fix:

```bash
# Terminal 1 — start Metro for dev client
npm start

# Terminal 2 — sync native pods and rebuild
cd ios && pod update RNSentry Sentry/HybridSDK && cd ..
npm run ios
```

Always use `npm start` (dev client) before launching the simulator — not a stale Metro instance.

---

## Links

- [README](./README.md)
- [Documentation index](./docs/README.md)
- [Web repo](https://github.com/DekuWorks/241RunnersAwareness)
- [API Swagger](https://241runners-api-v2.azurewebsites.net/swagger/index.html)
