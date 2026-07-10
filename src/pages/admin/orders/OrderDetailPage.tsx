import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOrderService } from '../../../services/adminOrderService';
import { useAuthStore } from '../../../store/authStore';
import Badge from '../../../components/shared/Badge';
import Button from '../../../components/shared/Button';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  FileText, 
  Download, 
  Clock, 
  Plus, 
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Home,
  School
} from 'lucide-react';
import type { OrderStatus, PaymentStatus } from '../../../types';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  const [noteText, setNoteText] = useState('');
  const [statusNoteText, setStatusNoteText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [refundReason, setRefundReason] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFlaggingStockOut, setIsFlaggingStockOut] = useState(false);

  // Fetch Order
  const { data: orderResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-order-detail', id],
    queryFn: () => adminOrderService.getOrderById(id!),
    enabled: !!id,
  });

  const order = orderResponse?.data;

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: (note: string) => adminOrderService.addNote(id!, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      setNoteText('');
      toast.success('Admin note added successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add note');
    }
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ toStatus, note }: { toStatus: OrderStatus; note?: string }) => 
      adminOrderService.updateStatus(id!, toStatus, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      setSelectedStatus('');
      setStatusNoteText('');
      toast.success('Order status updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update order status');
    }
  });

  // Flag StockOut Mutation
  const flagStockOutMutation = useMutation({
    mutationFn: () => adminOrderService.flagStockOut(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      toast.success('Order flagged as Stock-Out');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to flag stock-out');
    }
  });

  // Refund Mutation (SuperAdmin only)
  const refundMutation = useMutation({
    mutationFn: (reason: string) => adminOrderService.processRefund(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      setRefundReason('');
      toast.success('Refund processed successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to process refund');
    }
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNoteMutation.mutate(noteText.trim());
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;

    if (selectedStatus === 'Refunded') {
      if (!refundReason.trim()) {
        toast.error('Refund reason is required.');
        return;
      }
      refundMutation.mutate(refundReason.trim());
    } else {
      updateStatusMutation.mutate({
        toStatus: selectedStatus,
        note: statusNoteText.trim() || undefined
      });
    }
  };

  const handleFlagStockOut = async () => {
    if (!window.confirm('Are you sure you want to flag this order as Stock-Out? This will deduct/reconcile inventory levels.')) {
      return;
    }
    try {
      setIsFlaggingStockOut(true);
      await flagStockOutMutation.mutateAsync();
    } finally {
      setIsFlaggingStockOut(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      setIsDownloading(true);
      await adminOrderService.downloadInvoice(order.id, order.invoiceNumber);
      toast.success('Invoice downloaded');
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorJson = JSON.parse(text);
          toast.error(errorJson.message || 'Invoice not available — GSTIN configuration pending');
        } catch {
          toast.error('Invoice not available — GSTIN configuration pending');
        }
      } else {
        toast.error(err?.response?.data?.message || 'Invoice not available — GSTIN configuration pending');
      }
    } finally {
      setIsDownloading(false);
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

  // Status transitions
  const getAllowedTransitions = (status?: OrderStatus): OrderStatus[] => {
    if (!status) return [];
    const transitions: OrderStatus[] = [];

    // Confirmed -> Packed
    if (status === 'Confirmed') {
      transitions.push('Packed');
    }
    // Packed -> Dispatched
    if (status === 'Packed') {
      transitions.push('Dispatched');
    }
    // Dispatched -> Delivered
    if (status === 'Dispatched') {
      transitions.push('Delivered');
    }

    // Confirmed/Packed/Dispatched -> StockOut
    if (status === 'Confirmed' || status === 'Packed' || status === 'Dispatched') {
      transitions.push('StockOut');
    }

    // Any non-terminal (Pending/Confirmed/Packed/Dispatched) -> Refunded (SuperAdmin only)
    const isTerminal = status === 'Delivered' || status === 'Refunded' || status === 'StockOut';
    if (!isTerminal && isSuperAdmin) {
      transitions.push('Refunded');
    }

    return transitions;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-20 bg-gray-100 rounded-3xl w-full"></div>
        {/* Main Content Two Column Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-gray-100 rounded-3xl w-full"></div>
            <div className="h-64 bg-gray-100 rounded-3xl w-full"></div>
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-gray-100 rounded-3xl w-full"></div>
            <div className="h-56 bg-gray-100 rounded-3xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-6 flex flex-col items-center justify-center min-h-[400px] text-center gap-4 animate-in fade-in duration-300">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Order not found</h2>
          <p className="text-gray-500 text-xs mt-1 max-w-xs">
            The order with ID '{id}' could not be loaded. It may have been deleted or the link is invalid.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/accounts/orders')} icon={ArrowLeft} className="rounded-xl border-gray-250 font-bold">
          Back to Orders
        </Button>
      </div>
    );
  }

  const allowedTransitions = getAllowedTransitions(order.status);
  const isTerminalState = order.status === 'Delivered' || order.status === 'Refunded' || order.status === 'StockOut';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Block 1: Back & Page Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Link 
            to="/admin/accounts/orders" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-himgiri-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-3xl shadow-soft border border-gray-150 p-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">{order.invoiceNumber}</h1>
              <div className="flex gap-1.5">
                {getStatusBadge(order.status)}
                {getPaymentBadge(order.paymentStatus)}
              </div>
            </div>
            <div className="text-xs text-gray-400 font-bold flex gap-2 items-center flex-wrap">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(order.createdAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</span>
              {order.gradeName && <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-black text-[10px]">GRADE: {order.gradeName}</span>}
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              isLoading={isDownloading}
              onClick={handleDownloadInvoice}
              className="rounded-xl border-gray-250 text-xs font-bold flex-1 md:flex-none"
            >
              Invoice PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (60% equivalent to 2 cols in 3-col grid) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Block 2: Customer & Delivery Details */}
          <div className="bg-white rounded-3xl shadow-soft border border-gray-150 p-6 space-y-6">
            <h2 className="text-sm font-black text-gray-900 tracking-widest uppercase pb-3 border-b border-gray-100">Customer & Delivery</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Column */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><User className="h-4 w-4" /> Customer Details</h3>
                <div className="text-xs space-y-1.5 font-semibold text-gray-700 pl-5.5">
                  <div className="text-sm font-black text-gray-900">{order.customerName}</div>
                  <div className="flex items-center gap-1.5 text-gray-500"><Phone className="h-3.5 w-3.5" /> {order.mobile}</div>
                  <div className="flex items-center gap-1.5 text-gray-500"><Mail className="h-3.5 w-3.5" /> {order.email}</div>
                </div>
              </div>

              {/* Delivery Address Column */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Delivery Information</h3>
                <div className="text-xs space-y-1.5 font-semibold text-gray-700 pl-5.5">
                  <div className="text-gray-900 font-bold">{order.addressLine1}</div>
                  {order.addressLine2 && <div className="text-gray-600">{order.addressLine2}</div>}
                  <div className="text-gray-600">{order.city} - {order.pincode}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-wider mt-1">{order.customerStateName}</div>
                  
                  {/* Delivery Method Toggle state indicator */}
                  <div className="pt-2">
                    {order.isHomeDelivery ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full shadow-sm">
                        <Home className="h-3.5 w-3.5" /> Home Delivery (Free)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full shadow-sm">
                        <School className="h-3.5 w-3.5" /> Classroom Handover (Free)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Block 3: Order Items Table */}
          <div className="bg-white rounded-3xl shadow-soft border border-gray-150 p-6 space-y-4">
            <h2 className="text-sm font-black text-gray-900 tracking-widest uppercase pb-3 border-b border-gray-100">Ordered Items</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr>
                    {['Item', 'Type', 'HSN', 'Qty', 'Unit Price', 'GST', 'Line Total'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3 text-xs font-bold text-gray-900">{item.itemName}</td>
                      {/* Type Badge */}
                      <td className="px-4 py-3">
                        {item.isKitItem ? (
                          <Badge variant="info" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold">Kit</Badge>
                        ) : (
                          <Badge variant="gray" className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] font-bold">Extra</Badge>
                        )}
                      </td>
                      {/* HSN */}
                      <td className="px-4 py-3 text-xs text-gray-500 font-semibold">{item.hsnCode || '—'}</td>
                      {/* Quantity */}
                      <td className="px-4 py-3 text-xs text-gray-900 font-bold">{item.quantity}</td>
                      {/* Unit Price */}
                      <td className="px-4 py-3 text-xs text-gray-700 font-semibold">₹{item.unitPrice.toFixed(2)}</td>
                      {/* GST Amount */}
                      <td className="px-4 py-3 text-xs text-gray-600 font-semibold">
                        <div>₹{item.gstAmount.toFixed(2)}</div>
                        <div className="text-[9px] text-gray-400">({item.gstPercent}%)</div>
                      </td>
                      {/* Line Total */}
                      <td className="px-4 py-3 text-xs text-gray-900 font-black text-right">₹{item.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary block */}
            <div className="border-t border-gray-100 pt-4 flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-xs font-bold text-gray-600 pl-4">
                <div className="flex justify-between">
                  <span>Subtotal (Excl. GST)</span>
                  <span className="text-gray-900">₹{order.subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total GST Tax</span>
                  <span className="text-gray-900">₹{order.totalGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between border-t border-gray-150 pt-2 text-sm font-black">
                  <span className="text-gray-900 uppercase tracking-tight">Grand Total</span>
                  <span className="text-himgiri-primary text-base">₹{order.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Block 4: Status Timeline */}
          <div className="bg-white rounded-3xl shadow-soft border border-gray-150 p-6 space-y-6">
            <h2 className="text-sm font-black text-gray-900 tracking-widest uppercase pb-3 border-b border-gray-100">Order Timeline</h2>
            
            <div className="relative pl-6 border-l-2 border-gray-100 ml-4 space-y-6">
              {order.statusHistories.map((hist, idx) => {
                const colors: Record<OrderStatus, string> = {
                  Pending: 'bg-gray-400 border-gray-200',
                  Confirmed: 'bg-blue-500 border-blue-200',
                  Packed: 'bg-orange-500 border-orange-200',
                  Dispatched: 'bg-purple-500 border-purple-200',
                  Delivered: 'bg-green-500 border-green-200',
                  StockOut: 'bg-amber-500 border-amber-200',
                  Refunded: 'bg-red-500 border-red-200'
                };
                const colorClass = colors[hist.toStatus as OrderStatus] || 'bg-gray-500';

                return (
                  <div key={idx} className="relative">
                    {/* Timeline Node dot */}
                    <span className={`absolute -left-9 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ring-4 ring-white ${colorClass}`}></span>
                    
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-gray-900">{hist.toStatus}</span>
                        <span className="text-[10px] text-gray-400 font-bold">
                          {new Date(hist.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-semibold">
                        Action by: <span className="font-bold text-gray-700">{hist.changedBy}</span>
                      </div>
                      {hist.note && (
                        <div className="text-xs text-gray-500 italic mt-1 bg-gray-50/50 px-3 py-1.5 border border-gray-100 rounded-lg max-w-prose">
                          {hist.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block 5: Admin Notes */}
          <div className="bg-white rounded-3xl shadow-soft border border-gray-150 p-6 space-y-4">
            <h2 className="text-sm font-black text-gray-900 tracking-widest uppercase pb-3 border-b border-gray-100">Admin Notes</h2>
            
            {/* List Notes */}
            {order.adminNotes ? (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {order.adminNotes.split('\n').filter(Boolean).map((noteLine, idx) => {
                  // Format expected: "[changedBy - date] note text"
                  const match = noteLine.match(/^\[(.*?) - (.*?)\] (.*)$/);
                  if (match) {
                    const [, creator, timestamp, content] = match;
                    return (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-medium space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          <span>{creator}</span>
                          <span>{timestamp}</span>
                        </div>
                        <p className="text-gray-700 text-xs font-semibold">{content}</p>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-semibold text-gray-700">
                      {noteLine}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-bold text-gray-400 italic py-2 pl-1">No admin notes added to this order yet.</p>
            )}

            {/* Note addition textarea */}
            <form onSubmit={handleAddNote} className="space-y-3 pt-3 border-t border-gray-100">
              <textarea
                placeholder="Add an internal note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  isLoading={addNoteMutation.isPending}
                  disabled={!noteText.trim()}
                  className="rounded-xl font-bold"
                >
                  Add Note
                </Button>
              </div>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN (40% equivalent to 1 col in 3-col grid) */}
        <div className="space-y-6">
          
          {/* Card 1: Update Status */}
          <div className="bg-white rounded-3xl shadow-soft border border-gray-150 p-6 space-y-4">
            <h2 className="text-xs font-black text-gray-900 tracking-widest uppercase">Update Order Status</h2>
            
            <div className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <span className="text-xs font-bold text-gray-500">Current Status</span>
              {getStatusBadge(order.status)}
            </div>

            {isTerminalState ? (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" /> Order is complete. No further updates.
              </div>
            ) : (
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest pl-1">New Status</label>
                  <select
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                    required
                  >
                    <option value="">Select Next Status...</option>
                    {allowedTransitions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStatus === 'Refunded' ? (
                  <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                    <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest pl-1">Refund Reason *</label>
                    <textarea
                      placeholder="Reason for order refund..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full px-4 py-3 bg-red-50/10 border border-red-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all min-h-[60px]"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest pl-1">Status Note (Optional)</label>
                    <textarea
                      placeholder="Add an optional comment for this status change..."
                      value={statusNoteText}
                      onChange={(e) => setStatusNoteText(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all min-h-[60px]"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={updateStatusMutation.isPending || refundMutation.isPending}
                  disabled={!selectedStatus}
                  className="w-full rounded-xl font-bold"
                >
                  Update Status
                </Button>
              </form>
            )}
          </div>

          {/* Card 2: Quick Info */}
          <div className="bg-white rounded-3xl shadow-soft border border-gray-150 p-6 space-y-4">
            <h2 className="text-xs font-black text-gray-900 tracking-widest uppercase">Order Info</h2>
            
            <div className="text-xs divide-y divide-gray-100 font-bold text-gray-600">
              <div className="flex justify-between py-2.5">
                <span className="text-gray-400">Invoice Number</span>
                <span className="text-gray-900">{order.invoiceNumber}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gray-400">Payment Reference</span>
                <span className="text-gray-950 font-black">{order.jodoPaymentId || 'Simulator / Cash'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gray-400">Supply Type</span>
                <span className="text-gray-900">{order.supplyType}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gray-400">Place of Supply</span>
                <span className="text-gray-900">{order.placeOfSupply}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-gray-400">Seller GSTIN</span>
                <span className="text-gray-900">
                  {order.customerGstin?.includes('PENDING') || !order.customerGstin ? 'Pending' : order.customerGstin}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Actions */}
          {(!isTerminalState || order.status === 'Confirmed' || order.status === 'Packed' || order.status === 'Dispatched') && (
            <div className="bg-white rounded-3xl shadow-soft border border-gray-150 p-6 space-y-4">
              <h2 className="text-xs font-black text-gray-900 tracking-widest uppercase">Quick Actions</h2>
              <div className="space-y-2">
                {order.status !== 'StockOut' && order.status !== 'Delivered' && order.status !== 'Refunded' && (
                  <Button
                    variant="warning"
                    size="md"
                    icon={AlertTriangle}
                    isLoading={isFlaggingStockOut}
                    onClick={handleFlagStockOut}
                    className="w-full rounded-xl font-bold bg-amber-500 hover:bg-amber-600"
                  >
                    Flag Stock Out
                  </Button>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
