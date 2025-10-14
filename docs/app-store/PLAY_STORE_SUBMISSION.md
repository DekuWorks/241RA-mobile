# 🤖 Google Play Store Submission - Quick Guide

## ✅ **iOS Submitted - Now Let's Do Android!**

---

## 📊 **Current Android Build Status**

Your production Android build is in progress:
- **Build ID:** 435d5e2e-e54d-498b-a415-fb59e0dcbfc4
- **Format:** .aab (App Bundle) for Play Store
- **Version Code:** 23
- **Status:** 🔄 Building...

**Monitor:** https://expo.dev/accounts/241-runners-awareness/projects/241runners/builds/435d5e2e-e54d-498b-a415-fb59e0dcbfc4

---

## 🚀 **Submission Methods**

### **Option 1: EAS CLI (Automatic) - RECOMMENDED**

Once the build completes, run:

```bash
cd /Users/marcusbrown/241RA-mobile

# Submit to Play Store
npx eas-cli submit --platform android --latest

# Or specify the build ID directly
npx eas-cli submit --platform android --id 435d5e2e-e54d-498b-a415-fb59e0dcbfc4
```

**Requirements:**
- Google Service Account JSON file (for API access)
- Located at: `./google-service-account.json`

### **Option 2: Manual Upload**

If you don't have the service account file or prefer manual:

1. **Wait for build to complete**
2. **Download the .aab file:**
   ```bash
   # Get download URL
   npx eas-cli build:view 435d5e2e-e54d-498b-a415-fb59e0dcbfc4
   
   # Or download directly from dashboard
   open https://expo.dev/accounts/241-runners-awareness/projects/241runners/builds/435d5e2e-e54d-498b-a415-fb59e0dcbfc4
   ```

3. **Upload to Play Console:**
   - Go to: https://play.google.com/console
   - Select your app (or create new app)
   - Go to **Release → Production**
   - Click **Create new release**
   - Upload the .aab file
   - Fill in release notes
   - Review and rollout

---

## 📋 **Setup Google Service Account (For EAS Submission)**

If you don't have `google-service-account.json`:

### Step 1: Create Service Account

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/

2. **Select or Create Project:**
   - Project: 241 Runners Mobile (or your project name)

3. **Create Service Account:**
   - Go to **IAM & Admin → Service Accounts**
   - Click **Create Service Account**
   - Name: `eas-play-store-deployer`
   - Role: None needed here

4. **Create Key:**
   - Click on the service account
   - Go to **Keys** tab
   - **Add Key → Create new key**
   - Format: **JSON**
   - Download the file

5. **Save to Project:**
   ```bash
   # Move downloaded file to project root
   mv ~/Downloads/your-project-xxxxx.json /Users/marcusbrown/241RA-mobile/google-service-account.json
   ```

### Step 2: Link to Play Console

1. **Go to Play Console:**
   https://play.google.com/console

2. **Setup API Access:**
   - Go to **Settings (⚙️) → API access**
   - Click **Link to Google Cloud project** (if not linked)
   - Select your project
   - Click **Link project**

3. **Grant Permissions:**
   - Find your service account in the list
   - Click **Grant access**
   - Permissions needed:
     - ✅ View app information
     - ✅ Create and edit draft releases
     - ✅ Release to production, exclude devices, and use Play App Signing
   - Click **Apply**
   - Click **Invite user** / **Save**

### Step 3: Test Submission

```bash
# Now you can submit via EAS CLI
npx eas-cli submit --platform android --latest
```

---

## 🎯 **Quick Submission (If Service Account Ready)**

### Wait for Build:
```bash
# Check if build completed
npx eas-cli build:list --platform android --limit 1

# Or watch build in real-time
npx eas-cli build:view 435d5e2e-e54d-498b-a415-fb59e0dcbfc4
```

### Submit When Ready:
```bash
# Automatic submission to Play Store
npx eas-cli submit --platform android --latest

# Choose track (if prompted):
# - internal: For testing (up to 100 testers)
# - alpha: Closed testing
# - beta: Open testing  
# - production: Public release (recommended)
```

---

## 📱 **Play Store Listing Requirements**

Before public release, you need to complete in Play Console:

### 1. Store Listing
- **App name:** 241 Runners
- **Short description:** (max 80 chars)
  ```
  Missing person awareness and case management for the 241 Runners community
  ```
- **Full description:** (max 4000 chars) - See APP_STORE_DESCRIPTION.md
- **App icon:** 512×512 px PNG
- **Feature graphic:** 1024×500 px JPG or PNG
- **Screenshots:** Minimum 2 phone screenshots

### 2. Content Rating
- Complete the questionnaire
- Answer questions about:
  - Violence: None
  - Sexual content: None  
  - Language: None
  - Controlled substances: None
  - Social features: Yes (user-generated content)
- Expected rating: **Everyone** or **Teen**

### 3. App Content
- **Privacy Policy:** https://241runnersawareness.org/privacy-policy
- **App access:** All features available without special access
- **Ads:** No ads in this app
- **Target audience:** Ages 13+

### 4. Data Safety
Complete the form:
- **Location:** Collected, optional, used for app functionality
- **Photos:** Collected, optional, used for reporting
- **Personal info:** Email, name (for account)
- **Security:** 
  - ✅ Data encrypted in transit
  - ✅ Users can request deletion
  - ✅ Users can opt-out of data collection

### 5. App Category
- **Category:** Medical
- **Tags:** Health, Safety, Social, Community

---

## ⏰ **Timeline**

**Right Now:**
- ✅ iOS app submitted and in review
- 🔄 Android production build in progress

**Next 10-20 minutes:**
- ✅ Android build completes
- 🚀 Submit to Play Store

**1-2 Days:**
- ✅ Play Store review (usually faster than Apple)
- May ask for clarifications

**This Week:**
- 🎉 Android app live on Play Store!
- 🎉 iOS app live on App Store! (1-7 days)

---

## 🎯 **Quick Commands Reference**

```bash
# Check build status
npx eas-cli build:list --platform android --limit 1

# Watch build progress
npx eas-cli build:view 435d5e2e-e54d-498b-a415-fb59e0dcbfc4

# Submit to Play Store (when ready)
npx eas-cli submit --platform android --latest

# Choose production track
npx eas-cli submit --platform android --latest --track production

# Check submission status
npx eas-cli submit:list
```

---

## 🔍 **Verify Service Account Setup**

Check if service account file exists:
```bash
ls -la google-service-account.json

# Should show:
# -rw------- ... google-service-account.json
```

If missing, follow the **Setup Google Service Account** section above.

---

## 📸 **Screenshot Requirements**

**Play Store Minimum:**
- **Phone:** 2-8 screenshots
  - Min: 320px shortest dimension
  - Max: 3840px longest dimension
  - Format: JPG or 24-bit PNG

**Recommended Screenshots:**
1. Login screen (showing all auth options)
2. Dashboard with cases
3. Case detail with map
4. Profile management
5. Report sighting flow

**Create from preview build:**
- Install preview APK on S25 Ultra
- Navigate to each screen
- Take screenshots
- Upload to Play Console

---

## ✅ **What's Already Configured**

- ✅ Bundle/Package name: `org.runners241.app`
- ✅ Version: 1.0.0 (23)
- ✅ Keystore: Managed by EAS
- ✅ Signing: Automatic via EAS
- ✅ API credentials: Configured in EAS secrets
- ✅ Privacy policy URL: Set in app

---

## 🎉 **You're Almost There!**

### Current Progress:
- ✅ iOS: Submitted and in review
- 🔄 Android: Build in progress (ETA: 10-20 min)
- 📋 Next: Submit Android once build completes

### To Submit Android:

**If you have service account:**
```bash
npx eas-cli submit --platform android --latest
```

**If you don't have service account:**
1. Create service account (15 min setup)
2. Or manually upload .aab to Play Console

---

## 📞 **Need Help?**

**Service Account Issues:**
- Check Play Console API access settings
- Verify service account has correct permissions
- Ensure JSON file is in project root

**Build Issues:**
- Check build logs in dashboard
- Verify all environment variables set
- Check for TypeScript errors

**Submission Issues:**
- Ensure Play Console developer account is active
- Complete all required store listing sections
- Verify app signing is configured

---

**Monitor your Android build and submit once it's done!** 🚀

Build Dashboard: https://expo.dev/accounts/241-runners-awareness/projects/241runners/builds


