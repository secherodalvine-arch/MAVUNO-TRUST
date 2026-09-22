import apiClient from './apiClient';

export interface DealerProfileDTO {
  _id?: string;
  userId: string;
  businessName?: string;
  displayName: string;
  bio?: string;
  generalOperatingArea?: string;
  countiesServed?: string[];
  cropsDealt?: string[];
  purchasingCapacityKg?: number;
  businessRegNumber?: string;
  licence: {
    licenceNumber?: string;
    licenceType?: string;
    cropSector?: string;
    status: string;
    source: string;
    verifiedAt?: string;
  };
  isPublicProfile: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const getMyDealerProfileApi = async (): Promise<DealerProfileDTO> => {
  const response = await apiClient.get<{ success: boolean; data: { profile: DealerProfileDTO } }>(
    '/dealers/me'
  );
  return response.data.data.profile;
};

export const updateMyDealerProfileApi = async (
  data: Partial<DealerProfileDTO> & { licenceNumber?: string }
): Promise<DealerProfileDTO> => {
  const response = await apiClient.put<{ success: boolean; data: { profile: DealerProfileDTO } }>(
    '/dealers/me',
    data
  );
  return response.data.data.profile;
};

export const getVerifiedDealersApi = async (): Promise<Partial<DealerProfileDTO>[]> => {
  const response = await apiClient.get<{ success: boolean; data: Partial<DealerProfileDTO>[] }>(
    '/dealers/public'
  );
  return response.data.data;
};

export const getPublicDealerProfileApi = async (id: string): Promise<Partial<DealerProfileDTO>> => {
  const response = await apiClient.get<{ success: boolean; data: { profile: Partial<DealerProfileDTO> } }>(
    `/dealers/public/${id}`
  );
  return response.data.data.profile;
};
