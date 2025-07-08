import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types';
import { notificationService } from './notificationService';

// Define the event types for better type safety
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

  public connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    const url = process.env.WEBSOCKET_URL || 'ws://localhost:3004';
    this.socket = io(url, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
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
        duration: 0,
        closable: false,
      });
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      if (attempt === this.maxReconnectAttempts) {
        notificationService.error('Unable to connect to chat server', {
          title: 'Connection Failed',
          duration: 5000,
        });
      }
    });

    this.socket.on('connect_error', (error) => {
      notificationService.error(error.message || 'Chat error occurred', {
        title: 'Chat Error',
        duration: 4000,
      });
    });
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
    this.socket?.on('new_message', callback);
  }

  public onTypingStart(callback: (data: { userId: string; userName: string }) => void): void {
    this.socket?.on('typing:start', callback);
  }

  public onTypingStop(callback: (data: { userId: string }) => void): void {
    this.socket?.on('typing:stop', callback);
  }

  public emitTyping(conversationId: number): void {
    this.socket?.emit('typing:start', { conversationId });
  }

  public stopTyping(conversationId: number): void {
    this.socket?.emit('typing:stop', { conversationId });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const webSocketService = new WebSocketService();
