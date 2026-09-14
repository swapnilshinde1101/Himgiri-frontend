import { X } from 'lucide-react';
import Button from '../../../components/shared/Button';
import Badge from '../../../components/shared/Badge';
import type { CartDisplayItem } from '../CustomerHome';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  isHomeDelivery: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  selectedStateName: string;
  cartItems: CartDisplayItem[];
  getGstPercentByName: (categoryName: string) => number;
  subTotal: number;
  isIntraState: boolean;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  onConfirm: () => void;
}

export default function CheckoutConfirmationModal({
  isOpen,
  onClose,
  firstName,
  lastName,
  email,
  mobile,
  isHomeDelivery,
  addressLine1,
  addressLine2,
  city,
  pincode,
  selectedStateName,
  cartItems,
  getGstPercentByName,
  subTotal,
  isIntraState,
  cgstAmount,
  sgstAmount,
  igstAmount,
  grandTotal,
  onConfirm
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-250 cursor-pointer"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200 z-10">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Confirm Order & Invoice Preview</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Please review your invoice details before payment</p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full p-2 hover:rotate-90 transition-all focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* Delivery & Student Summary */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs font-semibold text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Customer Details</span>
              <div className="text-gray-900 font-black text-sm">{firstName} {lastName}</div>
              <div>Email: {email}</div>
              <div>Mobile: {mobile}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Delivery & Handover</span>
              <div>
                {isHomeDelivery ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">🏠 Home Delivery</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">🏫 Class Delivery</span>
                )}
              </div>
              <div className="text-gray-900 font-bold mt-1">{addressLine1}</div>
              {addressLine2 && <div className="text-gray-500">{addressLine2}</div>}
              <div>{city} - {pincode} ({selectedStateName})</div>
            </div>
          </div>

          {/* Invoice Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Itemized Charges</h4>
            <div className="border border-slate-150 rounded-2xl overflow-hidden">
              <table className="min-w-full divide-y divide-slate-150">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-2.5 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2.5 text-center text-[9px] font-black text-gray-400 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-2.5 text-right text-[9px] font-black text-gray-400 uppercase tracking-wider">Base Price</th>
                    <th className="px-4 py-2.5 text-right text-[9px] font-black text-gray-400 uppercase tracking-wider">GST</th>
                    <th className="px-4 py-2.5 text-right text-[9px] font-black text-gray-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-gray-700 bg-white">
                  {cartItems.map((item, idx) => {
                    const gstPercent = getGstPercentByName(item.categoryName);
                    const baseTotal = item.price * item.quantity;
                    const taxTotal = baseTotal * (gstPercent / 100);
                    const lineTotal = baseTotal + taxTotal;
                    return (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-bold text-gray-900">{item.itemName}</td>
                        <td className="px-4 py-3">
                          {item.isKitItem ? (
                            <Badge variant="info" className="text-[9px] font-bold px-1.5 py-0.5 rounded animate-none">Kit</Badge>
                          ) : (
                            <Badge variant="gray" className="text-[9px] font-bold px-1.5 py-0.5 rounded animate-none">Extra</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono">₹{item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-500 font-mono">
                          ₹{taxTotal.toFixed(2)}
                          <span className="text-[9px] block text-gray-400">({gstPercent}%)</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 font-mono">₹{lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex justify-end">
            <div className="w-full sm:w-64 space-y-2 text-xs font-bold text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal (Excl. GST)</span>
                <span className="text-gray-900 font-mono">₹{subTotal.toFixed(2)}</span>
              </div>
              {isIntraState ? (
                <>
                  <div className="flex justify-between">
                    <span>CGST (Central Tax)</span>
                    <span className="text-gray-900 font-mono">₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (State Tax)</span>
                    <span className="text-gray-900 font-mono">₹{sgstAmount.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>IGST (Integrated Tax)</span>
                  <span className="text-gray-900 font-mono">₹{igstAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="text-green-600 font-bold uppercase">Free</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black">
                <span className="uppercase tracking-tight text-gray-900">Total Payable</span>
                <span className="font-mono text-base text-himgiri-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            className="rounded-2xl font-bold border-gray-250"
          >
            Back to Edit
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onConfirm}
            className="rounded-2xl font-black px-6 shadow-md shadow-himgiri-primary/20"
          >
            Confirm & Pay ₹{grandTotal.toFixed(2)}
          </Button>
        </div>

      </div>
    </div>
  );
}
