import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserDTO, RegisterDTO, LoginDTO } from '../services/authService';
import { registerApi, loginApi, logoutApi, getMeApi } from '../services/authService';

interface AuthContextType {
  user: UserDTO | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginDTO) => Promise<UserDTO>;
  register: (data: RegisterDTO) => Promise<UserDTO>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(() => {
    try {
      const saved = localStorage.getItem('mavuno_user');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('mavuno_access_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('mavuno_access_token');
      if (storedToken) {
        try {
          const currentUser = await getMeApi();
          setUser(currentUser);
          localStorage.setItem('mavuno_user', JSON.stringify(currentUser));
        } catch {
          // Token expired or invalid
          setAccessToken(null);
          setUser(null);
          localStorage.removeItem('mavuno_access_token');
          localStorage.removeItem('mavuno_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for automatic logout events triggered by interceptor
    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
    };
    window.addEventListener('mavuno_auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('mavuno_auth_logout', handleLogoutEvent);
  }, []);

  const login = async (data: LoginDTO): Promise<UserDTO> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loginApi(data);
      setUser(res.user);
      setAccessToken(res.accessToken);
      localStorage.setItem('mavuno_access_token', res.accessToken);
      localStorage.setItem('mavuno_user', JSON.stringify(res.user));
      return res.user;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterDTO): Promise<UserDTO> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await registerApi(data);
      setUser(res.user);
      setAccessToken(res.accessToken);
      localStorage.setItem('mavuno_access_token', res.accessToken);
      localStorage.setItem('mavuno_user', JSON.stringify(res.user));
      return res.user;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('mavuno_access_token');
      localStorage.removeItem('mavuno_user');
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
