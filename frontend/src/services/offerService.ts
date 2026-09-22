import apiClient from './apiClient';

export interface OfferDTO {
  _id: string;
  farmerId: any;
  dealerId: any;
  listingId: string;
  quantity: number;
  unit: string;
  proposedPricePerUnit: number;
  currency: string;
  totalAmount: number;
  initiatedBy: 'FARMER' | 'DEALER';
  message?: string;
  parentOfferId?: string;
  status: 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export const createOffer = async (data: { targetUserId: string, listingId: string, quantity: number, unit: string, proposedPricePerUnit: number, message?: string }) => {
  const response = await apiClient.post<{ success: boolean, data: OfferDTO }>('/offers', data);
  return response.data.data;
};

export const getMyOffers = async () => {
  const response = await apiClient.get<{ success: boolean, data: OfferDTO[] }>('/offers');
  return response.data.data;
};

export const getOfferHistory = async (id: string) => {
  const response = await apiClient.get<{ success: boolean, data: OfferDTO[] }>(`/offers/${id}/history`);
  return response.data.data;
};

export const counterOffer = async (id: string, data: { quantity: number, proposedPricePerUnit: number, message?: string }) => {
  const response = await apiClient.post<{ success: boolean, data: OfferDTO }>(`/offers/${id}/counter`, data);
  return response.data.data;
};

export const respondToOffer = async (id: string, action: 'ACCEPT' | 'REJECT' | 'CANCEL') => {
  const response = await apiClient.post<{ success: boolean, data: OfferDTO }>(`/offers/${id}/respond`, { action });
  return response.data.data;
};
