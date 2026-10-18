import apiClient from './client';
import type {
  ApiResponse,
  MembershipType,
  Specialization,
  Rank,
  NatureOfMembership,
  AcademicField,
  DegreeLevel,
  AcademicQualification,
  IAcademicQualification,
  IVerifyQualificationPayload,
  AddressType,
  Province,
  City,
} from '@/types';

export const lookupsApi = {
  // Membership Types
  async getMembershipTypes(): Promise<ApiResponse<MembershipType[]>> {
    const res = await apiClient.get<ApiResponse<MembershipType[]>>('/lookups/membership-types');
    return res.data;
  },
  async createMembershipType(data: { title: string; code?: string; description?: string }): Promise<ApiResponse<MembershipType>> {
    const res = await apiClient.post<ApiResponse<MembershipType>>('/lookups/membership-types', data);
    return res.data;
  },
  async updateMembershipType(id: string, data: Partial<MembershipType>): Promise<ApiResponse<MembershipType>> {
    const res = await apiClient.put<ApiResponse<MembershipType>>(`/lookups/membership-types/${id}`, data);
    return res.data;
  },
  async deleteMembershipType(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/lookups/membership-types/${id}`);
    return res.data;
  },

  // Specializations
  async getSpecializations(): Promise<ApiResponse<Specialization[]>> {
    const res = await apiClient.get<ApiResponse<Specialization[]>>('/lookups/specializations');
    return res.data;
  },
  async createSpecialization(data: { title: string; code?: string }): Promise<ApiResponse<Specialization>> {
    const res = await apiClient.post<ApiResponse<Specialization>>('/lookups/specializations', data);
    return res.data;
  },
  async updateSpecialization(id: string, data: Partial<Specialization>): Promise<ApiResponse<Specialization>> {
    const res = await apiClient.put<ApiResponse<Specialization>>(`/lookups/specializations/${id}`, data);
    return res.data;
  },
  async deleteSpecialization(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/lookups/specializations/${id}`);
    return res.data;
  },

  // Ranks
  async getRanks(): Promise<ApiResponse<Rank[]>> {
    const res = await apiClient.get<ApiResponse<Rank[]>>('/lookups/ranks');
    return res.data;
  },
  async createRank(data: { title: string; level?: number }): Promise<ApiResponse<Rank>> {
    const res = await apiClient.post<ApiResponse<Rank>>('/lookups/ranks', data);
    return res.data;
  },
  async updateRank(id: string, data: Partial<Rank>): Promise<ApiResponse<Rank>> {
    const res = await apiClient.put<ApiResponse<Rank>>(`/lookups/ranks/${id}`, data);
    return res.data;
  },
  async deleteRank(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/lookups/ranks/${id}`);
    return res.data;
  },

  // Nature of Memberships
  async getNatureOfMemberships(): Promise<ApiResponse<NatureOfMembership[]>> {
    const res = await apiClient.get<ApiResponse<NatureOfMembership[]>>('/lookups/nature-of-memberships');
    return res.data;
  },
  async createNatureOfMembership(data: { title: string; code?: string }): Promise<ApiResponse<NatureOfMembership>> {
    const res = await apiClient.post<ApiResponse<NatureOfMembership>>('/lookups/nature-of-memberships', data);
    return res.data;
  },
  async updateNatureOfMembership(id: string, data: Partial<NatureOfMembership>): Promise<ApiResponse<NatureOfMembership>> {
    const res = await apiClient.put<ApiResponse<NatureOfMembership>>(`/lookups/nature-of-memberships/${id}`, data);
    return res.data;
  },
  async deleteNatureOfMembership(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/lookups/nature-of-memberships/${id}`);
    return res.data;
  },

  // Academic Fields
  async getAcademicFields(): Promise<ApiResponse<AcademicField[]>> {
    const res = await apiClient.get<ApiResponse<AcademicField[]>>('/lookups/academic-fields');
    return res.data;
  },
  async createAcademicField(data: { title: string }): Promise<ApiResponse<AcademicField>> {
    const res = await apiClient.post<ApiResponse<AcademicField>>('/lookups/academic-fields', data);
    return res.data;
  },
  async updateAcademicField(id: string, data: Partial<AcademicField>): Promise<ApiResponse<AcademicField>> {
    const res = await apiClient.put<ApiResponse<AcademicField>>(`/lookups/academic-fields/${id}`, data);
    return res.data;
  },
  async deleteAcademicField(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/lookups/academic-fields/${id}`);
    return res.data;
  },

  // Degree Levels
  async getDegreeLevels(): Promise<ApiResponse<DegreeLevel[]>> {
    const res = await apiClient.get<ApiResponse<DegreeLevel[]>>('/lookups/degree-levels');
    return res.data;
  },
  async createDegreeLevel(data: { title: string; description?: string }): Promise<ApiResponse<DegreeLevel>> {
    const res = await apiClient.post<ApiResponse<DegreeLevel>>('/lookups/degree-levels', data);
    return res.data;
  },
  async updateDegreeLevel(id: string, data: Partial<DegreeLevel>): Promise<ApiResponse<DegreeLevel>> {
    const res = await apiClient.put<ApiResponse<DegreeLevel>>(`/lookups/degree-levels/${id}`, data);
    return res.data;
  },
  async deleteDegreeLevel(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/lookups/degree-levels/${id}`);
    return res.data;
  },

  // Academic Qualifications
  async getAcademicQualifications(params?: {
    verificationStatus?: string;
    memberId?: string;
    degreeLevel?: string;
    search?: string;
  }): Promise<ApiResponse<IAcademicQualification[]>> {
    const res = await apiClient.get<ApiResponse<IAcademicQualification[]>>(
      '/lookups/academic-qualifications',
      { params }
    );
    return res.data;
  },
  async getAcademicQualificationById(id: string): Promise<ApiResponse<IAcademicQualification>> {
    const res = await apiClient.get<ApiResponse<IAcademicQualification>>(`/lookups/academic-qualifications/${id}`);
    return res.data;
  },
  async createAcademicQualification(data: {
    title: string;
    academicField: string;
    degreeLevel: string;
    memberId?: string;
    institution?: string;
    city?: string;
    startYear?: number;
    graduationYear?: number;
    gpa?: number | string;
    description?: string;
    isLatest?: boolean;
  }): Promise<ApiResponse<AcademicQualification>> {
    const res = await apiClient.post<ApiResponse<AcademicQualification>>('/lookups/academic-qualifications', data);
    return res.data;
  },
  async updateAcademicQualification(
    id: string,
    data: Partial<AcademicQualification>
  ): Promise<ApiResponse<AcademicQualification>> {
    const res = await apiClient.put<ApiResponse<AcademicQualification>>(`/lookups/academic-qualifications/${id}`, data);
    return res.data;
  },
  async deleteAcademicQualification(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/lookups/academic-qualifications/${id}`);
    return res.data;
  },
  async verifyAcademicQualification(
    id: string,
    payload: IVerifyQualificationPayload
  ): Promise<ApiResponse<IAcademicQualification>> {
    const res = await apiClient.patch<ApiResponse<IAcademicQualification>>(
      `/lookups/academic-qualifications/${id}/verify`,
      payload
    );
    return res.data;
  },

  // Address Types
  async getAddressTypes(): Promise<ApiResponse<AddressType[]>> {
    const res = await apiClient.get<ApiResponse<AddressType[]>>('/lookups/address-types');
    return res.data;
  },
  async createAddressType(data: { title: string; code?: string; description?: string }): Promise<ApiResponse<AddressType>> {
    const res = await apiClient.post<ApiResponse<AddressType>>('/lookups/address-types', data);
    return res.data;
  },
  async updateAddressType(id: string, data: Partial<AddressType>): Promise<ApiResponse<AddressType>> {
    const res = await apiClient.put<ApiResponse<AddressType>>(`/lookups/address-types/${id}`, data);
    return res.data;
  },
  async deleteAddressType(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/lookups/address-types/${id}`);
    return res.data;
  },

  // Provinces
  async getProvinces(): Promise<ApiResponse<Province[]>> {
    const res = await apiClient.get<ApiResponse<Province[]>>('/lookups/provinces');
    return res.data;
  },
  async createProvince(data: { title: string; code?: string }): Promise<ApiResponse<Province>> {
    const res = await apiClient.post<ApiResponse<Province>>('/lookups/provinces', data);
    return res.data;
  },
  async updateProvince(id: string, data: Partial<Province>): Promise<ApiResponse<Province>> {
    const res = await apiClient.put<ApiResponse<Province>>(`/lookups/provinces/${id}`, data);
    return res.data;
  },
  async deleteProvince(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/lookups/provinces/${id}`);
    return res.data;
  },

  // Cities
  async getCities(provinceId?: string): Promise<ApiResponse<City[]>> {
    const res = await apiClient.get<ApiResponse<City[]>>('/lookups/cities', {
      params: provinceId ? { provinceId } : undefined,
    });
    return res.data;
  },
  async createCity(data: { title: string; provinceId: string; code?: string }): Promise<ApiResponse<City>> {
    const res = await apiClient.post<ApiResponse<City>>('/lookups/cities', data);
    return res.data;
  },
  async updateCity(id: string, data: Partial<City>): Promise<ApiResponse<City>> {
    const res = await apiClient.put<ApiResponse<City>>(`/lookups/cities/${id}`, data);
    return res.data;
  },
  async deleteCity(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/lookups/cities/${id}`);
    return res.data;
  },
};
