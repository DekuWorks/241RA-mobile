import * as Sentry from '@sentry/react-native';
import { SentryService } from '../services/sentry';

const ENABLED = String(process.env.EXPO_PUBLIC_ENABLE_CRASH).toLowerCase() === 'true';

export function initCrashlytics(userId?: string) {
  if (!ENABLED) return;

  if (userId) {
    SentryService.setUser({ id: userId });
  }
}

export function recordError(err: unknown) {
  if (!ENABLED) return;

  if (err instanceof Error) {
    SentryService.captureException(err);
  } else {
    SentryService.captureException(new Error(String(err)));
  }
}

export function logEvent(name: string, data?: Record<string, unknown>) {
  if (!ENABLED) return;

  const sanitizedData = data ? sanitizeLogData(data) : undefined;
  SentryService.addBreadcrumb(name, 'app', sanitizedData);
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

export function forceTestCrash() {
  if (!ENABLED || __DEV__) return;
  Sentry.nativeCrash();
}
