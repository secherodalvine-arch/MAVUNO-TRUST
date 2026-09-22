import apiClient from './apiClient';
import type { UserSnippet } from './chatService'; // Reusing UserSnippet

export interface FulfilmentDTO {
  status: 'PENDING' | 'IN_PROGRESS' | 'FULFILLED';
  expectedDate?: string;
  method?: string;
  notes?: string;
  actualFulfilmentDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export interface TransactionDTO {
  _id: string;
  farmerId: UserSnippet;
  dealerId: UserSnippet;
  listingId: string;
  acceptedOfferId: string;
  cropName: string;
  quantity: number;
  unit: string;
  agreedPricePerUnit: number;
  totalAgreedValue: number;
  currency: string;
  agreementDate: string;
  status: string;
  fulfilment?: FulfilmentDTO;
  completedAt?: string;
  completedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  cancellationNote?: string;
  createdAt: string;
  updatedAt: string;
}

export const getTransactions = async (): Promise<TransactionDTO[]> => {
  const response = await apiClient.get('/transactions');
  return response.data.data;
};

export const getTransactionById = async (id: string): Promise<TransactionDTO> => {
  const response = await apiClient.get(`/transactions/${id}`);
  return response.data.data;
};

export const updateFulfilment = async (
  id: string,
  data: {
    status?: 'PENDING' | 'IN_PROGRESS' | 'FULFILLED';
    expectedDate?: string;
    method?: string;
    notes?: string;
    actualFulfilmentDate?: string;
  }
): Promise<TransactionDTO> => {
  const response = await apiClient.patch(`/transactions/${id}/fulfilment`, data);
  return response.data.data;
};

export const completeTransaction = async (id: string): Promise<TransactionDTO> => {
  const response = await apiClient.post(`/transactions/${id}/complete`);
  return response.data.data;
};

export const cancelTransaction = async (
  id: string,
  data: {
    cancellationReason: string;
    cancellationNote?: string;
  }
): Promise<TransactionDTO> => {
  const response = await apiClient.post(`/transactions/${id}/cancel`, data);
  return response.data.data;
};


