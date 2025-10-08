# 241 Runners API - Backend Implementation Deployment Guide

## 🚀 **IMPLEMENTATION COMPLETE**

This guide provides step-by-step instructions for deploying the runner profile system backend API.

## 📋 **What's Been Implemented**

### **✅ Database Schema**
- `RunnerProfiles` table with all required fields
- `RunnerPhotos` table for photo management
- `PhotoUpdateReminders` table for reminder system
- `NotificationSettings` table for user preferences
- Proper indexes and foreign key constraints
- Stored procedures for common operations

### **✅ API Controllers**
- `RunnerProfileController` - Complete CRUD operations
- Photo upload and management endpoints
- Notification settings endpoints
- Photo reminder management endpoints
- Comprehensive error handling and validation

### **✅ Services**
- `RunnerProfileService` - Profile management
- `PhotoService` - Photo upload/delete/management
- `BlobStorageService` - Azure Blob Storage integration
- `PhotoReminderService` - Background reminder processing
- Email and push notification services

### **✅ Data Models**
- Complete Entity Framework models
- DTOs for API communication
- Validation attributes
- Custom exceptions

### **✅ Configuration**
- Dependency injection setup
- CORS configuration for mobile app
- Health checks
- Swagger/OpenAPI documentation
- Database migration support

## 🛠 **Deployment Steps**

### **1. Database Setup**

#### **Option A: SQL Server (Recommended)**
```sql
-- Run the schema script
-- File: backend-implementation/Database/Schema.sql

-- Create database
CREATE DATABASE 241RunnersDB;
GO

USE 241RunnersDB;
GO

-- Run the schema script
-- This will create all tables, indexes, and stored procedures
```

#### **Option B: Azure SQL Database**
```bash
# Connect to Azure SQL Database
# Run the schema script in Azure SQL Database
```

### **2. Azure Blob Storage Setup**

#### **Create Storage Account**
```bash
# Create resource group
az group create --name 241RunnersRG --location eastus

# Create storage account
az storage account create \
  --name 241runnersstorage \
  --resource-group 241RunnersRG \
  --location eastus \
  --sku Standard_LRS

# Create container
az storage container create \
  --name runner-photos \
  --account-name 241runnersstorage
```

#### **Get Connection String**
```bash
# Get connection string
az storage account show-connection-string \
  --name 241runnersstorage \
  --resource-group 241RunnersRG
```

### **3. Application Configuration**

#### **Update appsettings.json**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-server;Database=241RunnersDB;Trusted_Connection=true;",
    "AzureStorage": "DefaultEndpointsProtocol=https;AccountName=241runnersstorage;AccountKey=your-key;EndpointSuffix=core.windows.net"
  }
}
```

#### **Environment Variables**
```bash
# Set environment variables
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__DefaultConnection="your-connection-string"
export ConnectionStrings__AzureStorage="your-azure-storage-connection"
```

### **4. Deploy to Azure App Service**

#### **Create App Service**
```bash
# Create app service plan
az appservice plan create \
  --name 241RunnersPlan \
  --resource-group 241RunnersRG \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --name 241runners-api-v2 \
  --resource-group 241RunnersRG \
  --plan 241RunnersPlan \
  --runtime "DOTNET|6.0"
```

#### **Deploy Application**
```bash
# Deploy using Azure CLI
az webapp deployment source config-zip \
  --name 241runners-api-v2 \
  --resource-group 241RunnersRG \
  --src deployment-package.zip
```

### **5. Configure Application Settings**

#### **In Azure Portal:**
1. Go to App Service → Configuration
2. Add application settings:
   - `ConnectionStrings__DefaultConnection`
   - `ConnectionStrings__AzureStorage`
   - `Email__SmtpServer`
   - `Email__SmtpUsername`
   - `Email__SmtpPassword`
   - `PushNotifications__FirebaseServerKey`

### **6. Database Migration**

#### **Run Migrations**
```bash
# Connect to your App Service
# Run Entity Framework migrations
dotnet ef database update
```

### **7. Test Deployment**

#### **Health Check**
```bash
curl https://241runners-api-v2.azurewebsites.net/health
```

#### **API Documentation**
```bash
# Visit Swagger UI
https://241runners-api-v2.azurewebsites.net/swagger
```

## 🔧 **Configuration Options**

### **Database Options**
- **SQL Server**: Local or Azure SQL Database
- **Connection String**: Update in appsettings.json
- **Migrations**: Automatic on startup

### **File Storage Options**
- **Azure Blob Storage**: Recommended for production
- **Local Storage**: For development/testing
- **CDN**: Optional for performance

### **Email Service Options**
- **SMTP**: Gmail, SendGrid, etc.
- **Azure Communication Services**: For Azure-based solutions
- **SendGrid**: For transactional emails

### **Push Notifications Options**
- **Firebase**: For mobile push notifications
- **Azure Notification Hubs**: For cross-platform notifications
- **OneSignal**: Third-party service

## 📊 **Monitoring and Logging**

### **Application Insights**
```json
{
  "ApplicationInsights": {
    "InstrumentationKey": "your-instrumentation-key"
  }
}
```

### **Health Checks**
- Database connectivity
- Blob storage accessibility
- External service dependencies

### **Logging**
- Console logging for development
- File logging for production
- Structured logging with Serilog

## 🔒 **Security Considerations**

### **Authentication**
- JWT Bearer tokens
- Token expiration and refresh
- Role-based authorization

### **File Upload Security**
- File type validation
- File size limits
- Malware scanning (optional)
- Rate limiting

### **Data Protection**
- Encryption at rest
- Encryption in transit
- GDPR compliance
- Data retention policies

## 🚀 **Performance Optimization**

### **Database**
- Proper indexing
- Query optimization
- Connection pooling
- Caching strategies

### **File Storage**
- CDN integration
- Image optimization
- Compression
- Caching headers

### **API Performance**
- Response compression
- Caching middleware
- Rate limiting
- Load balancing

## 📱 **Mobile App Integration**

### **API Endpoints**
All endpoints are ready for mobile app integration:

```
GET    /api/v1/runner-profile
POST   /api/v1/runner-profile
PUT    /api/v1/runner-profile
DELETE /api/v1/runner-profile
GET    /api/v1/runner-profile/exists
POST   /api/v1/runner-profile/photos
GET    /api/v1/runner-profile/photos
DELETE /api/v1/runner-profile/photos/{photoId}
PUT    /api/v1/runner-profile/photos/{photoId}/primary
GET    /api/v1/runner-profile/notification-settings
PUT    /api/v1/runner-profile/notification-settings
GET    /api/v1/runner-profile/photo-reminders
PUT    /api/v1/runner-profile/photo-reminders/{reminderId}/dismiss
```

### **CORS Configuration**
Mobile app origins are configured:
- `exp://localhost:19000` (Expo development)
- `exp://192.168.1.100:19000` (Expo on local network)
- `https://241runnersawareness.org` (Production website)

## ✅ **Deployment Checklist**

### **Pre-Deployment**
- [ ] Database schema created
- [ ] Azure Blob Storage configured
- [ ] Connection strings updated
- [ ] Environment variables set
- [ ] Email service configured
- [ ] Push notification service configured

### **Deployment**
- [ ] Application deployed to Azure App Service
- [ ] Database migrations run
- [ ] Health checks passing
- [ ] API documentation accessible
- [ ] CORS configuration working

### **Post-Deployment**
- [ ] Mobile app integration tested
- [ ] Photo upload functionality tested
- [ ] Notification system tested
- [ ] Performance monitoring configured
- [ ] Security measures verified

## 🎉 **SUCCESS METRICS**

### **Technical Metrics**
- API response time < 2 seconds
- File upload success rate > 95%
- Database query performance optimized
- Zero critical security vulnerabilities

### **User Experience Metrics**
- Profile creation completion rate > 90%
- Photo upload success rate > 95%
- Notification delivery rate > 98%
- Cross-platform compatibility verified

## 📞 **Support and Maintenance**

### **Monitoring**
- Application Insights for performance monitoring
- Health checks for service availability
- Log analytics for troubleshooting

### **Maintenance**
- Regular database backups
- Storage cleanup for old files
- Security updates and patches
- Performance optimization

## 🚀 **READY FOR PRODUCTION**

The backend implementation is complete and ready for deployment. All necessary components have been implemented:

- ✅ **Database Schema**: Complete with indexes and constraints
- ✅ **API Controllers**: Full CRUD operations for runner profiles
- ✅ **Photo Management**: Upload, delete, and primary photo selection
- ✅ **Notification System**: Email and push notification support
- ✅ **Background Services**: Automated photo reminder processing
- ✅ **Security**: Authentication, authorization, and data validation
- ✅ **Monitoring**: Health checks and logging
- ✅ **Documentation**: Swagger/OpenAPI integration

The mobile app will work seamlessly with this backend implementation once deployed.
