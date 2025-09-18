import * as Sentry from '@sentry/react-native';
import { ENV } from '../config/env';

/**
 * Sentry configuration and initialization
 */
export class SentryService {
  private static initialized = false;

  /**
   * Initialize Sentry with proper configuration
   */
  static init(): void {
    if (this.initialized) {
      return;
    }

    // Only initialize Sentry in production
    if (__DEV__) {
      console.log('Sentry disabled in development mode');
      return;
    }

    if (!ENV.SENTRY_DSN) {
      console.warn('Sentry DSN not configured');
      return;
    }

    try {
      Sentry.init({
        dsn: ENV.SENTRY_DSN,
        environment: __DEV__ ? 'development' : 'production',
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 10000,
        beforeSend(event) {
          // Filter out sensitive data
          if (event.user) {
            delete event.user.email;
            delete event.user.ip_address;
          }
          return event;
        },
        beforeBreadcrumb(breadcrumb) {
          // Filter out sensitive breadcrumbs
          if (breadcrumb.category === 'http' && breadcrumb.data) {
            delete breadcrumb.data.request_body;
            delete breadcrumb.data.response_body;
          }
          return breadcrumb;
        },
      });

      this.initialized = true;
      console.log('Sentry initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Capture an exception
   */
  static captureException(error: Error, context?: any): void {
    if (__DEV__) {
      console.error('Sentry (dev):', error, context);
      return;
    }

    try {
      Sentry.captureException(error, {
        extra: context,
      });
    } catch (sentryError) {
      console.error('Failed to capture exception in Sentry:', sentryError);
    }
  }

  /**
   * Capture a message
   */
  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (__DEV__) {
      console.log(`Sentry (dev): ${level.toUpperCase()} - ${message}`);
      return;
    }

    try {
      Sentry.captureMessage(message, level);
    } catch (sentryError) {
      console.error('Failed to capture message in Sentry:', sentryError);
    }
  }

  /**
   * Set user context
   */
  static setUser(user: { id: string; email?: string; role?: string }): void {
    if (__DEV__) {
      console.log('Sentry (dev): Setting user context', user);
      return;
    }

    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        extra: {
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Failed to set user context in Sentry:', error);
    }
  }

  /**
   * Clear user context
   */
  static clearUser(): void {
    if (__DEV__) {
      console.log('Sentry (dev): Clearing user context');
      return;
    }

    try {
      Sentry.setUser(null);
    } catch (error) {
      console.error('Failed to clear user context in Sentry:', error);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  static addBreadcrumb(message: string, category: string = 'user', data?: any): void {
    if (__DEV__) {
      console.log(`Sentry (dev): Breadcrumb - ${category}: ${message}`, data);
      return;
    }

    try {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
      });
    } catch (error) {
      console.error('Failed to add breadcrumb in Sentry:', error);
    }
  }

  /**
   * Set tag for filtering
   */
  static setTag(key: string, value: string): void {
    if (__DEV__) {
      console.log(`Sentry (dev): Setting tag ${key}=${value}`);
      return;
    }

    try {
      Sentry.setTag(key, value);
    } catch (error) {
      console.error('Failed to set tag in Sentry:', error);
    }
  }

  /**
   * Set extra context
   */
  static setExtra(key: string, value: any): void {
    if (__DEV__) {
      console.log(`Sentry (dev): Setting extra ${key}=`, value);
      return;
    }

    try {
      Sentry.setExtra(key, value);
    } catch (error) {
      console.error('Failed to set extra context in Sentry:', error);
    }
  }
}
