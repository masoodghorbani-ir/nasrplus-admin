export interface BaseLookup {
  _id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MembershipType extends BaseLookup {
  code?: string;
  description?: string;
}

export interface Specialization extends BaseLookup {
  code?: string;
}

export interface Rank extends BaseLookup {
  level?: number;
}

export interface NatureOfMembership extends BaseLookup {
  code?: string;
  key?: 'REAL' | 'LEGAL' | string;
}

export interface AcademicField extends BaseLookup {}

export interface DegreeLevel extends BaseLookup {
  description?: string;
}

export interface AcademicQualification extends BaseLookup {
  memberId?: string;
  academicField?: string | AcademicField;
  degreeLevel?: string | DegreeLevel;
  institution?: string;
  city?: string;
  startYear?: number;
  graduationYear?: number;
  gpa?: number | string;
  description?: string;
  isLatest?: boolean;
}

export interface AddressType extends BaseLookup {
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface Province extends BaseLookup {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export interface City extends BaseLookup {
  name?: string;
  provinceId?: string | Province;
  code?: string;
  isActive?: boolean;
}
