import apiClient from './apiClient';

export interface HealthResponse {
  success: boolean;
  service: string;
  database: 'connected' | 'disconnected';
  timestamp: string;
}

export const checkHealth = async (): Promise<HealthResponse> => {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
};
