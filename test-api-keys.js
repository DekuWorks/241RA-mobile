#!/usr/bin/env node

/**
 * 241RA Mobile - API Keys Test Script
 * This script tests if your API keys are properly configured
 */

import https from 'https';
import fs from 'fs';
// path and fileURLToPath imports removed as they're not used

console.log('🔑 241RA Mobile - API Keys Test');
console.log('================================');
console.log('');

// Load environment variables
// dotenv import replaced with ES6 import at top

// Test results
const results = {
  googleMaps: { status: 'pending', message: '' },
  sentry: { status: 'pending', message: '' },
  supabase: { status: 'pending', message: '' },
  envFile: { status: 'pending', message: '' },
};

// Test 1: Check .env file
function testEnvFile() {
  console.log('📄 Testing .env file...');

  if (!fs.existsSync('.env')) {
    results.envFile = { status: 'error', message: '.env file not found' };
    console.log('   ❌ .env file not found');
    console.log('   💡 Copy env.template to .env and add your API keys');
    return;
  }

  const envContent = fs.readFileSync('.env', 'utf8');
  const hasApiUrl = envContent.includes('EXPO_PUBLIC_API_URL');
  const hasGoogleMaps = envContent.includes('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
  const hasSentry = envContent.includes('EXPO_PUBLIC_SENTRY_DSN');

  if (hasApiUrl && hasGoogleMaps && hasSentry) {
    results.envFile = { status: 'success', message: 'All required variables found' };
    console.log('   ✅ .env file contains all required variables');
  } else {
    results.envFile = { status: 'warning', message: 'Some variables missing' };
    console.log('   ⚠️  .env file missing some variables');
  }
}

// Test 2: Test Google Maps API Key
function testGoogleMaps() {
  console.log('🗺️  Testing Google Maps API Key...');

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    results.googleMaps = { status: 'error', message: 'API key not configured' };
    console.log('   ❌ Google Maps API key not configured');
    return;
  }

  // Test with a simple geocoding request
  const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=New+York&key=${apiKey}`;

  https
    .get(testUrl, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.status === 'OK') {
            results.googleMaps = { status: 'success', message: 'API key is valid' };
            console.log('   ✅ Google Maps API key is valid');
          } else {
            results.googleMaps = { status: 'error', message: `API error: ${response.status}` };
            console.log(`   ❌ Google Maps API error: ${response.status}`);
          }
        } catch {
          results.googleMaps = { status: 'error', message: 'Invalid response' };
          console.log('   ❌ Invalid response from Google Maps API');
        }
        printSummary();
      });
    })
    .on('error', () => {
      results.googleMaps = { status: 'error', message: 'Network error' };
      console.log('   ❌ Network error testing Google Maps API');
      printSummary();
    });
}

// Test 3: Test Sentry DSN
function testSentry() {
  console.log('🐛 Testing Sentry DSN...');

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn || dsn === 'your_sentry_dsn_here') {
    results.sentry = { status: 'error', message: 'DSN not configured' };
    console.log('   ❌ Sentry DSN not configured');
    return;
  }

  // Basic DSN format validation
  const dsnRegex = /^https:\/\/[a-f0-9]+@[a-z0-9.-]+\.ingest\.sentry\.io\/[0-9]+$/;

  if (dsnRegex.test(dsn)) {
    results.sentry = { status: 'success', message: 'DSN format is valid' };
    console.log('   ✅ Sentry DSN format is valid');
  } else {
    results.sentry = { status: 'error', message: 'Invalid DSN format' };
    console.log('   ❌ Sentry DSN format is invalid');
  }
}

// Test 4: Test Supabase Configuration
function testSupabase() {
  console.log('⚡ Testing Supabase Configuration...');

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    results.supabase = { status: 'warning', message: 'Optional — not configured' };
    console.log('   ⚠️  Supabase not configured (optional)');
    return;
  }

  if (url.startsWith('https://') && url.includes('.supabase.co') && anonKey.length > 20) {
    results.supabase = { status: 'success', message: 'URL and anon key present' };
    console.log('   ✅ Supabase URL and anon key configured');
  } else {
    results.supabase = { status: 'error', message: 'Invalid Supabase config' };
    console.log('   ❌ Supabase configuration looks invalid');
  }
}

// Print summary
function printSummary() {
  console.log('');
  console.log('📊 Test Summary');
  console.log('===============');

  const tests = [
    { name: 'Environment File', result: results.envFile },
    { name: 'Google Maps API', result: results.googleMaps },
    { name: 'Sentry DSN', result: results.sentry },
    { name: 'Supabase Config', result: results.supabase },
  ];

  tests.forEach(test => {
    const icon =
      test.result.status === 'success' ? '✅' : test.result.status === 'warning' ? '⚠️' : '❌';
    console.log(`   ${icon} ${test.name}: ${test.result.message}`);
  });

  console.log('');

  const allSuccess = tests.every(test => test.result.status === 'success');
  const hasErrors = tests.some(test => test.result.status === 'error');

  if (allSuccess) {
    console.log('🎉 All tests passed! Your API keys are properly configured.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Run: npm run start');
    console.log('   2. Test the app on a device');
    console.log('   3. Create a preview build: eas build --profile preview');
  } else if (hasErrors) {
    console.log('❌ Some tests failed. Please fix the issues above.');
    console.log('');
    console.log('📚 For help, see: API_KEYS_SETUP.md');
  } else {
    console.log('⚠️  Some warnings found. Review the issues above.');
  }

  console.log('');
}

// Run tests
async function runTests() {
  testEnvFile();
  testGoogleMaps();
  testSentry();
  testSupabase();

  // Wait a bit for async tests to complete
  setTimeout(() => {
    if (results.googleMaps.status === 'pending') {
      results.googleMaps = { status: 'error', message: 'Test timeout' };
      printSummary();
    }
  }, 10000);
}

// Check if dotenv is available
try {
  await import('dotenv');
} catch {
  console.log('❌ dotenv package not found. Installing...');
  console.log('   Run: npm install dotenv');
  process.exit(1);
}

runTests();
