# 🔑 Google Service Account Setup Guide

## 🎯 **Purpose**
Create a Google Service Account JSON key to enable EAS automatic submission to Google Play Store.

## 📋 **Step-by-Step Instructions**

### **Step 1: Access Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account (same one used for Play Console)
3. Select your project or create a new one

### **Step 2: Enable Google Play Developer API**
1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Play Developer API"**
3. Click on it and press **"Enable"**

### **Step 3: Create Service Account**
1. Go to **"IAM & Admin"** → **"Service Accounts"**
2. Click **"Create Service Account"**
3. **Service account name:** `241-runners-play-store`
4. **Service account ID:** `241-runners-play-store` (auto-generated)
5. **Description:** `Service account for 241 Runners Play Store submissions`
6. Click **"Create and Continue"**

### **Step 4: Assign Roles**
1. In **"Grant this service account access to project"**:
2. Add these roles:
   - **"Editor"** (or **"Service Account User"**)
   - **"Google Play Developer API"** (if available)
3. Click **"Continue"**
4. Click **"Done"**

### **Step 5: Create JSON Key**
1. Find your service account in the list
2. Click on the service account name
3. Go to **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. **Download the JSON file** (keep it secure!)

### **Step 6: Grant Play Console Access**
1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app **"241 Runners"**
3. Go to **"Setup"** → **"API access"**
4. Find your service account (it should appear automatically)
5. Click **"Grant Access"**
6. Grant these permissions:
   - ✅ **View app information and download bulk reports**
   - ✅ **Create, edit and delete draft apps**
   - ✅ **Release apps in testing tracks**
   - ✅ **Release apps to production**
7. Click **"Apply"**

### **Step 7: Save JSON Key**
1. **Rename the downloaded file** to: `google-service-account.json`
2. **Place it in your project root** (`/Users/marcusbrown/241RA-mobile/`)
3. **Add to .gitignore** (IMPORTANT - never commit this file!)

---

## 🔒 **Security Best Practices**

### **File Protection:**
```bash
# Set proper permissions (readable only by you)
chmod 600 google-service-account.json
```

### **Add to .gitignore:**
```bash
echo "google-service-account.json" >> .gitignore
```

### **Environment Variables (Alternative):**
Instead of storing the file, you can use environment variables:
```bash
# Set environment variable
export GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}'
```

---

## ✅ **Verification Checklist**

Before proceeding with EAS submission:

- [ ] Service account created in Google Cloud Console
- [ ] Google Play Developer API enabled
- [ ] JSON key downloaded and renamed to `google-service-account.json`
- [ ] JSON file placed in project root directory
- [ ] Service account granted access in Play Console
- [ ] File permissions set to 600 (secure)
- [ ] File added to .gitignore

---

## 🚀 **After Setup**

Once you have the JSON key:

### **Test the Setup:**
```bash
# Verify the file exists
ls -la google-service-account.json

# Test EAS submission
npx eas submit --platform android --latest
```

### **Expected Result:**
- EAS will automatically detect the JSON key
- Upload your .aab file to Play Console
- Submit for review

---

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **"Service account not found"**
   - Ensure service account is created in the same Google account as Play Console

2. **"Insufficient permissions"**
   - Grant proper roles in Google Cloud Console
   - Grant access in Play Console API access settings

3. **"API not enabled"**
   - Enable Google Play Developer API in Google Cloud Console

4. **"JSON file not found"**
   - Ensure file is named exactly `google-service-account.json`
   - Ensure file is in project root directory

---

## 📞 **Need Help?**

- **Google Cloud Console Help:** https://cloud.google.com/docs
- **Play Console API Help:** https://developers.google.com/android-publisher
- **EAS Submit Help:** https://docs.expo.dev/submit/classic-services/

---

## 🎯 **Expected Timeline**

- **Setup time:** 10-15 minutes
- **EAS submission:** 2-5 minutes
- **Play Store review:** 1-2 days
- **Result:** App live on Play Store! 🎉

