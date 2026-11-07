export type AdminType = 'ADMIN' | 'SUPERADMIN' | 'EXPERT';

export interface ReviewableSpecializationSummary {
  _id: string;
  title: string;
  code?: string;
  isActive?: boolean;
}

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
  id?: string;
  _id?: string;
  username: string;
  type: AdminType;
  fullName: string;
  isActive?: boolean;
  permissions: Permission[] | string[];
  reviewableSpecializations?: ReviewableSpecializationSummary[];
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
  reviewableSpecializations?: string[];
}

export interface UpdateAdminInput {
  username?: string;
  password?: string;
  type?: AdminType;
  fullName?: string;
  isActive?: boolean;
  permissions?: string[];
  reviewableSpecializations?: string[];
}

export interface AssignPermissionsInput {
  permissionIds: string[];
}

export interface AdminLoginLog {
  _id: string;
  adminId?: {
    _id: string;
    username: string;
    fullName?: string;
    type?: AdminType;
    isActive?: boolean;
  } | string;
  username: string;
  adminType?: AdminType;
  fullName?: string;
  ip?: string;
  userAgent?: string;
  device?: 'Desktop' | 'Mobile' | 'Tablet' | string;
  browser?: string;
  os?: string;
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  loginAt: string;
  createdAt?: string;
}

export interface AdminLoginLogsQuery {
  page?: number;
  limit?: number;
  adminId?: string;
  username?: string;
  adminType?: AdminType;
  status?: 'SUCCESS' | 'FAILED';
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AdminLoginLogsResponseData {
  logs: AdminLoginLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

