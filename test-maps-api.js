#!/usr/bin/env node

/**
 * Test Google Maps API Key with Static Maps API
 */

import https from 'https';
import fs from 'fs';

console.log('🗺️  Testing Google Maps API Key with Static Maps...');
console.log('===================================================');
console.log('');

// Load environment variables
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
let apiKey = '';

for (const line of lines) {
  if (line.startsWith('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=')) {
    apiKey = line.split('=')[1];
    break;
  }
}

if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
  console.log('❌ Google Maps API key not found in .env file');
  process.exit(1);
}

console.log(`✅ Found API key: ${apiKey.substring(0, 10)}...`);
console.log('');

// Test with Static Maps API (requires fewer permissions)
const testUrl = `https://maps.googleapis.com/maps/api/staticmap?center=New+York&zoom=10&size=400x400&key=${apiKey}`;

console.log('🔄 Testing API key with Google Static Maps API...');

https
  .get(testUrl, res => {
    console.log(`📊 Response status: ${res.statusCode}`);

    if (res.statusCode === 200) {
      console.log('✅ Google Maps API key is working with Static Maps!');
      console.log('   This means your API key is valid and Maps APIs are enabled.');
      console.log('');
      console.log('🎉 Your Google Maps integration should work in the app!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('   1. Run: npm run start');
      console.log('   2. Navigate to the Map screen in your app');
      console.log('   3. The map should load correctly');
      console.log('');
      console.log('💡 Note: If you want to use Geocoding (address search),');
      console.log('   enable the Geocoding API in Google Cloud Console.');
    } else if (res.statusCode === 403) {
      console.log('❌ API access denied');
      console.log('   This usually means:');
      console.log('   - Static Maps API is not enabled');
      console.log('   - Billing is not enabled');
      console.log('   - API key restrictions are too strict');
      console.log('');
      console.log('🔧 Solutions:');
      console.log('   1. Enable Static Maps API in Google Cloud Console');
      console.log('   2. Enable billing on your Google Cloud project');
      console.log('   3. Check API key restrictions');
    } else {
      console.log(`❌ Unexpected response: ${res.statusCode}`);
    }

    // Don't read the response body for static maps (it's an image)
    res.on('data', () => {});
    res.on('end', () => {
      console.log('');
    });
  })
  .on('error', error => {
    console.log('❌ Network error testing Google Maps API');
    console.log(`   Error: ${error.message}`);
  });
