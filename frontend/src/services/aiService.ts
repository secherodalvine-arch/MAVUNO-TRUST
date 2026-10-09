import apiClient from './apiClient';

export interface MarketRecommendationQuery {
  crop: string;
  quantity: number;
  unit: string;
  county: string;
}

export interface MarketOptionItem {
  market: string;
  county: string;
  price: number;
  unit: string;
  source: string;
  observedDate: string;
  evidence: string;
}

export interface BuyerOptionItem {
  dealerId: string;
  displayName: string;
  countiesServed: string[];
  cropsDealt: string[];
  purchasingCapacityKg: number;
  verificationStatus: string;
  verificationSource: string;
}

export interface RecommendationDetail {
  option: string;
  nextAction?: string;
  reason: string;
  confidence: string;
  limitations: string[];
}

export interface EvidenceItem {
  commodity?: string;
  market?: string;
  county?: string;
  wholesalePrice?: number;
  retailPrice?: number;
  unit?: string;
  observedDate?: string;
  source?: string;
  provider?: string;
  qualityGrade?: string | null;
  dealerId?: string;
  displayName?: string;
  generalOperatingArea?: string;
  countiesServed?: string[];
  cropsDealt?: string[];
  purchasingCapacityKg?: number;
  verificationStatus?: string;
  verificationSource?: string;
  isPublicProfile?: boolean;
}

export interface MarketRecommendationData {
  query: MarketRecommendationQuery;
  marketOptions: MarketOptionItem[];
  buyerOptions: BuyerOptionItem[];
  recommendation: RecommendationDetail;
  evidence: EvidenceItem[];
  dataLimitations: string[];
}

export interface MarketRecommendationResponse {
  success: boolean;
  data: MarketRecommendationData;
  error?: {
    message: string;
  };
}

/**
 * Trigger Stage 2 Gemini B Market Recommendation
 * Endpoint: POST /api/ai/market-recommendation
 */
export const getMarketRecommendationApi = async (
  query: MarketRecommendationQuery
): Promise<MarketRecommendationData> => {
  const response = await apiClient.post<MarketRecommendationResponse>(
    '/ai/market-recommendation',
    query
  );

  if (!response.data || response.data.success === false) {
    throw new Error(
      response.data?.error?.message || 'Failed to retrieve market recommendation.'
    );
  }

  return response.data.data;
};
