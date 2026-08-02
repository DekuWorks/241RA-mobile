# App Store Connect — remaining steps (manual)

App: **241 Runners** (`org.runners241.app`) · ASC App ID: **6752970863**  
Version: **1.0.1** · Code: commit `3eeee25` (+ this store-assets / icon / config work)

**Automated already**
- ✅ EAS iOS production build **1.0.1 (155)** — commit `2909a51`  
  https://expo.dev/accounts/241-runners-awareness/projects/241runners/builds/5d994a09-8a8f-4c76-b6f7-caef9511a7a8
- ✅ Submitted to App Store Connect (binary upload) — Jul 26, 2026  
  https://expo.dev/accounts/241-runners-awareness/projects/241runners/submissions/d4807f11-365e-4535-8f0e-bde7135088bf  
  ASC: https://appstoreconnect.apple.com/apps/6752970863/testflight/ios
- ✅ App icon 1024×1024 traffic-light logo in `assets/icon.png` + `store-assets/icon/app-icon-1024.png` (opaque RGB PNG)
- ✅ Public description draft (no demo credentials): `store-assets/APP_DESCRIPTION.txt`
- ✅ Review reply draft: `store-assets/APP_REVIEW_REPLY.txt`
- ✅ Reviewer notes + demo credentials: `store-assets/APP_REVIEW_INFORMATION.txt` (`apptestreview@dekuworks.com`)
- ✅ Smoke account seeded in production SQL (see `store-assets/SMOKE_TEST_STATUS.md`)
- ✅ Simulator screenshots: `store-assets/screenshots/` (login, signup, map, cases, profile map, profile, report case) — re-captured Aug 1, 2026 on **iPhone 17 Pro** (resized to 1290×2796) and uploaded to ASC **iPhone 6.7"**
- ✅ Age rating via ASC API: Parental Controls / Age Assurance = None → **4+**
- ✅ Version string set to **1.0.1**; build **155** attached (`PREPARE_FOR_SUBMISSION`)
- ✅ API host: `https://two41runners-api.onrender.com` (Supabase + Render)

Local ASC API key (`AuthKey_H4G3Q866D3`) used for age rating, build attach, and screenshot upload. EAS Submit also has an Expo-managed key (Key ID `74U6N3NFF7`) for binary upload.

---

## 1) Public app description (Guideline 2.3) — ⚠️ ASC UI

1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **241 Runners**
2. Open version **1.0.1** (or create it and select build **155** when processing finishes)
3. **App Store** tab → **Description**
4. Paste contents of `store-assets/APP_DESCRIPTION.txt`
5. Confirm these are **absent** from the public description:
   - “Test account credentials provided above”
   - “The app uses location services for nearby alerts and camera for incident reporting.”
6. Demo credentials go **only** in **App Review Information** (`store-assets/APP_REVIEW_INFORMATION.txt`)

---

## 2) Age Rating (Guideline 2.3.6) — ✅ ASC API

- Parental Controls = None (`false`)
- Age Assurance = None (`false`)
- App Store age rating now **4+**
- Verify in ASC → App Information if needed before submit

---

## 3) App icon / logo — ✅ binary; ASC picks up from IPA

- `app.config.ts` → `icon: './assets/icon.png'`
- Store copy: `store-assets/icon/app-icon-1024.png` (1024×1024, no alpha)
- After build **155** finishes processing, ASC should show the traffic-light icon from the binary
- No separate “upload logo” step for iOS beyond the IPA icon

---

## 4) Screenshots 6.7" (Guideline 2.3.3) — ✅ ASC API upload

Local + uploaded to **iPhone 6.7" Display** (`APP_IPHONE_67`):
- `store-assets/screenshots/01-login.png` ✅
- `store-assets/screenshots/01b-signup.png` ✅
- `store-assets/screenshots/02-map.png` ✅
- `store-assets/screenshots/03-cases.png` ✅
- `store-assets/screenshots/04-profile-map.png` ✅
- `store-assets/screenshots/05-profile.png` ✅
- `store-assets/screenshots/06-report-case.png` ✅

Re-capture: `./scripts/capture-asc-screenshots.sh` (uses booted sim only)

---

## 5) Select build & submit for review — build ✅; submit ⚠️ ASC UI

1. ✅ Build **155** attached to version **1.0.1** (`PREPARE_FOR_SUBMISSION`)
2. Complete App Review Information (demo account) if not already set
3. **Add for Review** / **Submit to App Review**

Rebuild/submit again if needed:
```bash
cd /Users/marcusbrown/Documents/241RA-mobile
eas build --platform ios --profile production --non-interactive
eas submit --platform ios --profile production --latest --non-interactive
```

---

## 6) App Review reply — ⚠️ ASC UI

1. **Resolution Center** (rejection thread for Submission ID `443eb6c7-b22a-4aff-9a12-a64c29d98231`)
2. **Reply** → paste `store-assets/APP_REVIEW_REPLY.txt`
3. Send **after** metadata + screenshots + build **155** are attached
