# 241Runners Mobile (Android + iOS)

**Official mobile app for [241RunnersAwareness.org](https://241runnersawareness.org).**  
Web repo: https://github.com/DekuWorks/241RunnersAwareness  
API (shared with web): https://241runners-api-v2.azurewebsites.net/swagger/index.html

## Overview
- **Framework:** Expo (React Native + TypeScript)
- **Platforms:** iOS (App Store), Android (Google Play)
- **Backend:** Azure App Service (.NET 8 Web API) — same DB & users as the static site
- **Auth:** Email/Password, Google OAuth, 2FA (TOTP + backup codes)

## Env
Create `.env` from example:
```bash
cp .env.example .env
```

Key:
- `EXPO_PUBLIC_API_URL=https://241runners-api-v2.azurewebsites.net`

## Scripts
```bash
npm i
npm run start
npm run ios
npm run android
npm run build:preview
npm run build:prod
```

## Bundle IDs
- **iOS:** `org.241runners.app`
- **Android:** `org.earth241runners.app`

## Permissions
- **Camera:** capture evidence for sightings
- **Location (When In Use):** attach coordinates to reports; enable nearby alerts

## Security
- Tokens stored with SecureStore
- TLS only; minimal PII on device; redacted logs in prod

## Notes
- Same users, roles, and database as the static site
- Feature parity delivered in phases; see project board for roadmap

---

## 6) Expo/EAS Accounts & App IDs
- [ ] Apple Developer ($99/yr) + connect in EAS
- [ ] Google Play Developer ($25 one-off) + connect in EAS
- [ ] iOS bundle ID: `org.241runners.app`
- [ ] Android package: `org.earth241runners.app`

---

## 7) Keys & Permissions
- [ ] **Maps:** set Google Maps keys (Android & iOS if using Google provider)
- [ ] **Notifications:** configure Expo push (device token → your API)
- [ ] **OAuth:** add mobile redirect URIs to your provider:
  - iOS: `org.241runners.app:/oauthredirect`
  - Android: `org.earth241runners.app:/oauthredirect`

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
