# Apple App Store Review Response - Bug Fixes

**Submission ID:** [Your Submission ID]  
**Date:** January 16, 2025  
**Version:** 1.0.1

---

## Response to Apple Review Team

Dear Apple Review Team,

Thank you for your feedback regarding the bugs found during testing. We have identified and fixed both issues you reported:

### **Bug Fix #1: Apple Sign-In Error** ✅

**Issue:** An error occurred when trying to continue with Apple to login.

**Root Cause:** The Apple authentication service was calling an incorrect API endpoint (`/api/v1/auth/oauth/register` instead of `/api/v1/auth/oauth/apple`).

**Fix Applied:**
- Updated the `loginWithApple` method in `/src/services/auth.ts`
- Changed API endpoint from `/api/v1/auth/oauth/register` to `/api/v1/auth/oauth/apple`
- Simplified the request payload to match the expected backend format

**Code Changes:**
```typescript
// Before (causing error):
const data = await ApiClient.post('/api/v1/auth/oauth/register', { 
  provider: 'apple',
  token: appleToken 
});

// After (fixed):
const data = await ApiClient.post('/api/v1/auth/oauth/apple', { 
  token: appleToken 
});
```

**Testing:** Apple Sign-In now works correctly and successfully authenticates users.

### **Bug Fix #2: Create Runner Profile Button Not Working** ✅

**Issue:** No action occurred when tapping "Create Runner Profile" when logged in as a general user.

**Root Cause:** The button was calling the wrong handler function (`setShowCreateRunnerForm(true)` instead of `handleCreateRunnerProfile()`).

**Fix Applied:**
- Updated the "Create Runner Profile" button in `/src/app/profile.tsx`
- Changed button handler from `setShowCreateRunnerForm(true)` to `handleCreateRunnerProfile`
- Fixed type mismatches in the runner profile screen (`/src/app/portal/runner-profile.tsx`)
- Updated service calls to use the correct `EnhancedRunnerProfileService` methods

**Code Changes:**
```typescript
// Before (not working):
<TouchableOpacity 
  style={styles.createRunnerButtonCentered}
  onPress={() => setShowCreateRunnerForm(true)}
>

// After (fixed):
<TouchableOpacity 
  style={styles.createRunnerButtonCentered}
  onPress={handleCreateRunnerProfile}
>
```

**Testing:** The "Create Runner Profile" button now correctly navigates to the runner profile creation screen.

### **Additional Improvements Made:**

1. **Type Safety:** Fixed all TypeScript type mismatches in the runner profile components
2. **Service Integration:** Ensured all service calls use the correct enhanced runner profile service methods
3. **Error Handling:** Maintained proper error handling throughout the authentication flow

### **Testing Instructions for Apple Review Team:**

**Test Apple Sign-In:**
1. Launch the app
2. Tap "Continue with Apple" on the login screen
3. Complete Apple ID authentication
4. Verify successful login and navigation to profile screen

**Test Create Runner Profile:**
1. Log in as a general user (not admin)
2. Navigate to Profile screen
3. Scroll down to find "Create Runner Profile" button
4. Tap the button
5. Verify navigation to runner profile creation screen

### **Previous Requirements Still Met:**

All previously implemented requirements remain functional:
- ✅ Apple Sign-In integration (now working correctly)
- ✅ App Tracking Transparency (ATT) framework
- ✅ Account deletion functionality
- ✅ Privacy information accuracy
- ✅ Support URL accessibility
- ✅ Age rating compliance

---

**We believe both reported bugs have been resolved. The app should now function correctly for Apple Sign-In authentication and runner profile creation. Please let us know if you need any additional information or if you encounter any other issues during testing.**

Thank you for your review and consideration.

Best regards,  
241 Runners Development Team  
Email: ghxstyyfps@gmail.com

---

## Technical Summary

**Files Modified:**
- `src/services/auth.ts` - Fixed Apple Sign-In API endpoint
- `src/app/profile.tsx` - Fixed Create Runner Profile button handler
- `src/app/portal/runner-profile.tsx` - Fixed type mismatches and service calls

**Build Status:** Ready for resubmission  
**Version:** 1.0.1 (bug fixes only)
