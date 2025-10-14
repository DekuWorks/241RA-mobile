/**
 * Android-specific SignalR configuration and handling
 * Enhanced WebSocket support for Android devices
 */

import * as signalR from '@microsoft/signalr';
import { Platform } from 'react-native';
import { API_BASE } from '../../config/api';
import { SecureTokenService } from '../../services/secureTokens';
import { logEvent } from '../../lib/crash';
import { QueryClient } from '@tanstack/react-query';
import { WebSocketDiagnostics } from '../../utils/websocketDiagnostics';
import { UserDataService } from '../../services/userData';

export class AndroidSignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private queryClient: QueryClient | null = null;
  private isEnabled = true;
  private failureCount = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

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
      console.log('⏭️ Android SignalR disabled - skipping connection');
      return;
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('✅ Android SignalR already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('⏳ Android SignalR connection already in progress');
      return;
    }

    try {
      this.isConnecting = true;

      const token = await SecureTokenService.getAccessToken();
      if (!token) {
        console.warn('No access token available for Android SignalR - skipping connection');
        return;
      }

      if (!token.includes('.')) {
        console.warn('Invalid token format for Android SignalR - skipping connection');
        return;
      }

      const userRole = await this.getUserRole();
      const hubUrl = userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator'
        ? `${API_BASE}/hubs/admin`
        : `${API_BASE}/hubs/alerts`;

      console.log('🔌 Android SignalR connecting to:', hubUrl);

      // Android-specific connection configuration
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: async () => {
            try {
              const freshToken = await SecureTokenService.getAccessToken();
              if (!freshToken) {
                console.error('No access token available for Android SignalR');
                throw new Error('No valid access token available');
              }
              return freshToken;
            } catch (error) {
              console.error('Failed to get access token for Android SignalR:', error);
              throw error;
            }
          },
          // Android-specific WebSocket options
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
          withCredentials: false,
          timeout: 60000, // Extended timeout for Android
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': '241Runners-Mobile-Android/1.0.0',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'X-Platform': 'android',
          },
          // Android-specific keep-alive settings
          keepAliveIntervalInMilliseconds: 15000,
          serverTimeoutInMilliseconds: 60000,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Android-specific retry strategy
            const baseDelays = [0, 1000, 3000, 8000, 15000, 30000];
            
            if (retryContext.previousRetryCount < baseDelays.length) {
              return baseDelays[retryContext.previousRetryCount];
            }
            
            // Continue retrying with exponential backoff
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              return Math.min(120000, 30000 * Math.pow(2, retryContext.previousRetryCount - baseDelays.length));
            }
            
            return null; // Stop retrying
          }
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.setupAndroidEventHandlers();

      try {
        console.log('🚀 Starting Android SignalR connection...');
        
        // Extended delay for Android initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await Promise.race([
          this.connection.start(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Android connection timeout')), 15000)
          )
        ]);
        
        logEvent('android_signalr_connected', {
          connectionId: this.connection.connectionId || 'unknown',
        });

        console.log('✅ Android SignalR connected successfully');
        this.reconnectAttempts = 0;
        
      } catch (startError: any) {
        console.warn('⚠️ Android SignalR connection failed:', startError);
        
        this.failureCount++;
        this.reconnectAttempts++;
        
        if (this.failureCount >= 3) {
          console.warn('🚫 Android SignalR disabled after 3 failures');
          this.isEnabled = false;
        }
        
        WebSocketDiagnostics.recordError(
          'Android SignalR connection failed',
          startError?.statusCode,
          startError
        );
        
        throw startError;
      }
    } catch (error) {
      console.error('Failed to connect Android SignalR:', error);
      logEvent('android_signalr_connection_failed', { error: String(error) });
    } finally {
      this.isConnecting = false;
    }
  }

  private setupAndroidEventHandlers(): void {
    if (!this.connection) return;

    this.connection.onclose(error => {
      console.log('Android SignalR connection closed:', error);
      
      if (error) {
        console.error('Android SignalR close error:', {
          code: error.code,
          reason: error.reason,
          wasClean: error.wasClean
        });
        
        // Enhanced Android error handling
        if (error.code === 1006) {
          console.warn('Android WebSocket 1006: Abnormal closure');
          WebSocketDiagnostics.recordError('Android WebSocket 1006: Abnormal closure', error.code);
          logEvent('android_websocket_1006', { 
            error: 'Abnormal closure - Android network issue',
            code: error.code
          });
          
          // Android-specific reconnection strategy
          this.handleAndroidReconnection();
        } else {
          WebSocketDiagnostics.recordError(`Android WebSocket error ${error.code}`, error.code);
        }
      }
      
      logEvent('android_signalr_disconnected', { 
        error: error?.message || 'unknown',
        code: error?.code,
        wasClean: error?.wasClean 
      });
    });

    this.connection.onreconnecting(error => {
      console.log('Android SignalR reconnecting:', error);
      logEvent('android_signalr_reconnecting', { 
        error: error?.message || 'unknown',
        code: error?.code 
      });
    });

    this.connection.onreconnected(connectionId => {
      console.log('Android SignalR reconnected:', connectionId);
      logEvent('android_signalr_reconnected', { connectionId });
      this.reconnectAttempts = 0;
    });

    // Set up all the event handlers from the original service
    this.setupCommonEventHandlers();
  }

  private handleAndroidReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Android: Max reconnection attempts reached, giving up');
      return;
    }

    // Progressive reconnection delays for Android
    const delays = [2000, 5000, 10000, 20000, 30000];
    const delay = delays[Math.min(this.reconnectAttempts, delays.length - 1)];
    
    setTimeout(() => {
      console.log(`Android: Reconnection attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
      this.startConnection();
    }, delay);
  }

  private setupCommonEventHandlers(): void {
    if (!this.connection) return;

    // Case updates
    this.connection.on('caseUpdated', (payload: any) => {
      console.log('Android: Case updated via SignalR:', payload);
      logEvent('android_signalr_case_updated', { caseId: payload.id });
      this.invalidateQueries(['cases', 'case', payload.id]);
    });

    this.connection.on('newCase', (payload: any) => {
      console.log('Android: New case via SignalR:', payload);
      logEvent('android_signalr_new_case', { caseId: payload.id });
      this.invalidateQueries(['cases']);
    });

    this.connection.on('adminNotice', (payload: any) => {
      console.log('Android: Admin notice via SignalR:', payload);
      logEvent('android_signalr_admin_notice', { noticeId: payload.id });
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
        console.log('Android SignalR connection stopped');
        logEvent('android_signalr_stopped');
      } catch (error) {
        console.error('Error stopping Android SignalR connection:', error);
      }
      this.connection = null;
    }
  }

  async forceReconnect(): Promise<void> {
    try {
      console.log('Force reconnecting Android SignalR...');
      await this.stopConnection();
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.reconnectAttempts = 0;
      await this.startConnection();
    } catch (error) {
      console.error('Failed to force reconnect Android SignalR:', error);
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
        return { success: false, error: 'No Android connection established' };
      }

      const state = this.connection.state;
      if (state === signalR.HubConnectionState.Connected) {
        return { 
          success: true, 
          connectionId: this.connection.connectionId || 'unknown' 
        };
      } else {
        return { 
          success: false, 
          error: `Android connection state: ${state}` 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Unknown Android error' 
      };
    }
  }
}

// Export singleton instance for Android
export const androidSignalRService = new AndroidSignalRService();
