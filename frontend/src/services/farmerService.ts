import apiClient from './apiClient';

export interface FarmerProfileDTO {
  _id?: string;
  userId: string;
  displayName: string;
  bio?: string;
  generalArea?: string;
  county?: string;
  primaryCrops?: string[];
  estimatedAnnualYield?: number;
  yieldUnit?: string;
  expectedSellingPeriod?: string;
  isPublicProfile: boolean;
  _privateExactLocation?: string;
  createdAt?: string;
  updatedAt?: string;
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

export const getPublicFarmerProfileApi = async (id: string): Promise<Partial<FarmerProfileDTO>> => {
  const response = await apiClient.get<{ success: boolean; data: { profile: Partial<FarmerProfileDTO> } }>(
    `/farmers/public/${id}`
  );
  return response.data.data.profile;
};
