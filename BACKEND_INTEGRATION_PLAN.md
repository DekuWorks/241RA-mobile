# Backend Integration Plan with Main Repository

## 🎯 Current Situation Analysis

### ✅ **Main Repository Already Has:**
- **Complete Backend API**: All controllers, services, and models
- **Database Schema**: Full Entity Framework setup with all entities
- **Authentication System**: JWT-based auth with all endpoints
- **Real-time Features**: SignalR hubs and services
- **Admin Portal**: Complete admin functionality
- **Push Notifications**: Firebase integration
- **Security**: Comprehensive security services and validation

### 📱 **Mobile App Status:**
- **Frontend**: Complete and ready
- **API Integration**: Services calling endpoints
- **Authentication**: Login/register flow implemented
- **Real-time**: SignalR integration ready

## 🔄 **Integration Strategy**

### **Option 1: Use Main Repository Backend (Recommended)**
- **Pros**: No duplication, maintained codebase, all features available
- **Cons**: Need to coordinate deployments
- **Database**: Keep schema in main repo, mobile app connects to same database

### **Option 2: Sync Backend Code**
- **Pros**: Independent deployments
- **Cons**: Code duplication, maintenance overhead
- **Database**: Could use separate database or shared

## 🎯 **Recommended Approach: Option 1**

### **Database Schema Decision:**
**✅ Keep database schema in main repository** - This ensures:
- Single source of truth for data structure
- Consistent schema across web and mobile
- Easier maintenance and updates
- Shared user accounts and data

### **Implementation Steps:**

#### **1. Remove Duplicate Backend Code**
```bash
# Remove our duplicate backend implementation
rm -rf backend/
```

#### **2. Update Mobile App Configuration**
- Point mobile app to main repository's API
- Ensure all endpoint URLs match main repo structure
- Update authentication flow if needed

#### **3. Verify API Endpoint Compatibility**
- Test all mobile app API calls against main repo endpoints
- Update any mismatched endpoint URLs
- Ensure request/response formats match

#### **4. Database Connection**
- Mobile app connects to same database as static site
- No separate database needed
- Users, cases, and data shared between web and mobile

## 📋 **API Endpoints Available in Main Repository**

Based on the controller files found, the main repository provides:

### **Authentication (`/api/v1/auth`)**
- `POST /login` - User login
- `POST /register` - User registration  
- `POST /refresh` - Token refresh
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset
- `POST /verify-email` - Email verification
- `POST /2fa/enable` - Enable 2FA
- `POST /2fa/disable` - Disable 2FA
- `POST /2fa/verify` - Verify 2FA code

### **User Management (`/api/v1/users`)**
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `DELETE /account` - Delete account
- `POST /change-password` - Change password

### **Cases (`/api/v1/cases`)**
- `GET /` - List cases
- `GET /{id}` - Get case details
- `POST /` - Create case
- `PUT /{id}` - Update case
- `DELETE /{id}` - Delete case
- `GET /nearby` - Get nearby cases

### **Runners (`/api/v1/runners`)**
- `GET /` - List runners
- `GET /{id}` - Get runner details
- `POST /` - Create runner profile
- `PUT /{id}` - Update runner profile
- `DELETE /{id}` - Delete runner profile

### **Devices (`/api/v1/devices`)**
- `POST /` - Register device for push notifications
- `DELETE /` - Unregister device
- `GET /` - Get user's devices

### **Admin (`/api/v1/admin`)**
- `GET /stats` - Admin dashboard stats
- `GET /users` - User management
- `GET /cases` - Case management
- `GET /monitoring` - System monitoring

### **Real-time Features**
- SignalR hubs for live updates
- Push notifications via Firebase
- Topic subscriptions

## 🚀 **Next Steps**

### **Immediate Actions:**

1. **Remove Duplicate Backend**
   ```bash
   rm -rf backend/
   ```

2. **Update Mobile App API Configuration**
   - Ensure `EXPO_PUBLIC_API_URL` points to main repo API
   - Test authentication flow
   - Verify all endpoints work

3. **Test Integration**
   - Login/register flow
   - Case management
   - Push notifications
   - Real-time updates

4. **Deploy Coordination**
   - Main repo handles backend deployment
   - Mobile app deployment independent
   - Shared database ensures data consistency

### **Benefits of This Approach:**
- ✅ **No Code Duplication** - Single backend codebase
- ✅ **Shared Data** - Users and cases shared between web/mobile
- ✅ **Easier Maintenance** - One backend to maintain
- ✅ **Consistent Features** - Same functionality across platforms
- ✅ **Reduced Complexity** - Simpler deployment and management

## 🔧 **Mobile App Updates Needed**

### **API Endpoint Verification:**
Check that mobile app services call the correct endpoints from main repo:

```typescript
// Verify these match main repo endpoints:
- POST /api/v1/auth/login ✅
- POST /api/v1/auth/register ✅  
- GET /api/v1/users/profile ✅
- GET /api/v1/cases ✅
- POST /api/v1/devices ✅
- GET /api/v1/admin/stats ✅
```

### **Authentication Flow:**
- Ensure JWT token handling matches main repo format
- Verify 2FA flow compatibility
- Test token refresh mechanism

### **Real-time Integration:**
- SignalR hub endpoints match main repo
- Event handling compatible
- Connection management works

## 📊 **Database Schema Decision**

**✅ Recommendation: Keep database schema in main repository**

**Reasons:**
1. **Single Source of Truth** - Schema managed in one place
2. **Shared Data** - Users, cases, and runners shared between web and mobile
3. **Consistency** - Same data structure across platforms
4. **Maintenance** - Easier to update and migrate schema
5. **Deployment** - Simplified deployment process

**Database Connection:**
- Mobile app connects to same database as static site
- No separate mobile database needed
- All data shared and synchronized automatically
