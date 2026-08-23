import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { orderService } from '../../services/orderService';
import toast from 'react-hot-toast';
import { ShoppingBag, Loader2, CreditCard } from 'lucide-react';

export default function ConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'failed' | 'timeout'>('loading');
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const pollCountRef = useRef(0);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    let isMounted = true;
    const pollStatus = async () => {
      if (pollCountRef.current >= 20) {
        if (isMounted) {
          setStatus('timeout');
        }
        return;
      }

      try {
        const res = await orderService.getOrderLookup(orderId);
        const orderData = res.data;

        if (!isMounted) return;

        if (orderData.paymentStatus === 'Success' || orderData.paymentStatus === 'Paid') {
          setOrder(orderData);
          setStatus('success');
          return; // Stop polling
        }

        if (orderData.paymentStatus === 'Failed') {
          setStatus('failed');
          return; // Stop polling
        }

        pollCountRef.current += 1;
        setStatus('pending');
        setTimeout(pollStatus, 3000);

      } catch (err) {
        if (!isMounted) return;
        pollCountRef.current += 1;
        if (pollCountRef.current < 20) {
          setTimeout(pollStatus, 3000);
        } else {
          setStatus('timeout');
        }
      }
    };

    pollStatus();
    return () => {
      isMounted = false;
    };
  }, [orderId, navigate]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setIsDownloadingInvoice(true);
    try {
      await orderService.downloadInvoice(order.id, order.invoiceNumber, order.mobile, order.pincode);
      toast.success('Invoice PDF downloaded successfully!');
    } catch (err: any) {
      toast.error('Failed to download invoice.');
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  if (status === 'loading' || status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-600 font-semibold">Confirming your payment...</p>
          <p className="text-gray-400 text-sm">This may take a few seconds.</p>
        </div>
      </div>
    );
  }

  if (status === 'timeout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
          <div className="text-amber-500 text-6xl">⏳</div>
          <h1 className="text-2xl font-black text-gray-900">Payment Pending</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Payment is taking longer than expected. Your order will update automatically once confirmed. You can safely close this page.
          </p>
          <button
            onClick={() => navigate('/lookup')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-blue-500/10 active:scale-95"
          >
            Check Order Status
          </button>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-6xl">✗</div>
          <h1 className="text-2xl font-black text-gray-900">Payment Failed</h1>
          <p className="text-gray-600">
            Your payment could not be processed. No amount has been charged.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-lg w-full space-y-6">

        {/* Success header */}
        <div className="text-center space-y-2">
          <div className="text-green-500 text-6xl">✓</div>
          <h1 className="text-2xl font-black text-gray-900">Order Confirmed!</h1>
          <p className="text-gray-500 text-sm">
            Invoice: <span className="font-bold text-gray-900">{order.invoiceNumber}</span>
          </p>
        </div>

        {/* Items list */}
        <div className="space-y-2">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
            Items Ordered
          </h3>
          {order.items?.map((item: any) => (
            <div key={item.itemId} className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <p className="font-semibold text-sm text-gray-900">{item.itemName}</p>
                <p className="text-xs text-gray-400">
                  Qty: {item.quantity} •{' '}
                  {order.isHomeDelivery
                    ? '🏠 Home delivery'
                    : '🏫 Delivered to classroom'}
                </p>
              </div>
              <span className="font-bold text-sm">₹{item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="font-black text-gray-900">Total Paid</span>
          <span className="font-black text-xl text-blue-600">
            ₹{order.grandTotal.toFixed(2)}
          </span>
        </div>

        {/* Delivery info */}
        <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 space-y-1">
          <p className="font-bold text-gray-800">Delivery Details</p>
          <p>{order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ''}</p>
          <p>{order.city}, {order.pincode}</p>
          <p className="font-semibold mt-2">
            Method: {order.isHomeDelivery ? '🏠 Home Delivery' : '🏫 Class Delivery'}
          </p>
        </div>

        {/* Email notice */}
        <p className="text-center text-xs text-gray-400">
          A confirmation has been sent to {order.email}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 border border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold text-sm"
          >
            Order Another Kit
          </button>
          
          <button
            type="button"
            disabled={isDownloadingInvoice}
            onClick={handleDownloadInvoice}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-blue-500/10"
          >
            {isDownloadingInvoice ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin animate-spin-fast" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                <span>Invoice PDF</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
