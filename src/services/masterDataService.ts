import api from './api';
import type { ApiResponse, BaseRequest } from '../types';

export interface GradeDto {
  id: string;
  name: string;
  shortName: string;
  displayOrder: number;
}

export interface CategoryDto {
  id: string;
  name: string;
  hsnCode: string;
  gstPercent: number;
  cgstPercent: number;
  sgstPercent: number;
}

export const masterDataService = {
  // Grades
  getGrades: async (request?: BaseRequest): Promise<ApiResponse<GradeDto[]>> => {
    const { data } = await api.get<ApiResponse<GradeDto[]>>('/grades', { params: request });
    return data;
  },
  createGrade: async (grade: Partial<GradeDto>): Promise<GradeDto> => {
    const { data } = await api.post<ApiResponse<GradeDto>>('/grades', grade);
    return data.data;
  },
  updateGrade: async (id: string, grade: Partial<GradeDto>): Promise<GradeDto> => {
    const { data } = await api.put<ApiResponse<GradeDto>>(`/grades/${id}`, grade);
    return data.data;
  },
  deleteGrade: async (id: string): Promise<boolean> => {
    const { data } = await api.delete<ApiResponse<boolean>>(`/grades/${id}`);
    return data.data;
  },
  getGradeSuggestions: async (term: string): Promise<ApiResponse<string[]>> => {
    const { data } = await api.get<ApiResponse<string[]>>('/grades/suggestions', { params: { term } });
    return data;
  },

  // Categories
  getCategories: async (request?: BaseRequest): Promise<ApiResponse<CategoryDto[]>> => {
    const { data } = await api.get<ApiResponse<CategoryDto[]>>('/categories', { params: request });
    return data;
  },
  createCategory: async (cat: Partial<CategoryDto>): Promise<CategoryDto> => {
    const { data } = await api.post<ApiResponse<CategoryDto>>('/categories', cat);
    return data.data;
  },
  updateCategory: async (id: string, cat: Partial<CategoryDto>): Promise<CategoryDto> => {
    const { data } = await api.put<ApiResponse<CategoryDto>>(`/categories/${id}`, cat);
    return data.data;
  },
  deleteCategory: async (id: string): Promise<boolean> => {
    const { data } = await api.delete<ApiResponse<boolean>>(`/categories/${id}`);
    return data.data;
  },
  getCategorySuggestions: async (term: string): Promise<ApiResponse<string[]>> => {
    const { data } = await api.get<ApiResponse<string[]>>('/categories/suggestions', { params: { term } });
    return data;
  },
};
