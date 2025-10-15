# App Store Connect Updates Checklist

**Before resubmitting to Apple, complete these updates in App Store Connect:**

---

## 🚨 **CRITICAL UPDATES REQUIRED**

### **1. App Description Update** 
**Location:** App Store Connect → Your App → App Information → Description

**Current Issue:** Contains test credentials and irrelevant information

**Action Required:**
- ❌ Remove: "Test account credentials provided above"
- ❌ Remove: "The app uses location services for nearby alerts and camera for incident reporting"

**New Description (Copy & Paste):**
```
241 Runners is a community-driven missing person awareness app that helps bring people home safely. View active missing person cases, report sightings with photos and location data, and receive real-time updates about cases in your area. Join our community of concerned citizens working together to help law enforcement and families find missing persons.

Key Features:
• View active missing person cases
• Report sightings with photos and location data
• Receive real-time case updates
• Community-driven awareness platform
• Secure authentication with Apple Sign-In and Google Sign-In
• Admin portal for case management

Help make a difference in your community by staying informed and reporting any relevant information to help bring missing persons home safely.
```

### **2. Age Rating Update**
**Location:** App Store Connect → Your App → App Information → Age Rating

**Current Issue:** Shows "In-App Controls" for Parental Controls and Age Assurance

**Action Required:**
- ❌ Change "Parental Controls" from "In-App Controls" to **"None"**
- ❌ Change "Age Assurance" from "In-App Controls" to **"None"**

**Steps:**
1. Click "Edit" next to Age Rating
2. Answer the questionnaire with "None" for Parental Controls and Age Assurance
3. Save changes

### **3. Screenshots Update**
**Location:** App Store Connect → Your App → Screenshots

**Current Issue:** 6.7-inch iPhone screenshots don't show actual app usage

**Action Required:**
- ❌ Remove current 6.7-inch iPhone screenshots
- ✅ Upload new screenshots showing actual app functionality

**Required Screenshots (6.7-inch iPhone):**
1. **Login Screen** - Shows Apple Sign-In and Google Sign-In buttons
2. **Home Screen** - Shows active missing person cases
3. **Case Details** - Shows case information and "Report Sighting" button
4. **Sighting Report Form** - Shows the reporting interface
5. **Profile Screen** - Shows user profile and "Create Runner Profile" button
6. **Admin Portal** - Shows admin dashboard (if applicable)

**Screenshot Requirements:**
- Resolution: 1290 × 2796 pixels (6.7-inch iPhone)
- Must show actual app content, not placeholder images
- Should highlight core functionality and value proposition

---

## 📱 **SCREENSHOT GUIDELINES**

### **What to Include:**
- ✅ Real app screens with actual content
- ✅ Login screen showing authentication options
- ✅ Home screen with case listings
- ✅ Case details with sighting reporting
- ✅ Profile management features
- ✅ Clean, professional appearance

### **What to Avoid:**
- ❌ Placeholder or demo content
- ❌ Stretched or distorted images
- ❌ Screenshots that don't match current app version
- ❌ Generic or stock images

---

## 🔧 **TECHNICAL NOTES**

### **Build Information:**
- **Version:** 1.0.1
- **Build Number:** Auto-incremented
- **Platform:** iOS
- **Bundle ID:** org.runners241.app

### **Fixed Issues in This Build:**
- ✅ Google Sign-In crash resolved
- ✅ Apple Sign-In error fixed
- ✅ Create Runner Profile button working
- ✅ Enhanced error handling and logging
- ✅ Platform-specific optimizations

---

## ✅ **VERIFICATION CHECKLIST**

Before submitting to Apple, verify:

- [ ] App description updated (test credentials removed)
- [ ] Age rating updated (Parental Controls and Age Assurance set to "None")
- [ ] New 6.7-inch iPhone screenshots uploaded
- [ ] All screenshots show actual app functionality
- [ ] Screenshots match current app version (1.0.1)
- [ ] All changes saved in App Store Connect
- [ ] New build uploaded with fixes

---

## 📞 **RESPOND TO APPLE**

After completing all updates:

1. **Build and Upload:**
   - Build new version with all fixes
   - Upload to App Store Connect

2. **Respond to Review:**
   - Go to App Store Connect → Your App → Resolution Center
   - Click "Reply" to the rejection message
   - Copy and paste the response from `COMPLETE_APP_STORE_RESPONSE.md`
   - Submit your response

---

## 🎯 **EXPECTED OUTCOME**

After completing these updates and responding to Apple:

- ✅ Google Sign-In crash resolved (code fix)
- ✅ Apple Sign-In working correctly (code fix)
- ✅ Create Runner Profile button functional (code fix)
- ✅ Safety incident reporting documented (response)
- ✅ App description cleaned (metadata fix)
- ✅ Age rating corrected (metadata fix)
- ✅ Screenshots updated (content fix)

**Your app should be approved on resubmission!** 🚀

---

## 📋 **QUICK REFERENCE**

**Files to Reference:**
- `COMPLETE_APP_STORE_RESPONSE.md` - Full response to Apple
- `CROSS_PLATFORM_BUG_FIXES.md` - Technical fix details
- `APPLE_REVIEW_RESPONSE_BUG_FIXES.md` - Original bug fix response

**Support Resources:**
- App Store Connect Help: https://developer.apple.com/help/app-store-connect/
- Screenshot Guidelines: https://developer.apple.com/app-store/app-previews/
- Age Rating Guidelines: https://developer.apple.com/app-store/ratings/
