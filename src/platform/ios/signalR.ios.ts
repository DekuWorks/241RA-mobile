/**
 * iOS-specific SignalR configuration and handling
 * Optimized WebSocket support for iOS devices
 */

import * as signalR from '@microsoft/signalr';
// Platform import removed as it's not used
import { API_BASE } from '../../config/api';
import { SecureTokenService } from '../../services/secureTokens';
import { logEvent } from '../../lib/crash';
import { QueryClient } from '@tanstack/react-query';
import { WebSocketDiagnostics } from '../../utils/websocketDiagnostics';
import { UserDataService } from '../../services/userData';

export class IOSSignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private queryClient: QueryClient | null = null;
  private isEnabled = true;
  private failureCount = 0;

  setQueryClient(queryClient: QueryClient): void {
    this.queryClient = queryClient;
  }

  private async getUserRole(): Promise<string | null> {
    try {
      const userData = await UserDataService.getUserData();
      return userData?.role || null;
    } catch (error) {
      console.warn('Failed to get user role for SignalR:', error);
      return null;
    }
  }

  async startConnection(): Promise<void> {
    if (!this.isEnabled) {
      console.log('⏭️ iOS SignalR disabled - skipping connection');
      return;
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('✅ iOS SignalR already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('⏳ iOS SignalR connection already in progress');
      return;
    }

    try {
      this.isConnecting = true;

      const token = await SecureTokenService.getAccessToken();
      if (!token) {
        console.warn('No access token available for iOS SignalR - skipping connection');
        return;
      }

      if (!token.includes('.')) {
        console.warn('Invalid token format for iOS SignalR - skipping connection');
        return;
      }

      const userRole = await this.getUserRole();
      const hubUrl =
        userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator'
          ? `${API_BASE}/hubs/admin`
          : `${API_BASE}/hubs/alerts`;

      console.log('🔌 iOS SignalR connecting to:', hubUrl);

      // iOS-specific connection configuration
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: async () => {
            try {
              const freshToken = await SecureTokenService.getAccessToken();
              if (!freshToken) {
                console.error('No access token available for iOS SignalR');
                throw new Error('No valid access token available');
              }
              return freshToken;
            } catch (error) {
              console.error('Failed to get access token for iOS SignalR:', error);
              throw error;
            }
          },
          // iOS-specific WebSocket options
          transport:
            signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
          withCredentials: false,
          timeout: 30000, // Standard timeout for iOS
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': '241Runners-Mobile-iOS/1.0.0',
            'X-Platform': 'ios',
          },
          // iOS-specific keep-alive settings
          keepAliveIntervalInMilliseconds: 30000,
          serverTimeoutInMilliseconds: 30000,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            // iOS-specific retry strategy (less aggressive than Android)
            const baseDelays = [0, 2000, 5000, 10000, 30000];

            if (retryContext.previousRetryCount < baseDelays.length) {
              return baseDelays[retryContext.previousRetryCount];
            }

            return null; // Stop retrying after base delays
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.setupIOSEventHandlers();

      try {
        console.log('🚀 Starting iOS SignalR connection...');

        // Standard delay for iOS
        await new Promise(resolve => setTimeout(resolve, 500));

        await Promise.race([
          this.connection.start(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('iOS connection timeout')), 10000)
          ),
        ]);

        logEvent('ios_signalr_connected', {
          connectionId: this.connection.connectionId || 'unknown',
        });

        console.log('✅ iOS SignalR connected successfully');
      } catch (startError: any) {
        console.warn('⚠️ iOS SignalR connection failed:', startError);

        this.failureCount++;

        if (this.failureCount >= 3) {
          console.warn('🚫 iOS SignalR disabled after 3 failures');
          this.isEnabled = false;
        }

        WebSocketDiagnostics.recordError(
          'iOS SignalR connection failed',
          startError?.statusCode,
          startError
        );

        throw startError;
      }
    } catch (error) {
      console.error('Failed to connect iOS SignalR:', error);
      logEvent('ios_signalr_connection_failed', { error: String(error) });
    } finally {
      this.isConnecting = false;
    }
  }

  private setupIOSEventHandlers(): void {
    if (!this.connection) return;

    this.connection.onclose(error => {
      console.log('iOS SignalR connection closed:', error);

      if (error) {
        console.error('iOS SignalR close error:', {
          code: error.code,
          reason: error.reason,
          wasClean: error.wasClean,
        });

        // iOS-specific error handling
        if (error.code === 1006) {
          console.warn('iOS WebSocket 1006: Abnormal closure');
          WebSocketDiagnostics.recordError('iOS WebSocket 1006: Abnormal closure', error.code);
          logEvent('ios_websocket_1006', {
            error: 'Abnormal closure - iOS network issue',
            code: error.code,
          });

          // iOS-specific reconnection strategy
          this.handleIOSReconnection();
        } else {
          WebSocketDiagnostics.recordError(`iOS WebSocket error ${error.code}`, error.code);
        }
      }

      logEvent('ios_signalr_disconnected', {
        error: error?.message || 'unknown',
        code: error?.code,
        wasClean: error?.wasClean,
      });
    });

    this.connection.onreconnecting(error => {
      console.log('iOS SignalR reconnecting:', error);
      logEvent('ios_signalr_reconnecting', {
        error: error?.message || 'unknown',
        code: error?.code,
      });
    });

    this.connection.onreconnected(connectionId => {
      console.log('iOS SignalR reconnected:', connectionId);
      logEvent('ios_signalr_reconnected', { connectionId });
    });

    // Set up all the event handlers from the original service
    this.setupCommonEventHandlers();
  }

  private handleIOSReconnection(): void {
    // iOS uses more conservative reconnection strategy
    setTimeout(() => {
      console.log('iOS: Attempting reconnection...');
      this.startConnection();
    }, 5000);
  }

  private setupCommonEventHandlers(): void {
    if (!this.connection) return;

    // Case updates
    this.connection.on('caseUpdated', (payload: any) => {
      console.log('iOS: Case updated via SignalR:', payload);
      logEvent('ios_signalr_case_updated', { caseId: payload.id });
      this.invalidateQueries(['cases', 'case', payload.id]);
    });

    this.connection.on('newCase', (payload: any) => {
      console.log('iOS: New case via SignalR:', payload);
      logEvent('ios_signalr_new_case', { caseId: payload.id });
      this.invalidateQueries(['cases']);
    });

    this.connection.on('adminNotice', (payload: any) => {
      console.log('iOS: Admin notice via SignalR:', payload);
      logEvent('ios_signalr_admin_notice', { noticeId: payload.id });
      this.invalidateQueries(['user']);
    });

    // Add other event handlers as needed...
  }

  private invalidateQueries(queryKeys: string[][]): void {
    if (this.queryClient) {
      queryKeys.forEach(key => {
        this.queryClient?.invalidateQueries({ queryKey: key });
      });
    }
  }

  async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('iOS SignalR connection stopped');
        logEvent('ios_signalr_stopped');
      } catch (error) {
        console.error('Error stopping iOS SignalR connection:', error);
      }
      this.connection = null;
    }
  }

  async forceReconnect(): Promise<void> {
    try {
      console.log('Force reconnecting iOS SignalR...');
      await this.stopConnection();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.startConnection();
    } catch (error) {
      console.error('Failed to force reconnect iOS SignalR:', error);
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state || null;
  }

  async testConnection(): Promise<{ success: boolean; error?: string; connectionId?: string }> {
    try {
      if (!this.connection) {
        return { success: false, error: 'No iOS connection established' };
      }

      const state = this.connection.state;
      if (state === signalR.HubConnectionState.Connected) {
        return {
          success: true,
          connectionId: this.connection.connectionId || 'unknown',
        };
      } else {
        return {
          success: false,
          error: `iOS connection state: ${state}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown iOS error',
      };
    }
  }
}

// Export singleton instance for iOS
export const iosSignalRService = new IOSSignalRService();
