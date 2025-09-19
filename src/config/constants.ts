/**
 * Application constants and URLs
 */
export const APP_CONSTANTS = {
  // External URLs
  PRIVACY_POLICY_URL: 'https://241runnersawareness.org/privacy',
  TERMS_OF_SERVICE_URL: 'https://241runnersawareness.org/terms',
  SUPPORT_URL: 'https://241runnersawareness.org/contact',
  WEBSITE_URL: 'https://241runnersawareness.org',

  // App Store URLs (will be updated when apps are published)
  APP_STORE_URL: '', // Will be set after App Store submission
  PLAY_STORE_URL: '', // Will be set after Google Play submission

  // App Information
  APP_NAME: '241Runners',
  APP_SUBTITLE: 'Missing Person Alerts & Community Safety',
  VERSION: '1.0.0',

  // Contact Information
  SUPPORT_EMAIL: 'support@241runnersawareness.org',

  // Social Media (if applicable)
  TWITTER_URL: '', // Add if you have Twitter
  FACEBOOK_URL: '', // Add if you have Facebook

  // Legal
  COPYRIGHT_YEAR: new Date().getFullYear(),
  COMPANY_NAME: '241 Runners Awareness',
} as const;
