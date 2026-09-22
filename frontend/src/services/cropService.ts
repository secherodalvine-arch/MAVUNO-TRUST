import apiClient from './apiClient';

export interface CropListingDTO {
  _id?: string;
  farmerId: string;
  cropName: string;
  estimatedQuantity: number;
  unit: string;
  priceExpectationPerUnit?: number;
  currency?: string;
  expectedSellingPeriodStart?: string;
  expectedSellingPeriodEnd?: string;
  generalArea?: string;
  county?: string;
  additionalNotes?: string;
  status: 'ACTIVE' | 'PAUSED' | 'SOLD' | 'EXPIRED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}

export const getMyCropListingsApi = async (): Promise<CropListingDTO[]> => {
  const response = await apiClient.get<{ success: boolean; data: { listings: CropListingDTO[] } }>(
    '/crops/my-listings/all'
  );
  return response.data.data.listings;
};

export const getPublicCropListingsApi = async (filter?: {
  county?: string;
  cropName?: string;
}): Promise<CropListingDTO[]> => {
  const params = new URLSearchParams();
  if (filter?.county) params.append('county', filter.county);
  if (filter?.cropName) params.append('cropName', filter.cropName);

  const response = await apiClient.get<{ success: boolean; data: { listings: CropListingDTO[] } }>(
    `/crops/public?${params.toString()}`
  );
  return response.data.data.listings;
};

export const createCropListingApi = async (
  data: Partial<CropListingDTO>
): Promise<CropListingDTO> => {
  const response = await apiClient.post<{ success: boolean; data: { listing: CropListingDTO } }>(
    '/crops',
    data
  );
  return response.data.data.listing;
};

export const updateCropListingApi = async (
  id: string,
  data: Partial<CropListingDTO>
): Promise<CropListingDTO> => {
  const response = await apiClient.put<{ success: boolean; data: { listing: CropListingDTO } }>(
    `/crops/${id}`,
    data
  );
  return response.data.data.listing;
};

export const deleteCropListingApi = async (id: string): Promise<void> => {
  await apiClient.delete(`/crops/${id}`);
};
