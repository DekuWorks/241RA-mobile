# 🚀 iOS Build Commands - Run in Your Terminal

## **Step 1: Login to EAS**
```bash
eas login
```
- **Username:** `dekuworks`
- **Password:** [your password]

## **Step 2: Start iOS Production Build**
```bash
npx eas build --platform ios --profile production
```

## **Step 3: Monitor Build Progress**
```bash
npx eas build:list --limit 5
```

## **Step 4: Check Build Status**
```bash
npx eas build:view [BUILD_ID]
```

---

## 📋 **What to Expect:**

### **During Login:**
- Enter username: `dekuworks`
- Enter password: [your EAS password]
- Should show "Successfully logged in"

### **During Build:**
- Build will take 15-25 minutes
- You'll get a build URL to monitor progress
- Build ID will be provided for tracking

### **Build Completion:**
- You'll get a download link for the .ipa file
- Build will be ready for App Store submission

---

## 🎯 **After Build Completes:**

### **Option 1: Automatic Submission**
```bash
npx eas submit --platform ios --latest
```

### **Option 2: Manual Submission**
1. Download the .ipa file
2. Upload via App Store Connect
3. Complete metadata updates (privacy labels, age rating, screenshots)

---

## 📊 **Expected Timeline:**
- **Build Time:** 15-25 minutes
- **Submission:** 5-10 minutes
- **Apple Review:** 1-3 days
- **Result:** APPROVED! 🎉

---

## 🔧 **If You Have Issues:**

### **Login Problems:**
```bash
eas logout
eas login
```

### **Build Problems:**
```bash
npx eas build --platform ios --profile production --clear-cache
```

### **Check EAS Configuration:**
```bash
cat eas.json
```

---

## ✅ **Ready to Build!**

Your app is ready for submission with all Apple review issues addressed:
- ✅ Apple Sign-In implemented
- ✅ ATT framework implemented  
- ✅ Account deletion implemented
- ✅ Support URL working
- ✅ Privacy labels ready for update
- ✅ Age rating ready for update
- ✅ iPad screenshots ready for update

**Run these commands in your terminal to start the build!** 🚀

