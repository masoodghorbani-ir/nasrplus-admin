import type { MemberStatus } from './member';

export interface MemberInquiryPayload {
  memberCode: string;
  nationalCode: string;
  captchaCode: string;
}

export interface MemberInquiryResult {
  _id?: string;
  memberCode: string;
  nationalCode?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  fatherName?: string;
  profileImage?: string | null;
  status: MemberStatus;
  statusLabel: string;
  statusVariant: 'success' | 'warning' | 'danger' | 'secondary';
  membershipDate?: string;
  membershipDateJalali?: string;
  expiryDate?: string;
  expiryDateJalali?: string;
  isExpired?: boolean;
  membershipTypeName?: string;
  natureOfMembershipName?: string;
  specializationName?: string;
  rankName?: string;
  provinceName?: string;
  cityName?: string;
  companyName?: string;
  inquiryCode: string;
  inquiryTimestamp: string;
  inquiryDateJalali: string;
}
