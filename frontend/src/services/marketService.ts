import apiClient from './apiClient';

export interface MarketPriceItem {
  id: string;
  provider: string;
  externalId: string;
  cropName: string;
  marketName: string;
  county: string;
  price: number;
  unit: string;
  currency: string;
  recordedAt: string;
  source: string;
  qualityGrade?: string;
  notes?: string;
  fetchedAt: string;
}

export interface MarketDataResponse {
  success: boolean;
  data: {
    prices: MarketPriceItem[];
    disclaimer: string;
    source: string;
  };
}

export const marketService = {
  async getLatestPrices(): Promise<MarketDataResponse> {
    const response = await apiClient.get<MarketDataResponse>('/market/latest');
    return response.data;
  },

  async searchPrices(params: {
    cropName?: string;
    county?: string;
    market?: string;
  }): Promise<MarketDataResponse> {
    const response = await apiClient.get<MarketDataResponse>('/market/search', {
      params,
    });
    return response.data;
  },
};
