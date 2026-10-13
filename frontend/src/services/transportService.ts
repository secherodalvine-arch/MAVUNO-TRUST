import apiClient from './apiClient';
import type {
  TransportEstimateDTO,
  TransportRecordDTO,
  RouteDetailsDTO,
  VehicleCategory,
  TripArrangement,
  PriceEvidenceType,
} from '../types/transport';

export interface RouteRequestParams {
  origin: string | { name?: string; address?: string; lat?: number; lng?: number };
  destination: string | { name?: string; address?: string; lat?: number; lng?: number };
  trafficAware?: boolean;
}

export interface EstimateRequestParams {
  origin?: string;
  destination?: string;
  distanceKm?: number;
  vehicleCategory?: VehicleCategory;
  tripArrangement?: TripArrangement;
  loadWeightKg?: number;
}

export interface SubmitRecordParams {
  origin: { name: string; county?: string; isPrivateOrigin?: boolean } | string;
  destination: { name: string; county?: string } | string;
  vehicleCategory: VehicleCategory;
  reportedPriceKSh: number;
  evidenceType: PriceEvidenceType;
  cropCategory?: string;
  loadWeightKg?: number;
  vehiclePayloadKg?: number;
  tripArrangement?: TripArrangement;
  journeyDate: string;
  receiptUrl?: string;
  notes?: string;
}

export const transportService = {
  /**
   * Calculate driving road distance and duration via OpenStreetMap & OSRM
   */
  async calculateRoute(params: RouteRequestParams): Promise<{ success: boolean; data: RouteDetailsDTO }> {
    const res = await apiClient.post('/transport/route', params);
    return res.data;
  },

  /**
   * Obtain statistical cost estimate with optional Gemini bilingual explanation
   */
  async getEstimate(params: EstimateRequestParams): Promise<{ success: boolean; data: TransportEstimateDTO }> {
    const res = await apiClient.post('/transport/estimate', params);
    return res.data;
  },

  /**
   * Submit a new transport record from a Farmer or Dealer
   */
  async submitRecord(params: SubmitRecordParams): Promise<{ success: boolean; data: TransportRecordDTO; message: string }> {
    const res = await apiClient.post('/transport/records', params);
    return res.data;
  },

  /**
   * Get authenticated user's submitted transport records
   */
  async getMyRecords(): Promise<{ success: boolean; data: TransportRecordDTO[] }> {
    const res = await apiClient.get('/transport/records/my');
    return res.data;
  },

  /**
   * Update notes or evidence on a user's own record
   */
  async updateMyRecord(
    id: string,
    updates: { notes?: string; evidenceType?: PriceEvidenceType; receiptUrl?: string }
  ): Promise<{ success: boolean; data: TransportRecordDTO }> {
    const res = await apiClient.patch(`/transport/records/${id}`, updates);
    return res.data;
  },

  /**
   * Submit an appeal / explanation for a quarantined record
   */
  async appealRecord(
    id: string,
    appealData: { appealNotes: string; receiptUrl?: string }
  ): Promise<{ success: boolean; data: TransportRecordDTO }> {
    const res = await apiClient.post(`/transport/records/${id}/appeal`, appealData);
    return res.data;
  },

  /**
   * Retrieve privacy-sanitized comparable historical records
   */
  async getComparables(params?: {
    origin?: string;
    destination?: string;
    vehicleCategory?: string;
  }): Promise<{ success: boolean; data: TransportRecordDTO[] }> {
    const res = await apiClient.get('/transport/comparables', { params });
    return res.data;
  },

  /**
   * Admin: List flagged & quarantined records
   */
  async getAdminFlaggedRecords(status?: string): Promise<{ success: boolean; data: any[] }> {
    const res = await apiClient.get('/transport/admin/flagged', { params: { status } });
    return res.data;
  },

  /**
   * Admin: Review and moderate a flagged record
   */
  async adminReviewRecord(
    id: string,
    reviewData: { action: string; reasonCode: string; notes?: string }
  ): Promise<{ success: boolean; data: any; message: string }> {
    const res = await apiClient.patch(`/transport/admin/records/${id}/review`, reviewData);
    return res.data;
  },
};
