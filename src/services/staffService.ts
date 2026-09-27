import api from './api';
import type { ApiResponse, AdminRole } from '../types';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  roleName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  accessFailedCount: number;
  isLockedOut: boolean;
  lockoutEnd: string | null;
  createdAt: string;
  customPermissions?: string[] | null;
  effectivePermissions?: string[] | null;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

export const staffService = {
  getAllStaff: async (): Promise<ApiResponse<StaffMember[]>> => {
    const res = await api.get<ApiResponse<StaffMember[]>>('/staff');
    return res.data;
  },

  getStaffById: async (id: string): Promise<ApiResponse<StaffMember>> => {
    const res = await api.get<ApiResponse<StaffMember>>(`/staff/${id}`);
    return res.data;
  },

  createStaff: async (payload: CreateStaffPayload): Promise<ApiResponse<StaffMember>> => {
    const res = await api.post<ApiResponse<StaffMember>>('/staff', payload);
    return res.data;
  },

  updateStaffRole: async (id: string, role: AdminRole): Promise<ApiResponse<StaffMember>> => {
    const res = await api.patch<ApiResponse<StaffMember>>(`/staff/${id}/role`, { role });
    return res.data;
  },

  updateStaffPermissions: async (id: string, permissions: string[] | null): Promise<ApiResponse<StaffMember>> => {
    const res = await api.put<ApiResponse<StaffMember>>(`/staff/${id}/permissions`, { permissions });
    return res.data;
  },

  updateStaffStatus: async (id: string, isActive: boolean): Promise<ApiResponse<StaffMember>> => {
    const res = await api.patch<ApiResponse<StaffMember>>(`/staff/${id}/status`, { isActive });
    return res.data;
  },

  resetStaffPassword: async (id: string, newPassword: string): Promise<ApiResponse<boolean>> => {
    const res = await api.post<ApiResponse<boolean>>(`/staff/${id}/reset-password`, { newPassword });
    return res.data;
  },

  unlockStaffAccount: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await api.post<ApiResponse<boolean>>(`/staff/${id}/unlock`);
    return res.data;
  },

  deleteStaff: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await api.delete<ApiResponse<boolean>>(`/staff/${id}`);
    return res.data;
  },
};
