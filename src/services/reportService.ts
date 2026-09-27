import api from './api';
import type { ApiResponse } from '../types';

export interface GradeSalesSummaryDto {
  gradeId: string;
  gradeName: string;
  orderCount: number;
  totalSales: number;
  totalItemsCount: number;
}

export interface PaymentStatusSummaryDto {
  paymentStatus: string;
  orderCount: number;
  totalAmount: number;
}

export interface AccountReportSummaryDto {
  totalPaidSales: number;
  totalPaidOrdersCount: number;
  unpaidReceivables: number;
  pendingOrdersCount: number;
  totalRefunded: number;
  refundedOrdersCount: number;
  totalGstCollected: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalNetSales: number;
  gradeSales: GradeSalesSummaryDto[];
  paymentBreakdown: PaymentStatusSummaryDto[];
}

export interface CategoryValuationDto {
  categoryId: string | null;
  categoryName: string;
  itemCount: number;
  totalStockQty: number;
  totalPurchaseValue: number;
  totalRetailValue: number;
  potentialMargin: number;
}

export interface InventoryValuationReportDto {
  totalItemsCount: number;
  totalStockQty: number;
  totalPurchaseValue: number;
  totalRetailValue: number;
  totalPotentialMargin: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryBreakdown: CategoryValuationDto[];
}

export interface StaffUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

export interface StaffActivityLogDto {
  id: string;
  adminName: string;
  actionType: string;
  details: string;
  reference: string | null;
  timestamp: string;
}

export interface StaffActivityReportDto {
  staffMembers: StaffUserDto[];
  recentActivities: StaffActivityLogDto[];
}

export const reportService = {
  getAccountReportSummary: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await api.get<ApiResponse<AccountReportSummaryDto>>(`/reports/accounts/summary`, {
      params
    });
    return res.data;
  },

  getInventoryValuationReport: async () => {
    const res = await api.get<ApiResponse<InventoryValuationReportDto>>('/reports/inventory/valuation');
    return res.data;
  },

  getStaffActivityReport: async (limit = 50) => {
    const res = await api.get<ApiResponse<StaffActivityReportDto>>(`/reports/staff/activity?limit=${limit}`);
    return res.data;
  },
};
