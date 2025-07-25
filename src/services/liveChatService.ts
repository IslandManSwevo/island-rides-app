/**
 * Live Chat Service
 * Manages real-time customer service chat functionality
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { realTimeService, ChatMessage, TypingIndicator } from './realTimeService';
import { loggingService } from './LoggingService';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';

export interface ChatConversation {
  id: string;
  userId: string;
  agentId?: string;
  agentName?: string;
  status: 'waiting' | 'active' | 'resolved' | 'closed';
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  lastMessageAt: string;
  messages: ChatMessage[];
  unreadCount: number;
  estimatedWaitTime?: number;
  queuePosition?: number;
  tags: string[];
}

export interface ChatSettings {
  soundEnabled: boolean;
  showTypingIndicators: boolean;
  showReadReceipts: boolean;
  autoMarkAsRead: boolean;
  offlineMessageQueue: boolean;
}

export interface ChatMetrics {
  totalConversations: number;
  activeConversations: number;
  averageResponseTime: number;
  customerSatisfactionScore?: number;
  messagesExchanged: number;
}

type MessageCallback = (message: ChatMessage) => void;
type ConversationCallback = (conversation: ChatConversation) => void;
type TypingCallback = (indicator: TypingIndicator) => void;
type ConnectionCallback = (connected: boolean) => void;

class LiveChatService {
  private conversations: Map<string, ChatConversation> = new Map();
  private messageCallbacks: Set<MessageCallback> = new Set();
  private conversationCallbacks: Set<ConversationCallback> = new Set();
  private typingCallbacks: Set<TypingCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private offlineMessageQueue: ChatMessage[] = [];
  private typingTimer: NodeJS.Timeout | null = null;
  private currentUserId: string | null = null;
  
  private settings: ChatSettings = {
    soundEnabled: true,
    showTypingIndicators: true,
    showReadReceipts: true,
    autoMarkAsRead: true,
    offlineMessageQueue: true,
  };

  constructor() {
    this.setupRealTimeListeners();
    this.loadOfflineMessages();
  }

  /**
   * Setup real-time event listeners
   */
  private setupRealTimeListeners(): void {
    realTimeService.subscribe<ChatMessage>('chat_message', this.handleIncomingMessage.bind(this));
    realTimeService.subscribe<TypingIndicator>('typing_indicator', this.handleTypingIndicator.bind(this));
    
    realTimeService.subscribe('connection_status', (status) => {
      this.connectionCallbacks.forEach(callback => {
        try {
          callback(status.connected);
        } catch (error) {
          loggingService.error('Error in connection callback', error as Error);
        }
      });

      if (status.connected) {
        this.processOfflineMessageQueue();
      }
    });
  }

  /**
   * Initialize chat service for user
   */
  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    try {
      // Load existing conversations
      await this.loadConversations();
      
      // Load settings
      await this.loadSettings();
      
      loggingService.info('Live chat service initialized', { userId });
      
    } catch (error) {
      loggingService.error('Failed to initialize live chat service', error as Error);
      throw error;
    }
  }

  /**
   * Start a new conversation
   */
  async startConversation(
    subject: string,
    initialMessage: string,
    priority: ChatConversation['priority'] = 'medium',
    tags: string[] = []
  ): Promise<ChatConversation> {
    if (!this.currentUserId) {
      throw new Error('Chat service not initialized');
    }

    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation: ChatConversation = {
      id: conversationId,
      userId: this.currentUserId,
      status: 'waiting',
      subject,
      priority,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messages: [],
      unreadCount: 0,
      tags,
    };

    // Send initial message
    await this.sendMessage(conversationId, initialMessage);
    
    this.conversations.set(conversationId, conversation);
    await this.saveConversations();

    // Notify callbacks
    this.conversationCallbacks.forEach(callback => {
      try {
        callback({ ...conversation });
      } catch (error) {
        loggingService.error('Error in conversation callback', error as Error);
      }
    });

    // Track analytics
    analyticsService.trackEvent('chat_conversation_started', {
      conversationId,
      subject,
      priority,
      tagCount: tags.length,
    });

    return conversation;
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    message: string,
    messageType: ChatMessage['messageType'] = 'text'
  ): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Chat service not initialized');
    }

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId: this.currentUserId,
      senderType: 'user',
      message,
      messageType,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    // Add to conversation
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.messages.push(chatMessage);
      conversation.lastMessageAt = chatMessage.timestamp;
      this.conversations.set(conversationId, conversation);
    }

    // Send via real-time service or queue if offline
    if (realTimeService.isConnected()) {
      try {
        realTimeService.sendChatMessage(conversationId, message, messageType);
        chatMessage.status = 'sent';
      } catch (error) {
        chatMessage.status = 'failed';
        if (this.settings.offlineMessageQueue) {
          this.queueOfflineMessage(chatMessage);
        }
      }
    } else if (this.settings.offlineMessageQueue) {
      this.queueOfflineMessage(chatMessage);
    } else {
      chatMessage.status = 'failed';
    }

    // Update conversation
    if (conversation) {
      const messageIndex = conversation.messages.findIndex(m => m.id === chatMessage.id);
      if (messageIndex !== -1) {
        conversation.messages[messageIndex] = chatMessage;
        this.conversations.set(conversationId, conversation);
      }
    }

    await this.saveConversations();

    // Notify callbacks
    this.messageCallbacks.forEach(callback => {
      try {
        callback({ ...chatMessage });
      } catch (error) {
        loggingService.error('Error in message callback', error as Error);
      }
    });

    // Track analytics
    analyticsService.trackEvent('chat_message_sent', {
      conversationId,
      messageType,
      messageLength: message.length,
      status: chatMessage.status,
    });
  }

  /**
   * Handle incoming messages
   */
  private handleIncomingMessage(message: ChatMessage): void {
    const conversation = this.conversations.get(message.conversationId);
    
    if (!conversation) {
      loggingService.warn('Received message for unknown conversation', {
        conversationId: message.conversationId,
      });
      return;
    }

    // Add message to conversation
    conversation.messages.push(message);
    conversation.lastMessageAt = message.timestamp;
    
    // Update unread count if not from current user
    if (message.senderType !== 'user') {
      conversation.unreadCount++;
    }

    // Update conversation status if agent joined
    if (message.senderType === 'agent' && conversation.status === 'waiting') {
      conversation.status = 'active';
      conversation.agentId = message.senderId;
      // Agent name would come from message metadata
    }

    this.conversations.set(message.conversationId, conversation);
    this.saveConversations();

    // Show notification for agent messages
    if (message.senderType === 'agent') {
      this.showMessageNotification(message, conversation);
    }

    // Notify callbacks
    this.messageCallbacks.forEach(callback => {
      try {
        callback({ ...message });
      } catch (error) {
        loggingService.error('Error in message callback', error as Error);
      }
    });

    this.conversationCallbacks.forEach(callback => {
      try {
        callback({ ...conversation });
      } catch (error) {
        loggingService.error('Error in conversation callback', error as Error);
      }
    });

    // Auto-mark as read if enabled
    if (this.settings.autoMarkAsRead && message.senderType === 'agent') {
      this.markMessageAsRead(message.id);
    }
  }

  /**
   * Handle typing indicators
   */
  private handleTypingIndicator(indicator: TypingIndicator): void {
    if (!this.settings.showTypingIndicators) return;

    this.typingCallbacks.forEach(callback => {
      try {
        callback({ ...indicator });
      } catch (error) {
        loggingService.error('Error in typing callback', error as Error);
      }
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.settings.showTypingIndicators) return;

    realTimeService.sendTypingIndicator(conversationId, isTyping);

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      if (this.typingTimer) {
        clearTimeout(this.typingTimer);
      }
      
      this.typingTimer = setTimeout(() => {
        realTimeService.sendTypingIndicator(conversationId, false);
      }, 3000);
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    // Find conversation containing this message
    for (const conversation of this.conversations.values()) {
      const message = conversation.messages.find(m => m.id === messageId);
      if (message && message.status !== 'read') {
        message.status = 'read';
        
        // Decrease unread count
        if (conversation.unreadCount > 0) {
          conversation.unreadCount--;
        }
        
        await this.saveConversations();
        break;
      }
    }
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    conversation.unreadCount = 0;
    conversation.messages.forEach(message => {
      if (message.senderType !== 'user' && message.status !== 'read') {
        message.status = 'read';
      }
    });

    this.conversations.set(conversationId, conversation);
    await this.saveConversations();
  }

  /**
   * Show message notification
   */
  private showMessageNotification(message: ChatMessage, conversation: ChatConversation): void {
    const agentName = conversation.agentName || 'Support Agent';
    
    notificationService.show(`${agentName}: ${message.message}`, {
      type: 'info',
      duration: 5000,
      sound: this.settings.soundEnabled,
      action: {
        label: 'Reply',
        handler: () => {
          analyticsService.trackEvent('chat_notification_clicked', {
            conversationId: message.conversationId,
            messageId: message.id,
          });
        }
      }
    });
  }

  /**
   * Queue message for offline sending
   */
  private queueOfflineMessage(message: ChatMessage): void {
    this.offlineMessageQueue.push(message);
    this.saveOfflineMessages();
  }

  /**
   * Process offline message queue
   */
  private async processOfflineMessageQueue(): Promise<void> {
    if (this.offlineMessageQueue.length === 0) return;

    const messages = [...this.offlineMessageQueue];
    this.offlineMessageQueue = [];

    for (const message of messages) {
      try {
        realTimeService.sendChatMessage(
          message.conversationId,
          message.message,
          message.messageType
        );
        
        message.status = 'sent';
        
        // Update conversation
        const conversation = this.conversations.get(message.conversationId);
        if (conversation) {
          const messageIndex = conversation.messages.findIndex(m => m.id === message.id);
          if (messageIndex !== -1) {
            conversation.messages[messageIndex] = message;
            this.conversations.set(message.conversationId, conversation);
          }
        }
      } catch (error) {
        loggingService.error('Failed to send queued message', error as Error);
        message.status = 'failed';
      }
    }

    await this.saveConversations();
    await this.saveOfflineMessages();
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId: string): ChatConversation | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Get all conversations
   */
  getAllConversations(): ChatConversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  /**
   * Get conversations by status
   */
  getConversationsByStatus(status: ChatConversation['status']): ChatConversation[] {
    return this.getAllConversations().filter(conv => conv.status === status);
  }

  /**
   * Subscribe to messages
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  /**
   * Subscribe to conversations
   */
  onConversation(callback: ConversationCallback): () => void {
    this.conversationCallbacks.add(callback);
    return () => this.conversationCallbacks.delete(callback);
  }

  /**
   * Subscribe to typing indicators
   */
  onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.add(callback);
    return () => this.typingCallbacks.delete(callback);
  }

  /**
   * Subscribe to connection status
   */
  onConnection(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  /**
   * Update chat settings
   */
  async updateSettings(newSettings: Partial<ChatSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  /**
   * Get current settings
   */
  getSettings(): ChatSettings {
    return { ...this.settings };
  }

  /**
   * Get chat metrics
   */
  getChatMetrics(): ChatMetrics {
    const conversations = this.getAllConversations();
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    
    return {
      totalConversations: conversations.length,
      activeConversations: conversations.filter(c => c.status === 'active').length,
      averageResponseTime: 0, // Would calculate from message timestamps
      messagesExchanged: totalMessages,
    };
  }

  /**
   * Storage methods
   */
  private async loadConversations(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(`chat_conversations_${this.currentUserId}`);
      if (stored) {
        const conversations: ChatConversation[] = JSON.parse(stored);
        conversations.forEach(conv => {
          this.conversations.set(conv.id, conv);
        });
      }
    } catch (error) {
      loggingService.warn('Failed to load conversations', error as Error);
    }
  }

  private async saveConversations(): Promise<void> {
    try {
      const conversations = Array.from(this.conversations.values());
      await AsyncStorage.setItem(
        `chat_conversations_${this.currentUserId}`,
        JSON.stringify(conversations)
      );
    } catch (error) {
      loggingService.warn('Failed to save conversations', error as Error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(`chat_settings_${this.currentUserId}`);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      loggingService.warn('Failed to load chat settings', error as Error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `chat_settings_${this.currentUserId}`,
        JSON.stringify(this.settings)
      );
    } catch (error) {
      loggingService.warn('Failed to save chat settings', error as Error);
    }
  }

  private async loadOfflineMessages(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('chat_offline_messages');
      if (stored) {
        this.offlineMessageQueue = JSON.parse(stored);
      }
    } catch (error) {
      loggingService.warn('Failed to load offline messages', error as Error);
    }
  }

  private async saveOfflineMessages(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'chat_offline_messages',
        JSON.stringify(this.offlineMessageQueue)
      );
    } catch (error) {
      loggingService.warn('Failed to save offline messages', error as Error);
    }
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    this.conversations.clear();
    this.offlineMessageQueue = [];
    this.messageCallbacks.clear();
    this.conversationCallbacks.clear();
    this.typingCallbacks.clear();
    this.connectionCallbacks.clear();

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }

    // Clear stored data
    if (this.currentUserId) {
      await AsyncStorage.removeItem(`chat_conversations_${this.currentUserId}`);
      await AsyncStorage.removeItem(`chat_settings_${this.currentUserId}`);
    }
    await AsyncStorage.removeItem('chat_offline_messages');

    loggingService.info('Live chat service cleared');
  }
}

export const liveChatService = new LiveChatService();
