# Integration Plan with Main Repository Backend

## 🎯 Current Situation

### ✅ **Main Repository Already Has:**
- **Complete Backend API**: https://241runners-api-v2.azurewebsites.net
- **All Critical Controllers**: Devices, Auth Extensions, Cases Extensions, Admin Portal
- **Database Schema**: Users, Cases, Sightings, Devices, RunnerProfiles
- **Authentication System**: Google OAuth, 2FA, JWT tokens
- **Admin Portal**: Complete dashboard and management system
- **Push Notifications**: Device registration and FCM integration

### ✅ **Mobile App Has:**
- **Complete Frontend**: All screens and functionality
- **API Integration**: Services calling the correct endpoints
- **Authentication**: Login, register, 2FA, OAuth
- **Real-time Features**: SignalR integration
- **Platform Optimization**: Android/iOS specific code

## 🔗 **Integration Status Analysis**

### **✅ Already Connected:**
1. **Authentication**: Mobile app → `/api/v1/auth/*` → Main repo backend
2. **Device Registration**: Mobile app → `/api/v1/devices` → Main repo backend
3. **Admin Portal**: Mobile app → `/api/v1/Admin/*` → Main repo backend
4. **Runner Profiles**: Mobile app → `/api/v1/runner-profile/*` → Main repo backend
5. **Push Notifications**: Mobile app → FCM → Main repo backend

### **⚠️ Potential Gaps to Check:**
1. **Cases Management**: Mobile app calls `/api/v1/cases/*` - verify these exist
2. **User Profile**: Mobile app calls `/api/v1/users/*` - verify these exist
3. **SignalR Hubs**: Mobile app connects to `/hubs/admin` and `/hubs/alerts`
4. **Image Upload**: Mobile app uploads to `/api/v1/upload/image`

## 🚀 **Integration Steps**

### **Step 1: Verify API Endpoint Compatibility**

Let me check what endpoints your mobile app is calling vs what the main repo provides:

#### **Mobile App API Calls:**
```typescript
// From your services:
- POST /api/v1/auth/login
- POST /api/v1/auth/register
- GET /api/v1/users/profile
- GET /api/v1/cases
- GET /api/v1/cases/{id}
- POST /api/v1/cases
- GET /api/v1/Admin/stats
- POST /api/v1/devices
- DELETE /api/v1/devices
```

#### **Main Repo Endpoints:**
```csharp
// From implementation summary:
- POST /api/devices ✅
- DELETE /api/devices ✅
- POST /api/auth/google ✅
- POST /api/auth/2fa/enable ✅
- POST /api/auth/2fa/disable ✅
- POST /api/auth/2fa/verify ✅
- GET /api/cases/nearby ✅
- GET /api/cases/{id}/sightings ✅
- POST /api/sightings ✅
- POST /api/upload/image ✅
- GET /api/Admin/stats ✅
```

### **Step 2: Identify Missing Endpoints**

Based on the analysis, we need to add these endpoints to the main repo:

#### **Authentication Endpoints:**
```csharp
// Missing from main repo:
- POST /api/v1/auth/login
- POST /api/v1/auth/register
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
```

#### **User Management Endpoints:**
```csharp
// Missing from main repo:
- GET /api/v1/users/profile
- PUT /api/v1/users/profile
- DELETE /api/v1/users/account
- POST /api/v1/users/change-password
```

#### **Cases Management Endpoints:**
```csharp
// Missing from main repo:
- GET /api/v1/cases (with filters)
- GET /api/v1/cases/{id}
- POST /api/v1/cases
- PUT /api/v1/cases/{id}
- DELETE /api/v1/cases/{id}
```

### **Step 3: Update Mobile App API Calls**

Some endpoints might need to be updated to match the main repo:

#### **Current Mobile App Calls:**
```typescript
// These might need updating:
- /api/v1/auth/login → /api/auth/login
- /api/v1/auth/register → /api/auth/register
- /api/v1/devices → /api/devices (already correct)
- /api/v1/Admin/stats → /api/Admin/stats (already correct)
```

## 📋 **Action Plan**

### **Option A: Update Main Repo Backend (Recommended)**
1. Add missing endpoints to the main repository
2. Ensure all mobile app API calls work
3. Test integration end-to-end

### **Option B: Update Mobile App API Calls**
1. Update mobile app services to match existing backend
2. Modify endpoint URLs in ApiClient
3. Test all functionality

### **Option C: Hybrid Approach**
1. Add critical missing endpoints to main repo
2. Update mobile app for non-critical endpoints
3. Ensure full functionality

## 🔧 **Immediate Next Steps**

### **1. Test Current Integration**
```bash
# Test if current endpoints work:
curl -X POST https://241runners-api-v2.azurewebsites.net/api/devices
curl -X GET https://241runners-api-v2.azurewebsites.net/api/Admin/stats
```

### **2. Identify Critical Missing Endpoints**
Based on mobile app usage, prioritize:
1. **Authentication endpoints** (login, register)
2. **User profile endpoints** (profile management)
3. **Cases endpoints** (core functionality)

### **3. Create Missing Controllers**
Add to main repository:
- `AuthController` with login/register
- `UserController` with profile management
- `CasesController` with full CRUD

## 🎯 **Recommended Approach**

Since the main repository already has most of the infrastructure, I recommend:

1. **Add missing endpoints to main repo** (faster than rewriting mobile app)
2. **Test integration** with existing endpoints
3. **Fill gaps** with specific missing functionality
4. **Deploy and test** end-to-end

This approach leverages the existing backend infrastructure while ensuring full mobile app functionality.

Would you like me to:
1. **Create the missing controllers** for the main repository?
2. **Update the mobile app** to match existing endpoints?
3. **Test the current integration** first?
