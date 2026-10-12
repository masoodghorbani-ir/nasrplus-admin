import apiClient from './client';

export interface HealthResponse {
  status: string;
  service: string;
  swaggerDocs?: string;
  timestamp: string;
}

export const healthApi = {
  async getHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  },
};
