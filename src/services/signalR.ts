import * as signalR from '@microsoft/signalr';
import { Platform } from 'react-native';
import { API_BASE } from '../config/api';
import { SecureTokenService } from './secureTokens';
import { logEvent } from '../lib/crash';
import { QueryClient } from '@tanstack/react-query';
import { WebSocketDiagnostics } from '../utils/websocketDiagnostics';
import { PlatformServiceFactory } from '../platform/shared/platformFactory';
import { UserDataService } from './userData';

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private queryClient: QueryClient | null = null;
  private isEnabled = true; // Can be disabled if WebSocket fails repeatedly
  private failureCount = 0;
  private platformService: any;

  constructor() {
    // Initialize platform-specific service
    this.platformService = PlatformServiceFactory.getSignalRService();
  }

  setQueryClient(queryClient: QueryClient): void {
    this.queryClient = queryClient;
    // Also set for platform-specific service
    this.platformService.setQueryClient(queryClient);
  }

  private async getUserRole(): Promise<string | null> {
    try {
      // Try to get user role from secure storage or user data
      const userData = await UserDataService.getUserData();
      return userData?.role || null;
    } catch (error) {
      console.warn('Failed to get user role for SignalR:', error);
      return null;
    }
  }

  async startConnection(): Promise<void> {
    // Delegate to platform-specific service
    return this.platformService.startConnection();
  }

  async startConnectionLegacy(): Promise<void> {
    // Skip if disabled due to repeated failures
    if (!this.isEnabled) {
      console.log('⏭️ SignalR disabled - skipping connection');
      return;
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('✅ SignalR already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('⏳ SignalR connection already in progress');
      return;
    }

    try {
      this.isConnecting = true;

      // Get access token
      const token = await SecureTokenService.getAccessToken();
      if (!token) {
        console.warn('No access token available for SignalR - skipping connection');
        return;
      }

      // Verify token is valid by checking if it's a JWT
      if (!token.includes('.')) {
        console.warn('Invalid token format for SignalR - skipping connection');
        return;
      }

      // Validate token format
      console.log('🔑 Token format check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 20) + '...',
        isJWT: token?.includes('.')
      });

      // Determine which hub to use based on user role
      const userRole = await this.getUserRole();
      const hubUrl = userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator'
        ? `${API_BASE}/hubs/admin`    // AdminHub for admin users
        : `${API_BASE}/hubs/alerts`;  // AlertsHub for regular users

      console.log('🔌 Connecting to SignalR hub:', hubUrl);
      console.log('👤 User role:', userRole, '→ Using', userRole?.includes('admin') || userRole === 'moderator' ? 'AdminHub' : 'AlertsHub');
      console.log('🔑 Access token available:', !!token);
      console.log('🌐 API Base URL:', API_BASE);

      // Create connection with enhanced error handling and fallback transports
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: async () => {
            try {
              // Refresh token if needed
              const freshToken = await SecureTokenService.getAccessToken();
              if (!freshToken) {
                console.error('No access token available for SignalR');
                throw new Error('No valid access token available');
              }
              console.log('🔑 Using token for SignalR:', freshToken.substring(0, 20) + '...');
              return freshToken;
            } catch (error) {
              console.error('Failed to get access token for SignalR:', error);
              throw error;
            }
          },
          skipNegotiation: false, // Allow negotiation for better compatibility
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
          withCredentials: false,
          timeout: 30000, // 30 second timeout
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          // Android-specific WebSocket options
          ...(Platform.OS === 'android' && {
            // Force WebSocket for Android with fallback
            transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
            // Add keep-alive for Android
            keepAliveIntervalInMilliseconds: 15000,
            // Increase timeout for Android
            timeout: 45000,
            // Android-specific headers
            headers: {
              'User-Agent': '241Runners-Mobile-Android',
              'Connection': 'keep-alive',
              'Cache-Control': 'no-cache',
            },
          }),
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Enhanced retry logic for Android WebSocket issues
            const isAndroid = Platform.OS === 'android';
            const baseDelays = isAndroid 
              ? [0, 1000, 3000, 8000, 15000, 30000] // More aggressive for Android
              : [0, 2000, 5000, 10000, 30000];
            
            if (retryContext.previousRetryCount < baseDelays.length) {
              return baseDelays[retryContext.previousRetryCount];
            }
            
            // Continue retrying for Android with exponential backoff
            if (isAndroid && retryContext.previousRetryCount < 10) {
              return Math.min(60000, 30000 * Math.pow(2, retryContext.previousRetryCount - baseDelays.length));
            }
            
            return null; // Stop retrying
          }
        })
        .configureLogging(signalR.LogLevel.Warning) // Reduce logging noise
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start connection with enhanced error handling
      try {
        console.log('🚀 Starting SignalR connection...');
        
        // Add a small delay to ensure authentication is fully processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to start with timeout
        await Promise.race([
          this.connection.start(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 10000)
          )
        ]);
        
        logEvent('signalr_connected', {
          connectionId: this.connection.connectionId || 'unknown',
        });

        console.log('✅ SignalR connected successfully');
        console.log('🔗 Connection ID:', this.connection.connectionId);
        console.log('🌐 Hub URL:', hubUrl);
        console.log('👤 User Role:', userRole);
      } catch (startError: any) {
        console.warn('⚠️ SignalR connection failed (app will work without real-time features):', startError);
        
        this.failureCount++;
        
        // Disable SignalR after 3 consecutive failures
        if (this.failureCount >= 3) {
          console.warn('🚫 SignalR disabled after 3 failures - app will work without real-time features');
          this.isEnabled = false;
        }
        
        // Handle specific error types (non-blocking)
        if (startError?.statusCode === 403) {
          console.warn('⚠️ SignalR authentication issue - continuing without real-time features');
          
          WebSocketDiagnostics.recordError(
            'SignalR 403 Forbidden - Authentication failed',
            403,
            startError
          );
        } else if (startError?.statusCode === 401) {
          console.warn('🔐 SignalR 401 Unauthorized - Token issue');
          WebSocketDiagnostics.recordError(
            'SignalR 401 Unauthorized - Token invalid',
            401,
            startError
          );
          throw new Error('SignalR token invalid (401)');
        } else {
          WebSocketDiagnostics.recordError(
            'SignalR connection failed',
            startError?.statusCode,
            startError
          );
          throw startError;
        }
      }
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
      
      // Handle specific error codes
      if (error) {
        console.error('SignalR close error details:', {
          code: error.code,
          reason: error.reason,
          wasClean: error.wasClean
        });
        
        // Handle WebSocket error 1006 (abnormal closure)
        if (error.code === 1006) {
          console.warn('WebSocket error 1006: Abnormal closure detected');
          WebSocketDiagnostics.recordError('WebSocket 1006: Abnormal closure', error.code);
          logEvent('signalr_websocket_1006', { 
            error: 'Abnormal closure - possible network or server issue',
            code: error.code,
            platform: Platform.OS
          });
          
          // Log diagnostics for troubleshooting
          WebSocketDiagnostics.logDiagnostics();
          
          // Android-specific reconnection strategy
          if (Platform.OS === 'android') {
            // More aggressive reconnection for Android
            setTimeout(() => {
              console.log('Android: Attempting immediate reconnect after WebSocket 1006...');
              this.startConnection();
            }, 2000);
            
            // Additional fallback reconnection
            setTimeout(() => {
              if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
                console.log('Android: Fallback reconnection attempt...');
                this.startConnection();
              }
            }, 10000);
            
            // Third attempt for Android if still not connected
            setTimeout(() => {
              if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
                console.log('Android: Third reconnection attempt...');
                this.forceReconnect();
              }
            }, 20000);
          } else {
            // Standard reconnection for iOS
            setTimeout(() => {
              console.log('Attempting to reconnect after WebSocket 1006 error...');
              this.startConnection();
            }, 5000);
          }
        } else {
          // Record other WebSocket errors
          WebSocketDiagnostics.recordError(`WebSocket error ${error.code}`, error.code);
          
          // Handle other common Android WebSocket errors
          if (Platform.OS === 'android' && (error.code === 1000 || error.code === 1001)) {
            setTimeout(() => {
              console.log('Android: Reconnecting after connection loss...');
              this.startConnection();
            }, 3000);
          }
        }
      }
      
      logEvent('signalr_disconnected', { 
        error: error?.message || 'unknown',
        code: error?.code,
        wasClean: error?.wasClean 
      });
    });

    this.connection.onreconnecting(error => {
      console.log('SignalR reconnecting:', error);
      logEvent('signalr_reconnecting', { 
        error: error?.message || 'unknown',
        code: error?.code 
      });
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
      // Try different method names that might exist on the server
      const methods = ['joingroup', 'JoinGroup', 'joinGroup', 'JoinGroupAsync'];
      let success = false;
      
      for (const method of methods) {
        try {
          await this.connection.invoke(method, groupName);
          console.log(`✅ Joined SignalR group '${groupName}' using method '${method}'`);
          logEvent('signalr_group_joined', { groupName, method });
          success = true;
          break;
        } catch (methodError) {
          console.log(`❌ Method '${method}' failed for group '${groupName}':`, methodError);
        }
      }
      
      if (!success) {
        console.warn(`⚠️ All methods failed for group '${groupName}'. Server may not support group joins yet.`);
        logEvent('signalr_group_join_not_supported', { groupName });
      }
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
      // Try different method names that might exist on the server
      const methods = ['leavegroup', 'LeaveGroup', 'leaveGroup', 'LeaveGroupAsync'];
      let success = false;
      
      for (const method of methods) {
        try {
          await this.connection.invoke(method, groupName);
          console.log(`✅ Left SignalR group '${groupName}' using method '${method}'`);
          logEvent('signalr_group_left', { groupName, method });
          success = true;
          break;
        } catch (methodError) {
          console.log(`❌ Method '${method}' failed for group '${groupName}':`, methodError);
        }
      }
      
      if (!success) {
        console.warn(`⚠️ All methods failed for group '${groupName}'. Server may not support group leaves yet.`);
        logEvent('signalr_group_leave_not_supported', { groupName });
      }
    } catch (error) {
      console.error('Failed to leave SignalR group:', groupName, error);
      logEvent('signalr_group_leave_failed', { groupName, error: String(error) });
    }
  }

  async stopConnection(): Promise<void> {
    // Delegate to platform-specific service
    return this.platformService.stopConnection();
  }

  async stopConnectionLegacy(): Promise<void> {
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

  /**
   * Test SignalR connection and return status
   */
  async testConnection(): Promise<{ success: boolean; error?: string; connectionId?: string }> {
    // Delegate to platform-specific service
    return this.platformService.testConnection();
  }

  async testConnectionLegacy(): Promise<{ success: boolean; error?: string; connectionId?: string }> {
    try {
      if (!this.connection) {
        return { success: false, error: 'No connection established' };
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
          error: `Connection state: ${state}` 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
  }

  /**
   * Check connection health and attempt recovery if needed
   */
  async checkConnectionHealth(): Promise<boolean> {
    try {
      if (!this.connection) {
        console.log('No SignalR connection to check');
        return false;
      }

      const state = this.connection.state;
      console.log('SignalR connection state:', state);

      if (state === signalR.HubConnectionState.Disconnected) {
        console.log('SignalR disconnected, attempting to reconnect...');
        await this.startConnection();
        return this.connection?.state === signalR.HubConnectionState.Connected;
      }

      if (state === signalR.HubConnectionState.Connected) {
        // Test the connection with a ping
        try {
          await this.connection.invoke('Ping');
          return true;
        } catch (error) {
          console.warn('SignalR ping failed, connection may be unhealthy:', error);
          return false;
        }
      }

      return state === signalR.HubConnectionState.Connected;
    } catch (error) {
      console.error('Failed to check SignalR connection health:', error);
      return false;
    }
  }

  /**
   * Force reconnection with fresh token
   */
  async forceReconnect(): Promise<void> {
    try {
      console.log('Force reconnecting SignalR...');
      await this.stopConnection();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await this.startConnection();
    } catch (error) {
      console.error('Failed to force reconnect SignalR:', error);
    }
  }

  isConnected(): boolean {
    return this.platformService.isConnected();
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.platformService.getConnectionState();
  }

  async forceReconnect(): Promise<void> {
    return this.platformService.forceReconnect();
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
