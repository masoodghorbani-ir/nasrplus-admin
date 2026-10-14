import apiClient from './client';
import type {
  ApiResponse,
  Member,
  CreateMemberInput,
  UpdateMemberInput,
  MemberFilterParams,
  MemberAddress,
  CreateAddressInput,
  MemberTelephone,
  CreateTelephoneInput,
  IImportPreviewResponse,
  IImportConfirmPayload,
  IImportExecutionResponse,
} from '@/types';

export const membersApi = {
  async getMembers(params?: MemberFilterParams): Promise<ApiResponse<Member[]>> {
    const response = await apiClient.get<ApiResponse<Member[]>>('/members', { params });
    return response.data;
  },

  async getMemberById(id: string): Promise<ApiResponse<Member>> {
    const response = await apiClient.get<ApiResponse<Member>>(`/members/${id}`);
    return response.data;
  },

  async createMember(data: CreateMemberInput): Promise<ApiResponse<Member>> {
    const response = await apiClient.post<ApiResponse<Member>>('/members', data);
    return response.data;
  },

  async updateMember(id: string, data: UpdateMemberInput): Promise<ApiResponse<Member>> {
    const response = await apiClient.put<ApiResponse<Member>>(`/members/${id}`, data);
    return response.data;
  },

  async deleteMember(id: string): Promise<ApiResponse<Member>> {
    const response = await apiClient.delete<ApiResponse<Member>>(`/members/${id}`);
    return response.data;
  },

  // Address sub-resource
  async getMemberAddresses(memberId: string): Promise<ApiResponse<MemberAddress[]>> {
    const response = await apiClient.get<ApiResponse<MemberAddress[]>>(`/members/${memberId}/addresses`);
    return response.data;
  },

  async addMemberAddress(memberId: string, data: CreateAddressInput): Promise<ApiResponse<MemberAddress>> {
    const response = await apiClient.post<ApiResponse<MemberAddress>>(`/members/${memberId}/addresses`, data);
    return response.data;
  },

  async updateMemberAddress(
    memberId: string,
    addressId: string,
    data: Partial<CreateAddressInput>
  ): Promise<ApiResponse<MemberAddress>> {
    const response = await apiClient.put<ApiResponse<MemberAddress>>(
      `/members/${memberId}/addresses/${addressId}`,
      data
    );
    return response.data;
  },

  async deleteMemberAddress(memberId: string, addressId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/members/${memberId}/addresses/${addressId}`
    );
    return response.data;
  },

  // Telephone sub-resource
  async getMemberTelephones(memberId: string): Promise<ApiResponse<MemberTelephone[]>> {
    const response = await apiClient.get<ApiResponse<MemberTelephone[]>>(`/members/${memberId}/telephones`);
    return response.data;
  },

  async addMemberTelephone(memberId: string, data: CreateTelephoneInput): Promise<ApiResponse<MemberTelephone>> {
    const response = await apiClient.post<ApiResponse<MemberTelephone>>(`/members/${memberId}/telephones`, data);
    return response.data;
  },

  async updateMemberTelephone(
    memberId: string,
    telephoneId: string,
    data: Partial<CreateTelephoneInput>
  ): Promise<ApiResponse<MemberTelephone>> {
    const response = await apiClient.put<ApiResponse<MemberTelephone>>(
      `/members/${memberId}/telephones/${telephoneId}`,
      data
    );
    return response.data;
  },

  async deleteMemberTelephone(memberId: string, telephoneId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/members/${memberId}/telephones/${telephoneId}`
    );
    return response.data;
  },

  // Bulk Excel Import
  async previewImport(file: File): Promise<ApiResponse<IImportPreviewResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<IImportPreviewResponse>>(
      '/members/import/preview',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async confirmImport(payload: IImportConfirmPayload): Promise<ApiResponse<IImportExecutionResponse>> {
    const response = await apiClient.post<ApiResponse<IImportExecutionResponse>>(
      '/members/import/confirm',
      payload
    );
    return response.data;
  },
};
