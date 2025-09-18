# 241Runners Mobile - Deployment Checklist

## Pre-Deployment Checklist

### ✅ Build Configuration

- [x] EAS Build configured
- [x] Apple Developer account set up
- [x] Bundle IDs configured (iOS: org.241runners.app, Android: org.earth241runners.app)
- [x] Push notification certificates created
- [x] Dependencies fixed and compatible
- [x] Build profiles configured (preview, production)

### 🔄 Current Build Status

- [x] iOS Preview Build: In Progress
- [x] Android Preview Build: In Queue
- [ ] iOS Preview Build: Completed & Tested
- [ ] Android Preview Build: Completed & Tested

### 📱 App Store Preparation

#### iOS App Store Connect

- [ ] Create app in App Store Connect
- [ ] Upload app icon (1024x1024px)
- [ ] Add app screenshots (iPhone 6.7", 6.5", 5.5")
- [ ] Write app description and metadata
- [ ] Set age rating and content warnings
- [ ] Configure app pricing (Free)
- [ ] Set availability and territories
- [ ] Submit for review

#### Google Play Console

- [ ] Create app in Google Play Console
- [ ] Upload app icon and feature graphic
- [ ] Add app screenshots (Phone, Tablet, 7-inch, 10-inch)
- [ ] Write store listing
- [ ] Set content rating
- [ ] Configure pricing and distribution
- [ ] Upload app bundle (.aab)
- [ ] Submit for review

### 🔧 Technical Configuration

#### Environment Variables

- [x] API URL configured
- [ ] Google Maps API key added
- [ ] Sentry DSN configured (optional)
- [ ] Push notification keys configured

#### Permissions & Privacy

- [x] Camera permission configured
- [x] Location permission configured
- [x] Photo library permission configured
- [x] Push notification permission configured
- [ ] Privacy policy URL added
- [ ] Terms of service URL added

#### App Configuration

- [x] Bundle identifiers set
- [x] App version and build numbers configured
- [x] Splash screen configured
- [x] App icons configured
- [ ] Deep linking configured
- [ ] Associated domains configured

### 🧪 Testing Checklist

#### Functional Testing

- [ ] Login/logout flow
- [ ] Cases listing and search
- [ ] Case detail view
- [ ] Report sighting with camera
- [ ] Report sighting with location
- [ ] Map view functionality
- [ ] Push notifications
- [ ] Offline functionality
- [ ] Profile management
- [ ] 2FA setup and verification

#### Device Testing

- [ ] iPhone (latest iOS)
- [ ] Android (latest version)
- [ ] Different screen sizes
- [ ] Different orientations
- [ ] Network connectivity (WiFi, Cellular)
- [ ] Offline scenarios

#### Performance Testing

- [ ] App launch time
- [ ] Image loading performance
- [ ] Map rendering performance
- [ ] Memory usage
- [ ] Battery usage
- [ ] Network efficiency

### 📋 Production Deployment Steps

#### 1. Final Build

```bash
# Create production builds
eas build --profile production --platform all
```

#### 2. iOS Deployment

```bash
# Submit to App Store
eas submit -p ios --latest
```

#### 3. Android Deployment

```bash
# Submit to Google Play
eas submit -p android --latest
```

### 🔍 Post-Deployment Monitoring

#### Analytics Setup

- [ ] Firebase Analytics (if needed)
- [ ] Crash reporting (Sentry)
- [ ] User engagement tracking
- [ ] Performance monitoring

#### App Store Optimization

- [ ] Monitor download metrics
- [ ] Track user reviews and ratings
- [ ] Monitor crash reports
- [ ] Update app based on feedback

### 🚨 Rollback Plan

#### Emergency Procedures

- [ ] Rollback to previous version
- [ ] Disable app features if needed
- [ ] Communicate with users
- [ ] Fix critical issues quickly

### 📞 Support & Maintenance

#### User Support

- [ ] Support email configured
- [ ] FAQ documentation
- [ ] User guide/tutorial
- [ ] Contact form on website

#### Maintenance Schedule

- [ ] Regular security updates
- [ ] Performance optimizations
- [ ] Feature updates
- [ ] Bug fixes and patches

## Current Status: 🟡 In Progress

**Next Steps:**

1. Wait for preview builds to complete
2. Test builds on physical devices
3. Fix any issues found during testing
4. Create production builds
5. Submit to app stores
6. Monitor for approval and launch

**Estimated Timeline:**

- Preview builds: 30-60 minutes
- Testing and fixes: 1-2 days
- Production builds: 30-60 minutes
- App store review: 1-7 days
- Launch: Ready when approved
