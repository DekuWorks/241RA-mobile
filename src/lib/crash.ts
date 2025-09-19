// Conditional Firebase import for builds
let crashlytics: any = null;
try {
  crashlytics = require('@react-native-firebase/crashlytics').default;
} catch (error) {
  console.warn('Firebase Crashlytics not available in this build');
}

const ENABLED = String(process.env.EXPO_PUBLIC_ENABLE_CRASH).toLowerCase() === 'true';

export function initCrashlytics(userId?: string) {
  if (!crashlytics) return;
  crashlytics().setCrashlyticsCollectionEnabled(ENABLED);
  if (userId) {
    // Only use GUID, no PII
    crashlytics().setUserId(userId);
  }
}

export function recordError(err: unknown) {
  if (!ENABLED || !crashlytics) return;

  if (err instanceof Error) {
    crashlytics().recordError(err);
  } else {
    crashlytics().recordError(new Error(String(err)));
  }
}

export function logEvent(name: string, data?: Record<string, unknown>) {
  if (!ENABLED || !crashlytics) return;

  // Log non-sensitive info only - never log PII/PHI
  // Filter out sensitive data like names, emails, phone numbers, GPS coordinates
  const sanitizedData = data ? sanitizeLogData(data) : undefined;
  crashlytics().log(`${name}${sanitizedData ? ' ' + JSON.stringify(sanitizedData) : ''}`);
}

function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = [
    'email',
    'name',
    'firstName',
    'lastName',
    'phone',
    'address',
    'latitude',
    'longitude',
    'location',
    'gps',
    'coordinates',
    'password',
    'token',
    'key',
    'secret',
    'ssn',
    'id',
  ];

  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Optional dev helper - only use in development builds
export function forceTestCrash() {
  if (!ENABLED) return;
  crashlytics().crash();
}
