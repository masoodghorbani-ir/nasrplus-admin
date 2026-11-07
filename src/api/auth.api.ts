import apiClient from './client';
import type {
  ApiResponse,
  LoginCredentials,
  LoginResponseData,
  AdminUser,
  AdminLoginLogsResponseData,
} from '@/types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
    return response.data;
  },

  async getProfile(): Promise<ApiResponse<AdminUser>> {
    const response = await apiClient.get<ApiResponse<AdminUser>>('/auth/me');
    return response.data;
  },

  /**
   * Authenticated Admin's Own Login History
   * GET /api/v1/auth/my-login-logs
   */
  async getMyLoginLogs(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<AdminLoginLogsResponseData>> {
    const response = await apiClient.get<ApiResponse<AdminLoginLogsResponseData>>(
      '/auth/my-login-logs',
      { params }
    );
    return response.data;
  },

  /**
   * Change the signed-in admin password
   * POST /api/v1/auth/change-password
   */
  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>('/auth/change-password', payload);
    return response.data;
  },
};

