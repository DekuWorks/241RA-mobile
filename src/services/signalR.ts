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

  private async getUserRole(): Promise<string | null> {
    try {
      // Try to get user role from secure storage or user data
      const { UserDataService } = await import('./userData');
      const userData = await UserDataService.getUserData();
      return userData?.role || null;
    } catch (error) {
      console.warn('Failed to get user role for SignalR:', error);
      return null;
    }
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

      // Determine which hub to use based on user role
      const userRole = await this.getUserRole();
      const hubUrl = userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator'
        ? `${API_BASE}/hubs/admin`    // AdminHub for admin users
        : `${API_BASE}/hubs/alerts`;  // AlertsHub for regular users

      console.log('🔌 Connecting to SignalR hub:', hubUrl);
      console.log('👤 User role:', userRole, '→ Using', userRole?.includes('admin') || userRole === 'moderator' ? 'AdminHub' : 'AlertsHub');

      // Create connection
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
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

    // Admin-specific event handlers (from static site RealtimeClient)
    this.connection.on('NewUserRegistration', (data: any) => {
      console.log('👤 New user registration:', data);
      logEvent('signalr_new_user_registration', { userId: data.userData?.id });
      
      // Invalidate user queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['users'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      }
    });

    this.connection.on('CaseCreated', (data: any) => {
      console.log('📋 New case created:', data);
      logEvent('signalr_case_created', { caseId: data.caseData?.id });
      
      // Invalidate case queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['cases'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      }
    });

    this.connection.on('CaseUpdated', (data: any) => {
      console.log('📋 Case updated:', data);
      logEvent('signalr_case_updated_admin', { caseId: data.id });
      
      // Invalidate case queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['cases'] });
        this.queryClient.invalidateQueries({ queryKey: ['case', data.id] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] });
      }
    });

    this.connection.on('caseDeleted', (data: any) => {
      console.log('🗑️ Case deleted:', data);
      logEvent('signalr_case_deleted_admin', { caseId: data.data?.id });
      
      // Invalidate case queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['cases'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'cases'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      }
    });

    // Admin connection tracking
    this.connection.on('AdminConnected', (data: any) => {
      console.log('👑 Admin connected:', data);
      logEvent('signalr_admin_connected', { adminId: data.adminId, adminName: data.adminName });
      
      // Invalidate admin queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'online'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'activity'] });
      }
    });

    this.connection.on('AdminDisconnected', (data: any) => {
      console.log('👑 Admin disconnected:', data);
      logEvent('signalr_admin_disconnected', { adminId: data.adminId, adminName: data.adminName });
      
      // Invalidate admin queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'online'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'activity'] });
      }
    });

    this.connection.on('CurrentAdmins', (data: any) => {
      console.log('👥 Current admins:', data);
      logEvent('signalr_current_admins', { count: data.length });
      
      // Update admin list in cache
      if (this.queryClient) {
        this.queryClient.setQueryData(['admin', 'online'], data);
      }
    });

    this.connection.on('UserChanged', (data: any) => {
      console.log('👤 User changed:', data);
      logEvent('signalr_user_changed_admin', { userId: data.userId, operation: data.operation });
      
      // Invalidate user queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['users'] });
        this.queryClient.invalidateQueries({ queryKey: ['user', data.userId] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      }
    });

    this.connection.on('RunnerChanged', (data: any) => {
      console.log('🏃 Runner changed:', data);
      logEvent('signalr_runner_changed', { runnerId: data.runnerId, operation: data.operation });
      
      // Invalidate runner queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['runners'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'runners'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      }
    });

    this.connection.on('AdminProfileChanged', (data: any) => {
      console.log('👑 Admin profile changed:', data);
      logEvent('signalr_admin_profile_changed', { adminId: data.adminId, operation: data.operation });
      
      // Invalidate admin profile queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] });
        this.queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    });

    this.connection.on('DataVersionChanged', (data: any) => {
      console.log('📊 Data version changed:', data);
      logEvent('signalr_data_version_changed', { dataType: data.dataType, version: data.version });
      
      // Invalidate all relevant queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      }
    });

    this.connection.on('AdminActivity', (data: any) => {
      console.log('👑 Admin activity:', data);
      logEvent('signalr_admin_activity', { adminId: data.adminId, activity: data.activity });
      
      // Invalidate admin activity queries
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['admin', 'activity'] });
      }
    });

    this.connection.on('OnlineAdmins', (data: any) => {
      console.log('👥 Online admins:', data);
      logEvent('signalr_online_admins', { count: data.length });
      
      // Update online admins in cache
      if (this.queryClient) {
        this.queryClient.setQueryData(['admin', 'online'], data);
      }
    });

    this.connection.on('Pong', (data: any) => {
      console.log('🏓 Pong received:', data);
      // Update last ping time for connection monitoring
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
