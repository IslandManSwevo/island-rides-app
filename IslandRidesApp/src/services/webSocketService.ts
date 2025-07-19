import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types';
import { notificationService } from './notificationService';
import { getEnvironmentConfig } from '../config/environment';
import { authService } from './authService';

// Define the event types for better type safety

export type WebSocketEvent = keyof ServerToClientEvents | keyof ClientToServerEvents;

interface ServerToClientEvents {
  new_message: (message: ChatMessage) => void;
  'typing:start': (data: { userId: string; userName: string }) => void;
  'typing:stop': (data: { userId: string }) => void;
  connect: () => void;
  disconnect: () => void;
  reconnect_attempt: (attempt: number) => void;
  connect_error: (error: Error) => void;
}

interface ClientToServerEvents {
  join_conversation: (data: { conversationId: number }) => void;
  send_message: (data: { conversationId: number; content: string; messageType: 'text' }) => void;
  'typing:start': (data: { conversationId: number }) => void;
  'typing:stop': (data: { conversationId: number }) => void;
}

class WebSocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private maxReconnectAttempts = 5;
  private eventListeners = new Map<string, Function[]>();

  public async connect(token: string): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    try {
      const envConfig = await getEnvironmentConfig();
      const url = envConfig.WS_URL;
      
      this.socket = io(url, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.setupListeners();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      notificationService.error('Failed to connect to chat server', {
        title: 'Connection Failed',
        duration: 5000,
      });
    }
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      notificationService.success('Connected to chat server', {
        duration: 2000,
      });
    });

    this.socket.on('disconnect', () => {
      notificationService.warning('Lost connection to chat server', {
        duration: 3000, // Auto-close after 3 seconds to prevent stacking
        closable: true,
      });
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      if (attempt >= this.maxReconnectAttempts) { // Fixed: Use >= instead of ===
        notificationService.error('Unable to connect to chat server', {
          title: 'Connection Failed',
          duration: 5000,
        });
      }
    });

    this.socket.on('connect_error', async (error) => {
      if (error.message.includes('Authentication error')) {
        try {
          console.log('WebSocket authentication error, attempting to refresh token...');
          const newToken = await authService.refreshToken();
          if (newToken && this.socket) {
            this.socket.auth = { ...this.socket.auth, token: newToken };
            this.socket.connect();
            notificationService.info('Reconnecting with new token...', { duration: 2000 });
          } else {
            notificationService.error('Session expired. Please log in again.', {
              title: 'Authentication Failed',
            });
          }
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          notificationService.error('Session expired. Please log in again.', {
            title: 'Authentication Failed',
          });
          this.disconnect();
        }
      } else {
        notificationService.error(error.message || 'Chat error occurred', {
          title: 'Chat Error',
          duration: 4000,
        });
      }
    });
  }

  private removeAllListeners(): void {
    if (!this.socket) return;

    // Remove built-in event listeners
    this.socket.off('connect');
    this.socket.off('disconnect');
    this.socket.off('reconnect_attempt');
    this.socket.off('connect_error');
    this.socket.off('new_message');
    this.socket.off('typing:start');
    this.socket.off('typing:stop');

    // Remove custom event listeners
    this.eventListeners.forEach((listeners, eventName) => {
      listeners.forEach(listener => {
        this.socket?.off(eventName as keyof ServerToClientEvents, listener as any);
      });
    });
    this.eventListeners.clear();
  }

  public joinConversation(conversationId: number): void {
    this.socket?.emit('join_conversation', { conversationId });
  }

  public sendMessage(conversationId: number, content: string): void {
    this.socket?.emit('send_message', {
      conversationId,
      content,
      messageType: 'text',
    });
  }

  public onNewMessage(callback: (message: ChatMessage) => void): void {
    if (!this.socket) return;
    
    this.socket.on('new_message', callback);
    
    // Track the listener for cleanup
    if (!this.eventListeners.has('new_message')) {
      this.eventListeners.set('new_message', []);
    }
    this.eventListeners.get('new_message')!.push(callback);
  }

  public offNewMessage(callback: (message: ChatMessage) => void): void {
    if (!this.socket) return;
    
    this.socket.off('new_message', callback);
    
    // Remove from tracking
    const listeners = this.eventListeners.get('new_message');
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public onTypingStart(callback: (data: { userId: string; userName: string }) => void): void {
    if (!this.socket) return;
    
    this.socket.on('typing:start', callback);
    
    // Track the listener for cleanup
    if (!this.eventListeners.has('typing:start')) {
      this.eventListeners.set('typing:start', []);
    }
    this.eventListeners.get('typing:start')!.push(callback);
  }

  public offTypingStart(callback: (data: { userId: string; userName: string }) => void): void {
    if (!this.socket) return;
    
    this.socket.off('typing:start', callback);
    
    // Remove from tracking
    const listeners = this.eventListeners.get('typing:start');
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public onTypingStop(callback: (data: { userId: string }) => void): void {
    if (!this.socket) return;
    
    this.socket.on('typing:stop', callback);
    
    // Track the listener for cleanup
    if (!this.eventListeners.has('typing:stop')) {
      this.eventListeners.set('typing:stop', []);
    }
    this.eventListeners.get('typing:stop')!.push(callback);
  }

  public offTypingStop(callback: (data: { userId: string }) => void): void {
    if (!this.socket) return;
    
    this.socket.off('typing:stop', callback);
    
    // Remove from tracking
    const listeners = this.eventListeners.get('typing:stop');
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public emitTyping(conversationId: number): void {
    this.socket?.emit('typing:start', { conversationId });
  }

  public stopTyping(conversationId: number): void {
    this.socket?.emit('typing:stop', { conversationId });
  }

  public disconnect(): void {
    if (this.socket) {
      // Clean up all event listeners before disconnecting
      this.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Method to clean up specific event listeners without disconnecting
  public removeListeners(eventName: WebSocketEvent): void {
    if (!this.socket) return;

    const event = eventName as keyof ServerToClientEvents;
    this.socket.off(event);
    this.eventListeners.delete(event);
  }

  // Method to clean up all listeners without disconnecting
  public removeAllEventListeners(): void {
    this.removeAllListeners();
  }
}

export const webSocketService = new WebSocketService();
