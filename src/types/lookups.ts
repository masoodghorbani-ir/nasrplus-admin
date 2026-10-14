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
  academicField?: string | AcademicField;
  degreeLevel?: string | DegreeLevel;
  institution?: string;
  graduationYear?: number;
}

export interface AddressType {
  _id: string;
  title: string;
}

export interface Province {
  _id: string;
  name: string;
  code?: string;
}

export interface City {
  _id: string;
  name: string;
  provinceId?: string;
}
