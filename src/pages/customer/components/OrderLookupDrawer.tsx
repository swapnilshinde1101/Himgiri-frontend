import { X, Loader2, CreditCard, Truck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lookupMobile: string;
  onLookupMobileChange: (value: string) => void;
  lookupPincode: string;
  onLookupPincodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSearchingLookup: boolean;
  lookupResults: any[];
  onDownloadInvoice: (orderId: string, invoiceNumber: string) => void;
  onDownloadDeliveryChallan?: (orderId: string, invoiceNumber: string) => void;
}

export default function OrderLookupDrawer({
  isOpen,
  onClose,
  lookupMobile,
  onLookupMobileChange,
  lookupPincode,
  onLookupPincodeChange,
  onSubmit,
  isSearchingLookup,
  lookupResults,
  onDownloadInvoice,
  onDownloadDeliveryChallan
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 border-l border-slate-100 animate-in slide-in-from-right duration-250 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black text-gray-950">Track My Order</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Search for invoices & delivery statuses</p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full p-2.5 hover:rotate-90 transition-all focus:outline-none"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1">Mobile Number</label>
            <input
              type="text"
              placeholder="Enter 10-digit number"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              value={lookupMobile}
              onChange={(e) => onLookupMobileChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1">Billing Pincode</label>
            <input
              type="text"
              placeholder="Enter 6-digit Pincode"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              value={lookupPincode}
              onChange={(e) => onLookupPincodeChange(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingLookup}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            {isSearchingLookup ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <span>Track & View Invoices</span>
            )}
          </button>
        </form>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">Search Results</div>

          {lookupResults.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs font-bold">
              Enter details above to fetch your order status.
            </div>
          ) : (
            <div className="space-y-3">
              {lookupResults.map((order, idx) => (
                <div key={idx} className="p-4 border border-slate-150 rounded-2xl space-y-3 bg-slate-50/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-slate-400 font-black font-mono block">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs font-black text-gray-900">{order.invoiceNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 font-bold block">Total Paid</span>
                      <span className="text-xs font-black font-mono text-gray-900">₹{(order.grandTotal ?? 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-slate-100 text-slate-700">
                      {order.status}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md ${
                      ['success', 'paid'].includes((order.paymentStatus ?? '').toLowerCase())
                        ? 'bg-green-50 text-green-700 border border-green-150'
                        : 'bg-orange-50 text-orange-700 border border-orange-150'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onDownloadInvoice(order.id, order.invoiceNumber)}
                      className="flex-1 py-2 bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-700 font-extrabold text-[10px] rounded-xl tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Invoice</span>
                    </button>
                    {onDownloadDeliveryChallan && (
                      <button
                        type="button"
                        onClick={() => onDownloadDeliveryChallan(order.id, order.invoiceNumber)}
                        className="flex-1 py-2 bg-sky-50 border border-sky-100 hover:bg-sky-100 text-sky-700 font-extrabold text-[10px] rounded-xl tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 active:scale-98"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Challan</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
