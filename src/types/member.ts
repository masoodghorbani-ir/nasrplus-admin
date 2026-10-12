import type {
  AddressType,
  Province,
  City,
  MembershipType,
  Specialization,
  Rank,
  NatureOfMembership,
  AcademicQualification,
} from './lookups';
import type { Company } from './company';

export type MemberStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'REJECTED';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type PhoneType = 'MOBILE' | 'LANDLINE' | 'FAX' | 'SUPPORT' | 'OTHER';

export interface MemberTelephone {
  _id: string;
  membershipId?: string;
  phoneType: PhoneType;
  phoneNumber: string;
  areaCode?: string;
  countryCode?: string;
  extension?: string;
  title?: string;
  isPrimary?: boolean;
}

export interface CreateTelephoneInput {
  phoneType?: PhoneType;
  phoneNumber: string;
  areaCode?: string;
  countryCode?: string;
  extension?: string;
  title?: string;
  isPrimary?: boolean;
}

export interface MemberAddress {
  _id: string;
  membershipId?: string;
  addressType: string | AddressType;
  province: string | Province;
  city: string | City;
  postalCode?: string;
  address: string;
  plaque?: string;
  isPrimary?: boolean;
}

export interface CreateAddressInput {
  addressType: string;
  province: string;
  city: string;
  postalCode?: string;
  address: string;
  plaque?: string;
  isPrimary?: boolean;
}

export interface Member {
  _id: string;
  memberCode: string;
  nationalCode?: string;
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  gender?: Gender;
  birthDate?: string;
  status: MemberStatus;
  membershipTypeId: string | MembershipType;
  specializationId: string | Specialization;
  rankId?: string | Rank;
  latestAcademicQualifications?: string | AcademicQualification;
  natureOfMembership: string | NatureOfMembership;
  companyInformation?: string | Company;
  membershipDate?: string;
  expiryDate?: string;
  notes?: string;
  addresses?: MemberAddress[];
  telephones?: MemberTelephone[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMemberInput {
  memberCode: string;
  nationalCode?: string;
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  gender?: Gender;
  birthDate?: string;
  membershipTypeId: string;
  specializationId: string;
  rankId?: string;
  latestAcademicQualifications?: string;
  natureOfMembership: string;
  companyInformation?: string;
  membershipDate?: string;
  expiryDate?: string;
}

export interface UpdateMemberInput {
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  gender?: Gender;
  birthDate?: string;
  status?: MemberStatus;
  membershipTypeId?: string;
  specializationId?: string;
  rankId?: string;
  latestAcademicQualifications?: string;
  natureOfMembership?: string;
  companyInformation?: string;
  membershipDate?: string;
  expiryDate?: string;
  notes?: string;
}

export interface MemberFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MemberStatus | '';
  natureOfMembership?: string;
  membershipTypeId?: string;
  specializationId?: string;
  rankId?: string;
}
