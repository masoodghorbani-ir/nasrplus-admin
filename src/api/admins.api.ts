import apiClient from './client';
import type { ApiResponse, AdminUser, CreateAdminInput, Permission } from '@/types';

export const adminsApi = {
  async getAdmins(): Promise<ApiResponse<AdminUser[]>> {
    const response = await apiClient.get<ApiResponse<AdminUser[]>>('/admins');
    return response.data;
  },

  async createAdmin(data: CreateAdminInput): Promise<ApiResponse<AdminUser>> {
    const response = await apiClient.post<ApiResponse<AdminUser>>('/admins', data);
    return response.data;
  },

  async getPermissions(): Promise<ApiResponse<Permission[]>> {
    const response = await apiClient.get<ApiResponse<Permission[]>>('/admins/permissions');
    return response.data;
  },

  async createPermission(data: {
    name: string;
    key: string;
    module?: string;
    description?: string;
  }): Promise<ApiResponse<Permission>> {
    const response = await apiClient.post<ApiResponse<Permission>>('/admins/permissions', data);
    return response.data;
  },
};
