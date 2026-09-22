import apiClient from './apiClient';
import type { UserSnippet } from './chatService';

export type DisputeCategory =
  | 'DELIVERY_ISSUE'
  | 'QUANTITY_ISSUE'
  | 'QUALITY_ISSUE'
  | 'AGREEMENT_ISSUE'
  | 'PAYMENT_ISSUE'
  | 'OTHER';

export type DisputeStatus = 'OPEN' | 'CLOSED';

export interface DisputeDTO {
  _id: string;
  caseId: string;
  transactionId: any;
  openedBy: UserSnippet;
  category: DisputeCategory;
  description: string;
  evidenceInfo?: string;
  status: DisputeStatus;
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisputePayload {
  transactionId: string;
  category: DisputeCategory;
  description: string;
  evidenceInfo?: string;
}

export const createDispute = async (payload: CreateDisputePayload): Promise<DisputeDTO> => {
  const response = await apiClient.post('/disputes', payload);
  return response.data.data;
};

export const getDisputes = async (): Promise<DisputeDTO[]> => {
  const response = await apiClient.get('/disputes');
  return response.data.data;
};

export const getDisputeById = async (id: string): Promise<DisputeDTO> => {
  const response = await apiClient.get(`/disputes/${id}`);
  return response.data.data;
};

export const closeDispute = async (id: string): Promise<DisputeDTO> => {
  const response = await apiClient.post(`/disputes/${id}/close`);
  return response.data.data;
};
