# App Store Connect — remaining steps (manual)

App: **241 Runners** (`org.runners241.app`) · ASC App ID: **6752970863**  
Version: **1.0.1** · Code: commit `3eeee25` (+ this store-assets / icon / config work)

**Automated already**
- ✅ EAS iOS production build **1.0.1 (143)**  
  https://expo.dev/accounts/241-runners-awareness/projects/241runners/builds/9ed358d9-6eb4-4100-a1ce-736e0a6dca1a
- ✅ Submitted to App Store Connect (processing / TestFlight)  
  https://expo.dev/accounts/241-runners-awareness/projects/241runners/submissions/03661458-ef2d-40ba-ba45-46fd7bb71cef  
  ASC: https://appstoreconnect.apple.com/apps/6752970863/testflight/ios
- ✅ App icon 1024×1024 traffic-light logo in `assets/icon.png` + `store-assets/icon/app-icon-1024.png` (opaque RGB PNG)
- ✅ Public description draft (no demo credentials): `store-assets/APP_DESCRIPTION.txt`
- ✅ Review reply draft: `store-assets/APP_REVIEW_REPLY.txt`
- ✅ Reviewer notes + demo credentials: `store-assets/APP_REVIEW_INFORMATION.txt` (`apptestreview@dekuworks.com`)
- ✅ Smoke account seeded in production SQL (see `store-assets/SMOKE_TEST_STATUS.md`)
- ✅ Simulator screenshots (partial): `store-assets/screenshots/` (login, signup, cases)
- ⛔ **Blocker:** Azure API App Service `241runners-api-v2` is `AdminDisabled` (subscription Warned). Re-enable billing / start webapp before reviewers can log in.

No local App Store Connect `.p8` key was available. EAS Submit uses an Expo-managed ASC API key on EAS servers (Key ID `74U6N3NFF7`) for binary upload only — **not** for listing metadata / age rating / screenshots / Resolution Center replies.

---

## 1) Public app description (Guideline 2.3) — ⚠️ ASC UI

1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **241 Runners**
2. Open version **1.0.1** (or create it and select build **143** when processing finishes)
3. **App Store** tab → **Description**
4. Paste contents of `store-assets/APP_DESCRIPTION.txt`
5. Confirm these are **absent** from the public description:
   - “Test account credentials provided above”
   - “The app uses location services for nearby alerts and camera for incident reporting.”
6. Demo credentials go **only** in **App Review Information** (`store-assets/APP_REVIEW_INFORMATION.txt`)

---

## 2) Age Rating (Guideline 2.3.6) — ⚠️ ASC UI

1. **241 Runners** → **App Information** (General)
2. **Age Ratings** → **Edit**
3. Set **Parental Controls** → **None**
4. Set **Age Assurance** → **None**
5. Save until Age Rating no longer lists “In-App Controls”

---

## 3) App icon / logo — ✅ binary; ASC picks up from IPA

- `app.config.ts` → `icon: './assets/icon.png'`
- Store copy: `store-assets/icon/app-icon-1024.png` (1024×1024, no alpha)
- After build **143** finishes processing, ASC should show the traffic-light icon from the binary
- No separate “upload logo” step for iOS beyond the IPA icon

---

## 4) Screenshots 6.7" (Guideline 2.3.3) — ⚠️ ASC upload (+ more captures)

Prepared (1290×2796 where resized):
- `store-assets/screenshots/01-login.png` — email/password only (no Apple/Google) ✅
- `store-assets/screenshots/01b-signup.png` — create account ✅
- `store-assets/screenshots/03-cases.png` — Cases list UI ✅

Still needed (login as demo user in Simulator, then capture):
- Home / Profile with runner profile
- Map with cases (requires working Maps key in local `.env` + native maps; production EAS env has the secret)
- Report Sighting / Report Case form
- Runner Profile create form

Upload path:
1. ASC → version **1.0.1** → **Previews and Screenshots**
2. **iPhone 6.7" Display**
3. Delete outdated shots → upload new set

Capture helpers: `store-assets/screenshots/README.md`

---

## 5) Select build & submit for review — ⚠️ ASC UI

1. Wait for email that build **143** finished processing
2. Version **1.0.1** → **Build** → select **143**
3. Complete App Review Information (demo account)
4. **Add for Review** / **Submit to App Review**

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
3. Send **after** metadata + screenshots + build **143** are attached
