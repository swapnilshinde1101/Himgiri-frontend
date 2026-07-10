import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminOrderService } from '../../../services/adminOrderService';
import { useGradesDropdown } from '../../../hooks/useMasterData';
import { useDebounce } from '../../../hooks/useDebounce';
import Badge from '../../../components/shared/Badge';
import Button from '../../../components/shared/Button';
import toast from 'react-hot-toast';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Download, 
  RotateCcw, 
  Home, 
  School, 
  AlertCircle,
  Eye
} from 'lucide-react';
import type { OrderStatus, PaymentStatus } from '../../../types';

export default function OrdersPage() {
  const navigate = useNavigate();

  // Filter States
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20;
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>(undefined);
  const [gradeId, setGradeId] = useState<string | undefined>(undefined);
  const [searchVal, setSearchVal] = useState('');
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  // Export Loading States
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(searchVal, 300);

  // Reset page when filters change
  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, status, paymentStatus, gradeId, startDate, endDate]);

  // Master Data (Grades)
  const { data: grades } = useGradesDropdown();

  // Main Data Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-orders', { pageNumber, status, paymentStatus, gradeId, debouncedSearch, startDate, endDate }],
    queryFn: () => adminOrderService.getOrders({
      pageNumber,
      pageSize,
      status,
      paymentStatus,
      gradeId,
      search: debouncedSearch || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }),
  });

  const handleResetFilters = () => {
    setSearchVal('');
    setStatus(undefined);
    setPaymentStatus(undefined);
    setGradeId(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setPageNumber(1);
  };

  const handleExportCsv = async () => {
    try {
      setIsExportingCsv(true);
      await adminOrderService.exportCsv();
      toast.success('CSV export started');
    } catch (err) {
      toast.error('Failed to export CSV');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      await adminOrderService.exportExcel();
      toast.success('Excel export started');
    } catch (err) {
      toast.error('Failed to export Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const getStatusBadge = (orderStatus: OrderStatus) => {
    switch (orderStatus) {
      case 'Pending':
        return <Badge variant="gray" className="bg-gray-100 text-gray-700 border-gray-200 uppercase font-black text-[10px]">Pending</Badge>;
      case 'Confirmed':
        return <Badge variant="info" className="bg-blue-50 text-blue-700 border-blue-200 uppercase font-black text-[10px]">Confirmed</Badge>;
      case 'Packed':
        return <Badge variant="warning" className="bg-orange-50 text-orange-700 border-orange-200 uppercase font-black text-[10px]">Packed</Badge>;
      case 'Dispatched':
        return <Badge variant="gray" className="bg-purple-50 text-purple-700 border-purple-200 uppercase font-black text-[10px]">Dispatched</Badge>;
      case 'Delivered':
        return <Badge variant="success" className="bg-green-50 text-green-700 border-green-200 uppercase font-black text-[10px]">Delivered</Badge>;
      case 'StockOut':
        return <Badge variant="warning" className="bg-amber-50 text-amber-700 border-amber-200 uppercase font-black text-[10px]">StockOut</Badge>;
      case 'Refunded':
        return <Badge variant="danger" className="bg-red-50 text-red-700 border-red-200 uppercase font-black text-[10px]">Refunded</Badge>;
      default:
        return <Badge variant="gray" className="uppercase font-black text-[10px]">{orderStatus}</Badge>;
    }
  };

  const getPaymentBadge = (payStatus: PaymentStatus) => {
    switch (payStatus) {
      case 'Pending':
        return <Badge variant="gray" className="bg-gray-150 text-gray-600 border-gray-200 uppercase font-black text-[10px]">Pending</Badge>;
      case 'Success':
        return <Badge variant="success" className="bg-green-50 text-green-700 border-green-200 uppercase font-black text-[10px]">Success</Badge>;
      case 'Failed':
        return <Badge variant="danger" className="bg-red-50 text-red-700 border-red-200 uppercase font-black text-[10px]">Failed</Badge>;
      default:
        return <Badge variant="gray" className="uppercase font-black text-[10px]">{payStatus}</Badge>;
    }
  };

  const ordersList = data?.data || [];
  const totalRecords = data?.meta?.totalRecords || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Parent Orders</h1>
          <p className="text-himgiri-secondary-dark/60 mt-1 text-sm">
            Monitor uniform kit order checkouts, delivery statuses, and payment processing history.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-3xl shadow-soft border border-gray-150 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
              placeholder="Search by invoice, name, or mobile..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
              value={status || ''}
              onChange={(e) => setStatus(e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Packed">Packed</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              <option value="StockOut">StockOut</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* Payment Status Dropdown */}
          <div>
            <select
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
              value={paymentStatus || ''}
              onChange={(e) => setPaymentStatus(e.target.value || undefined)}
            >
              <option value="">All Payments</option>
              <option value="Pending">Pending</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Grade Dropdown */}
          <div>
            <select
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
              value={gradeId || ''}
              onChange={(e) => setGradeId(e.target.value || undefined)}
            >
              <option value="">All Grades</option>
              {grades?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest pl-1">Date From</span>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
              value={startDate || ''}
              onChange={(e) => setStartDate(e.target.value || undefined)}
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest pl-1">Date To</span>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
              value={endDate || ''}
              onChange={(e) => setEndDate(e.target.value || undefined)}
            />
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <div>
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={handleResetFilters}
              className="rounded-xl border-gray-200 text-xs font-bold"
            >
              Reset Filters
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              isLoading={isExportingCsv}
              onClick={handleExportCsv}
              className="rounded-xl border-gray-200 text-xs font-bold"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              isLoading={isExportingExcel}
              onClick={handleExportExcel}
              className="rounded-xl border-gray-200 text-xs font-bold"
            >
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <h3 className="font-bold text-red-900">Failed to load orders</h3>
          <p className="text-red-700 text-xs max-w-sm">
            There was a problem communicating with the server. Please check your connection and try again.
          </p>
          <Button variant="danger" size="sm" onClick={() => refetch()} className="rounded-xl font-bold mt-2">
            Try Again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                {['Invoice No', 'Customer', 'Mobile', 'Grade', 'Grand Total', 'Order Status', 'Payment', 'Delivery', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {[...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded-full w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded-full w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded-full w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded-full w-12"></div></td>
                  <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded-full w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-5 bg-gray-100 rounded-full w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-5 bg-gray-100 rounded-full w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-full w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded-full w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded-lg w-14"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : ordersList.length === 0 ? (
        <div className="bg-white border border-gray-150 rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-3">
          <Search className="h-10 w-10 text-gray-300" />
          <h3 className="font-bold text-gray-700 text-sm">No orders found</h3>
          <p className="text-gray-400 text-xs max-w-sm">
            Try adjusting your search terms or filters to find what you are looking for.
          </p>
          <button onClick={handleResetFilters} className="text-himgiri-primary text-xs font-bold hover:underline mt-2">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-soft border border-gray-150 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    {['Invoice No', 'Customer', 'Mobile', 'Grade', 'Grand Total', 'Order Status', 'Payment', 'Delivery', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {ordersList.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Invoice No */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-black text-gray-900 tracking-tight">{order.invoiceNumber}</span>
                      </td>

                      {/* Customer Name & Email */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900">{order.customerName}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">{order.email}</span>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-gray-600">{order.mobile}</span>
                      </td>

                      {/* Grade */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {order.gradeName || 'N/A'}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-black text-gray-900">₹{order.grandTotal.toFixed(2)}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentBadge(order.paymentStatus)}
                      </td>

                      {/* Delivery */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.isHomeDelivery ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full">
                            <Home className="h-3 w-3" /> Home
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full">
                            <School className="h-3 w-3" /> Class
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Eye}
                          onClick={() => navigate(`/admin/accounts/orders/${order.id}`)}
                          className="rounded-lg text-gray-500 hover:text-himgiri-primary hover:bg-himgiri-primary/5 font-black text-[11px] px-2 py-1"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalRecords > 0 && (
            <div className="bg-white rounded-3xl shadow-soft border border-gray-150 px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-bold text-himgiri-secondary-dark/50 uppercase tracking-widest">
                Showing <span className="text-gray-900 font-black">{(pageNumber - 1) * pageSize + 1}</span> to{' '}
                <span className="text-gray-900 font-black">
                  {Math.min(pageNumber * pageSize, totalRecords)}
                </span> of{' '}
                <span className="text-gray-900 font-black">{totalRecords}</span> orders
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber === 1}
                  onClick={() => setPageNumber(p => p - 1)}
                  icon={ChevronLeft}
                  className="rounded-xl border-gray-200 text-xs font-bold"
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber * pageSize >= totalRecords}
                  onClick={() => setPageNumber(p => p + 1)}
                  icon={ChevronRight}
                  className="rounded-xl border-gray-200 text-xs font-bold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
