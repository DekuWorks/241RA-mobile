#!/usr/bin/env node

/**
 * Firebase Integration Test Script
 * 
 * This script tests the Firebase integration locally without building the app.
 * Run with: node test-firebase-integration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔥 Testing Firebase Integration...\n');

// Test 1: Check if GoogleService-Info.plist exists
console.log('1. Checking GoogleService-Info.plist...');
const plistPath = path.join(__dirname, 'ios', 'GoogleService-Info.plist');
if (fs.existsSync(plistPath)) {
  console.log('   ✅ GoogleService-Info.plist found');
  
  // Check if it's a valid plist file
  const plistContent = fs.readFileSync(plistPath, 'utf8');
  if (plistContent.includes('<plist version="1.0">') && plistContent.includes('<dict>')) {
    console.log('   ✅ Valid plist format');
  } else {
    console.log('   ❌ Invalid plist format');
  }
} else {
  console.log('   ❌ GoogleService-Info.plist not found');
}

// Test 2: Check Firebase packages in package.json
console.log('\n2. Checking Firebase packages...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredPackages = [
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    '@react-native-firebase/crashlytics'
  ];
  
  requiredPackages.forEach(pkg => {
    if (dependencies[pkg]) {
      console.log(`   ✅ ${pkg} - ${dependencies[pkg]}`);
    } else {
      console.log(`   ❌ ${pkg} - Not installed`);
    }
  });
} else {
  console.log('   ❌ package.json not found');
}

// Test 3: Check app.config.ts for Firebase plugins
console.log('\n3. Checking app.config.ts...');
const appConfigPath = path.join(__dirname, 'app.config.ts');
if (fs.existsSync(appConfigPath)) {
  const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
  
  if (appConfigContent.includes('@react-native-firebase/app')) {
    console.log('   ✅ Firebase app plugin configured');
  } else {
    console.log('   ❌ Firebase app plugin not configured');
  }
  
  if (appConfigContent.includes('@react-native-firebase/messaging')) {
    console.log('   ✅ Firebase messaging plugin configured');
  } else {
    console.log('   ❌ Firebase messaging plugin not configured');
  }
  
  if (appConfigContent.includes('@react-native-firebase/crashlytics')) {
    console.log('   ✅ Firebase crashlytics plugin configured');
  } else {
    console.log('   ❌ Firebase crashlytics plugin not configured');
  }
  
  if (appConfigContent.includes('googleServicesFile')) {
    console.log('   ✅ GoogleServices file reference found');
  } else {
    console.log('   ❌ GoogleServices file reference not found');
  }
} else {
  console.log('   ❌ app.config.ts not found');
}

// Test 4: Check iOS AppDelegate for Firebase configuration
console.log('\n4. Checking iOS AppDelegate...');
const appDelegatePath = path.join(__dirname, 'ios', '241Runners', 'AppDelegate.swift');
if (fs.existsSync(appDelegatePath)) {
  const appDelegateContent = fs.readFileSync(appDelegatePath, 'utf8');
  
  if (appDelegateContent.includes('import FirebaseCore')) {
    console.log('   ✅ FirebaseCore import found');
  } else {
    console.log('   ❌ FirebaseCore import not found');
  }
  
  if (appDelegateContent.includes('FirebaseApp.configure()')) {
    console.log('   ✅ FirebaseApp.configure() found');
  } else {
    console.log('   ❌ FirebaseApp.configure() not found');
  }
} else {
  console.log('   ❌ AppDelegate.swift not found');
}

// Test 5: Check Firebase integration files
console.log('\n5. Checking Firebase integration files...');
const firebaseFiles = [
  'src/lib/crash.ts',
  'src/features/push/registerDeviceToken.ts'
];

firebaseFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} not found`);
  }
});

// Test 6: Check EAS configuration
console.log('\n6. Checking EAS configuration...');
const easJsonPath = path.join(__dirname, 'eas.json');
if (fs.existsSync(easJsonPath)) {
  const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  
  if (easJson.build?.preview?.env?.GOOGLE_SERVICE_INFO_PLIST) {
    console.log('   ✅ GOOGLE_SERVICE_INFO_PLIST environment variable configured');
  } else {
    console.log('   ❌ GOOGLE_SERVICE_INFO_PLIST environment variable not configured');
  }
  
  if (easJson.build?.preview?.env?.EXPO_PUBLIC_ENABLE_CRASH) {
    console.log('   ✅ EXPO_PUBLIC_ENABLE_CRASH environment variable configured');
  } else {
    console.log('   ❌ EXPO_PUBLIC_ENABLE_CRASH environment variable not configured');
  }
} else {
  console.log('   ❌ eas.json not found');
}

console.log('\n🎯 Next Steps:');
console.log('1. Add GOOGLE_SERVICE_INFO_PLIST environment variable in EAS dashboard');
console.log('2. Create /api/devices endpoint in your backend API');
console.log('3. Run: eas build -p ios --profile preview');
console.log('4. Test Crashlytics by triggering a test crash');
console.log('5. Test push notifications by sending a test message');

console.log('\n✨ Firebase integration test completed!');
