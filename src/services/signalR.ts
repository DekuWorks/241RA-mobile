import * as signalR from '@microsoft/signalr';
import { API_BASE } from '../config/api';
import { SecureTokenService } from './secureTokens';
import { logEvent } from '../lib/crash';
import { QueryClient } from '@tanstack/react-query';

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private queryClient: QueryClient | null = null;

  setQueryClient(queryClient: QueryClient): void {
    this.queryClient = queryClient;
  }

  async startConnection(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('SignalR connection already in progress');
      return;
    }

    try {
      this.isConnecting = true;

      // Get access token
      const token = await SecureTokenService.getAccessToken();
      if (!token) {
        console.warn('No access token available for SignalR');
        return;
      }

      // Create connection
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE}/hubs/alerts`, {
          accessTokenFactory: async () => token,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start connection
      await this.connection.start();

      logEvent('signalr_connected', {
        connectionId: this.connection.connectionId || 'unknown',
      });

      console.log('SignalR connected successfully');
    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
      logEvent('signalr_connection_failed', { error: String(error) });
    } finally {
      this.isConnecting = false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle connection events
    this.connection.onclose(error => {
      console.log('SignalR connection closed:', error);
      logEvent('signalr_disconnected', { error: error?.message || 'unknown' });
    });

    this.connection.onreconnecting(error => {
      console.log('SignalR reconnecting:', error);
      logEvent('signalr_reconnecting', { error: error?.message || 'unknown' });
    });

    this.connection.onreconnected(connectionId => {
      console.log('SignalR reconnected:', connectionId);
      logEvent('signalr_reconnected', { connectionId });
    });

    // Handle case updates
    this.connection.on('caseUpdated', (payload: any) => {
      console.log('Case updated via SignalR:', payload);
      logEvent('signalr_case_updated', { caseId: payload.id });

      // Invalidate case queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['cases'] });
        this.queryClient.invalidateQueries({ queryKey: ['case', payload.id] });
      }
    });

    // Handle new case notifications
    this.connection.on('newCase', (payload: any) => {
      console.log('New case via SignalR:', payload);
      logEvent('signalr_new_case', { caseId: payload.id });

      // Invalidate cases list
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['cases'] });
      }
    });

    // Handle admin notices
    this.connection.on('adminNotice', (payload: any) => {
      console.log('Admin notice via SignalR:', payload);
      logEvent('signalr_admin_notice', { noticeId: payload.id });

      // Invalidate user data to refresh admin status
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    });

    // Handle urgent notifications
    this.connection.on('urgentNotification', (payload: any) => {
      console.log('Urgent notification via SignalR:', payload);
      logEvent('signalr_urgent_notification', { notificationId: payload.id });
    });

    // Handle system notifications
    this.connection.on('systemNotification', (payload: any) => {
      console.log('System notification via SignalR:', payload);
      logEvent('signalr_system_notification', { notificationId: payload.id });
    });
  }

  async joinGroup(groupName: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.warn('SignalR not connected, cannot join group:', groupName);
      return;
    }

    try {
      await this.connection.invoke('JoinGroup', groupName);
      console.log('Joined SignalR group:', groupName);
      logEvent('signalr_group_joined', { groupName });
    } catch (error) {
      console.error('Failed to join SignalR group:', groupName, error);
      logEvent('signalr_group_join_failed', { groupName, error: String(error) });
    }
  }

  async leaveGroup(groupName: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.warn('SignalR not connected, cannot leave group:', groupName);
      return;
    }

    try {
      await this.connection.invoke('LeaveGroup', groupName);
      console.log('Left SignalR group:', groupName);
      logEvent('signalr_group_left', { groupName });
    } catch (error) {
      console.error('Failed to leave SignalR group:', groupName, error);
      logEvent('signalr_group_leave_failed', { groupName, error: String(error) });
    }
  }

  async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('SignalR connection stopped');
        logEvent('signalr_stopped');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      }
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state || null;
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
