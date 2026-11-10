import apiClient from './apiClient';

export interface FarmerProfileDTO {
  _id?: string;
  userId: string;
  displayName: string;
  bio?: string;
  generalArea?: string;
  subCounty?: string;
  county?: string;
  farmSizeAcres?: number;
  primaryCrops?: string[];
  estimatedAnnualYield?: number;
  yieldUnit?: string;
  expectedSellingPeriod?: string;
  isPublicProfile: boolean;
  _privateExactLocation?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationUpdatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FarmLocationDTO {
  county: string;
  subCounty: string;
  generalArea: string;
  farmSizeAcres: number | null;
  latitude: number | null;
  longitude: number | null;
  locationUpdatedAt: string | null;
  hasRegisteredCoordinates: boolean;
}

export const getMyFarmerProfileApi = async (): Promise<FarmerProfileDTO> => {
  const response = await apiClient.get<{ success: boolean; data: { profile: FarmerProfileDTO } }>(
    '/farmers/me'
  );
  return response.data.data.profile;
};

export const updateMyFarmerProfileApi = async (
  data: Partial<FarmerProfileDTO>
): Promise<FarmerProfileDTO> => {
  const response = await apiClient.put<{ success: boolean; data: { profile: FarmerProfileDTO } }>(
    '/farmers/me',
    data
  );
  return response.data.data.profile;
};

export const getFarmLocationApi = async (): Promise<FarmLocationDTO> => {
  const response = await apiClient.get<{ success: boolean; data: { location: FarmLocationDTO } }>(
    '/farmers/location'
  );
  return response.data.data.location;
};

export const updateFarmLocationApi = async (
  data: {
    county?: string;
    subCounty?: string;
    generalArea?: string;
    farmSizeAcres?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  }
): Promise<{ location: FarmLocationDTO; message: string }> => {
  const response = await apiClient.put<{
    success: boolean;
    message: string;
    data: { location: FarmLocationDTO };
  }>('/farmers/location', data);
  return { location: response.data.data.location, message: response.data.message };
};

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [[[lng, lat], [lng, lat], ...]]
}

export interface FarmBoundaryDTO {
  hasBoundary: boolean;
  farmBoundary: GeoJSONPolygon | null;
  boundaryAreaAcres: number | null;
  boundaryAreaHectares?: number | null;
  boundaryUpdatedAt: string | null;
  farmSizeAcres?: number | null;
  referenceCoordinates?: {
    latitude: number | null;
    longitude: number | null;
  };
}

export interface SatelliteStatusDTO {
  ready: boolean;
  dataset: string;
  spectralBands: {
    nir: string;
    red: string;
    cloudBitmask: string;
    sceneClassification: string;
  };
  formula: string;
  missingEnvironmentVariables: string[];
  setupInstructions: string | Record<string, string>;
}

export interface SatelliteNDVIResponse {
  success: boolean;
  code?: string;
  status?: string;
  message?: string;
  data?: {
    dataset: string;
    farmAreaAcres: number;
    observationPeriod: { start: string; end: string };
    cloudThresholdPercent: number;
    rawResult?: any;
  };
  pipelineDetails?: any;
  setupRequired?: any;
}

export const getPublicFarmerProfileApi = async (id: string): Promise<Partial<FarmerProfileDTO>> => {
  const response = await apiClient.get<{ success: boolean; data: { profile: Partial<FarmerProfileDTO> } }>(
    `/farmers/public/${id}`
  );
  return response.data.data.profile;
};

export const getFarmBoundaryApi = async (): Promise<FarmBoundaryDTO> => {
  const response = await apiClient.get<{ success: boolean; data: { boundary: FarmBoundaryDTO } }>(
    '/farmers/boundary'
  );
  return response.data.data.boundary;
};

export const updateFarmBoundaryApi = async (
  boundaryInput: GeoJSONPolygon | number[][][] | number[][]
): Promise<{ boundary: FarmBoundaryDTO; message: string }> => {
  const response = await apiClient.put<{
    success: boolean;
    message: string;
    data: { boundary: FarmBoundaryDTO };
  }>('/farmers/boundary', boundaryInput);
  return { boundary: response.data.data.boundary, message: response.data.message };
};

export const clearFarmBoundaryApi = async (): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string; data: { boundary: any } }>(
    '/farmers/boundary'
  );
  return { message: response.data.message };
};

export const getSatelliteStatusApi = async (): Promise<SatelliteStatusDTO> => {
  const response = await apiClient.get<{ success: boolean; data: SatelliteStatusDTO }>(
    '/farmers/satellite/status'
  );
  return response.data.data;
};

export const getFarmNDVIApi = async (params?: {
  maxCloudCover?: number;
  startDate?: string;
  endDate?: string;
}): Promise<SatelliteNDVIResponse> => {
  const response = await apiClient.get<SatelliteNDVIResponse>('/farmers/satellite/ndvi', {
    params,
    validateStatus: (status) => status < 600, // Handle 503 GEE_CREDENTIALS_REQUIRED cleanly
  });
  return response.data;
};

export interface FarmAdvisoryDTO {
  success: boolean;
  code?: string;
  message?: string;
  ndviClassification?: {
    label: string;
    description: string;
    severity: 'good' | 'moderate' | 'concern' | 'unknown';
  };
  observationDate?: string | null;
  advisory?: {
    vegetationObservation: string;
    ndviSummary: string;
    practicalRecommendations: string[];
    limitations: string[];
    confidence: string;
    disclaimer: string;
  };
  dataQuality?: {
    cloudCoverPercent: number | null;
    validPixelPercent: number | null;
    meanNDVI: number;
    minNDVI?: number | null;
    maxNDVI?: number | null;
  };
  generatedAt?: string;
  setupInstructions?: any;
}

export interface AgriculturalPartnerDTO {
  id: string;
  name: string;
  description: string;
  ussdCode?: string | null;
  tollFreeHotline?: string | null;
  smsChannel?: string | null;
  website?: string | null;
  services: string[];
}

export interface AssistanceReferralRequest {
  organizationId?: string;
  assistanceType?: string;
  consentGiven: boolean;
  notes?: string;
}

export interface AssistanceReferralResponse {
  success: boolean;
  code?: string;
  message?: string;
  data?: {
    referralId: string;
    status: string;
    partner: AgriculturalPartnerDTO;
    sharedDetails: {
      farmerName: string;
      county: string;
      subCounty: string;
      primaryCrops: string[];
      contactPhone: string;
    };
    consentRecordedAt: string;
    instructions: string;
  };
}

export const getFarmAdvisoryApi = async (params?: {
  maxCloudCover?: number;
  startDate?: string;
  endDate?: string;
}): Promise<FarmAdvisoryDTO> => {
  const response = await apiClient.get<{ success: boolean; data: FarmAdvisoryDTO }>(
    '/farmers/satellite/advisory',
    {
      params,
      validateStatus: (status) => status < 600,
    }
  );
  return response.data.data || (response.data as unknown as FarmAdvisoryDTO);
};

export const getAssistancePartnersApi = async (): Promise<AgriculturalPartnerDTO[]> => {
  const response = await apiClient.get<{ success: boolean; data: { partners: AgriculturalPartnerDTO[] } }>(
    '/farmers/assistance/partners'
  );
  return response.data.data.partners;
};

export const requestAssistanceReferralApi = async (
  input: AssistanceReferralRequest
): Promise<AssistanceReferralResponse> => {
  const response = await apiClient.post<AssistanceReferralResponse>(
    '/farmers/assistance/referral',
    input,
    {
      validateStatus: (status) => status < 600,
    }
  );
  return response.data;
};

export const updatePushTokenApi = async (fcmToken: string): Promise<{ success: boolean }> => {
  const response = await apiClient.post<{ success: boolean }>('/farmers/notifications/push-token', {
    fcmToken,
  });
  return response.data;
};

// ── Weather DTO & API ─────────────────────────────────────────────────────────

export interface FarmWeatherCurrent {
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  precipitationMm: number | null;
  rainMm: number | null;
  weatherCode: number | null;
  weatherDescription: string;
  windSpeedKph: number | null;
  windDescription: string | null;
  relativeHumidityPct: number | null;
  humidityLabel: string | null;
  humidityNote: string | null;
  soilTemperatureC: number | null;
  soilMoisture: number | null;
}

export interface FarmWeatherForecastDay {
  date: string;
  maxTempC: number | null;
  minTempC: number | null;
  precipitationMm: number;
  weatherCode: number | null;
  description: string;
}

export interface FarmWeatherDTO {
  success: boolean;
  code?: string;
  message?: string;
  fetchedAt?: string;
  fromCache?: boolean;
  location?: { latitude: number; longitude: number };
  current?: FarmWeatherCurrent;
  forecast?: FarmWeatherForecastDay[];
  units?: {
    temperature: string;
    precipitation: string;
    windSpeed: string;
    humidity: string;
  };
}

export const getFarmWeatherApi = async (): Promise<FarmWeatherDTO> => {
  const response = await apiClient.get<{ success: boolean; data: FarmWeatherDTO }>(
    '/farmers/weather',
    { validateStatus: (status) => status < 600 }
  );
  return response.data.data || (response.data as unknown as FarmWeatherDTO);
};

// ── NDVI History DTO & API ────────────────────────────────────────────────────

export interface NDVIObservationDTO {
  _id: string;
  observationDate: string;
  meanNDVI: number | null;
  minNDVI?: number | null;
  maxNDVI?: number | null;
  vegetationLabel?: string;
  vegetationSeverity?: 'good' | 'moderate' | 'concern' | 'unknown';
  cloudCoverPercent?: number | null;
  farmAreaAcres?: number | null;
  createdAt: string;
}

export interface NDVIHistoryDTO {
  observations: NDVIObservationDTO[];
  count: number;
}

export const getNDVIHistoryApi = async (limit = 30): Promise<NDVIHistoryDTO> => {
  const response = await apiClient.get<{ success: boolean; data: NDVIHistoryDTO }>(
    '/farmers/satellite/history',
    { params: { limit }, validateStatus: (status) => status < 600 }
  );
  return response.data.data || { observations: [], count: 0 };
};
