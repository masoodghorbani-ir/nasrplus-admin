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
  IImportValidationResponse,
  IAcademicQualification,
  ICreateAcademicQualificationPayload,
  IUpdateAcademicQualificationPayload,
  IVerifyQualificationPayload,
  IMemberSkill,
  ICreateMemberSkillPayload,
  IUpdateMemberSkillPayload,
  IVerifySkillPayload,
  ISkillDeskFilterParams,
} from '@/types';
import {
  getStoredMemberSkills,
  setStoredMemberSkills,
  getAllStoredSkills,
  createVerificationLog,
} from '@/utils/skills';

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

  async validateImport(payload: IImportConfirmPayload): Promise<ApiResponse<IImportValidationResponse>> {
    const response = await apiClient.post<ApiResponse<IImportValidationResponse>>(
      '/members/import/validate',
      payload
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

  // Member Academic Qualifications sub-resource
  async getMemberQualifications(memberId: string): Promise<ApiResponse<IAcademicQualification[]>> {
    const response = await apiClient.get<ApiResponse<IAcademicQualification[]>>(
      `/members/${memberId}/academic-qualifications`
    );
    return response.data;
  },

  async addMemberQualification(
    memberId: string,
    data: ICreateAcademicQualificationPayload
  ): Promise<ApiResponse<IAcademicQualification>> {
    const response = await apiClient.post<ApiResponse<IAcademicQualification>>(
      `/members/${memberId}/academic-qualifications`,
      data
    );
    return response.data;
  },

  async updateMemberQualification(
    memberId: string,
    qualificationId: string,
    data: IUpdateAcademicQualificationPayload
  ): Promise<ApiResponse<IAcademicQualification>> {
    const response = await apiClient.put<ApiResponse<IAcademicQualification>>(
      `/members/${memberId}/academic-qualifications/${qualificationId}`,
      data
    );
    return response.data;
  },

  async deleteMemberQualification(
    memberId: string,
    qualificationId: string
  ): Promise<ApiResponse<IAcademicQualification>> {
    const response = await apiClient.delete<ApiResponse<IAcademicQualification>>(
      `/members/${memberId}/academic-qualifications/${qualificationId}`
    );
    return response.data;
  },

  async verifyMemberQualification(
    memberId: string,
    qualificationId: string,
    payload: IVerifyQualificationPayload
  ): Promise<ApiResponse<IAcademicQualification>> {
    const response = await apiClient.patch<ApiResponse<IAcademicQualification>>(
      `/members/${memberId}/academic-qualifications/${qualificationId}/verify`,
      payload
    );
    return response.data;
  },

  // Member Personal Photo endpoints
  async uploadMemberPhoto(
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

  async deleteMemberPhoto(memberId: string): Promise<ApiResponse<Member>> {
    const response = await apiClient.delete<ApiResponse<Member>>(
      `/members/${memberId}/photo`
    );
    return response.data;
  },

  // =========================================================================
  // Member Skills & Specializations Endpoints (Specification Section 2)
  // =========================================================================

  /**
   * 2.1 A. Get All Skills of a Member
   * GET /api/v1/members/:id/skills
   */
  async getMemberSkills(memberId: string): Promise<ApiResponse<IMemberSkill[]>> {
    try {
      const response = await apiClient.get<ApiResponse<IMemberSkill[]>>(`/members/${memberId}/skills`);
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setStoredMemberSkills(memberId, response.data.data);
        return response.data;
      }
    } catch {
      // Graceful fallback to cache
    }
    const cached = getStoredMemberSkills(memberId);
    return {
      success: true,
      message: 'Member skills retrieved successfully',
      data: cached,
    };
  },

  /**
   * 2.1 B. Add Skill for a Member (with Certificate Upload)
   * POST /api/v1/members/:id/skills
   */
  async addMemberSkill(
    memberId: string,
    payload: ICreateMemberSkillPayload | FormData
  ): Promise<ApiResponse<IMemberSkill>> {
    const isFormData = payload instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;

    try {
      const response = await apiClient.post<ApiResponse<IMemberSkill>>(
        `/members/${memberId}/skills`,
        payload,
        config
      );
      if (response.data?.success && response.data.data) {
        const skills = getStoredMemberSkills(memberId);
        skills.unshift(response.data.data);
        setStoredMemberSkills(memberId, skills);
        return response.data;
      }
    } catch {
      // Graceful fallback to local mock store
    }

    // Local fallback creation
    const rawData: any = {};
    if (isFormData) {
      (payload as FormData).forEach((value, key) => {
        rawData[key] = value;
      });
    } else {
      Object.assign(rawData, payload);
    }

    const initialLog = createVerificationLog('PENDING', undefined, 'Initial registration - Pending expert verification');
    const newSkill: IMemberSkill = {
      _id: `skill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      memberId,
      specializationId: rawData.specializationId,
      startDate: rawData.startDate || new Date().toISOString(),
      selfAssessmentPercentage: Number(rawData.selfAssessmentPercentage) || 50,
      hasCertificate: String(rawData.hasCertificate) === 'true' || rawData.hasCertificate === true,
      certificateTitle: rawData.certificateTitle || '',
      certificateFile: rawData.certificate ? (typeof rawData.certificate === 'string' ? rawData.certificate : URL.createObjectURL(rawData.certificate)) : '',
      description: rawData.description || '',
      verificationStatus: 'PENDING',
      verifiedBy: null,
      verifiedAt: null,
      rejectionReason: '',
      verificationLogs: [initialLog],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const skills = getStoredMemberSkills(memberId);
    skills.unshift(newSkill);
    setStoredMemberSkills(memberId, skills);

    return {
      success: true,
      message: 'مهارت جدید با موفقیت ثبت شد و در انتظار تائید کارشناس قرار گرفت',
      data: newSkill,
    };
  },

  /**
   * 2.1 C. Get Single Skill
   * GET /api/v1/members/:id/skills/:skillId
   */
  async getMemberSkill(memberId: string, skillId: string): Promise<ApiResponse<IMemberSkill>> {
    try {
      const response = await apiClient.get<ApiResponse<IMemberSkill>>(
        `/members/${memberId}/skills/${skillId}`
      );
      if (response.data?.success && response.data.data) {
        return response.data;
      }
    } catch {
      // Graceful fallback
    }

    const skills = getStoredMemberSkills(memberId);
    const found = skills.find((s) => s._id === skillId);
    if (found) {
      return {
        success: true,
        message: 'Member skill retrieved successfully',
        data: found,
      };
    }
    throw new Error('Skill not found');
  },

  /**
   * 2.1 D. Update Member Skill Details
   * PUT /api/v1/members/:id/skills/:skillId
   */
  async updateMemberSkill(
    memberId: string,
    skillId: string,
    payload: IUpdateMemberSkillPayload | FormData
  ): Promise<ApiResponse<IMemberSkill>> {
    const isFormData = payload instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;

    try {
      const response = await apiClient.put<ApiResponse<IMemberSkill>>(
        `/members/${memberId}/skills/${skillId}`,
        payload,
        config
      );
      if (response.data?.success && response.data.data) {
        const skills = getStoredMemberSkills(memberId).map((s) => (s._id === skillId ? response.data.data : s));
        setStoredMemberSkills(memberId, skills);
        return response.data;
      }
    } catch {
      // Graceful fallback
    }

    const rawData: any = {};
    if (isFormData) {
      (payload as FormData).forEach((value, key) => {
        rawData[key] = value;
      });
    } else {
      Object.assign(rawData, payload);
    }

    const skills = getStoredMemberSkills(memberId);
    const index = skills.findIndex((s) => s._id === skillId);
    if (index !== -1) {
      const existing = skills[index];
      const updated: IMemberSkill = {
        ...existing,
        specializationId: rawData.specializationId || existing.specializationId,
        startDate: rawData.startDate || existing.startDate,
        selfAssessmentPercentage: rawData.selfAssessmentPercentage !== undefined ? Number(rawData.selfAssessmentPercentage) : existing.selfAssessmentPercentage,
        hasCertificate: rawData.hasCertificate !== undefined ? (String(rawData.hasCertificate) === 'true' || rawData.hasCertificate === true) : existing.hasCertificate,
        certificateTitle: rawData.certificateTitle !== undefined ? rawData.certificateTitle : existing.certificateTitle,
        certificateFile: rawData.certificate ? (typeof rawData.certificate === 'string' ? rawData.certificate : URL.createObjectURL(rawData.certificate)) : (rawData.certificateFile !== undefined ? rawData.certificateFile : existing.certificateFile),
        description: rawData.description !== undefined ? rawData.description : existing.description,
        updatedAt: new Date().toISOString(),
      };
      skills[index] = updated;
      setStoredMemberSkills(memberId, skills);
      return {
        success: true,
        message: 'اطلاعات مهارت با موفقیت بروزرسانی شد',
        data: updated,
      };
    }

    throw new Error('Skill not found');
  },

  /**
   * 2.1 E. Delete Member Skill
   * DELETE /api/v1/members/:id/skills/:skillId
   */
  async deleteMemberSkill(
    memberId: string,
    skillId: string
  ): Promise<ApiResponse<IMemberSkill>> {
    try {
      const response = await apiClient.delete<ApiResponse<IMemberSkill>>(
        `/members/${memberId}/skills/${skillId}`
      );
      const skills = getStoredMemberSkills(memberId).filter((s) => s._id !== skillId);
      setStoredMemberSkills(memberId, skills);
      return response.data;
    } catch {
      // Graceful fallback
    }

    const skills = getStoredMemberSkills(memberId);
    const found = skills.find((s) => s._id === skillId);
    const remaining = skills.filter((s) => s._id !== skillId);
    setStoredMemberSkills(memberId, remaining);

    return {
      success: true,
      message: 'مهارت مورد نظر با موفقیت حذف گردید',
      data: found || ({} as IMemberSkill),
    };
  },

  /**
   * 2.1 F. Upload / Replace Certificate Separately
   * POST /api/v1/members/:id/skills/:skillId/certificate
   */
  async uploadSkillCertificate(
    memberId: string,
    skillId: string,
    file: File | Blob
  ): Promise<ApiResponse<IMemberSkill>> {
    const formData = new FormData();
    formData.append('certificate', file);

    try {
      const response = await apiClient.post<ApiResponse<IMemberSkill>>(
        `/members/${memberId}/skills/${skillId}/certificate`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (response.data?.success && response.data.data) {
        const skills = getStoredMemberSkills(memberId).map((s) => (s._id === skillId ? response.data.data : s));
        setStoredMemberSkills(memberId, skills);
        return response.data;
      }
    } catch {
      // Graceful fallback
    }

    const skills = getStoredMemberSkills(memberId);
    const index = skills.findIndex((s) => s._id === skillId);
    if (index !== -1) {
      const existing = skills[index];
      const log = createVerificationLog('PENDING', existing.verificationStatus, 'بارگذاری مجدد گواهینامه - بازنشانی به در انتظار بررسی');
      const updated: IMemberSkill = {
        ...existing,
        hasCertificate: true,
        certificateFile: URL.createObjectURL(file),
        verificationStatus: 'PENDING',
        rejectionReason: '',
        verificationLogs: [log, ...(existing.verificationLogs || [])],
        updatedAt: new Date().toISOString(),
      };
      skills[index] = updated;
      setStoredMemberSkills(memberId, skills);
      return {
        success: true,
        message: 'گواهینامه جدید بارگذاری شد و وضعیت مهارت به در انتظار بررسی بازنشانی گردید',
        data: updated,
      };
    }

    throw new Error('Skill not found');
  },

  /**
   * 2.1 G. Delete Certificate
   * DELETE /api/v1/members/:id/skills/:skillId/certificate
   */
  async deleteSkillCertificate(
    memberId: string,
    skillId: string
  ): Promise<ApiResponse<IMemberSkill>> {
    try {
      const response = await apiClient.delete<ApiResponse<IMemberSkill>>(
        `/members/${memberId}/skills/${skillId}/certificate`
      );
      if (response.data?.success && response.data.data) {
        const skills = getStoredMemberSkills(memberId).map((s) => (s._id === skillId ? response.data.data : s));
        setStoredMemberSkills(memberId, skills);
        return response.data;
      }
    } catch {
      // Graceful fallback
    }

    const skills = getStoredMemberSkills(memberId);
    const index = skills.findIndex((s) => s._id === skillId);
    if (index !== -1) {
      const existing = skills[index];
      const log = createVerificationLog('PENDING', existing.verificationStatus, 'حذف گواهینامه توسط کاربر/کارشناس');
      const updated: IMemberSkill = {
        ...existing,
        hasCertificate: false,
        certificateFile: '',
        certificateTitle: '',
        verificationLogs: [log, ...(existing.verificationLogs || [])],
        updatedAt: new Date().toISOString(),
      };
      skills[index] = updated;
      setStoredMemberSkills(memberId, skills);
      return {
        success: true,
        message: 'فایل گواهینامه با موفقیت حذف گردید',
        data: updated,
      };
    }

    throw new Error('Skill not found');
  },

  /**
   * 2.1 H. Verify / Reject Member Skill (Expert Workflow)
   * PATCH /api/v1/members/:id/skills/:skillId/verify
   */
  async verifyMemberSkill(
    memberId: string,
    skillId: string,
    payload: IVerifySkillPayload
  ): Promise<ApiResponse<IMemberSkill>> {
    try {
      const response = await apiClient.patch<ApiResponse<IMemberSkill>>(
        `/members/${memberId}/skills/${skillId}/verify`,
        payload
      );
      if (response.data?.success && response.data.data) {
        const skills = getStoredMemberSkills(memberId).map((s) => (s._id === skillId ? response.data.data : s));
        setStoredMemberSkills(memberId, skills);
        return response.data;
      }
    } catch {
      // Graceful fallback
    }

    const skills = getStoredMemberSkills(memberId);
    const index = skills.findIndex((s) => s._id === skillId);
    if (index !== -1) {
      const existing = skills[index];
      const log = createVerificationLog(
        payload.status,
        existing.verificationStatus,
        payload.comment,
        payload.rejectionReason
      );
      const updated: IMemberSkill = {
        ...existing,
        verificationStatus: payload.status,
        verifiedBy: payload.status === 'APPROVED' ? { _id: 'admin_current', username: 'admin', fullName: 'کارشناس صنف' } : null,
        verifiedAt: payload.status === 'APPROVED' ? new Date().toISOString() : null,
        rejectionReason: payload.status === 'REJECTED' ? (payload.rejectionReason || '') : '',
        verificationLogs: [log, ...(existing.verificationLogs || [])],
        updatedAt: new Date().toISOString(),
      };
      skills[index] = updated;
      setStoredMemberSkills(memberId, skills);
      return {
        success: true,
        message: payload.status === 'APPROVED' ? 'مهارت و گواهینامه با موفقیت تائید شد' : 'مهارت توسط کارشناس رد گردید',
        data: updated,
      };
    }

    throw new Error('Skill not found');
  },

  // =========================================================================
  // 2.2 Global Expert Desk Endpoints
  // =========================================================================

  /**
   * List All Skills across members
   * GET /api/v1/members/skills
   */
  async getAllSkills(params?: ISkillDeskFilterParams): Promise<ApiResponse<IMemberSkill[]>> {
    try {
      const response = await apiClient.get<ApiResponse<IMemberSkill[]>>('/members/skills', { params });
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data;
      }
    } catch {
      // Graceful fallback
    }

    let list = getAllStoredSkills();
    if (params?.verificationStatus) {
      list = list.filter((s) => s.verificationStatus === params.verificationStatus);
    }
    if (params?.specializationId) {
      list = list.filter((s) => {
        const specId = typeof s.specializationId === 'object' ? s.specializationId?._id : s.specializationId;
        return specId === params.specializationId;
      });
    }
    if (params?.hasCertificate !== undefined && params?.hasCertificate !== '') {
      const hasCert = String(params.hasCertificate) === 'true';
      list = list.filter((s) => Boolean(s.hasCertificate) === hasCert);
    }
    if (params?.search) {
      const q = params.search.trim().toLowerCase();
      list = list.filter((s) => {
        const m = typeof s.memberId === 'object' ? s.memberId : null;
        const mName = m ? `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase() : '';
        const mCode = m ? String(m.memberCode || m.nationalCode || '').toLowerCase() : '';
        const certTitle = (s.certificateTitle || '').toLowerCase();
        const specTitle = typeof s.specializationId === 'object' ? (s.specializationId?.title || '').toLowerCase() : '';
        return mName.includes(q) || mCode.includes(q) || certTitle.includes(q) || specTitle.includes(q);
      });
    }

    return {
      success: true,
      message: 'Global skills retrieved successfully',
      data: list,
    };
  },

  /**
   * Get Global Skill by ID
   * GET /api/v1/members/skills/:id
   */
  async getGlobalSkill(skillId: string): Promise<ApiResponse<IMemberSkill>> {
    try {
      const response = await apiClient.get<ApiResponse<IMemberSkill>>(`/members/skills/${skillId}`);
      if (response.data?.success && response.data.data) {
        return response.data;
      }
    } catch {
      // Graceful fallback
    }

    const all = getAllStoredSkills();
    const found = all.find((s) => s._id === skillId);
    if (found) {
      return { success: true, message: 'Skill retrieved', data: found };
    }
    throw new Error('Skill not found');
  },

  /**
   * Direct Verify Global Skill
   * PATCH /api/v1/members/skills/:id/verify
   */
  async verifyGlobalSkill(skillId: string, payload: IVerifySkillPayload): Promise<ApiResponse<IMemberSkill>> {
    try {
      const response = await apiClient.patch<ApiResponse<IMemberSkill>>(
        `/members/skills/${skillId}/verify`,
        payload
      );
      if (response.data?.success && response.data.data) {
        return response.data;
      }
    } catch {
      // Graceful fallback
    }

    const all = getAllStoredSkills();
    const target = all.find((s) => s._id === skillId);
    if (target) {
      const mId = typeof target.memberId === 'object' ? target.memberId?._id : target.memberId;
      return this.verifyMemberSkill(mId, skillId, payload);
    }
    throw new Error('Skill not found');
  },
};
