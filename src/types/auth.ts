export type AdminType = 'ADMIN' | 'SUPERADMIN';

export interface Permission {
  _id: string;
  name: string;
  key: string;
  module: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: string;
  _id?: string;
  username: string;
  type: AdminType;
  fullName: string;
  isActive?: boolean;
  permissions: Permission[] | string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  admin: AdminUser;
}

export interface CreateAdminInput {
  username: string;
  password: string;
  type?: AdminType;
  fullName?: string;
  isActive?: boolean;
  permissions?: string[];
}
