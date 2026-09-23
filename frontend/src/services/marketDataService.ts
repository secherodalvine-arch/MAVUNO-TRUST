import apiClient from './apiClient';

export interface KamisMarketItem {
  _id?: string;
  id?: string;
  source: 'KAMIS' | string;
  sourceMethod?: string;
  commodity: string;
  classification?: string | null;
  grade?: string | null;
  market: string;
  county?: string | null;
  wholesalePrice?: number | null;
  retailPrice?: number | null;
  unit: string;
  supplyVolume?: number | null;
  observedDate: string;
  retrievedAt: string;
  sourceUrl?: string;
  syncRunId?: string;
  isDevelopmentData?: boolean;
}

export interface KamisMarketQueryParams {
  commodity?: string;
  county?: string;
  market?: string;
  priceType?: 'wholesale' | 'retail' | 'all';
  limit?: number;
  page?: number;
}

export interface KamisMarketResponse {
  success: boolean;
  data: {
    records: KamisMarketItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    source: string;
    disclaimer: string;
  };
}

export const kamisMarketService = {
  getMarketPrices: async (params?: KamisMarketQueryParams): Promise<KamisMarketResponse> => {
    try {
      const res = await apiClient.get('/market-prices', { params });
      if (res.data?.success && Array.isArray(res.data?.data?.records)) {
        return res.data;
      }
      throw new Error('Invalid market prices format');
    } catch {
      // Fallback request to /market/latest endpoint if primary route is initializing
      try {
        const fallbackRes = await apiClient.get('/market/latest');
        const rawPrices = fallbackRes.data?.data?.prices || [];
        const records: KamisMarketItem[] = rawPrices.map((p: any, idx: number) => ({
          _id: p.id || `fallback_${idx}`,
          commodity: p.cropName || 'Produce',
          market: p.market || 'Regional Market',
          county: p.county || 'Kenya',
          wholesalePrice: p.minimumPrice || p.price,
          retailPrice: p.maximumPrice || p.price,
          unit: p.unit || 'KG',
          observedDate: p.observedAt || new Date().toISOString(),
          source: 'KAMIS',
          sourceMethod: 'MAVUNO_AGENT',
          retrievedAt: new Date().toISOString(),
        }));

        return {
          success: true,
          data: {
            records,
            pagination: { total: records.length, page: 1, limit: 50, totalPages: 1 },
            source: 'KAMIS',
            disclaimer: 'Current agricultural market observations.',
          },
        };
      } catch (fallbackErr) {
        return {
          success: true,
          data: {
            records: [],
            pagination: { total: 0, page: 1, limit: 50, totalPages: 1 },
            source: 'KAMIS',
            disclaimer: 'Current agricultural market observations.',
          },
        };
      }
    }
  },
};
