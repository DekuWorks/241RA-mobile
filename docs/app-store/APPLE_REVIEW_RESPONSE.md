# Apple App Store Review Response

**Submission ID:** 443eb6c7-b22a-4aff-9a12-a64c29d98231  
**Date:** October 10, 2025  
**Version:** 1.0.0

---

## Response to Apple Review Team

Dear Apple Review Team,

Thank you for your feedback on our app submission. We have addressed all the issues raised in your review. Here's a detailed explanation of how each requirement has been implemented:

### **Guideline 4.8 - Design - Login Services** ✅

**Apple Sign-In is already fully implemented and available in our app.**

**Location:** Login screen - users can tap "Continue with Apple" button

**Implementation Details:**
- Apple Sign-In button is prominently displayed on the login screen
- Full integration with Apple Authentication framework
- Proper entitlements configured (`com.apple.developer.applesignin`)
- Meets all three requirements:
  - ✅ Limits data collection to name and email address only
  - ✅ Allows users to keep email address private via Apple's privacy features
  - ✅ Does not collect interactions for advertising purposes

**How to Test:**
1. Open the app
2. On the login screen, tap "Continue with Apple"
3. Complete Apple ID authentication
4. User will be signed in and redirected to the appropriate screen

### **Guideline 5.1.2 - Legal - Privacy - Data Use and Sharing** ✅

**App Tracking Transparency (ATT) framework is fully implemented.**

**Location:** Requested automatically on app launch

**Implementation Details:**
- ATT permission request is shown during app initialization
- Includes explanatory dialog before system permission request
- Proper handling of user's tracking preferences
- Respects user's choice regardless of selection

**How to Test:**
1. Install and launch the app
2. You will see an explanation dialog: "Help Us Improve 241Runners"
3. System ATT permission request will appear
4. App respects user's choice (Allow/Ask App Not to Track)

### **Guideline 5.1.1(v) - Data Collection and Storage** ✅

**Account deletion functionality is fully implemented.**

**Location:** Profile screen - "Delete Account" button

**Implementation Details:**
- Clear "Delete Account" button in user profile
- Comprehensive warning dialog explaining permanent nature
- Backend API integration for complete account removal
- Permanent deletion (not just deactivation)

**How to Test:**
1. Sign in to the app
2. Go to Profile screen
3. Scroll down to find "Delete Account" button
4. Tap the button to see confirmation dialog
5. Confirm deletion to permanently remove account

### **App Store Connect Metadata Updates** ✅

We have updated our App Store Connect settings:

1. **Privacy Information:** Updated to accurately reflect our app's data collection practices
2. **Age Rating:** Changed "Parental Controls" and "Age Assurance" to "None"
3. **Support URL:** Created functional support page at https://241runnersawareness.org/support

### **Additional Information**

- **Support URL:** https://241runnersawareness.org/support (now functional)
- **Privacy Policy:** https://241runnersawareness.org/privacy-policy
- **App does NOT track users** across other apps or websites
- **All features are fully functional** and ready for testing

### **Testing Instructions**

All three required features can be tested by:
1. Installing the app
2. Following the login flow (Apple Sign-In will be visible)
3. ATT permission request appears on launch
4. Account deletion available in Profile → Delete Account

---

**We believe our app now fully complies with all Apple App Store guidelines. All requested features are implemented and functional. Please let us know if you need any additional information or clarification.**

Thank you for your review and consideration.

Best regards,  
241 Runners Development Team  
Email: ghxstyyfps@gmail.com