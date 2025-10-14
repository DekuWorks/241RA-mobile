# App Store Connect - Critical Updates Checklist

## 🚨 **IMMEDIATE ACTIONS REQUIRED**

### **1. Privacy Information Update (CRITICAL)**

**Go to:** App Store Connect → Your App → App Privacy

**Current Issue:** App privacy labels indicate tracking data collection that doesn't exist

**Fix Required:**
- ❌ Remove "User ID" from data collection
- ❌ Remove "Physical Address" from data collection  
- ❌ Remove "Phone Number" from data collection
- ❌ Remove "Contacts (Address Book)" from data collection
- ❌ Remove "Demographics (race, religion, etc.)" from data collection
- ❌ Remove "Sensitive Info" from data collection
- ❌ Remove "Other Contact Info" from data collection
- ❌ Remove "Emails or Text Messages" from data collection
- ❌ Remove "Other Diagnostic Data" from data collection

**Keep Only:**
- ✅ Name (for account creation)
- ✅ Email Address (for authentication)
- ✅ Photos or Videos (for sighting reports)
- ✅ Coarse Location (for case location)
- ✅ Precise Location (for sighting reports)
- ✅ Crash Data (for app improvement)

**Data Usage:**
- ✅ App Functionality
- ✅ Analytics (for crash data only)
- ❌ Remove "Advertising or Marketing"
- ❌ Remove "Third-Party Advertising"
- ❌ Remove "Developer Communications"

### **2. Age Rating Update (CRITICAL)**

**Go to:** App Store Connect → Your App → App Information → Age Rating

**Current Issue:** Shows "In-App Controls" but none exist

**Fix Required:**
- ❌ Change "Parental Controls" from "In-App Controls" to **"None"**
- ❌ Change "Age Assurance" from "In-App Controls" to **"None"**

### **3. Support URL Verification (CRITICAL)**

**Go to:** App Store Connect → Your App → App Information

**Current Issue:** https://241runnersawareness.org/support returns error

**Fix Required:**
- ✅ Upload the `support.html` file to your website
- ✅ Ensure URL is accessible without errors
- ✅ Test the URL in a browser

### **4. Screenshots Update (IMPORTANT)**

**Go to:** App Store Connect → Your App → Screenshots

**Current Issue:** iPad screenshots are stretched iPhone images

**Fix Required:**
- ❌ Remove current iPad screenshots
- ✅ Take new screenshots on actual iPad device
- ✅ Upload proper iPad-sized screenshots (1290 × 2796 px for 12.9" iPad Pro)

---

## 📋 **STEP-BY-STEP INSTRUCTIONS**

### **Step 1: Update Privacy Information**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app "241 Runners"
3. Click "App Privacy" in the left sidebar
4. Click "Get Started" or "Edit" if already configured
5. Update data collection to match the corrected list above
6. Save changes

### **Step 2: Update Age Rating**
1. In App Store Connect, go to "App Information"
2. Scroll down to "Age Rating"
3. Click "Edit" next to Age Rating
4. Complete the questionnaire with these answers:
   - **Parental Controls:** None
   - **Age Assurance:** None
   - **Medical/Treatment Information:** None
   - **Unrestricted Web Access:** None
   - **Simulated Gambling:** None
   - **User Generated Content:** None
   - **Frequent/Intense Violence:** None
   - **Frequent/Intense Sexual Content:** None
   - **Frequent/Intense Profanity:** None
   - **Frequent/Intense Mature/Suggestive Themes:** None
   - **Frequent/Intense Realistic Violence:** None
   - **Frequent/Intense Prolonged Violence:** None
   - **Frequent/Intense Horror/Fear Themes:** None
   - **Frequent/Intense Sexual Content or Nudity:** None
   - **Frequent/Intense Alcohol, Tobacco, or Drug Use:** None
   - **Frequent/Intense Simulated Gambling:** None
   - **Frequent/Intense Mature/Suggestive Themes:** None
5. Save changes

### **Step 3: Upload Support Page**
1. Upload the `support.html` file to your website server
2. Ensure it's accessible at https://241runnersawareness.org/support
3. Test the URL in a browser
4. Verify it loads without errors

### **Step 4: Update Screenshots**
1. Build and install your app on an actual iPad device
2. Take screenshots of key app screens:
   - Login screen (showing Apple Sign-In button)
   - Home/Dashboard
   - Case details
   - Profile screen (showing Delete Account option)
   - Report sighting screen
3. Go to App Store Connect → Screenshots
4. Upload new iPad screenshots (remove old ones first)
5. Ensure proper dimensions (1290 × 2796 px for 12.9" iPad Pro)

---

## ✅ **VERIFICATION CHECKLIST**

Before responding to Apple, verify:

- [ ] Privacy information updated (no tracking data listed)
- [ ] Age rating shows "None" for Parental Controls and Age Assurance
- [ ] Support URL loads correctly: https://241runnersawareness.org/support
- [ ] New iPad screenshots uploaded
- [ ] All changes saved in App Store Connect

---

## 📞 **RESPOND TO APPLE**

After completing all updates:

1. Go to App Store Connect → Your App → Resolution Center
2. Click "Reply" to the rejection message
3. Copy and paste the response from `APPLE_REVIEW_RESPONSE.md`
4. Submit your response

---

## 🎯 **EXPECTED OUTCOME**

After these updates and your response to Apple:
- ✅ Apple Sign-In requirement satisfied (already implemented)
- ✅ ATT requirement satisfied (already implemented)  
- ✅ Account deletion requirement satisfied (already implemented)
- ✅ Privacy information corrected (metadata fix)
- ✅ Support URL functional (website fix)
- ✅ Age rating corrected (metadata fix)
- ✅ Screenshots updated (content fix)

**Your app should be approved on resubmission!** 🚀

