import api from './api';
import type { ApiResponse } from '../types';

export interface CreateOrderRequest {
  customerName: string;
  email: string;
  mobile: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  customerStateId: string;
  customerGstin?: string | null;
  gradeId: string | null;
  items: { itemId: string; quantity: number }[];
  includeDelivery: boolean;
}

export interface OrderSummary {
  id: string;
  invoiceNumber: string;
  customerName: string;
  mobile: string;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface JodoWebhookPayload {
  orderId: string;
  transactionId: string;
  status: string;
  amount: number;
  message: string;
}

export const orderService = {
  createOrder: async (request: CreateOrderRequest): Promise<ApiResponse<OrderSummary>> => {
    const { data } = await api.post<ApiResponse<OrderSummary>>('/orders', request);
    return data;
  },

  triggerWebhook: async (payload: JodoWebhookPayload): Promise<ApiResponse<boolean>> => {
    const { data } = await api.post<ApiResponse<boolean>>('/orders/webhook', payload);
    return data;
  },

  getOrder: async (id: string, token: string): Promise<ApiResponse<any>> => {
    const { data } = await api.get<ApiResponse<any>>(`/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return data;
  },

  getOrders: async (request?: any): Promise<ApiResponse<OrderSummary[]>> => {
    const { data } = await api.get<ApiResponse<OrderSummary[]>>('/orders', { params: request });
    return data;
  }
};
