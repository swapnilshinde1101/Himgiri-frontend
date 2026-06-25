import api from './api';
import type { Item, ApiResponse } from '../types';

export interface CatalogQueryParams {
  gradeId?: string | null;
  categoryId?: string | null;
  searchTerm?: string;
  pageNumber: number;
  pageSize: number;
}

export const catalogService = {
  getCatalog: async (params: CatalogQueryParams, signal?: AbortSignal): Promise<ApiResponse<Item[]>> => {
    const apiParams: Record<string, any> = {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
    };
    
    if (params.gradeId) {
      apiParams.gradeId = params.gradeId;
    }
    if (params.categoryId && params.categoryId !== 'All') {
      apiParams.categoryId = params.categoryId;
    }
    if (params.searchTerm) {
      apiParams.searchTerm = params.searchTerm;
    }

    const { data } = await api.get<ApiResponse<Item[]>>('/catalog', { 
      params: apiParams,
      signal 
    });
    return data;
  }
};
