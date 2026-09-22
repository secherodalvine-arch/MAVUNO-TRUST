import apiClient from './apiClient';

export interface UserDTO {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: 'FARMER' | 'DEALER' | 'ADMIN';
  accountStatus: string;
  createdAt: string;
}

export interface RegisterDTO {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role: 'FARMER' | 'DEALER';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: UserDTO;
    accessToken: string;
  };
}

export const registerApi = async (data: RegisterDTO): Promise<AuthResponse['data']> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  return response.data.data;
};

export const loginApi = async (data: LoginDTO): Promise<AuthResponse['data']> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  return response.data.data;
};

export const logoutApi = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

export const getMeApi = async (): Promise<UserDTO> => {
  const response = await apiClient.get<{ success: boolean; data: { user: UserDTO } }>('/auth/me');
  return response.data.data.user;
};
