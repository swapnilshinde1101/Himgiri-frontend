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

export const orderService = {
  createOrder: async (request: CreateOrderRequest): Promise<ApiResponse<OrderSummary>> => {
    const { data } = await api.post<ApiResponse<OrderSummary>>('/orders', request);
    return data;
  },

  initiatePayment: async (orderId: string): Promise<{ redirectUrl: string }> => {
    const { data } = await api.post<ApiResponse<{ redirectUrl: string }>>('/payments/initiate', { orderId });
    return data.data;
  },

  getOrderLookup: async (
    orderId: string,
    token?: string | null,
    mobile?: string | null,
    pincode?: string | null
  ): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    if (token) params.append('token', token);
    if (mobile) params.append('mobile', mobile);
    if (pincode) params.append('pincode', pincode);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    // skipGlobalToast: this is polled repeatedly by ConfirmationPage while waiting for the
    // payment webhook — a transient failure (rate limit, network blip) is already handled by
    // its own retry loop, so a global error toast on top would just spam the customer right
    // after they've paid.
    const { data } = await api.get<ApiResponse<any>>(`/orders/${orderId}/lookup${queryString}`, {
      skipGlobalToast: true
    } as any);
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
    // skipGlobalToast: the caller shows its own contextual toast — without this, errors here
    // (e.g. a 429 rate limit) would show twice.
    const { data } = await api.get<ApiResponse<OrderSummary[]>>('/orders/lookup', {
      params: { mobile, pincode },
      skipGlobalToast: true
    } as any);
    return data;
  },

  downloadInvoice: async (id: string, invoiceNumber: string, mobile?: string | null, pincode?: string | null, token?: string | null): Promise<void> => {
    const params = new URLSearchParams();
    if (token) params.append('token', token);
    if (mobile) params.append('mobile', mobile);
    if (pincode) params.append('pincode', pincode);

    const response = await api.get(`/orders/${id}/invoice`, {
      params,
      responseType: 'blob',
      skipGlobalToast: true
    } as any);
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  downloadDeliveryChallan: async (id: string, invoiceNumber: string, mobile?: string | null, pincode?: string | null, token?: string | null): Promise<void> => {
    const params = new URLSearchParams();
    if (token) params.append('token', token);
    if (mobile) params.append('mobile', mobile);
    if (pincode) params.append('pincode', pincode);

    const response = await api.get(`/orders/${id}/delivery-challan`, {
      params,
      responseType: 'blob',
      skipGlobalToast: true
    } as any);
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DeliveryChallan_${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
