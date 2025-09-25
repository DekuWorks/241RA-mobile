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

    // Handle user management events
    this.connection.on('userCreated', (payload: any) => {
      console.log('User created via SignalR:', payload);
      logEvent('signalr_user_created', { userId: payload.id });
      
      // Invalidate user queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['users'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      }
    });

    this.connection.on('userUpdated', (payload: any) => {
      console.log('User updated via SignalR:', payload);
      logEvent('signalr_user_updated', { userId: payload.id });
      
      // Invalidate user queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['users'] });
        this.queryClient.invalidateQueries({ queryKey: ['user', payload.id] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      }
    });

    this.connection.on('userDeleted', (payload: any) => {
      console.log('User deleted via SignalR:', payload);
      logEvent('signalr_user_deleted', { userId: payload.id });
      
      // Invalidate user queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['users'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      }
    });

    this.connection.on('userRoleChanged', (payload: any) => {
      console.log('User role changed via SignalR:', payload);
      logEvent('signalr_user_role_changed', { userId: payload.id, newRole: payload.role });
      
      // Invalidate user queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['users'] });
        this.queryClient.invalidateQueries({ queryKey: ['user', payload.id] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      }
    });

    this.connection.on('userStatusChanged', (payload: any) => {
      console.log('User status changed via SignalR:', payload);
      logEvent('signalr_user_status_changed', { userId: payload.id, isActive: payload.isActive });
      
      // Invalidate user queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['users'] });
        this.queryClient.invalidateQueries({ queryKey: ['user', payload.id] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      }
    });

    // Handle case status changes
    this.connection.on('caseStatusChanged', (payload: any) => {
      console.log('Case status changed via SignalR:', payload);
      logEvent('signalr_case_status_changed', { caseId: payload.id, newStatus: payload.status });
      
      // Invalidate case queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['cases'] });
        this.queryClient.invalidateQueries({ queryKey: ['case', payload.id] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] });
      }
    });

    this.connection.on('casePriorityChanged', (payload: any) => {
      console.log('Case priority changed via SignalR:', payload);
      logEvent('signalr_case_priority_changed', { caseId: payload.id, newPriority: payload.priority });
      
      // Invalidate case queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['cases'] });
        this.queryClient.invalidateQueries({ queryKey: ['case', payload.id] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] });
      }
    });

    this.connection.on('caseDeleted', (payload: any) => {
      console.log('Case deleted via SignalR:', payload);
      logEvent('signalr_case_deleted', { caseId: payload.id });
      
      // Invalidate case queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['cases'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] });
      }
    });

    // Handle admin dashboard updates
    this.connection.on('adminStatsUpdated', (payload: any) => {
      console.log('Admin stats updated via SignalR:', payload);
      logEvent('signalr_admin_stats_updated');
      
      // Invalidate admin dashboard queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
        this.queryClient.invalidateQueries({ queryKey: ['portal', 'stats'] });
      }
    });

    // Handle system settings changes
    this.connection.on('systemSettingsChanged', (payload: any) => {
      console.log('System settings changed via SignalR:', payload);
      logEvent('signalr_system_settings_changed', { setting: payload.setting });
      
      // Invalidate settings queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
        this.queryClient.invalidateQueries({ queryKey: ['system', 'configuration'] });
      }
    });

    // Handle database operations
    this.connection.on('databaseBackupCompleted', (payload: any) => {
      console.log('Database backup completed via SignalR:', payload);
      logEvent('signalr_database_backup_completed', { backupId: payload.backupId });
      
      // Invalidate database queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'database'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
      }
    });

    this.connection.on('databaseMaintenanceCompleted', (payload: any) => {
      console.log('Database maintenance completed via SignalR:', payload);
      logEvent('signalr_database_maintenance_completed', { operation: payload.operation });
      
      // Invalidate database queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'database'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      }
    });

    // Handle bulk operations
    this.connection.on('bulkOperationCompleted', (payload: any) => {
      console.log('Bulk operation completed via SignalR:', payload);
      logEvent('signalr_bulk_operation_completed', { operation: payload.operation, count: payload.count });
      
      // Invalidate relevant queries based on operation type
      if (this.queryClient) {
        if (payload.operation.includes('user')) {
          this.queryClient.invalidateQueries({ queryKey: ['users'] });
          this.queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        }
        if (payload.operation.includes('case')) {
          this.queryClient.invalidateQueries({ queryKey: ['cases'] });
          this.queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] });
        }
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      }
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
