import apiClient from './apiClient';

export interface VerificationResultDTO {
  licenceNumber: string;
  status: string;
  source: string;
  isDemoData: boolean;
  licenceType?: string;
  cropSector?: string;
  sourceReference?: string;
  checkedAt: string;
  notes?: string;
  disclaimer: string;
}

export interface VerificationApiResponse {
  success: boolean;
  data: {
    verificationResult: VerificationResultDTO;
    profile: any;
    verificationId: string;
  };
}

export const verifyDealerLicenceApi = async (
  licenceNumber: string
): Promise<VerificationApiResponse['data']> => {
  const response = await apiClient.post<VerificationApiResponse>('/verifications/dealer', {
    licenceNumber,
  });
  return response.data.data;
};
