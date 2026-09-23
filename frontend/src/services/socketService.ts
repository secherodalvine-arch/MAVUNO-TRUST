import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:8000';

class SocketService {
  private socket: Socket | null = null;
  private currentConversationId: string | null = null;

  connect(token: string) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'], // Fallback if WS blocked
      });

      this.socket.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err.message);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      if (this.currentConversationId) {
        this.leaveConversation(this.currentConversationId);
      }
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId: string) {
    if (this.socket) {
      if (this.currentConversationId && this.currentConversationId !== conversationId) {
        this.leaveConversation(this.currentConversationId);
      }
      this.socket.emit('join_conversation', conversationId);
      this.currentConversationId = conversationId;
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit('leave_conversation', conversationId);
      if (this.currentConversationId === conversationId) {
        this.currentConversationId = null;
      }
    }
  }

  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      // Remove any existing listeners to prevent duplicates
      this.socket.off('new_message');
      this.socket.on('new_message', callback);
    }
  }

  onMessagesRead(callback: (data: { conversationId: string; readerId: string }) => void) {
    if (this.socket) {
      this.socket.off('messages_read');
      this.socket.on('messages_read', callback);
    }
  }

  onNewNotification(callback: (notification: any) => void) {
    if (this.socket) {
      this.socket.off('new_notification');
      this.socket.on('new_notification', callback);
    }
  }

  onError(callback: (error: any) => void) {
    if (this.socket) {
      this.socket.off('error_message');
      this.socket.on('error_message', callback);
    }
  }
}

export const socketService = new SocketService();
