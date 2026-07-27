# App Store Connect Submission — 241 Runners (iOS)

**Bundle ID:** `org.runners241.app`  
**ASC App ID:** `6752970863`  
**Team ID:** `KR52VK4ZKR`  
**Version:** `1.0.1`  
**EAS project:** `@241-runners-awareness/241runners`

## Compliance status (code)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Privacy usage strings (camera, photos, location) | ✅ | `app.config.ts` `infoPlist` |
| Export compliance (`ITSAppUsesNonExemptEncryption: false`) | ✅ | Standard HTTPS only |
| Push (`aps-environment`) | ✅ | `production` on EAS `production` profile |
| Notifications plugin mode | ✅ | `production` on EAS `production` profile |
| Account deletion | ✅ | Profile → Delete Account |
| App Tracking Transparency | ✅ | `expo-tracking-transparency` (no cross-app tracking) |
| Sign in with Apple | ✅ N/A | Email/password only — no third-party OAuth |
| Admin / dev tools in production | ✅ | `ADMIN_APP_ENABLED: false`; element inspector dev-only |
| Privacy policy URL | ✅ | `https://241runnersawareness.org/privacy.html` |
| Universal links | ✅ | `applinks:241runnersawareness.org` |
| Production API | ✅ | `https://two41runners-api.onrender.com` |

## Screenshots (iPhone 6.7" slot — 1290×2796)

Captured on **iPhone 17 Pro** simulator (native 1206×2622, resized to 1290×2796 for ASC).

| File | Screen |
|------|--------|
| `store-assets/screenshots/01-login.png` | Login |
| `store-assets/screenshots/01b-signup.png` | Sign up |
| `store-assets/screenshots/02-map.png` | Public missing cases map |
| `store-assets/screenshots/03-cases.png` | Cases list |
| `store-assets/screenshots/04-profile-map.png` | Profile map (`/map?source=profile`) |
| `store-assets/screenshots/05-profile.png` | Profile (signed in) |
| `store-assets/screenshots/06-report-case.png` | Report case form |

Re-capture:

```bash
./scripts/capture-asc-screenshots.sh
```

Uses the **currently booted** simulator only (`xcrun simctl io booted screenshot`).

## Production build & submit

```bash
cd /Users/marcusbrown/Documents/241RA-mobile
eas build --platform ios --profile production --non-interactive
eas submit --platform ios --profile production --latest --non-interactive
```

`eas.json` submit block: Apple ID, ASC app ID, team ID configured.

## Manual steps in App Store Connect

1. **Version 1.0.1** → select latest EAS production build when processing completes.
2. **Description** — paste `store-assets/APP_DESCRIPTION.txt` (no demo credentials in public text).
3. **App Review Information** — paste `store-assets/APP_REVIEW_INFORMATION.txt` (demo account).
4. **Screenshots** — upload `store-assets/screenshots/*.png` → **iPhone 6.7" Display**.
5. **Age Rating** — set Parental Controls and Age Assurance to **None** (Guideline 2.3.6).
6. **Privacy Nutrition Labels** — align with `docs/privacy/PRIVACY_POLICY.md`.
7. **Support URL** — `https://241runnersawareness.org/support.html`
8. **Marketing URL** — `https://241runnersawareness.org`
9. **Submit for Review** after build + metadata complete.
10. **Resolution Center** — if replying to prior rejection, use `store-assets/APP_REVIEW_REPLY.txt`.

## Reviewer demo account

- Email: `apptestreview@dekuworks.com`
- Password: see `store-assets/APP_REVIEW_INFORMATION.txt`
- API must be awake: `https://two41runners-api.onrender.com/health`

## Tests

```bash
npm test   # 7/7 passing
```
