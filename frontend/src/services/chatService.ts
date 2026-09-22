import apiClient from './apiClient';

export interface UserSnippet {
  _id: string;
  fullName: string;
}

export interface ListingSnippet {
  _id: string;
  cropName: string;
  estimatedQuantity: number;
  unit: string;
}

export interface ConversationDTO {
  _id: string;
  participants: UserSnippet[];
  relatedListingId?: ListingSnippet;
  relatedOfferId?: string;
  isActive: boolean;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDTO {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: string;
  isSystemMessage: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createOrGetConversation = async (targetUserId: string, offerId: string): Promise<ConversationDTO> => {
  const response = await apiClient.post('/chat/create', { targetUserId, offerId });
  return response.data.data;
};

export const getConversations = async (): Promise<ConversationDTO[]> => {
  const response = await apiClient.get('/chat');
  return response.data.data;
};

export const getMessages = async (conversationId: string): Promise<MessageDTO[]> => {
  const response = await apiClient.get(`/chat/${conversationId}/messages`);
  return response.data.data;
};

export const sendMessage = async (conversationId: string, content: string): Promise<MessageDTO> => {
  const response = await apiClient.post(`/chat/${conversationId}/send`, { content });
  return response.data.data;
};
