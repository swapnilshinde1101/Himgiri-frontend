import api from './api';
import type { SchoolKit, CreateSchoolKitRequest, ApiResponse, BaseRequest } from '../types';

export const kitService = {
  getKits: async (request: BaseRequest): Promise<ApiResponse<SchoolKit[]>> => {
    const { data } = await api.get<ApiResponse<SchoolKit[]>>('/kits', { params: request });
    return data;
  },

  getKit: async (id: string): Promise<SchoolKit> => {
    const { data } = await api.get<ApiResponse<SchoolKit>>(`/kits/${id}`);
    return data.data;
  },

  getKitsByGrade: async (gradeId: string): Promise<SchoolKit[]> => {
    const { data } = await api.get<ApiResponse<SchoolKit[]>>(`/kits/grade/${gradeId}`);
    return data.data;
  },

  createKit: async (request: CreateSchoolKitRequest): Promise<SchoolKit> => {
    const { data } = await api.post<ApiResponse<SchoolKit>>('/kits', request);
    return data.data;
  },

  updateKit: async (id: string, request: CreateSchoolKitRequest): Promise<SchoolKit> => {
    const { data } = await api.put<ApiResponse<SchoolKit>>(`/kits/${id}`, request);
    return data.data;
  },

  deleteKit: async (id: string): Promise<boolean> => {
    const { data } = await api.delete<ApiResponse<boolean>>(`/kits/${id}`);
    return data.data;
  },
};
