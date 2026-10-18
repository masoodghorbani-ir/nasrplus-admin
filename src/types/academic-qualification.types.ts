// Verification status enum
export type QualificationVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Operator summary
export interface IAdminSummary {
  _id: string;
  username: string;
  fullName?: string;
  type?: string;
}

// Single audit log record
export interface IQualificationVerificationLog {
  _id?: string;
  fromStatus?: QualificationVerificationStatus;
  toStatus: QualificationVerificationStatus;
  changedBy?: IAdminSummary | string | null;
  changedAt: string;
  comment?: string;
}

// Related lookup references
export interface IAcademicFieldSummary {
  _id: string;
  title: string;
  code?: string;
}

export interface IDegreeLevelSummary {
  _id: string;
  title: string;
  code?: string;
  rankOrder?: number;
}

// Member summary for populated member references in desk view
export interface IMemberSummary {
  _id: string;
  memberCode?: string;
  nationalCode?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

// Full Academic Qualification entity
export interface IAcademicQualification {
  _id: string;
  memberId?: string | IMemberSummary | any;
  title: string;
  academicField: IAcademicFieldSummary | string | any;
  degreeLevel: IDegreeLevelSummary | string | any;
  institution?: string;
  city?: string;
  startYear?: number;
  graduationYear?: number;
  gpa?: number;
  description?: string;
  verificationStatus: QualificationVerificationStatus;
  verifiedBy?: IAdminSummary | string | null;
  verifiedAt?: string | null;
  rejectionReason?: string;
  verificationLogs: IQualificationVerificationLog[];
  isActive: boolean;
  isLatest?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form payload for Create
export interface ICreateAcademicQualificationPayload {
  title: string;
  academicField: string;
  degreeLevel: string;
  institution?: string;
  city?: string;
  startYear?: number;
  graduationYear?: number;
  gpa?: number;
  description?: string;
}

// Form payload for Update
export type IUpdateAcademicQualificationPayload = Partial<ICreateAcademicQualificationPayload>;

// Payload for Verify / Reject modal
export interface IVerifyQualificationPayload {
  status: QualificationVerificationStatus;
  rejectionReason?: string;
  comment?: string;
}
