import { signalRService } from './signalR';
import { logEvent } from '../lib/crash';

/**
 * Manages SignalR group memberships and provides fallback mechanisms
 */
export class GroupManager {
  private static joinedGroups = new Set<string>();
  private static isInitialized = false;

  /**
   * Initialize the group manager
   */
  static initialize(): void {
    this.isInitialized = true;
    console.log('GroupManager initialized');
  }

  /**
   * Join a group with fallback mechanisms
   */
  static async joinGroup(groupName: string): Promise<boolean> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      // Try to join the group
      await signalRService.joinGroup(groupName);
      this.joinedGroups.add(groupName);
      console.log(`✅ Successfully joined group: ${groupName}`);
      logEvent('group_joined', { groupName });
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to join group '${groupName}':`, error);
      logEvent('group_join_failed', { groupName, error: String(error) });
      return false;
    }
  }

  /**
   * Leave a group
   */
  static async leaveGroup(groupName: string): Promise<boolean> {
    try {
      await signalRService.leaveGroup(groupName);
      this.joinedGroups.delete(groupName);
      console.log(`✅ Successfully left group: ${groupName}`);
      logEvent('group_left', { groupName });
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to leave group '${groupName}':`, error);
      logEvent('group_leave_failed', { groupName, error: String(error) });
      return false;
    }
  }

  /**
   * Join multiple groups
   */
  static async joinGroups(groups: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };

    for (const group of groups) {
      const success = await this.joinGroup(group);
      if (success) {
        results.success.push(group);
      } else {
        results.failed.push(group);
      }
    }

    console.log(`📊 Group join results: ${results.success.length} success, ${results.failed.length} failed`);
    if (results.failed.length > 0) {
      console.log('❌ Failed groups:', results.failed);
    }

    return results;
  }

  /**
   * Get list of currently joined groups
   */
  static getJoinedGroups(): string[] {
    return Array.from(this.joinedGroups);
  }

  /**
   * Check if we're in a specific group
   */
  static isInGroup(groupName: string): boolean {
    return this.joinedGroups.has(groupName);
  }

  /**
   * Rejoin all groups (useful for reconnection)
   */
  static async rejoinAllGroups(): Promise<void> {
    const groups = Array.from(this.joinedGroups);
    console.log(`🔄 Rejoining ${groups.length} groups after reconnection...`);
    
    // Clear the current list
    this.joinedGroups.clear();
    
    // Rejoin all groups
    await this.joinGroups(groups);
  }

  /**
   * Leave all groups
   */
  static async leaveAllGroups(): Promise<void> {
    const groups = Array.from(this.joinedGroups);
    console.log(`👋 Leaving ${groups.length} groups...`);
    
    for (const group of groups) {
      await this.leaveGroup(group);
    }
  }

  /**
   * Get group management status
   */
  static getStatus(): {
    isInitialized: boolean;
    joinedGroups: string[];
    totalGroups: number;
  } {
    return {
      isInitialized: this.isInitialized,
      joinedGroups: this.getJoinedGroups(),
      totalGroups: this.joinedGroups.size,
    };
  }
}
