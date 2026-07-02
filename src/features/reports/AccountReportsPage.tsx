import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  AlertTriangle,
  Loader2,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '../../components/shared/Badge';

export default function AccountReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch orders from backend API
  const { data: ordersRes, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders-report'],
    queryFn: () => orderService.getOrders({ pageNumber: 1, pageSize: 100 }),
  });

  const orders = ordersRes?.data || [];

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchSearch = searchTerm === '' || 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.mobile.includes(searchTerm);

    const matchStatus = statusFilter === '' || order.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // Calculate Metrics
  const totalOrdersCount = orders.length;
  
  // Paid / Confirmed orders
  const paidOrders = orders.filter(o => o.paymentStatus === 'Success' || o.status === 'Confirmed' || o.status === 'Delivered' || o.status === 'Packed' || o.status === 'Dispatched');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  // Pending orders
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const pendingReceivables = pendingOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  // Refunded or Cancelled orders
  const refundedOrders = orders.filter(o => o.status === 'Refunded');
  const totalRefunded = refundedOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  // Tax breakdowns estimates (India standard GST split: ~18% typical on school kits, delivery flat GST, let's estimate 18% of revenue is GST)
  const estimatedGST = totalRevenue * 0.18;
  const estimatedCGST = estimatedGST / 2;
  const estimatedSGST = estimatedGST / 2;

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
            Monitor revenue streams, calculate estimated tax splits (CGST/SGST), and track unpaid receivables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-white border border-gray-155 text-gray-500 hover:text-himgiri-primary hover:bg-gray-50 transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-himgiri-primary text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm text-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Confirmed Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Paid Sales</span>
            <p className="text-3xl font-black text-gray-900 font-mono">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Completed Invoices
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Unpaid Receivables</span>
            <p className="text-3xl font-black text-amber-600 font-mono">₹{pendingReceivables.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            <span className="text-[10px] text-gray-400 font-semibold block">Awaiting webhook payment</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Estimated GST Collected */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Tax Collected</span>
            <p className="text-3xl font-black text-gray-900 font-mono">₹{estimatedGST.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            <div className="flex gap-2 text-[9px] font-bold text-gray-450 mt-1">
              <span>CGST: ₹{estimatedCGST.toFixed(1)}</span>
              <span>•</span>
              <span>SGST: ₹{estimatedSGST.toFixed(1)}</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        {/* Refunds Issued */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Refunds</span>
            <p className="text-3xl font-black text-red-600 font-mono">₹{totalRefunded.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            <span className="text-[10px] text-gray-400 font-semibold block">{refundedOrders.length} refunded invoices</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts by invoice number, customer name, or mobile..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
          >
            <option value="">All Order Statuses</option>
            <option value="Pending">Pending Payment</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Packed">Packed</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Refunded">Refunded</option>
            <option value="StockOut">StockOut</option>
          </select>
        </div>
      </div>

      {/* Transaction Records Table */}
      {isLoading ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-12 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-himgiri-primary animate-spin" />
            <span className="text-sm font-bold text-gray-500">Loading accounting transactions...</span>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-20 text-center">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 border border-gray-100">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold">No accounting transactions found.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Invoice Number</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Customer Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Grand Total</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Order Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Payment Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Transaction Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">
                      {order.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{order.customerName}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">{order.mobile}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-black text-gray-950">
                      ₹{order.grandTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={clsx(
                        "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider",
                        order.status === 'Pending' && "bg-amber-100 text-amber-800",
                        order.status === 'Confirmed' && "bg-blue-100 text-blue-800",
                        order.status === 'Delivered' && "bg-emerald-100 text-emerald-800",
                        order.status === 'Refunded' && "bg-red-100 text-red-800",
                        order.status === 'StockOut' && "bg-slate-100 text-slate-800"
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={order.paymentStatus === 'Success' ? 'success' : order.paymentStatus === 'Failed' ? 'danger' : 'warning'}>
                        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold">
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
