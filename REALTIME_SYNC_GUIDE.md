# Real-Time Data Synchronization Guide

## Overview

This guide explains how the 241Runners mobile app ensures real-time data synchronization between the static site and mobile app, especially for admin operations and database changes.

## Architecture

### 1. SignalR Real-Time Connection
- **Hub URL**: `https://241runners-api-v2.azurewebsites.net/hubs/alerts`
- **Authentication**: Bearer token with automatic refresh
- **Connection**: Automatic reconnection with exponential backoff
- **Groups**: Admin-specific groups for targeted updates

### 2. Event-Driven Synchronization
All database changes trigger SignalR events that automatically update connected clients:

#### User Management Events
- `userCreated` - New user registration
- `userUpdated` - User profile changes
- `userDeleted` - User account deletion
- `userRoleChanged` - Role updates (admin, moderator, etc.)
- `userStatusChanged` - Active/inactive status changes

#### Case Management Events
- `caseUpdated` - Case information changes
- `newCase` - New case creation
- `caseStatusChanged` - Status updates (missing, found, resolved)
- `casePriorityChanged` - Priority level changes
- `caseDeleted` - Case removal

#### Admin Dashboard Events
- `adminStatsUpdated` - Dashboard statistics refresh
- `adminNotice` - System announcements
- `systemSettingsChanged` - Configuration updates
- `databaseBackupCompleted` - Backup operations
- `bulkOperationCompleted` - Mass operations

### 3. Query Invalidation
When SignalR events are received, the app automatically invalidates relevant React Query caches:

```typescript
// Example: User role change triggers cache invalidation
this.queryClient.invalidateQueries({ queryKey: ['users'] });
this.queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
this.queryClient.invalidateQueries({ queryKey: ['user', payload.id] });
```

## Implementation Details

### SignalR Service (`src/services/signalR.ts`)
- Handles all real-time event listeners
- Manages connection state and reconnection
- Automatically invalidates React Query caches
- Logs all events for debugging and monitoring

### Real-Time Sync Service (`src/services/realtimeSync.ts`)
- Coordinates admin operations with real-time updates
- Ensures proper SignalR group membership
- Provides monitoring and status checking
- Handles operation logging and error tracking

### Admin Service (`src/services/admin.ts`)
- All admin operations trigger real-time sync
- Automatic SignalR event broadcasting (backend)
- Comprehensive operation logging
- Error handling and recovery

## Admin Operations Covered

### User Management
- ✅ **User Creation**: New user registration triggers `userCreated` event
- ✅ **User Updates**: Profile changes trigger `userUpdated` event
- ✅ **User Deletion**: Account removal triggers `userDeleted` event
- ✅ **Role Changes**: Admin role updates trigger `userRoleChanged` event
- ✅ **Status Changes**: Active/inactive toggles trigger `userStatusChanged` event

### Case Management
- ✅ **Case Creation**: New cases trigger `newCase` event
- ✅ **Case Updates**: Information changes trigger `caseUpdated` event
- ✅ **Status Changes**: Case status updates trigger `caseStatusChanged` event
- ✅ **Priority Changes**: Priority updates trigger `casePriorityChanged` event
- ✅ **Case Deletion**: Case removal triggers `caseDeleted` event

### System Operations
- ✅ **Dashboard Updates**: Statistics refresh trigger `adminStatsUpdated` event
- ✅ **Settings Changes**: Configuration updates trigger `systemSettingsChanged` event
- ✅ **Database Operations**: Backup/maintenance trigger appropriate events
- ✅ **Bulk Operations**: Mass operations trigger `bulkOperationCompleted` event

## Cross-Platform Synchronization

### Static Site ↔ Mobile App
- **Shared Database**: Both platforms use the same Azure SQL database
- **Shared API**: Both platforms use the same backend API
- **Shared SignalR Hub**: Real-time events work across both platforms
- **Shared Authentication**: Users can switch between platforms seamlessly

### Real-Time Updates Flow
1. **Admin Action**: Admin performs operation on static site or mobile app
2. **Database Change**: Backend updates database record
3. **SignalR Broadcast**: Backend triggers SignalR event to all connected clients
4. **Client Update**: All connected clients (static site + mobile app) receive event
5. **Cache Invalidation**: React Query caches are invalidated
6. **UI Refresh**: User interfaces automatically update with new data

## Monitoring and Debugging

### Event Logging
All SignalR events are logged with structured data:
```typescript
logEvent('signalr_user_role_changed', { 
  userId: payload.id, 
  newRole: payload.role 
});
```

### Connection Status
Monitor SignalR connection health:
```typescript
const status = RealtimeSyncService.getSyncStatus();
console.log('SignalR Connected:', status.signalRConnected);
```

### Error Handling
Comprehensive error handling for:
- Connection failures
- Event processing errors
- Cache invalidation failures
- Network issues

## Testing Real-Time Sync

### 1. User Management Test
1. Open static site admin dashboard
2. Change a user's role
3. Check mobile app admin portal
4. Verify user list updates automatically

### 2. Case Management Test
1. Create a new case on mobile app
2. Check static site dashboard
3. Verify case appears in real-time
4. Update case status on static site
5. Check mobile app cases list
6. Verify status updates automatically

### 3. Admin Operations Test
1. Perform bulk user operations
2. Check both platforms for updates
3. Verify dashboard statistics refresh
4. Test system settings changes

## Best Practices

### 1. Always Use Admin Service
```typescript
// ✅ Good - Triggers real-time sync
await AdminService.updateUserRole(userId, 'admin');

// ❌ Bad - Bypasses real-time sync
await ApiClient.patch(`/api/Admin/users/${userId}`, { role: 'admin' });
```

### 2. Handle Connection Issues
```typescript
// Check connection before operations
if (!signalRService.isConnected()) {
  await signalRService.startConnection();
}
```

### 3. Monitor Sync Status
```typescript
// Regular health checks
const status = RealtimeSyncService.getSyncStatus();
if (!status.signalRConnected) {
  // Handle reconnection
}
```

## Troubleshooting

### Common Issues

1. **Events Not Received**
   - Check SignalR connection status
   - Verify admin group membership
   - Check network connectivity

2. **Cache Not Updating**
   - Verify React Query is properly configured
   - Check query key invalidation
   - Ensure proper error handling

3. **Cross-Platform Sync Issues**
   - Verify both platforms use same API
   - Check authentication tokens
   - Ensure SignalR hub is shared

### Debug Commands
```typescript
// Check SignalR status
console.log('SignalR Connected:', signalRService.isConnected());

// Check sync status
const status = RealtimeSyncService.getSyncStatus();
console.log('Sync Status:', status);

// Force refresh
await RealtimeSyncService.forceRefreshAdminData();
```

## Security Considerations

- All SignalR events require valid authentication tokens
- Admin operations require proper role-based permissions
- Sensitive data is not exposed in event payloads
- All operations are logged for audit trails

## Performance Optimization

- Events are batched when possible
- Cache invalidation is targeted to specific queries
- Connection pooling reduces overhead
- Automatic reconnection prevents data loss

This real-time synchronization system ensures that all database changes are immediately reflected across both the static site and mobile app, providing a seamless admin experience and consistent data across all platforms.

