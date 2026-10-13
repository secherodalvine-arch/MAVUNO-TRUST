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
  try {
    const response = await apiClient.post<MarketRecommendationResponse>(
      '/ai/market-recommendation',
      query
    );

    // Axios resolves on 2xx; a success:false body at HTTP 200 is a logic error.
    if (!response.data || response.data.success === false) {
      throw new Error(
        response.data?.error?.message || 'Failed to retrieve market recommendation.'
      );
    }

    return response.data.data;
  } catch (err: unknown) {
    // Re-shape Axios HTTP errors so the component receives the backend's
    // human-readable message instead of the generic "Request failed with status code N".
    if (
      err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object'
    ) {
      const axiosErr = err as {
        response: { status: number; data?: { error?: { message?: string }; message?: string } };
        message: string;
      };
      const status = axiosErr.response.status;
      const serverMsg =
        axiosErr.response.data?.error?.message ||
        axiosErr.response.data?.message;

      if (serverMsg) {
        // Preserve the original server message and attach the HTTP status for context.
        throw new Error(`${serverMsg} (HTTP ${status})`);
      }

      // Fallback messages for common statuses.
      if (status === 503) {
        throw new Error(
          'The market recommendation AI service is temporarily unavailable. Please try again in a moment.'
        );
      }
      if (status === 502) {
        throw new Error(
          'The AI service returned an unexpected response. Please try again shortly.'
        );
      }
    }
    // Re-throw everything else as-is.
    throw err;
  }
};
