# 241Runners Mobile (Android + iOS)

**Official mobile app for [241RunnersAwareness.org](https://241runnersawareness.org).**  
Web repo: https://github.com/DekuWorks/241RunnersAwareness  
API (shared with web): https://241runners-api-v2.azurewebsites.net/swagger/index.html

## Overview

- **Framework:** Expo (React Native + TypeScript)
- **Platforms:** iOS (App Store), Android (Google Play)
- **Backend:** Azure App Service (.NET 8 Web API) — same DB & users as the static site
- **Auth:** Email/Password, Google OAuth, 2FA (TOTP + backup codes)

## Environment Configuration

### Local Development

Create `.env` from example:

```bash
cp .env.example .env
```

**Required Variables:**

- `EXPO_PUBLIC_API_URL=https://241runners-api-v2.azurewebsites.net`

### EAS Build (Preview/Production)

Environment variables are configured per profile in EAS:

- **Preview:** `EXPO_PUBLIC_API_URL` set in EAS secrets
- **Production:** `EXPO_PUBLIC_API_URL` set in EAS secrets

**Important:** Never commit `.env` files. Only `EXPO_PUBLIC_*` variables are exposed to the client. Use EAS secrets for sensitive values.

## Scripts

```bash
# Development
npm i
npm run start
npm run ios
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

---

## 6) Expo/EAS Accounts & App IDs

- [ ] Apple Developer ($99/yr) + connect in EAS
- [ ] Google Play Developer ($25 one-off) + connect in EAS
- [ ] iOS bundle ID: `org.runners241.app`
- [ ] Android package: `org.runners241.app`

---

## 7) Keys & Permissions

- [ ] **Maps:** set Google Maps keys (Android & iOS if using Google provider)
- [ ] **Notifications:** configure Expo push (device token → your API)
- [ ] **OAuth:** add mobile redirect URIs to your provider:
  - iOS: `org.runners241.app:/oauthredirect`
  - Android: `org.runners241.app:/oauthredirect`

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
