export type VehicleCategory =
  | 'PICKUP'
  | 'SMALL_TRUCK'
  | 'MEDIUM_LORRY'
  | 'LARGE_LORRY'
  | 'OTHER';

export type TripArrangement = 'EXCLUSIVE' | 'SHARED';

export type PriceEvidenceType =
  | 'USER_ESTIMATE'
  | 'TRANSPORTER_QUOTATION'
  | 'REPORTED_COMPLETED_JOURNEY'
  | 'COMPLETED_JOURNEY_WITH_RECEIPT';

export type TransportVerificationStatus =
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'QUARANTINED'
  | 'REJECTED';

export type TransportReviewStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_MORE_INFO';

export interface AnomalyFlag {
  flag: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  detectedAt?: string;
}

export interface RouteDetailsDTO {
  success?: boolean;
  provider?: string;
  distanceKm: number;
  distanceMeters: number;
  durationSeconds?: number;
  originLabel?: string;
  destinationLabel?: string;
  polyline?: string | null;
}

export interface TransportExplanationDTO {
  englishSummary: string;
  swahiliSummary: string;
  keyAdvice: string[];
  warnings: string[];
}

export interface TransportEstimateDTO {
  success: boolean;
  currency: string;
  distanceKm: number;
  distanceMeters: number;
  vehicleCategory: VehicleCategory;
  tripArrangement: TripArrangement;
  assumedLoadKg: number | null;
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  estimatedPriceMedian: number;
  baselineRatePerKm: number;
  sampleSize: number;
  contributorCount: number;
  dateRange: {
    earliest: string | null;
    latest: string | null;
  };
  methodology: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  assumptions?: string[];
  warnings: string[];
  recommendations: string;
  routeDetails?: RouteDetailsDTO;
  explanation?: TransportExplanationDTO;
  advisorSource?: string;
}

export interface TransportRecordDTO {
  _id: string;
  userId?: string;
  userRole?: 'FARMER' | 'DEALER';
  origin: {
    name: string;
    county?: string;
    isPrivateOrigin?: boolean;
  };
  destination: {
    name: string;
    county?: string;
  };
  routing: {
    provider: string;
    distanceMeters: number;
    distanceKm: number;
    durationSeconds: number;
    routeStatus: string;
  };
  cropCategory?: string;
  vehicleCategory: VehicleCategory;
  loadWeightKg?: number;
  tripArrangement: TripArrangement;
  reportedPriceKSh: number;
  evidenceType: PriceEvidenceType;
  journeyDate: string;
  submissionTimestamp: string;
  receiptUrl?: string;
  notes?: string;
  verificationStatus: TransportVerificationStatus;
  reviewStatus: TransportReviewStatus;
  anomalyFlags?: AnomalyFlag[];
  isAppealRequested?: boolean;
  appealNotes?: string;
  createdAt: string;
  updatedAt: string;
}
