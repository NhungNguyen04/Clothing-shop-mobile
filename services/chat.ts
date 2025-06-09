import axiosInstance from './axiosInstance';
import { Seller } from './seller';
import { User } from './user';
import { io, Socket } from 'socket.io-client';

// Types for conversations and messages
export interface Message {
  id: string;
  senderId: string;
  conversationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
  user: User;
  seller: Seller;
}

// Conversation related functions
export const createConversation = async (userId: string, sellerId: string): Promise<Conversation> => {
  try {
    const response = await axiosInstance.post(`/conversations`, { userId, sellerId });
    return response.data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const getConversation = async (conversationId: string): Promise<Conversation> => {
  try {
    const response = await axiosInstance.get(`/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const response = await axiosInstance.get(`/conversations/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
};

export const getSellerConversations = async (sellerId: string): Promise<Conversation[]> => {
  try {
    const response = await axiosInstance.get(`/conversations/seller/${sellerId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting seller conversations:', error);
    throw error;
  }
};

// Message related functions
export const sendMessage = async (
  senderId: string, 
  conversationId: string, 
  content: string
): Promise<Message> => {
  try {
    const response = await axiosInstance.post(`/messages`, {
      senderId,
      conversationId,
      content
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessage = async (messageId: string): Promise<Message> => {
  try {
    const response = await axiosInstance.get(`/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting message:', error);
    throw error;
  }
};

export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const response = await axiosInstance.get(`/messages/conversation/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    throw error;
  }
};

// Add this new function to fetch the last message
export const getLastMessage = async (conversationId: string): Promise<Message | null> => {
  try {
    const response = await axiosInstance.get(`/conversations/last-message/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting last message:', error);
    return null;
  }
};

// Get WebSocket base URL from the axiosInstance base URL
const getWebSocketUrl = () => {
  const baseUrl = axiosInstance.defaults.baseURL || '';
  // Replace http(s):// with ws(s)://
  return baseUrl.replace(/^http(s)?:\/\//, 'ws$1://') + '/chat';
};

// WebSocket implementation for real-time messaging
// Replace the ChatWebSocket class with this Socket.io implementation

// WebSocket implementation for real-time messaging
export class ChatWebSocket {
  private socket: Socket | null = null;
  private messageHandlers: ((message: Message) => void)[] = [];
  private currentConversationId: string | null = null;

  constructor(private userId: string) {}

  connect(): void {
    const wsUrl = axiosInstance.defaults.baseURL?.replace(/^http(s)?:\/\//, '') || '';
    
    this.socket = io(`http://${wsUrl}/conversations`, {
      query: { userId: this.userId },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket.io connected');
      
      // Rejoin conversation room if we have one
      if (this.currentConversationId) {
        this.joinConversation(this.currentConversationId);
      }
    });

    // Listen for messages from the server
    this.socket.on('message', (message: Message) => {
      console.log('Received message via socket:', message);
      this.notifyHandlers(message);
    });

    this.socket.on('error', (error) => {
      console.error('Socket.io error:', error);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });
  }

  // Join a conversation room to receive messages
  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      console.error('Cannot join conversation: Socket not connected');
      return;
    }
    
    console.log(`Joining conversation room: ${conversationId}`);
    this.socket.emit('joinConversation', conversationId, (response: any) => {
      console.log('Join conversation response:', response);
    });
    
    this.currentConversationId = conversationId;
  }

  // Leave the current conversation room
  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) return;
    
    console.log(`Leaving conversation room: ${conversationId}`);
    this.socket.emit('leaveConversation', conversationId);
    
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
  }

  // Modified to handle the sending of messages through Socket.io only
  // The backend will handle the database persistence
  sendMessage(message: { conversationId: string; content: string }): void {
    if (!this.socket?.connected) {
      console.error('Cannot send message: Socket not connected');
      return;
    }
    
    console.log('Sending message via socket:', message);
    
    // Add the senderId to the message
    const fullMessage = {
      ...message,
      senderId: this.userId
    };
    
    this.socket.emit('sendMessage', fullMessage, (response: any) => {
      console.log('Send message response:', response);
    });
  }

  disconnect(): void {
    if (this.currentConversationId) {
      this.leaveConversation(this.currentConversationId);
    }
    this.socket?.disconnect();
    this.socket = null;
  }

  onMessage(handler: (message: Message) => void): () => void {
    this.messageHandlers.push(handler);
    
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  private notifyHandlers(message: Message): void {
    this.messageHandlers.forEach(handler => handler(message));
  }
}