import { http } from '../lib/http';
import { logEvent } from '../lib/crash';

export interface TopicSubscription {
  topic: string;
  subscribed: boolean;
}

export class TopicService {
  // Global topics
  static readonly GLOBAL_TOPICS = {
    ALL: 'org_all',
    SYSTEM: 'org_system',
  };

  // Role-based topics
  static readonly ROLE_TOPICS = {
    ADMIN: 'role_admin',
    PARENT: 'role_parent',
    MODERATOR: 'role_moderator',
  };

  // Case-specific topics
  static getCaseTopic(caseId: string): string {
    return `case_${caseId}`;
  }

  // Geographic topics (optional)
  static readonly GEO_TOPICS = {
    TEXAS_HOUSTON: 'region_tx_houston',
    TEXAS_DALLAS: 'region_tx_dallas',
  };

  /**
   * Subscribe to a topic
   */
  static async subscribeToTopic(topic: string): Promise<void> {
    try {
      // Try the API endpoint first
      await http.post('/api/v1/topics/subscribe', { topic });
      logEvent('topic_subscribed', { topic });
      console.log('✅ Subscribed to topic via API:', topic);
    } catch (apiError) {
      console.warn('⚠️ API topic subscription failed, trying SignalR fallback:', apiError);
      
      // If API fails, try SignalR group join as fallback
      try {
        const { signalRService } = await import('./signalR');
        await signalRService.joinGroup(`topic_${topic}`);
        logEvent('topic_subscribed_signalr', { topic });
        console.log('✅ Subscribed to topic via SignalR group:', topic);
      } catch (signalRError) {
        console.warn('⚠️ SignalR topic subscription also failed:', signalRError);
        // Don't throw error - just log it and continue
        console.log('📝 Topic subscription not available, continuing without real-time updates for:', topic);
        logEvent('topic_subscribe_not_available', { topic, apiError: String(apiError), signalRError: String(signalRError) });
      }
    }
  }

  /**
   * Unsubscribe from a topic
   */
  static async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await http.post('/api/v1/topics/unsubscribe', { topic });

      logEvent('topic_unsubscribed', { topic });
      console.log('Unsubscribed from topic:', topic);
    } catch (error) {
      console.error('Failed to unsubscribe from topic:', topic, error);
      logEvent('topic_unsubscribe_failed', { topic, error: String(error) });
      throw error;
    }
  }

  /**
   * Get user's current topic subscriptions
   */
  static async getUserSubscriptions(): Promise<TopicSubscription[]> {
    try {
      const response = await http.get('/api/v1/topics/subscriptions');
      return response.data;
    } catch (error) {
      console.error('Failed to get user subscriptions:', error);
      logEvent('topic_subscriptions_failed', { error: String(error) });
      throw error;
    }
  }

  /**
   * Subscribe to case updates
   */
  static async subscribeToCase(caseId: string): Promise<void> {
    const topic = this.getCaseTopic(caseId);
    await this.subscribeToTopic(topic);
  }

  /**
   * Unsubscribe from case updates
   */
  static async unsubscribeFromCase(caseId: string): Promise<void> {
    const topic = this.getCaseTopic(caseId);
    await this.unsubscribeFromTopic(topic);
  }

  /**
   * Subscribe to role-based notifications
   */
  static async subscribeToRoleTopic(role: string): Promise<void> {
    const topicKey = role.toUpperCase() as keyof typeof TopicService.ROLE_TOPICS;
    const topic = TopicService.ROLE_TOPICS[topicKey];

    if (!topic) {
      throw new Error(`Unknown role: ${role}`);
    }

    await this.subscribeToTopic(topic);
  }

  /**
   * Subscribe to geographic notifications
   */
  static async subscribeToGeoRegion(region: string): Promise<void> {
    const topicKey = region.toUpperCase() as keyof typeof TopicService.GEO_TOPICS;
    const topic = TopicService.GEO_TOPICS[topicKey];

    if (!topic) {
      throw new Error(`Unknown geographic region: ${region}`);
    }

    await this.subscribeToTopic(topic);
  }

  /**
   * Subscribe to all default topics based on user role
   */
  static async subscribeToDefaultTopics(userRole?: string): Promise<void> {
    const topics = [TopicService.GLOBAL_TOPICS.ALL, TopicService.GLOBAL_TOPICS.SYSTEM];

    // Add role-specific topic
    if (userRole) {
      try {
        await this.subscribeToRoleTopic(userRole);
      } catch (error) {
        console.warn('Failed to subscribe to role topic:', userRole, error);
      }
    }

    // Subscribe to all topics
    for (const topic of topics) {
      try {
        await this.subscribeToTopic(topic);
      } catch (error) {
        console.warn('Failed to subscribe to topic:', topic, error);
      }
    }
  }

  /**
   * Check if user is subscribed to a topic
   */
  static async isSubscribedToTopic(topic: string): Promise<boolean> {
    try {
      const subscriptions = await this.getUserSubscriptions();
      return subscriptions.some(sub => sub.topic === topic && sub.subscribed);
    } catch (error) {
      console.error('Failed to check topic subscription:', topic, error);
      return false;
    }
  }
}
