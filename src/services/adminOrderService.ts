import api from './api';
import type { ApiResponse, OrderStatus, PaymentStatus } from '../types';

export interface OrderQueryRequest {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  paymentStatus?: string;
  gradeId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdminOrderItemDto {
  itemId: string;
  itemName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  baseAmount: number;
  gstPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
  isKitItem: boolean;
}

export interface OrderStatusHistoryDto {
  fromStatus?: string | null;
  toStatus: string;
  changedBy: string;
  note?: string | null;
  createdAt: string;
}

export interface AdminOrderDetailDto {
  id: string;
  invoiceNumber: string;
  customerName: string;
  email: string;
  mobile: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  customerStateId: string;
  customerStateName: string;
  customerGstStateCode: string;
  customerGstin?: string | null;
  gradeId?: string | null;
  gradeName?: string | null;
  isHomeDelivery: boolean;
  supplyType: string;
  placeOfSupply: string;
  placeOfSupplyCode: string;
  subTotal: number;
  totalGst: number;
  deliveryFee: number;
  deliveryGst: number;
  deliveryCgstAmount: number;
  deliverySgstAmount: number;
  deliveryIgstAmount: number;
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  jodoPaymentId?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  items: AdminOrderItemDto[];
  statusHistories: OrderStatusHistoryDto[];
}

export interface AdminOrderSummaryDto {
  id: string;
  invoiceNumber: string;
  customerName: string;
  mobile: string;
  email: string;
  gradeName?: string | null;
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  isHomeDelivery: boolean;
  createdAt: string;
}

export interface CustomerSummaryDto {
  customerName: string;
  mobile: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  customerStateId: string;
}

export const adminOrderService = {
  getOrders: async (params?: OrderQueryRequest): Promise<ApiResponse<AdminOrderSummaryDto[]>> => {
    const { data } = await api.get<ApiResponse<AdminOrderSummaryDto[]>>('/orders', { params });
    return data;
  },

  getOrderById: async (id: string): Promise<ApiResponse<AdminOrderDetailDto>> => {
    const { data } = await api.get<ApiResponse<AdminOrderDetailDto>>(`/orders/${id}`);
    return data;
  },

  updateStatus: async (id: string, toStatus: OrderStatus, note?: string): Promise<ApiResponse<boolean>> => {
    const { data } = await api.patch<ApiResponse<boolean>>(`/orders/${id}/status`, { toStatus, note });
    return data;
  },

  addNote: async (id: string, note: string): Promise<ApiResponse<boolean>> => {
    const { data } = await api.post<ApiResponse<boolean>>(`/orders/${id}/notes`, { note });
    return data;
  },

  flagStockOut: async (id: string): Promise<ApiResponse<boolean>> => {
    const { data } = await api.patch<ApiResponse<boolean>>(`/orders/${id}/stockout`);
    return data;
  },

  processRefund: async (id: string, reason: string): Promise<ApiResponse<boolean>> => {
    const { data } = await api.patch<ApiResponse<boolean>>(`/orders/${id}/refund`, { reason });
    return data;
  },

  exportCsv: async (): Promise<void> => {
    const response = await api.get('/orders/export/csv', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `OrdersExport_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  exportExcel: async (): Promise<void> => {
    const response = await api.get('/orders/export/excel', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `OrdersExport_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  downloadInvoice: async (id: string, invoiceNumber: string): Promise<void> => {
    const response = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
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

  getCustomers: async (): Promise<ApiResponse<CustomerSummaryDto[]>> => {
    const { data } = await api.get<ApiResponse<CustomerSummaryDto[]>>('/orders/customers');
    return data;
  },

  getCustomerHistory: async (mobile: string): Promise<ApiResponse<AdminOrderSummaryDto[]>> => {
    const { data } = await api.get<ApiResponse<AdminOrderSummaryDto[]>>(`/orders/customers/${mobile}`);
    return data;
  }
};
