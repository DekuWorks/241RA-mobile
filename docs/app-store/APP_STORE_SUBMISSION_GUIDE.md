# 🚀 241 Runners - App Store & Play Store Submission Guide

**Date:** October 9, 2025  
**Status:** Production Builds In Progress

---

## 📱 **Current Build Status**

### ✅ Preview Builds (COMPLETED)
- **Android APK:** https://expo.dev/accounts/241-runners-awareness/projects/241runners/builds/eb41f8f7-a9dd-4ee8-90c3-4a0dc58374c3
- **iOS Ad-Hoc:** https://expo.dev/accounts/241-runners-awareness/projects/241runners/builds/430e2596-f5ae-4579-ae31-69a4a3936de8

### 🔄 Production Builds (IN PROGRESS)
- **Android (Play Store):** Building app-bundle format
- **iOS (App Store):** Building for submission
- **ETA:** 20-30 minutes

---

## 📋 **Pre-Submission Checklist**

### ✅ App Information (Already Configured)
- **App Name:** 241 Runners
- **Bundle ID (iOS):** org.runners241.app
- **Package Name (Android):** org.runners241.app
- **Version:** 1.0.0
- **Build Number (iOS):** 113+
- **Version Code (Android):** 22+

### ✅ Accounts & Credentials
- **Apple ID:** ghxstyyfps@gmail.com
- **App Store Connect ID:** 6752970863
- **Apple Team ID:** KR52VK4ZKR (Marcus Brown - Individual)
- **Google Play Console:** Account configured
- **Service Account:** google-service-account.json

### ✅ Required Assets
- **App Icon:** ✅ Configured (assets/icon.png)
- **Splash Screen:** ✅ Configured (assets/splash-icon.png)
- **Screenshots:** ⚠️ Need to prepare
- **Privacy Policy URL:** https://241runnersawareness.org/privacy-policy
- **Support URL:** https://241runnersawareness.org/support
- **Website:** https://241runnersawareness.org

---

## 🍎 **iOS App Store Submission**

### Step 1: Wait for Production Build to Complete
```bash
# Monitor build progress
npx eas-cli build:list --limit 5

# Or check dashboard
open https://expo.dev/accounts/241-runners-awareness/projects/241runners/builds
```

### Step 2: Automatic Submission (Recommended)
Once the iOS build completes, EAS can auto-submit:

```bash
npx eas-cli submit --platform ios --latest
```

This will:
- Upload the .ipa to App Store Connect
- Use credentials from eas.json
- Submit for TestFlight review first

### Step 3: Manual App Store Connect Setup

**Go to:** https://appstoreconnect.apple.com

1. **App Information**
   - Name: 241 Runners
   - Bundle ID: org.runners241.app
   - Primary Language: English (U.S.)
   - Category: Medical
   - Sub-Category: Health & Fitness

2. **Privacy Details**
   - ✅ Data Collection: Location, Camera, Photos
   - ✅ Privacy Policy URL: https://241runnersawareness.org/privacy-policy
   - ✅ Usage descriptions configured in app.config.ts

3. **App Store Listing**
   - **Name:** 241 Runners
   - **Subtitle:** Missing Person Awareness
   - **Description:** (Use content from APP_STORE_DESCRIPTION.md)
   - **Keywords:** missing persons, amber alert, safety, awareness, community
   - **Support URL:** https://241runnersawareness.org/support
   - **Marketing URL:** https://241runnersawareness.org

4. **Screenshots Required**
   - iPhone 6.7" (Pro Max): 3-10 screenshots
   - iPhone 6.5" (Plus): 3-10 screenshots
   - iPad Pro 12.9": 3-10 screenshots
   
   **Recommended Screenshots:**
   1. Login screen with all auth options
   2. Home/Dashboard
   3. Case list view
   4. Case details with map
   5. Profile management
   6. Admin portal (if applicable)

5. **App Review Information**
   - **Contact:** ghxstyyfps@gmail.com
   - **Demo Account:** Provide test credentials
   - **Notes:** Explain the app's purpose for missing persons awareness

6. **Version Information**
   - **Version:** 1.0.0
   - **Copyright:** © 2025 241 Runners Awareness
   - **Release:** Manual Release

### Step 4: Submit for Review

After uploading build via EAS:
1. Go to App Store Connect
2. Select your app → Version 1.0
3. Add required screenshots
4. Fill in all required fields
5. Click "Submit for Review"

**Review Time:** 1-7 days typically

---

## 🤖 **Google Play Store Submission**

### Step 1: Wait for Production Build to Complete
```bash
# Monitor build progress
npx eas-cli build:list --limit 5
```

### Step 2: Automatic Submission (Recommended)
Once the Android build completes:

```bash
npx eas-cli submit --platform android --latest
```

This will:
- Upload the .aab to Google Play Console
- Use service account credentials
- Submit to Internal Testing track first

### Step 3: Manual Play Console Setup

**Go to:** https://play.google.com/console

1. **App Information**
   - **App Name:** 241 Runners
   - **Short Description:** Missing person awareness and case management
   - **Full Description:** (Use content from APP_STORE_DESCRIPTION.md)
   - **Category:** Medical
   - **Tags:** Health, Safety, Community

2. **Store Listing**
   - **App Icon:** 512×512 px (use assets/icon.png upscaled)
   - **Feature Graphic:** 1024×500 px (create from assets)
   - **Phone Screenshots:** 2-8 screenshots (min 320px)
   - **Tablet Screenshots:** 2-8 screenshots (min 1024px)
   
   **Screenshot Requirements:**
   - Minimum 2 screenshots
   - JPEG or 24-bit PNG
   - Minimum dimension: 320px
   - Maximum dimension: 3840px

3. **Content Rating**
   - Complete questionnaire
   - Medical/Health app category
   - No violence, mature content
   - Expected rating: Everyone

4. **App Content**
   - **Privacy Policy:** https://241runnersawareness.org/privacy-policy
   - **Data Safety:**
     - Collects: Location (precise), Photos, Personal Info
     - Uses: App functionality, fraud prevention
     - Encrypted in transit: Yes
     - User can request deletion: Yes
     - Can opt-out: Yes

5. **Target Audience**
   - **Age Group:** 13 and older (Teens)
   - **Ads:** No ads
   - **In-app purchases:** No

6. **App Access**
   - **Restricted access:** No
   - **Demo account:** Provide test credentials if needed

### Step 4: Release Management

1. **Testing Track (First):**
   ```bash
   # Submit to internal testing
   npx eas-cli submit --platform android --latest --track internal
   ```

2. **After Testing:**
   - Internal Testing → Closed Testing → Open Testing → Production
   - Or go directly to Production if confident

3. **Production Release:**
   - Review all warnings
   - Set rollout percentage (start with 20%)
   - Click "Start rollout to Production"

**Review Time:** Few hours to 1-2 days typically

---

## 📸 **Screenshot Requirements**

### Create Screenshots

**Use Preview Builds to Capture:**
1. **Login Screen** - Show all auth options
2. **Dashboard/Home** - Clean, functional view
3. **Cases List** - Show multiple cases
4. **Case Detail** - With map and information
5. **Profile** - User profile management
6. **Admin Portal** - If applicable

**Tools to Create Screenshots:**
- iOS: Use iPhone simulators + Xcode screenshot tool
- Android: Use Android emulators + screenshot tool
- Design: Use Figma or Canva to add device frames

**Dimensions:**

**iOS:**
- 6.7" (iPhone 14 Pro Max): 1290 × 2796 px
- 6.5" (iPhone 11 Pro Max): 1242 × 2688 px
- 5.5" (iPhone 8 Plus): 1242 × 2208 px

**Android:**
- Phone: 1080 × 1920 px or higher
- Tablet: 1600 × 2560 px or higher

---

## 🔐 **Required Credentials**

### Apple App Store
- **Apple ID:** ghxstyyfps@gmail.com
- **App Store Connect:** Access configured
- **Team ID:** KR52VK4ZKR
- **Certificates:** Managed by EAS

### Google Play Store
- **Service Account:** google-service-account.json
- **Play Console:** Access configured
- **Track:** Production (or internal/alpha/beta for testing)

---

## 🧪 **Testing Before Public Release**

### TestFlight (iOS)
After first upload:
1. Build appears in TestFlight automatically
2. Add internal testers (up to 100)
3. Get feedback before public release
4. Can update build without new review

### Internal Testing (Android)
```bash
# Upload to internal track
npx eas-cli submit --platform android --latest --track internal

# Add up to 100 testers via email
```

---

## 📝 **App Store Description Template**

```
241 Runners - Missing Person Awareness

Help bring missing persons home by staying informed about active cases in your area.

KEY FEATURES:
• Real-time case updates and alerts
• Interactive map showing case locations
• Report sightings with photos and location
• Secure authentication with Google and Apple Sign-In
• Push notifications for important updates
• Admin portal for case management

SAFETY & PRIVACY:
• Your location is only used when you choose to share it
• All data is encrypted in transit
• Photos are only uploaded when you report a sighting
• No tracking or data selling
• Full privacy policy available at 241runnersawareness.org

WHO IT'S FOR:
• Concerned community members
• Families of missing persons
• Volunteers and awareness advocates
• Law enforcement partners

AUTHENTICATION:
• Sign in with Email
• Sign in with Google
• Sign in with Apple (iOS)
• Two-factor authentication for security

JOIN THE COMMUNITY:
Help make a difference in finding missing persons. Every alert shared and every sighting reported brings hope to families searching for loved ones.

SUPPORT:
Visit https://241runnersawareness.org/support
Email: support@241runnersawareness.org

PRIVACY:
Read our full privacy policy at https://241runnersawareness.org/privacy-policy
```

---

## ⚠️ **Common Rejection Reasons & How to Avoid**

### iOS App Store

1. **Missing Privacy Descriptions**
   - ✅ Already configured in app.config.ts
   - Camera, Location, Photos usage descriptions

2. **Incomplete Metadata**
   - Add all required screenshots
   - Fill in all text fields completely
   - Provide demo account if needed

3. **App Crashes**
   - Test thoroughly with preview builds first
   - Check crash logs in Sentry

4. **Privacy Policy Issues**
   - ✅ Already have: https://241runnersawareness.org/privacy-policy
   - Must be accessible without login

### Google Play Store

1. **Data Safety Form Incomplete**
   - Declare all data collection
   - Explain data usage clearly

2. **Content Rating Not Set**
   - Complete the questionnaire
   - Medical/Health category

3. **Missing Screenshots**
   - Minimum 2 screenshots required
   - Use real app screenshots, not mockups

4. **Target SDK Version**
   - ✅ Using latest Android SDK via Expo

---

## 📊 **Submission Timeline**

### Day 0 (Today)
- ✅ Preview builds completed
- 🔄 Production builds in progress

### Day 1
- ⏳ Production builds complete (~30 min)
- ⏳ Submit to stores
- ⏳ Upload screenshots and metadata

### Day 1-7 (iOS)
- ⏳ Apple review process
- May request clarifications
- Possible rejection if issues found

### Day 1-2 (Android)
- ⏳ Google Play review
- Usually faster than Apple
- May have policy questions

### Day 7-10
- 🎉 Both apps live (if no rejections)
- Users can download from stores
- Monitor reviews and crashes

---

## 🎯 **After Approval**

### Monitor Performance
```bash
# Check analytics
open https://analytics.google.com

# Check crash reports
open https://sentry.io

# Monitor reviews
open https://appstoreconnect.apple.com
open https://play.google.com/console
```

### Respond to Reviews
- Set up notifications for new reviews
- Respond professionally to feedback
- Address issues quickly

### Plan Updates
- Bug fixes: Can be released quickly
- New features: Follow same submission process
- Use EAS versioning: Increments automatically

---

## 🚀 **Quick Submission Commands**

Once production builds complete:

```bash
# Submit iOS (automatic)
npx eas-cli submit --platform ios --latest

# Submit Android (automatic)
npx eas-cli submit --platform android --latest

# Or submit both at once
npx eas-cli submit --platform all --latest

# Check submission status
npx eas-cli submit:list
```

---

## 📞 **Support Contacts**

**Apple Developer Support:**
- https://developer.apple.com/contact/

**Google Play Support:**
- https://support.google.com/googleplay/android-developer/

**EAS Build Support:**
- https://expo.dev/support

**Your Details:**
- Email: ghxstyyfps@gmail.com
- Organization: 241-runners-awareness
- Project: 241runners

---

## ✅ **Final Checklist Before Submission**

- [ ] Production builds completed successfully
- [ ] Test production builds on real devices
- [ ] All authentication methods working
- [ ] Screenshots prepared (minimum 2-3 per platform)
- [ ] App description written
- [ ] Privacy policy accessible
- [ ] Support email active
- [ ] Demo account created (if needed)
- [ ] Content rating completed (Android)
- [ ] Data safety form completed (Android)
- [ ] All metadata fields filled
- [ ] Legal/copyright information correct
- [ ] Age rating appropriate
- [ ] Submit for review!

---

## 🎉 **You're Ready!**

Once the production builds complete (ETA: 30 minutes), you can:

1. Test the builds on real devices
2. Prepare screenshots
3. Submit to both stores using EAS CLI
4. Fill in store metadata manually
5. Submit for review

**Good luck with your app store submissions!** 🚀

---

**Last Updated:** October 9, 2025  
**Next Step:** Wait for production builds to complete, then submit!


