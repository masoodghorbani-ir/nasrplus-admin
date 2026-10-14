export type PublicMembershipKind = 'REAL' | 'LEGAL';

export interface DocumentUploadItem {
  id: string;
  field: string;
  title: string;
  required: boolean;
  fileName?: string;
  fileSize?: number;
  previewUrl?: string;
  dataUrl?: string;
  fileType?: string;
  uploadedAt?: string;
}

export interface PublicRegistrationPayload {
  // Membership Type
  kind: PublicMembershipKind;
  membershipCategory: string; // e.g. کارشناس فاوا، شرکت نرم‌افزاری

  // Personal Info (Real & Legal Representative)
  firstName: string;
  lastName: string;
  nationalCode: string;
  fatherName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  idNumber?: string;

  // Legal entity info (if kind === 'LEGAL')
  companyName?: string;
  companyNationalId?: string;
  companyRegistrationNumber?: string;
  companyEconomicCode?: string;
  companyEstablishmentDate?: string;
  representativePosition?: string;

  // Contact Info
  mobilePhone: string;
  phone?: string;
  email?: string;
  province: string;
  city: string;
  postalCode: string;
  address: string;
  website?: string;

  // Professional / Business
  specialization: string;
  degreeLevel?: string;
  academicField?: string;
  experienceYears?: number;
  activitySummary?: string;

  // Documents
  documents?: DocumentUploadItem[];

  // Terms agreement
  acceptedTerms: boolean;
}

export type RegistrationStepStatus = 'PENDING' | 'UNDER_REVIEW' | 'DOCUMENT_VERIFIED' | 'APPROVED' | 'REJECTED';

export interface RegistrationTrackRecord {
  trackingCode: string;
  nationalCode: string;
  fullName: string;
  companyName?: string;
  kind: PublicMembershipKind;
  mobilePhone: string;
  specialization: string;
  province: string;
  status: RegistrationStepStatus;
  statusLabel: string;
  submittedAt: string;
  lastUpdatedAt: string;
  reviewNotes?: string;
  stepsTimeline: Array<{
    title: string;
    description: string;
    completed: boolean;
    active: boolean;
    date?: string;
  }>;
}
