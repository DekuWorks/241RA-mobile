#!/usr/bin/env node

/**
 * Simple Google Maps API Key Test
 */

import https from 'https';
import fs from 'fs';

console.log('🗺️  Testing Google Maps API Key...');
console.log('===================================');
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
  console.log('   Please add your API key to the .env file');
  process.exit(1);
}

console.log(`✅ Found API key: ${apiKey.substring(0, 10)}...`);
console.log('');

// Test the API key with a simple geocoding request
const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=New+York&key=${apiKey}`;

console.log('🔄 Testing API key with Google Maps Geocoding API...');

https.get(testUrl, (res) => {
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.status === 'OK') {
        console.log('✅ Google Maps API key is working!');
        console.log(`   Found ${response.results.length} results for "New York"`);
        console.log(`   First result: ${response.results[0].formatted_address}`);
        console.log('');
        console.log('🎉 Your Google Maps integration is ready!');
        console.log('');
        console.log('📋 Next steps:');
        console.log('   1. Run: npm run start');
        console.log('   2. Navigate to the Map screen in your app');
        console.log('   3. Verify the map loads correctly');
      } else {
        console.log(`❌ Google Maps API error: ${response.status}`);
        if (response.error_message) {
          console.log(`   Error: ${response.error_message}`);
        }
        console.log('');
        console.log('🔧 Possible solutions:');
        console.log('   - Check if the API key is correct');
        console.log('   - Verify that Geocoding API is enabled');
        console.log('   - Check if billing is enabled on your Google Cloud project');
        console.log('   - Verify API key restrictions (if any)');
      }
    } catch (error) {
      console.log('❌ Failed to parse response from Google Maps API');
      console.log(`   Error: ${error.message}`);
    }
  });
}).on('error', (error) => {
  console.log('❌ Network error testing Google Maps API');
  console.log(`   Error: ${error.message}`);
});
