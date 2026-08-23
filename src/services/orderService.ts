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
  items: { itemId: string; quantity: number; isKitItem: boolean }[];
  isHomeDelivery: boolean;
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
    const { data } = await api.post<ApiResponse<boolean>>('/payments/webhook', payload);
    return data;
  },

  initiatePayment: async (orderId: string): Promise<{ redirectUrl: string }> => {
    const { data } = await api.post<ApiResponse<{ redirectUrl: string }>>('/payments/initiate', { orderId });
    return data.data;
  },

  getOrderLookup: async (orderId: string): Promise<ApiResponse<any>> => {
    const { data } = await api.get<ApiResponse<any>>(`/orders/${orderId}/lookup`);
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
  },

  lookupOrders: async (mobile: string, pincode: string): Promise<ApiResponse<OrderSummary[]>> => {
    const { data } = await api.get<ApiResponse<OrderSummary[]>>('/orders/lookup', {
      params: { mobile, pincode }
    });
    return data;
  },

  downloadInvoice: async (id: string, invoiceNumber: string, mobile?: string, pincode?: string): Promise<void> => {
    const params = new URLSearchParams();
    if (mobile) params.append('mobile', mobile);
    if (pincode) params.append('pincode', pincode);

    const response = await api.get(`/orders/${id}/invoice`, {
      params,
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
