#!/usr/bin/env node

/**
 * External Services Configuration Helper
 * Run this script to get step-by-step instructions for configuring external services
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🔧 241Runners External Services Configuration\n');

const steps = [
  {
    title: 'Google Cloud Console Setup',
    steps: [
      '1. Go to https://console.cloud.google.com/',
      '2. Create a new project or select existing',
      '3. Enable APIs: Google Maps SDK (Android/iOS), Places API, Geocoding API, Google+ API',
      '4. Go to APIs & Services > Credentials',
      '5. Create OAuth 2.0 Client IDs:',
      '   - Web Application (for backend)',
      '   - iOS Application (Bundle ID: org.runners241.app)',
      '   - Android Application (Package: org.runners241.app)',
      '6. Create API Key for Maps (restrict to your bundle IDs)',
    ],
  },
  {
    title: 'Supabase Setup (optional)',
    steps: [
      '1. Go to https://supabase.com/dashboard',
      '2. Create project for 241runners-mobile',
      '3. Copy Project URL → EXPO_PUBLIC_SUPABASE_URL',
      '4. Copy anon/public key → EXPO_PUBLIC_SUPABASE_ANON_KEY',
      '5. Add secrets to EAS: ./setup-eas-secrets.sh',
    ],
  },
  {
    title: 'Update Environment Variables',
    steps: [
      '1. Copy Supabase URL and anon key to .env file',
      '2. Update eas.json with production values',
      '3. Test the configuration',
    ],
  },
];

function displayStep(stepIndex) {
  if (stepIndex >= steps.length) {
    console.log('\n✅ Configuration complete! Your app is ready for external services.');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with actual credentials');
    console.log('2. Update eas.json with production values');
    console.log('3. Test push notifications');
    console.log('4. Test maps functionality');
    rl.close();
    return;
  }

  const step = steps[stepIndex];
  console.log(`\n📋 ${step.title}`);
  console.log('='.repeat(50));
  step.steps.forEach(stepText => console.log(stepText));

  rl.question('\nPress Enter to continue to next step...', () => {
    displayStep(stepIndex + 1);
  });
}

displayStep(0);
