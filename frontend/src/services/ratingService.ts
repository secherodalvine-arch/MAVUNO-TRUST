import apiClient from './apiClient';

export interface RatingData {
  _id: string;
  transactionId: string;
  reviewerId: { _id: string; fullName: string };
  reviewedUserId: { _id: string; fullName: string };
  rating: number;
  comment?: string;
  createdAt: string;
}

export const ratingService = {
  submitRating: async (transactionId: string, rating: number, comment?: string): Promise<RatingData> => {
    const res = await apiClient.post('/ratings', { transactionId, rating, comment });
    return res.data.data;
  },

  getTransactionRatings: async (transactionId: string): Promise<RatingData[]> => {
    const res = await apiClient.get(`/ratings/transaction/${transactionId}`);
    return res.data.data;
  }
};
