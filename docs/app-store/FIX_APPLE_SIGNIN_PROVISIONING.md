# 🔧 Fix Apple Sign-In Provisioning Profile Issue

## Problem
The iOS production build is failing because the provisioning profile doesn't include the **Sign in with Apple** capability.

**Error:**
```
Provisioning profile doesn't support the Sign in with Apple capability.
Provisioning profile doesn't include the com.apple.developer.applesignin entitlement.
```

## Solution: Regenerate Provisioning Profile with Apple Sign-In

### **Option 1: Use EAS CLI to Regenerate (Recommended)**

```bash
# Delete the old provisioning profile and certificates
npx eas-cli credentials --platform ios

# Then select:
# 1. "Select a build profile" → production
# 2. "Provisioning Profile" → "Remove Provisioning Profile"
# 3. Exit and rebuild - EAS will auto-generate a new profile with all capabilities
```

### **Option 2: Manual Fix via Apple Developer Portal**

1. **Go to Apple Developer Portal:**
   ```
   https://developer.apple.com/account/resources/profiles/list
   ```

2. **Find your provisioning profile:**
   - Look for `org.runners241.app` App Store profile
   - Click on it

3. **Edit the profile:**
   - Click "Edit"
   - Make sure **"Sign in with Apple"** is checked under App Services
   - Click "Generate"
   - Download the new profile

4. **Upload to EAS:**
   ```bash
   npx eas-cli credentials --platform ios
   # Select "Upload Provisioning Profile"
   # Upload the downloaded profile
   ```

### **Option 3: Force EAS to Regenerate (Fastest)**

```bash
# This will force EAS to regenerate everything with current capabilities
npx eas-cli build --profile production --platform ios --clear-credentials
```

**Warning:** This will require you to re-configure credentials, but ensures everything is fresh.

## Recommended Approach

Try **Option 1 first** (it's the cleanest). If that doesn't work, use **Option 3**.

### Step-by-Step for Option 1:

```bash
# Step 1: Access credentials
npx eas-cli credentials --platform ios

# Step 2: Remove old profile
# Navigate: production → Provisioning Profile → Remove

# Step 3: Rebuild (will auto-generate new profile)
npx eas-cli build --profile production --platform ios
```

## Why This Happened

The provisioning profile was created **before** we enabled Apple Sign-In in the app. When you add new capabilities (like Apple Sign-In), you need to regenerate the provisioning profile to include those capabilities.

## Verification

After regenerating, the build logs should show:
```
✓ Provisioning profile supports Sign in with Apple
✓ All entitlements are included
```

## Alternative: Disable Apple Sign-In Temporarily

If you want to get the app submitted ASAP without Apple Sign-In (not recommended):

1. Remove Apple Sign-In from `app.config.ts`:
   ```typescript
   // Remove this line:
   'expo-apple-authentication',
   ```

2. Comment out Apple Sign-In in `ios/241Runners/241Runners.entitlements`:
   ```xml
   <!-- <key>com.apple.developer.applesignin</key>
   <array>
     <string>Default</string>
   </array> -->
   ```

**Not recommended** because Apple's review specifically requires Apple Sign-In when you have Google Sign-In.


