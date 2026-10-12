import apiClient from './client';
import type { ApiResponse, Company, CreateCompanyInput, UpdateCompanyInput, PaginatedQueryParams } from '@/types';

export const companiesApi = {
  async getCompanies(params?: PaginatedQueryParams): Promise<ApiResponse<Company[]>> {
    const response = await apiClient.get<ApiResponse<Company[]>>('/companies', { params });
    return response.data;
  },

  async getCompanyById(id: string): Promise<ApiResponse<Company>> {
    const response = await apiClient.get<ApiResponse<Company>>(`/companies/${id}`);
    return response.data;
  },

  async createCompany(data: CreateCompanyInput): Promise<ApiResponse<Company>> {
    const response = await apiClient.post<ApiResponse<Company>>('/companies', data);
    return response.data;
  },

  async updateCompany(id: string, data: UpdateCompanyInput): Promise<ApiResponse<Company>> {
    const response = await apiClient.put<ApiResponse<Company>>(`/companies/${id}`, data);
    return response.data;
  },

  async deleteCompany(id: string): Promise<ApiResponse<Company>> {
    const response = await apiClient.delete<ApiResponse<Company>>(`/companies/${id}`);
    return response.data;
  },
};
