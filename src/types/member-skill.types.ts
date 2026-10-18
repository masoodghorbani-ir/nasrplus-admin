import type { IAdminSummary, IMemberSummary } from './academic-qualification.types';

// Verification status enum
export type SkillVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Single audit log record for skill transitions
export interface ISkillVerificationLog {
  _id?: string;
  fromStatus?: SkillVerificationStatus;
  toStatus: SkillVerificationStatus;
  changedBy?: IAdminSummary | string | null;
  changedAt: string;
  comment?: string;
  rejectionReason?: string;
}

// Specialization summary for populated reference
export interface ISpecializationSummary {
  _id: string;
  title: string;
  code?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
}

// Full Member Skill & Specialization entity
export interface IMemberSkill {
  _id: string;
  memberId: string | IMemberSummary | any;
  specializationId: ISpecializationSummary | string | any;
  startDate: string; // e.g. "2020-03-20T00:00:00.000Z" or "2020-03-20"
  selfAssessmentPercentage: number; // 1 to 100
  hasCertificate: boolean;
  certificateFile?: string; // e.g. "/uploads/members/certificates/cert-..."
  certificateTitle?: string;
  description?: string;
  verificationStatus: SkillVerificationStatus;
  verifiedBy?: IAdminSummary | string | null;
  verifiedAt?: string | null;
  rejectionReason?: string;
  verificationLogs: ISkillVerificationLog[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form payload for Create Member Skill
export interface ICreateMemberSkillPayload {
  specializationId: string;
  startDate: string;
  selfAssessmentPercentage: number;
  hasCertificate: boolean;
  certificateTitle?: string;
  description?: string;
  certificate?: File | Blob | null;
}

// Form payload for Update Member Skill
export type IUpdateMemberSkillPayload = Partial<ICreateMemberSkillPayload>;

// Payload for Verify / Reject skill modal
export interface IVerifySkillPayload {
  status: SkillVerificationStatus;
  rejectionReason?: string;
  comment?: string;
}

// Filter query parameters for Global Expert Desk
export interface ISkillDeskFilterParams {
  verificationStatus?: SkillVerificationStatus | string;
  specializationId?: string;
  hasCertificate?: boolean | string;
  search?: string;
  page?: number;
  limit?: number;
}
