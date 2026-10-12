export type CompanyType =
  | 'PRIVATE_JOINT_STOCK'
  | 'PUBLIC_JOINT_STOCK'
  | 'LIMITED_LIABILITY'
  | 'COOPERATIVE'
  | 'KNOWLEDGE_BASED'
  | 'STARTUP'
  | 'OTHER';

export interface Company {
  _id: string;
  title: string;
  companyType?: CompanyType;
  nationalId?: string;
  registrationNumber?: string;
  economicCode?: string;
  ceoName?: string;
  website?: string;
  email?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyInput {
  title: string;
  companyType?: CompanyType;
  nationalId?: string;
  registrationNumber?: string;
  economicCode?: string;
  ceoName?: string;
  website?: string;
  email?: string;
  description?: string;
}

export interface UpdateCompanyInput extends Partial<CreateCompanyInput> {}
