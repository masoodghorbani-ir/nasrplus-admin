import apiClient from './client';
import type { ApiResponse, Member, IAcademicQualification, IMemberSkill } from '@/types';

export interface MemberPortalLoginPayload {
  memberCode: string;
  nationalCode: string;
}

export interface MemberPortalLoginResponse {
  token: string;
  member: Member;
}

export const memberPortalApi = {
  /**
   * Login as member using Membership Code & National Code
   * POST /api/v1/members/portal/login
   */
  async login(payload: MemberPortalLoginPayload): Promise<ApiResponse<MemberPortalLoginResponse>> {
    const response = await apiClient.post<ApiResponse<MemberPortalLoginResponse>>(
      '/members/portal/login',
      payload
    );
    return response.data;
  },

  /**
   * Fetch current member profile details
   * GET /api/v1/members/:id
   */
  async getProfile(memberId: string): Promise<ApiResponse<Member>> {
    const response = await apiClient.get<ApiResponse<Member>>(`/members/${memberId}`);
    return response.data;
  },

  /**
   * Upload or update member personal photo
   * POST /api/v1/members/:id/photo
   */
  async updatePhoto(
    memberId: string,
    file: File | Blob,
    onProgress?: (percent: number) => void
  ): Promise<ApiResponse<Member>> {
    const formData = new FormData();
    formData.append('photo', file, 'member-photo.jpg');

    const response = await apiClient.post<ApiResponse<Member>>(
      `/members/${memberId}/photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );
    return response.data;
  },

  /**
   * Remove member personal photo
   * DELETE /api/v1/members/:id/photo
   */
  async deletePhoto(memberId: string): Promise<ApiResponse<Member>> {
    const response = await apiClient.delete<ApiResponse<Member>>(`/members/${memberId}/photo`);
    return response.data;
  },

  /**
   * Get member academic qualifications
   * GET /api/v1/members/:id/academic-qualifications
   */
  async getQualifications(memberId: string): Promise<ApiResponse<IAcademicQualification[]>> {
    const response = await apiClient.get<ApiResponse<IAcademicQualification[]>>(
      `/members/${memberId}/academic-qualifications`
    );
    return response.data;
  },

  /**
   * Get member skills and certificates
   * GET /api/v1/members/:id/skills
   */
  async getSkills(memberId: string): Promise<ApiResponse<IMemberSkill[]>> {
    const response = await apiClient.get<ApiResponse<IMemberSkill[]>>(
      `/members/${memberId}/skills`
    );
    return response.data;
  },
};
