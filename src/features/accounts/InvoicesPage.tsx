import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { 
  Receipt, 
  Search, 
  Download, 
  FileText, 
  Loader2, 
  RefreshCw, 
  Calendar, 
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '../../components/shared/Badge';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Success'); // default filter to paid invoices
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch orders from API
  const { data: ordersRes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-invoices-list'],
    queryFn: () => orderService.getOrders({ pageNumber: 1, pageSize: 100 }),
  });

  const orders = ordersRes?.data || [];

  // Filter orders containing success payment or confirmed status (since they are generated invoices)
  const filteredInvoices = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.mobile.includes(searchTerm);

    const matchesStatus = statusFilter === '' || order.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle PDF Download
  const handleDownloadInvoice = async (id: string, invoiceNo: string) => {
    setDownloadingId(id);
    const toastId = toast.loading(`Generating invoice ${invoiceNo} PDF...`);
    try {
      await orderService.downloadInvoice(id, invoiceNo);
      toast.success('Invoice downloaded successfully!', { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to download invoice. Check vendor GSTIN settings.', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <FileText className="h-8 w-8 text-himgiri-primary" />
            Invoices Management
          </h1>
          <p className="text-sm text-himgiri-secondary-dark/60 mt-1">
            Track transaction records, manage tax reports, and print compliant Indian GST tax invoices.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-150 rounded-xl text-gray-650 hover:text-himgiri-primary hover:bg-gray-50 active:scale-95 transition-all shadow-sm text-sm font-semibold disabled:opacity-60"
        >
          <RefreshCw className={clsx("h-4 w-4", (isLoading || isRefetching) && "animate-spin")} />
          Sync Data
        </button>
      </div>

      {/* Filter Options */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices by number, client name, or phone..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
          >
            <option value="Success">Success (Paid)</option>
            <option value="Pending">Pending (Unpaid)</option>
            <option value="Failed">Failed (Declined)</option>
            <option value="">All Transactions</option>
          </select>
        </div>
      </div>

      {/* Main invoices content */}
      {isLoading ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-16 flex items-center justify-center min-h-[350px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-himgiri-primary animate-spin" />
            <span className="text-sm font-bold text-gray-500">Loading invoices database...</span>
          </div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-20 text-center">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 border border-gray-100">
              <Receipt className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold text-lg">No invoices found matching query.</p>
            <p className="text-xs text-gray-400 mt-1">Make sure you have active completed transactions to view.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Invoice Number</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Date Issued</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Recipient Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-right">Grand Total</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Payment Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">
                      {order.invoiceNumber || 'PENDING'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-semibold text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{order.customerName}</div>
                      <div className="text-[10px] text-gray-450 font-semibold">{order.mobile}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-black text-gray-950">
                      ₹{order.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={order.paymentStatus === 'Success' ? 'success' : order.paymentStatus === 'Failed' ? 'danger' : 'warning'}>
                        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-black">
                          {order.paymentStatus === 'Success' && <CheckCircle className="h-3 w-3" />}
                          {order.paymentStatus === 'Failed' && <XCircle className="h-3 w-3" />}
                          {order.paymentStatus === 'Pending' && <Clock className="h-3 w-3" />}
                          {order.paymentStatus}
                        </div>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDownloadInvoice(order.id, order.invoiceNumber)}
                        disabled={downloadingId !== null}
                        className="p-2 bg-blue-50 text-himgiri-primary hover:bg-himgiri-primary hover:text-white rounded-xl active:scale-95 transition-all inline-flex items-center justify-center disabled:opacity-60"
                        title="Download tax invoice PDF"
                      >
                        {downloadingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>
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
