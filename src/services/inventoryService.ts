import api from './api';
import type { Item, CreateItemRequest, ApiResponse, BaseRequest } from '../types';

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

  updateStock: async (id: string, newQty: number, reason: string): Promise<boolean> => {
    const { data } = await api.patch<ApiResponse<boolean>>(`/items/${id}/stock`, { newQty, reason });
    return data.data;
  },
};
