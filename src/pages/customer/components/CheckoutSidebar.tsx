import { Truck, School, Check, User, Phone, Mail, MapPin, Loader2, ChevronRight, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import DeliveryMapPicker from './DeliveryMapPicker';
import type { Item, StateDto } from '../../../types';
import type { CartDisplayItem } from '../CustomerHome';

interface Props {
  cartItems: CartDisplayItem[];
  catalogItems: Item[];
  updateAddOnQty: (itemId: string, delta: number, item: any) => void;
  isHomeDelivery: boolean;
  onSetHomeDelivery: (value: boolean) => void;
  firstName: string;
  onFirstNameChange: (value: string) => void;
  lastName: string;
  onLastNameChange: (value: string) => void;
  mobile: string;
  onMobileChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  addressLine1: string;
  onAddressLine1Change: (value: string) => void;
  addressLine2: string;
  onAddressLine2Change: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  customerStateId: string;
  onCustomerStateIdChange: (value: string) => void;
  states: StateDto[];
  pincode: string;
  onPincodeChange: (value: string) => void;
  mapLocation: { lat: number; lng: number } | null;
  onLocationChange: (loc: { lat: number; lng: number } | null) => void;
  onAddressAutofill: (fields: { city?: string; pincode?: string; addressLine1?: string }) => void;
  itemsTotal: number;
  grandTotal: number;
  isPlacingOrder: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CheckoutSidebar({
  cartItems,
  catalogItems,
  updateAddOnQty,
  isHomeDelivery,
  onSetHomeDelivery,
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  mobile,
  onMobileChange,
  email,
  onEmailChange,
  addressLine1,
  onAddressLine1Change,
  addressLine2,
  onAddressLine2Change,
  city,
  onCityChange,
  customerStateId,
  onCustomerStateIdChange,
  states,
  pincode,
  onPincodeChange,
  mapLocation,
  onLocationChange,
  onAddressAutofill,
  itemsTotal,
  grandTotal,
  isPlacingOrder,
  onSubmit
}: Props) {
  return (
    <div className="lg:col-span-4 space-y-6 sticky top-24">

      {/* Cart review */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft space-y-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
          Order Summary
        </h4>

        {cartItems.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            Cart is empty
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-150 rounded-2xl overflow-hidden bg-slate-50/20 max-h-60 overflow-y-auto">
            {cartItems.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl.split(',')[0]}
                      alt={item.itemName}
                      className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0 bg-white"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg border border-gray-100 flex-shrink-0 bg-white flex items-center justify-center text-gray-400">
                      <BookOpen className="h-4 w-4" />
                    </div>
                  )}

                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-xs text-gray-900 block truncate" title={item.itemName}>
                      {item.itemName}
                    </span>
                    <span className="text-[8px] font-black uppercase bg-white border border-gray-200 text-gray-500 px-1 py-0.2 rounded">
                      {item.categoryName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.isKitItem ? (
                    <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {item.quantity} (Kit)
                    </span>
                  ) : (
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 scale-90 shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          const catItem = catalogItems.find(i => i.id === item.itemId);
                          if (catItem) updateAddOnQty(item.itemId, -1, catItem);
                        }}
                        className="h-5 w-5 rounded bg-gray-55 text-gray-700 hover:bg-gray-100 active:scale-90 flex items-center justify-center font-bold text-[10px]"
                      >
                        -
                      </button>
                      <span className="w-4 text-center font-black text-[10px] text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const catItem = catalogItems.find(i => i.id === item.itemId);
                          if (catItem) updateAddOnQty(item.itemId, 1, catItem);
                        }}
                        disabled={item.storageStatus === 'InStock' && (() => {
                          const catItem = catalogItems.find(i => i.id === item.itemId);
                          return catItem ? item.quantity >= catItem.stockQty : false;
                        })()}
                        className="h-5 w-5 rounded bg-gray-55 text-gray-700 hover:bg-gray-100 active:scale-90 disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center font-bold text-[10px]"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <span className="font-mono font-black text-xs text-gray-800 w-14 text-right">
                    ₹{(item.mrp * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Option */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft space-y-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
          Delivery Method Selection
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSetHomeDelivery(true)}
            className={clsx(
              "p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all select-none",
              isHomeDelivery
                ? "border-himgiri-primary bg-himgiri-primary/[0.03] ring-2 ring-himgiri-primary/10"
                : "border-gray-200 hover:bg-gray-50/50"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <Truck className={clsx("h-5 w-5", isHomeDelivery ? "text-himgiri-primary" : "text-gray-400")} />
              {isHomeDelivery && <div className="h-4 w-4 bg-himgiri-primary rounded-full flex items-center justify-center text-white"><Check className="h-2.5 w-2.5" /></div>}
            </div>
            <div>
              <span className="font-bold text-xs text-gray-950 block">Home Delivery</span>
              <span className="text-[10px] text-gray-400 font-semibold">Free Delivery</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSetHomeDelivery(false)}
            className={clsx(
              "p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all select-none",
              !isHomeDelivery
                ? "border-himgiri-primary bg-himgiri-primary/[0.03] ring-2 ring-himgiri-primary/10"
                : "border-gray-200 hover:bg-gray-50/50"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <School className={clsx("h-5 w-5", !isHomeDelivery ? "text-himgiri-primary" : "text-gray-400")} />
              {!isHomeDelivery && <div className="h-4 w-4 bg-himgiri-primary rounded-full flex items-center justify-center text-white"><Check className="h-2.5 w-2.5" /></div>}
            </div>
            <div>
              <span className="font-bold text-xs text-gray-950 block">Class Delivery</span>
              <span className="text-[10px] text-gray-400 font-semibold">Handover (Free)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Form & Price summary */}
      <form onSubmit={onSubmit} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft space-y-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
          Customer & Delivery Details
        </h4>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                placeholder="First Name *"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
              />
            </div>

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Last Name *"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Contact Number *"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                value={mobile}
                onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="Parent Email *"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
              />
            </div>
          </div>

          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              required
              placeholder="Address Line 1 *"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
              value={addressLine1}
              onChange={(e) => onAddressLine1Change(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Address Line 2 (Optional)"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
              value={addressLine2}
              onChange={(e) => onAddressLine2Change(e.target.value)}
            />
            <input
              type="text"
              required
              placeholder="City *"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <select
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all cursor-pointer"
                value={customerStateId}
                onChange={(e) => onCustomerStateIdChange(e.target.value)}
              >
                <option value="" disabled>Select State *</option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>
                    {state.stateName}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              required
              placeholder="Pincode (6 digits) *"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
              value={pincode}
              onChange={(e) => onPincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>

          <DeliveryMapPicker
            isHomeDelivery={isHomeDelivery}
            mapLocation={mapLocation}
            onLocationChange={onLocationChange}
            city={city}
            addressLine1={addressLine1}
            pincode={pincode}
            onAddressAutofill={onAddressAutofill}
          />
        </div>

        {/* Price Summary */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold space-y-2 mt-4">
          <div className="flex justify-between text-gray-500">
            <span>Items Total (Incl. GST)</span>
            <span className="font-mono">₹{itemsTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200/50 pt-2 mt-2">
            <span>Grand Total</span>
            <span className="font-mono text-base text-himgiri-primary">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPlacingOrder || cartItems.length === 0}
          className="w-full mt-2 py-4 rounded-2xl bg-himgiri-primary text-white font-extrabold hover:bg-blue-700 disabled:opacity-45 disabled:hover:bg-himgiri-primary disabled:active:scale-100 transition-all active:scale-98 shadow-lg shadow-himgiri-primary/20 flex items-center justify-center gap-2"
        >
          {isPlacingOrder ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating Invoice...</span>
            </>
          ) : (
            <>
              <span>Proceed to Secure Checkout</span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
