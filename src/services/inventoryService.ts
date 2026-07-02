import api from './api';
import type { Item, CreateItemRequest, ApiResponse, BaseRequest, StockLog, BulkInwardRequest, CompletedStats, DashboardStats } from '../types';

export const inventoryService = {
  getItems: async (request: BaseRequest): Promise<ApiResponse<Item[]>> => {
    const { data } = await api.get<ApiResponse<Item[]>>('/items', { params: request });
    return data;
  },

  getItem: async (id: string): Promise<Item> => {
    const { data } = await api.get<ApiResponse<Item>>(`/items/${id}`);
    return data.data;
  },

  createItem: async (request: CreateItemRequest): Promise<Item> => {
    const { data } = await api.post<ApiResponse<Item>>('/items', request);
    return data.data;
  },

  updateItem: async (id: string, request: CreateItemRequest): Promise<Item> => {
    const { data } = await api.put<ApiResponse<Item>>(`/items/${id}`, request);
    return data.data;
  },

  deleteItem: async (id: string): Promise<boolean> => {
    const { data } = await api.delete<ApiResponse<boolean>>(`/items/${id}`);
    return data.data;
  },

  updateStock: async (id: string, adjustmentQty: number, reason: string, lastSeenStockQty?: number): Promise<boolean> => {
    const { data } = await api.patch<ApiResponse<boolean>>(`/items/${id}/stock`, { adjustmentQty, reason, lastSeenStockQty });
    return data.data;
  },

  getStockLogs: async (id: string): Promise<ApiResponse<StockLog[]>> => {
    const { data } = await api.get<ApiResponse<StockLog[]>>(`/items/${id}/stock-logs`);
    return data;
  },

  getAllStockLogs: async (onlyCompleted?: boolean): Promise<ApiResponse<StockLog[]>> => {
    const { data } = await api.get<ApiResponse<StockLog[]>>('/items/stock/logs', {
      params: onlyCompleted !== undefined ? { onlyCompleted } : undefined
    });
    return data;
  },

  getLowStock: async (): Promise<ApiResponse<Item[]>> => {
    const { data } = await api.get<ApiResponse<Item[]>>('/items/stock/low');
    return data;
  },

  getOutOfStock: async (): Promise<ApiResponse<Item[]>> => {
    const { data } = await api.get<ApiResponse<Item[]>>('/items/stock/out');
    return data;
  },

  bulkInwardStock: async (request: BulkInwardRequest): Promise<boolean> => {
    const { data } = await api.patch<ApiResponse<boolean>>('/items/stock/bulk-inward', request);
    return data.data;
  },

  bulkToggleActive: async (itemIds: string[], isActive: boolean): Promise<boolean> => {
    const { data } = await api.patch<ApiResponse<boolean>>('/items/bulk-status', { itemIds, isActive });
    return data.data;
  },

  bulkUpdateCategory: async (itemIds: string[], categoryId: string): Promise<boolean> => {
    const { data } = await api.patch<ApiResponse<boolean>>('/items/bulk-category', { itemIds, categoryId });
    return data.data;
  },

  getCompletedStats: async (): Promise<ApiResponse<CompletedStats>> => {
    const { data } = await api.get<ApiResponse<CompletedStats>>('/items/completed/stats');
    return data;
  },

  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/items/dashboard/stats');
    return data;
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<ApiResponse<{ imageUrl: string }>>('/items/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data.imageUrl;
  },
};
