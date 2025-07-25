/**
 * Real-time Service
 * Manages WebSocket connections using Socket.IO for live updates
 * Handles vehicle availability, price changes, booking status, and chat functionality
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEnvironmentConfig } from '../config/environment';
import { loggingService } from './LoggingService';
import { performanceMonitor } from './PerformanceMonitor';
import { analyticsService } from './analyticsService';
import { VehicleRecommendation } from '../types';

export interface VehicleAvailabilityUpdate {
  vehicleId: string;
  available: boolean;
  lastUpdated: string;
  reason?: 'booked' | 'maintenance' | 'returned' | 'manual';
  nextAvailableDate?: string;
}

export interface VehiclePriceUpdate {
  vehicleId: string;
  oldPrice: number;
  newPrice: number;
  priceChangePercent: number;
  effectiveDate: string;
  reason?: 'demand' | 'promotion' | 'seasonal' | 'manual';
}

export interface BookingStatusUpdate {
  bookingId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'active' | 'completed' | 'cancelled';
  message?: string;
  estimatedTime?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'system';
  message: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
  };
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  lastConnected?: string;
  connectionAttempts: number;
  latency?: number;
}

type EventCallback<T = any> = (data: T) => void;

class RealTimeService {
  private socket: Socket | null = null;
  private connectionStatus: ConnectionStatus = {
    connected: false,
    reconnecting: false,
    connectionAttempts: 0,
  };
  
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private authToken: string | null = null;
  
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 2000; // 2 seconds
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  /**
   * Initialize WebSocket connection
   */
  async initialize(userId: string, authToken: string): Promise<void> {
    try {
      this.userId = userId;
      this.authToken = authToken;
      
      const config = getEnvironmentConfig();
      const socketUrl = config.WEBSOCKET_URL || 'ws://localhost:3001';
      
      // Create socket connection
      this.socket = io(socketUrl, {
        auth: {
          token: authToken,
          userId: userId,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: this.RECONNECT_DELAY,
      });

      this.setupEventHandlers();
      this.startHeartbeat();
      
      loggingService.info('Real-time service initialized', { userId, socketUrl });
      
    } catch (error) {
      loggingService.error('Failed to initialize real-time service', error as Error);
      throw error;
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.connectionStatus = {
        connected: true,
        reconnecting: false,
        lastConnected: new Date().toISOString(),
        connectionAttempts: 0,
      };
      
      this.clearReconnectTimer();
      this.emit('connection_status', this.connectionStatus);
      
      loggingService.info('WebSocket connected');
      analyticsService.trackEvent('websocket_connected', {
        userId: this.userId,
        connectionAttempts: this.connectionStatus.connectionAttempts,
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionStatus.connected = false;
      this.emit('connection_status', this.connectionStatus);
      
      loggingService.warn('WebSocket disconnected', new Error(reason));
      analyticsService.trackEvent('websocket_disconnected', {
        reason,
        userId: this.userId,
      });
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.connectionStatus.reconnecting = true;
      this.connectionStatus.connectionAttempts++;
      this.emit('connection_status', this.connectionStatus);
      
      loggingService.error('WebSocket connection error', error);
      performanceMonitor.recordMetric('websocket_connection_error', 1);
      
      if (this.connectionStatus.connectionAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
        this.emit('connection_failed', { 
          attempts: this.connectionStatus.connectionAttempts,
          error: error.message 
        });
      }
    });

    // Real-time data events
    this.socket.on('vehicle_availability_update', (data: VehicleAvailabilityUpdate) => {
      this.emit('vehicle_availability_update', data);
      analyticsService.trackEvent('vehicle_availability_received', {
        vehicleId: data.vehicleId,
        available: data.available,
        reason: data.reason,
      });
    });

    this.socket.on('vehicle_price_update', (data: VehiclePriceUpdate) => {
      this.emit('vehicle_price_update', data);
      analyticsService.trackEvent('vehicle_price_update_received', {
        vehicleId: data.vehicleId,
        priceChange: data.priceChangePercent,
        reason: data.reason,
      });
    });

    this.socket.on('booking_status_update', (data: BookingStatusUpdate) => {
      this.emit('booking_status_update', data);
      analyticsService.trackEvent('booking_status_received', {
        bookingId: data.bookingId,
        status: data.status,
      });
    });

    this.socket.on('chat_message', (data: ChatMessage) => {
      this.emit('chat_message', data);
      analyticsService.trackEvent('chat_message_received', {
        conversationId: data.conversationId,
        messageType: data.messageType,
        senderType: data.senderType,
      });
    });

    this.socket.on('typing_indicator', (data: TypingIndicator) => {
      this.emit('typing_indicator', data);
    });

    // Heartbeat response
    this.socket.on('pong', (latency: number) => {
      this.connectionStatus.latency = latency;
      performanceMonitor.recordMetric('websocket_latency', latency);
    });
  }

  /**
   * Subscribe to real-time events
   */
  subscribe<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(event);
        }
      }
    };
  }

  /**
   * Emit event to subscribers
   */
  private emit<T = any>(event: string, data: T): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          loggingService.error(`Error in event listener for ${event}`, error as Error);
        }
      });
    }
  }

  /**
   * Subscribe to vehicle updates for specific vehicles
   */
  subscribeToVehicleUpdates(vehicleIds: string[]): void {
    if (!this.socket?.connected) {
      loggingService.warn('Cannot subscribe to vehicle updates: not connected');
      return;
    }

    this.socket.emit('subscribe_vehicles', { vehicleIds });
    
    analyticsService.trackEvent('vehicle_subscription', {
      vehicleCount: vehicleIds.length,
      userId: this.userId,
    });
  }

  /**
   * Unsubscribe from vehicle updates
   */
  unsubscribeFromVehicleUpdates(vehicleIds: string[]): void {
    if (!this.socket?.connected) return;

    this.socket.emit('unsubscribe_vehicles', { vehicleIds });
  }

  /**
   * Subscribe to booking updates
   */
  subscribeToBookingUpdates(bookingIds: string[]): void {
    if (!this.socket?.connected) {
      loggingService.warn('Cannot subscribe to booking updates: not connected');
      return;
    }

    this.socket.emit('subscribe_bookings', { bookingIds });
    
    analyticsService.trackEvent('booking_subscription', {
      bookingCount: bookingIds.length,
      userId: this.userId,
    });
  }

  /**
   * Send chat message
   */
  sendChatMessage(conversationId: string, message: string, messageType: 'text' | 'image' | 'file' = 'text'): void {
    if (!this.socket?.connected) {
      loggingService.warn('Cannot send chat message: not connected');
      return;
    }

    const chatMessage: Partial<ChatMessage> = {
      conversationId,
      message,
      messageType,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    this.socket.emit('send_message', chatMessage);
    
    analyticsService.trackEvent('chat_message_sent', {
      conversationId,
      messageType,
      messageLength: message.length,
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing', {
      conversationId,
      isTyping,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Start heartbeat to monitor connection
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        const startTime = Date.now();
        this.socket.emit('ping', startTime);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectTimer) return;

    this.connectionStatus.reconnecting = true;
    this.emit('connection_status', this.connectionStatus);

    this.reconnectTimer = setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
      this.clearReconnectTimer();
    }, this.RECONNECT_DELAY);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Manually reconnect
   */
  reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.clearReconnectTimer();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.eventListeners.clear();
    this.connectionStatus = {
      connected: false,
      reconnecting: false,
      connectionAttempts: 0,
    };

    loggingService.info('Real-time service disconnected');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const realTimeService = new RealTimeService();

/**
 * Real-time Manager
 * Coordinates all real-time services and provides unified initialization
 */
export class RealTimeManager {
  private isInitialized = false;
  private userId: string | null = null;
  private authToken: string | null = null;

  /**
   * Initialize all real-time services
   */
  async initialize(userId: string, authToken: string): Promise<void> {
    if (this.isInitialized) {
      loggingService.warn('Real-time manager already initialized');
      return;
    }

    try {
      this.userId = userId;
      this.authToken = authToken;

      // Initialize core real-time service
      await realTimeService.initialize(userId, authToken);

      // Initialize chat service
      const { liveChatService } = await import('./liveChatService');
      await liveChatService.initialize(userId);

      this.isInitialized = true;

      loggingService.info('Real-time manager initialized successfully', { userId });

      analyticsService.trackEvent('realtime_manager_initialized', {
        userId,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggingService.error('Failed to initialize real-time manager', error as Error);
      throw error;
    }
  }

  /**
   * Cleanup all real-time services
   */
  async cleanup(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Cleanup individual services
      const { vehicleAvailabilityManager } = await import('./vehicleAvailabilityManager');
      const { priceUpdateManager } = await import('./priceUpdateManager');
      const { liveSearchManager } = await import('./liveSearchManager');
      const { bookingStatusManager } = await import('./bookingStatusManager');
      const { liveChatService } = await import('./liveChatService');

      vehicleAvailabilityManager.clearAll();
      priceUpdateManager.clearAll();
      liveSearchManager.clearAll();
      bookingStatusManager.clearAll();
      await liveChatService.clearAll();

      // Disconnect core service
      realTimeService.disconnect();

      this.isInitialized = false;
      this.userId = null;
      this.authToken = null;

      loggingService.info('Real-time manager cleaned up');

    } catch (error) {
      loggingService.error('Error during real-time manager cleanup', error as Error);
    }
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized && realTimeService.isConnected();
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return realTimeService.getConnectionStatus();
  }

  /**
   * Manual reconnect
   */
  reconnect(): void {
    if (this.isInitialized) {
      realTimeService.reconnect();
    }
  }
}

export const realTimeManager = new RealTimeManager();
