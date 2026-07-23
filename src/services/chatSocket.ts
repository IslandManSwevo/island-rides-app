import { io, Socket } from 'socket.io-client';
import { apiService } from './apiService';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

/**
 * Thin client for the KeyLo realtime chat namespace (backend/src/realtime/socket.ts).
 * One shared socket, authenticated with the current access token; screens
 * join/leave conversation rooms and subscribe to message events.
 */
class ChatSocket {
  private socket: Socket | null = null;

  async connect(): Promise<Socket | null> {
    if (this.socket?.connected) return this.socket;
    const token = await apiService.getToken();
    if (!token) return null;

    this.socket = io(BASE_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
    });
    return this.socket;
  }

  async join(conversationId: string): Promise<void> {
    const socket = await this.connect();
    socket?.emit('conversation:join', conversationId);
  }

  leave(conversationId: string): void {
    this.socket?.emit('conversation:leave', conversationId);
  }

  /** Send a message; resolves with the persisted message from the server ack. */
  send(conversationId: string, body: string): Promise<ChatMessage | null> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve(null);
      this.socket.emit('message:send', { conversationId, body }, (res: { ok?: boolean; message?: ChatMessage }) => {
        resolve(res?.message ?? null);
      });
    });
  }

  markRead(conversationId: string): void {
    this.socket?.emit('message:read', conversationId);
  }

  sendTyping(conversationId: string): void {
    this.socket?.emit('typing', conversationId);
  }

  onMessage(cb: (m: ChatMessage) => void): () => void {
    this.socket?.on('message:new', cb);
    return () => this.socket?.off('message:new', cb);
  }

  onTyping(cb: (p: { conversationId: string; userId: string }) => void): () => void {
    this.socket?.on('typing', cb);
    return () => this.socket?.off('typing', cb);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const chatSocket = new ChatSocket();
