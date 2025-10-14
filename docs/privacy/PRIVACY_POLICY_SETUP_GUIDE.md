# 🔒 Privacy Policy Setup Guide for App Stores

## 📱 **Current Status**
- **Privacy Policy URL**: https://241runnersawareness.org/privacy.html ✅
- **Android Build**: Fresh build in progress (version code 26+)
- **iOS Build**: Fresh build in progress (build number 118+)

## 🎯 **Google Play Store - Privacy Policy Setup**

### **Step 1: Navigate to App Content**
1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app (Account ID: 8485277930267155808)
3. In the left sidebar, look for **"App content"**
4. Click on **"App content"**

### **Step 2: Add Privacy Policy URL**
1. Look for **"Privacy Policy"** section
2. Add the URL: `https://241runnersawareness.org/privacy.html`
3. Click **"Save"**

### **Step 3: Alternative Location (if not in App Content)**
If you don't see "App content", try:
1. Go to **"Store listing"**
2. Look for **"Privacy Policy"** field
3. Add the URL there

## 🍎 **Apple App Store - Privacy Policy Setup**

### **Step 1: Navigate to App Information**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **"App Information"**

### **Step 2: Add Privacy Policy URL**
1. Look for **"Privacy Policy URL"** field
2. Add: `https://241runnersawareness.org/privacy.html`
3. Click **"Save"**

### **Step 3: App Privacy Section**
1. Go to **"App Privacy"** in the left sidebar
2. Complete the privacy questionnaire
3. Declare data collection practices
4. Reference your privacy policy

## 📋 **Privacy Policy Requirements Checklist**

### ✅ **Your Privacy Policy Covers:**
- [x] **Camera Permission** - Explained for photo evidence
- [x] **Location Services** - Explained for incident reporting
- [x] **Data Collection** - Detailed breakdown
- [x] **User Rights** - Access, correction, deletion
- [x] **No Advertising Tracking** - Explicitly stated
- [x] **Apple Compliance** - Guideline 4.8 compliance
- [x] **Contact Information** - Provided

### ✅ **App Store Requirements:**
- [x] **Google Play** - Privacy policy URL ready
- [x] **Apple App Store** - Privacy policy URL ready
- [x] **Data Safety** - Covered in privacy policy
- [x] **User Rights** - Account deletion functionality

## 🚀 **Next Steps**

### **For Google Play Store:**
1. **Wait for new Android build** (version code 26+)
2. **Upload new AAB file** to Google Play Console
3. **Add privacy policy URL** in App Content section
4. **Complete release**

### **For Apple App Store:**
1. **Wait for new iOS build** (build number 118+)
2. **Upload IPA file** to App Store Connect
3. **Add privacy policy URL** in App Information
4. **Fix metadata issues** (Age Rating, iPad screenshots)
5. **Submit for review**

## 📊 **Build Status Monitoring**

### **Check Build Status:**
```bash
# Check Android builds
npx eas-cli build:list --platform=android --limit=3

# Check iOS builds  
npx eas-cli build:list --platform=ios --limit=3
```

### **Expected Results:**
- **Android**: Version code 26+ (should resolve version conflicts)
- **iOS**: Build number 118+ (should resolve provisioning issues)

## 🔧 **Troubleshooting**

### **If Version Code Still Conflicts:**
1. Check Google Play Console for existing releases
2. Look in "Production" section for existing version codes
3. Use a much higher version code (e.g., 100+)

### **If Privacy Policy Not Found:**
1. Try "Store listing" section in Google Play Console
2. Try "Policy" section in Google Play Console
3. Look for "Privacy Policy" field in app settings

## 📞 **Support Resources**

### **Google Play Console:**
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Privacy Policy Requirements](https://support.google.com/googleplay/android-developer/answer/9859455)

### **Apple App Store Connect:**
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [App Privacy Requirements](https://developer.apple.com/app-store/app-privacy/)

---

**Last Updated**: October 12, 2025
**Status**: Fresh builds in progress, privacy policies ready
