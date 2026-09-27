import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';
import { orderService } from '../../services/orderService';
import { 
  Receipt, 
  IndianRupee, 
  ShoppingBag, 
  Clock, 
  ShieldAlert, 
  TrendingUp, 
  Search, 
  CalendarDays, 
  CheckCircle2, 
  XCircle,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  GraduationCap,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '../../components/shared/Badge';

export default function AccountReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Fetch Real Backend Database Aggregations for Accounting Summary
  const { 
    data: summaryRes, 
    isLoading: summaryLoading, 
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['account-report-summary', startDate, endDate],
    queryFn: () => reportService.getAccountReportSummary(startDate || undefined, endDate || undefined),
  });

  // 2. Fetch Orders for Transaction Audit Table
  const { 
    data: ordersRes, 
    isLoading: ordersLoading, 
    refetch: refetchOrders 
  } = useQuery({
    queryKey: ['admin-orders-report', startDate, endDate, statusFilter],
    queryFn: () => orderService.getOrders({ 
      pageNumber: 1, 
      pageSize: 100,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: statusFilter || undefined
    }),
  });

  const summary = summaryRes?.data;
  const orders = ordersRes?.data || [];

  // Client-side search on current page records
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.customerName.toLowerCase().includes(term) ||
      order.invoiceNumber.toLowerCase().includes(term) ||
      order.mobile.includes(term)
    );
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchOrders();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setSearchTerm('');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Customer Name', 'Mobile', 'Grand Total', 'Order Status', 'Payment Status', 'Date'];
    const rows = filteredOrders.map(o => [
      o.invoiceNumber,
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.mobile,
      o.grandTotal,
      o.status,
      o.paymentStatus,
      new Date(o.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Accounts_Transactions_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPaidRevenue = summary?.totalPaidSales ?? 0;
  const maxGradeRevenue = Math.max(...(summary?.gradeSales?.map(g => g.totalSales) ?? [1]), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-5 w-5 text-himgiri-primary" />
            Accounting & Transaction Reports
          </h2>
          <p className="text-xs text-himgiri-secondary-dark/60 mt-0.5">
            Real-time database aggregated financial metrics, exact CGST/SGST tax distributions, and scholastic grade sales breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-himgiri-primary hover:bg-gray-50 transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={clsx("h-4 w-4", (summaryLoading || ordersLoading) && "animate-spin text-himgiri-primary")} />
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-himgiri-primary text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm text-xs cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Range & Quick Filters Card */}
      <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest pl-1">Date From</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest pl-1">Date To</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest pl-1">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
            >
              <option value="">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Packed">Packed</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
              <option value="StockOut">StockOut</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleResetFilters}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5 text-gray-400" />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row (Live Database Aggregations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Confirmed Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Paid Sales</span>
            <p className="text-3xl font-black text-gray-900 font-mono">
              ₹{totalPaidRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {summary?.totalPaidOrdersCount ?? 0} Invoices Settled
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Unpaid Receivables</span>
            <p className="text-3xl font-black text-amber-600 font-mono">
              ₹{(summary?.unpaidReceivables ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-gray-400 font-semibold block">
              {summary?.pendingOrdersCount ?? 0} Awaiting payment
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* GST Tax Collected (Real Split) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total GST Tax</span>
            <p className="text-3xl font-black text-gray-900 font-mono">
              ₹{(summary?.totalGstCollected ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
            <div className="flex gap-2 text-[10px] font-bold text-gray-500 mt-1">
              <span>CGST: ₹{(summary?.totalCgst ?? 0).toFixed(1)}</span>
              <span>•</span>
              <span>SGST: ₹{(summary?.totalSgst ?? 0).toFixed(1)}</span>
              {!!summary?.totalIgst && (
                <>
                  <span>•</span>
                  <span>IGST: ₹{summary.totalIgst.toFixed(1)}</span>
                </>
              )}
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        {/* Total Refunds Issued */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Refunds</span>
            <p className="text-3xl font-black text-red-600 font-mono">
              ₹{(summary?.totalRefunded ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-red-500 font-semibold block">
              {summary?.refundedOrdersCount ?? 0} Refunded invoices
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Grade Sales & Payment Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Sales Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-150 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-gray-900 tracking-wider uppercase flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-himgiri-primary" />
              Sales Distribution by Scholastic Grade
            </h3>
            <span className="text-xs font-bold text-gray-400">
              {summary?.gradeSales?.length ?? 0} Active Grades
            </span>
          </div>

          {summaryLoading ? (
            <div className="py-8 flex items-center justify-center text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin text-himgiri-primary mr-2" />
              <span className="text-xs font-bold">Aggregating grade sales...</span>
            </div>
          ) : !summary?.gradeSales || summary.gradeSales.length === 0 ? (
            <p className="text-xs text-gray-400 font-bold py-6 text-center">No grade sales recorded for the selected period.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {summary.gradeSales.map((grade) => {
                const percent = Math.round((grade.totalSales / maxGradeRevenue) * 100);
                return (
                  <div key={grade.gradeId} className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-gray-900">{grade.gradeName}</span>
                      <span className="font-black text-gray-900 font-mono">₹{grade.totalSales.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-himgiri-primary h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                      <span>{grade.orderCount} orders completed</span>
                      <span>{grade.totalItemsCount} items dispatched</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Breakdown (1 Col) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-gray-900 tracking-wider uppercase flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-himgiri-primary" />
              Payment Status
            </h3>
          </div>

          {summaryLoading ? (
            <div className="py-8 flex items-center justify-center text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin text-himgiri-primary mr-2" />
              <span className="text-xs font-bold">Loading...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {summary?.paymentBreakdown?.map((pb) => {
                const isSuccess = pb.paymentStatus === 'Success';
                const isFailed = pb.paymentStatus === 'Failed';
                return (
                  <div key={pb.paymentStatus} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className={clsx(
                        "text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider",
                        isSuccess && "bg-green-100 text-green-800",
                        isFailed && "bg-red-100 text-red-800",
                        !isSuccess && !isFailed && "bg-amber-100 text-amber-800"
                      )}>
                        {pb.paymentStatus}
                      </span>
                      <div className="text-[10px] text-gray-400 font-semibold mt-1">
                        {pb.orderCount} orders
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-gray-900 font-mono">
                        ₹{pb.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Search Input for Transactions */}
      <div className="bg-white rounded-3xl p-4 shadow-soft border border-gray-150 flex items-center gap-3">
        <Search className="h-4 w-4 text-gray-400 ml-2" />
        <input
          type="text"
          placeholder="Search accounting transactions by invoice number, customer name, or mobile..."
          className="w-full text-xs font-semibold focus:outline-none bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Transaction Records Table */}
      {ordersLoading ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-150 p-12 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-himgiri-primary animate-spin" />
            <span className="text-xs font-bold text-gray-500">Loading accounting transactions...</span>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-150 p-16 text-center">
          <div className="flex flex-col items-center">
            <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 border border-gray-100">
              <ShoppingBag className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold text-xs">No accounting transactions found matching the filter criteria.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-150 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Number</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Grand Total</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Order Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Payment Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">
                      {order.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{order.customerName}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">{order.mobile}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-black text-gray-900">
                      ₹{order.grandTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={clsx(
                        "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider",
                        order.status === 'Pending' && "bg-amber-50 text-amber-700 border border-amber-200",
                        order.status === 'Confirmed' && "bg-blue-50 text-blue-700 border border-blue-200",
                        order.status === 'Packed' && "bg-orange-50 text-orange-700 border border-orange-200",
                        order.status === 'Dispatched' && "bg-purple-50 text-purple-700 border border-purple-200",
                        order.status === 'Delivered' && "bg-green-50 text-green-700 border border-green-200",
                        order.status === 'Refunded' && "bg-red-50 text-red-700 border border-red-200",
                        order.status === 'StockOut' && "bg-amber-50 text-amber-700 border border-amber-200"
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={order.paymentStatus === 'Success' ? 'success' : order.paymentStatus === 'Failed' ? 'danger' : 'warning'}>
                        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-black">
                          {order.paymentStatus === 'Success' && <CheckCircle2 className="h-3 w-3" />}
                          {order.paymentStatus === 'Failed' && <XCircle className="h-3 w-3" />}
                          {order.paymentStatus === 'Pending' && <Clock className="h-3 w-3" />}
                          {order.paymentStatus}
                        </div>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-semibold text-xs">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                        {new Date(order.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
