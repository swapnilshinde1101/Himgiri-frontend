import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { kitService } from '../../services/kitService';
import { orderService } from '../../services/orderService';
import { masterDataService } from '../../services/masterDataService';
import { 
  GraduationCap, 
  ShoppingBag, 
  Truck, 
  School, 
  Check, 
  AlertTriangle, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ChevronRight,
  Sparkles,
  MapPin,
  User,
  Phone,
  Mail,
  BookOpen
} from 'lucide-react';
import Button from '../../components/shared/Button';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import type { SchoolKit, SchoolKitItem } from '../../types';

export default function CustomerHome() {
  // ── States ──
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [selectedKit, setSelectedKit] = useState<SchoolKit | null>(null);
  
  // Cart state
  const [cartItems, setCartItems] = useState<SchoolKitItem[]>([]);
  const [includeDelivery, setIncludeDelivery] = useState<boolean>(true);

  // Form info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Pune');
  const [pincode, setPincode] = useState('411057');

  // Checkout states
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorStatus, setSimulatorStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [simulatorMessage, setSimulatorMessage] = useState('');

  // ── Fetch all kits to extract grades and select kits anonymously ──
  const { data: kitsRes, isLoading: kitsLoading } = useQuery({
    queryKey: ['public-kits'],
    queryFn: () => kitService.getKits({ pageNumber: 1, pageSize: 100 }),
  });

  const { data: gradesRes, isLoading: gradesLoading } = useQuery({
    queryKey: ['public-grades'],
    queryFn: () => masterDataService.getGrades({ pageNumber: 1, pageSize: 100 }),
  });

  const kits = kitsRes?.data || [];
  const grades = gradesRes?.data || [];
  
  const getDeliveryMethodText = (item: SchoolKitItem) => {
    return item.storageStatus === 'PreOrder' ? 'Classroom Delivery' : 'Home Delivery';
  };

  const getDeliveryMethodStyles = (item: SchoolKitItem) => {
    return item.storageStatus === 'PreOrder'
      ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
  };

  // Filter active kits
  const activeKits = kits.filter(k => k.isActive);

  // Get all active grades sorted by displayOrder
  const activeGrades = grades
    .filter(g => g.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Map to uniqueGrades structure for compatibility with rendering
  const uniqueGrades = activeGrades.map(g => ({ id: g.id, name: g.name }));

  // ── Handlers ──
  const handleGradeSelect = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    const kit = activeKits.find(k => k.gradeId === gradeId) || null;
    setSelectedKit(kit);
    setCartItems(kit ? kit.items : []);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKit || cartItems.length === 0) {
      toast.error('Please select a grade kit first.');
      return;
    }

    // Validation
    if (name.trim().length < 3) {
      toast.error('Student Name must be at least 3 characters.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Pincode must be exactly 6 digits.');
      return;
    }
    if (!addressLine1.trim()) {
      toast.error('Address Line 1 is required.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderReq = {
        customerName: name,
        email: email,
        mobile: mobile,
        addressLine1: addressLine1,
        addressLine2: addressLine2,
        city: city,
        pincode: pincode,
        gradeId: selectedKit.gradeId,
        items: cartItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity
        })),
        includeDelivery: includeDelivery
      };

      const res = await orderService.createOrder(orderReq);
      if (res.statusCode === 200 && res.data) {
        setCreatedOrder(res.data);
        setShowSimulator(true);
        setSimulatorStatus('idle');
        setSimulatorMessage('');
        toast.success('Order generated in system. Redirecting to payment...');
      } else {
        toast.error(res.message || 'Failed to place order.');
      }
    } catch (err: any) {
      // Handled by global response interceptor
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ── Simulator actions ──
  const handlePaymentSuccess = async () => {
    if (!createdOrder) return;
    setSimulatorStatus('processing');
    setSimulatorMessage('Initiating webhook transaction check on server...');

    try {
      // Simulate Jodo signature header check (we can pass a mock transaction ID)
      const txnId = 'TXN_SIM_' + Math.floor(Math.random() * 10000000);
      const webhookPayload = {
        orderId: createdOrder.id,
        transactionId: txnId,
        status: 'SUCCESS',
        amount: createdOrder.grandTotal,
        message: 'Payment simulation success'
      };

      const res = await orderService.triggerWebhook(webhookPayload);
      if (res.statusCode === 200) {
        setSimulatorStatus('success');
        setSimulatorMessage('Payment succeeded. Stock quantities successfully updated in inventory!');
        toast.success('Payment completed successfully.');
      } else {
        setSimulatorStatus('failed');
        setSimulatorMessage(res.message || 'Gateway confirmed payment, but inventory update failed.');
      }
    } catch (err: any) {
      setSimulatorStatus('failed');
      setSimulatorMessage(err.response?.data?.message || err.message || 'Connection failed.');
    }
  };

  const handlePaymentFail = async () => {
    if (!createdOrder) return;
    setSimulatorStatus('processing');
    setSimulatorMessage('Sending failure callback to merchant server...');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    setSimulatorStatus('failed');
    setSimulatorMessage('Payment cancelled or rejected by Jodo Gateway. Stock reservation rolled back.');
    toast.error('Payment cancelled.');
  };

  const resetCheckout = () => {
    setSelectedGradeId(null);
    setSelectedKit(null);
    setCartItems([]);
    setName('');
    setEmail('');
    setMobile('');
    setAddressLine1('');
    setAddressLine2('');
    setCreatedOrder(null);
    setShowSimulator(false);
    setSimulatorStatus('idle');
  };

  // ── Price summary calculations ──
  const itemsSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemsGst = cartItems.reduce((sum, item) => sum + ((item.mrp - item.price) * item.quantity), 0);
  const itemsTotal = itemsSubtotal + itemsGst;
  
  // Home delivery logic (split base: 211.86, GST: 38.14)
  const deliveryBase = includeDelivery ? 211.86 : 0;
  const deliveryGst = includeDelivery ? 38.14 : 0;
  
  const grandTotal = itemsTotal + deliveryBase + deliveryGst;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Navbar Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-himgiri-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-himgiri-primary/25">
              H
            </div>
            <div>
              <span className="font-black text-gray-900 tracking-tight text-lg block leading-none">
                HIMGIRI GOODS
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                DPS Hinjawadi Kit Portal
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
              Parent Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {showSimulator ? (
          /* JODO MOCK SIMULATOR MODAL PANEL */
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 text-white px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-himgiri-primary" />
                <span className="font-extrabold text-sm uppercase tracking-wider">
                  Jodo Payment Sandbox Gateway
                </span>
              </div>
              <span className="bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                Demo Simulator
              </span>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center space-y-2">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block">
                  Amount Due to Merchant
                </span>
                <p className="text-4xl font-black text-gray-900 font-mono">
                  ₹{createdOrder?.grandTotal.toFixed(2)}
                </p>
                <div className="flex justify-center gap-4 text-xs font-semibold text-gray-500 pt-2 border-t border-gray-200/50 mt-4">
                  <span>Invoice: <strong className="text-gray-700 font-mono">{createdOrder?.invoiceNumber}</strong></span>
                  <span>|</span>
                  <span>Customer: <strong className="text-gray-700">{createdOrder?.customerName}</strong></span>
                </div>
              </div>

              {simulatorStatus === 'idle' && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl text-xs font-bold flex items-center gap-2.5 justify-center">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>This simulator bypasses real payment card gateways to allow functional testing of webhook concurrency.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <button
                      type="button"
                      onClick={handlePaymentSuccess}
                      className="px-6 py-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/10 flex flex-col items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Simulate Success Payment</span>
                      <span className="text-[10px] text-emerald-200 font-medium">Triggers webhook and updates stock</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handlePaymentFail}
                      className="px-6 py-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 font-bold hover:bg-red-100 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5"
                    >
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span>Simulate Failed Payment</span>
                      <span className="text-[10px] text-red-500/80 font-medium">Cancels flow without deducting stock</span>
                    </button>
                  </div>
                </div>
              )}

              {simulatorStatus === 'processing' && (
                <div className="text-center py-10 space-y-3">
                  <Loader2 className="h-10 w-10 text-himgiri-primary animate-spin mx-auto" />
                  <p className="text-sm font-bold text-gray-600">{simulatorMessage}</p>
                </div>
              )}

              {simulatorStatus === 'success' && (
                <div className="text-center py-6 space-y-5 animate-in fade-in duration-300">
                  <div className="h-16 w-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">Order Confirmed!</h3>
                    <p className="text-sm font-medium text-gray-500 max-w-md mx-auto">
                      {simulatorMessage}
                    </p>
                  </div>
                  <div className="pt-4 max-w-sm mx-auto">
                    <Button
                      onClick={resetCheckout}
                      className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Back to Grade Selection
                    </Button>
                  </div>
                </div>
              )}

              {simulatorStatus === 'failed' && (
                <div className="text-center py-6 space-y-5 animate-in fade-in duration-300">
                  <div className="h-16 w-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto text-red-600">
                    <XCircle className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">Payment Unsuccessful</h3>
                    <p className="text-sm font-semibold text-red-600 max-w-md mx-auto">
                      {simulatorMessage}
                    </p>
                  </div>
                  <div className="pt-4 grid grid-cols-2 gap-3 max-w-sm mx-auto">
                    <button
                      onClick={() => setSimulatorStatus('idle')}
                      className="px-4 py-3 border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                    >
                      Retry Payment
                    </button>
                    <button
                      onClick={resetCheckout}
                      className="px-4 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800"
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* PARENT BUNDLE CHECKOUT SCREEN */
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-himgiri-primary to-blue-700 text-white rounded-3xl p-8 lg:p-12 shadow-lg shadow-himgiri-primary/10">
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
              <div className="relative max-w-2xl space-y-3">
                <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Academic Session 2026-27
                </span>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-none">
                  Official DPS School Kit Distribution
                </h1>
                <p className="text-sm lg:text-base font-semibold text-blue-100">
                  Select your child's grade class below to verify inventory stock bundles, customize delivery settings, and complete purchase checkout.
                </p>
              </div>
            </div>

            {/* Step 1: Grade Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-himgiri-primary/10 text-himgiri-primary text-xs font-extrabold flex items-center justify-center">1</span>
                Select Child's Grade / Class
              </h2>

              {kitsLoading || gradesLoading ? (
                <div className="flex items-center justify-center py-10 gap-3">
                  <Loader2 className="h-5 w-5 text-himgiri-primary animate-spin" />
                  <span className="text-sm font-bold text-gray-500">Loading grade packages...</span>
                </div>
              ) : uniqueGrades.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-soft">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-gray-500 font-bold text-sm">No school kits are currently active for checkouts.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {uniqueGrades.map((grade) => (
                    <button
                      key={grade.id}
                      type="button"
                      onClick={() => handleGradeSelect(grade.id)}
                      className={clsx(
                        "p-4 rounded-2xl border text-center transition-all duration-300 select-none flex flex-col items-center justify-center gap-1",
                        selectedGradeId === grade.id 
                          ? "bg-himgiri-primary border-himgiri-primary text-white shadow-lg shadow-himgiri-primary/25 scale-102"
                          : "bg-white border-gray-200/70 text-gray-700 hover:border-gray-300 hover:bg-gray-50/50"
                      )}
                    >
                      <GraduationCap className={clsx("h-5 w-5", selectedGradeId === grade.id ? "text-white" : "text-gray-400")} />
                      <span className="font-extrabold text-sm">{grade.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Choose Bundle Kit */}
            {selectedGradeId && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-himgiri-primary/10 text-himgiri-primary text-xs font-extrabold flex items-center justify-center">2</span>
                  Choose Available Kit Bundle
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeKits.filter(k => k.gradeId === selectedGradeId).map((kit) => {
                    const kitPrice = kit.items.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
                    const isKitSelected = selectedKit?.id === kit.id;
                    return (
                      <div 
                        key={kit.id}
                        className={clsx(
                          "bg-white rounded-3xl p-6 border transition-all duration-300 shadow-soft flex flex-col justify-between gap-4",
                          isKitSelected 
                            ? "border-himgiri-primary ring-2 ring-himgiri-primary/10" 
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="font-extrabold text-gray-900 text-sm leading-tight">{kit.name}</h3>
                            <span className="font-mono font-black text-sm text-himgiri-primary shrink-0">
                              ₹{kitPrice.toFixed(2)}
                            </span>
                          </div>
                          {kit.description && (
                            <p className="text-xs text-gray-400">{kit.description}</p>
                          )}
                          
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5 pt-1">
                            <span>Includes {kit.items.length} items</span>
                            <span>•</span>
                            <span>Grade Bundle</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedKit(kit);
                            setCartItems(kit.items);
                          }}
                          className={clsx(
                            "w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95",
                            isKitSelected 
                              ? "bg-himgiri-primary text-white font-bold" 
                              : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          {isKitSelected ? "Selected Bundle" : "Select This Bundle"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {activeKits.filter(k => k.gradeId === selectedGradeId).length === 0 && (
                  <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-soft">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-gray-500 font-bold text-sm">No packages are currently active for this grade class.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review Kit Items & Checkout */}
            {selectedKit && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-himgiri-primary/10 text-himgiri-primary text-xs font-extrabold flex items-center justify-center">3</span>
                  Review Package & Place Order
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Kit Item List (Left 7 Columns) */}
                  <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">
                        {selectedKit.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 font-semibold">
                        {selectedKit.description || 'Constituent bundle package content details:'}
                      </p>
                    </div>

                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                      {cartItems.map((item, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/40 transition-colors">
                          <div className="flex items-center gap-3">
                            {/* Thumbnail */}
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.itemName} 
                                className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0 bg-gray-50"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl border border-gray-100 flex-shrink-0 bg-gray-50 flex items-center justify-center text-gray-400">
                                <BookOpen className="h-5 w-5" />
                              </div>
                            )}
                            
                            <div className="space-y-0.5">
                              <span className="font-bold text-sm text-gray-900">{item.itemName}</span>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 font-extrabold uppercase">
                                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{item.categoryName}</span>
                                <span>•</span>
                                <span>Qty: {item.quantity} {item.unit}</span>
                                <span>•</span>
                                <span className={`px-1.5 py-0.5 rounded normal-case tracking-normal border ${getDeliveryMethodStyles(item)}`}>
                                  {getDeliveryMethodText(item)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="font-mono font-black text-sm text-gray-800">
                              ₹{(item.mrp * item.quantity).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold block leading-none">
                              (Incl. GST)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checkout & Delivery info (Right 5 Columns) */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Delivery Selection */}
                    <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
                        Delivery Method Selection
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setIncludeDelivery(true)}
                          className={clsx(
                            "p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all",
                            includeDelivery 
                              ? "border-himgiri-primary bg-himgiri-primary/[0.03] ring-2 ring-himgiri-primary/10" 
                              : "border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <Truck className={clsx("h-5 w-5", includeDelivery ? "text-himgiri-primary" : "text-gray-400")} />
                            {includeDelivery && <div className="h-4 w-4 bg-himgiri-primary rounded-full flex items-center justify-center text-white"><Check className="h-2.5 w-2.5" /></div>}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-gray-950 block">Home Delivery</span>
                            <span className="text-[10px] text-gray-400 font-semibold">₹250 flat charges</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIncludeDelivery(false)}
                          className={clsx(
                            "p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all",
                            !includeDelivery 
                              ? "border-himgiri-primary bg-himgiri-primary/[0.03] ring-2 ring-himgiri-primary/10" 
                              : "border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <School className={clsx("h-5 w-5", !includeDelivery ? "text-himgiri-primary" : "text-gray-400")} />
                            {!includeDelivery && <div className="h-4 w-4 bg-himgiri-primary rounded-full flex items-center justify-center text-white"><Check className="h-2.5 w-2.5" /></div>}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-gray-950 block">Class Delivery</span>
                            <span className="text-[10px] text-gray-400 font-semibold">Handover (Free)</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Delivery Detail Form */}
                    <form onSubmit={handlePlaceOrder} className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
                        Student & Parent Contact Details
                      </h4>

                      <div className="space-y-3">
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            placeholder="Student Full Name"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              required
                              placeholder="Mobile (10 digits)"
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                              value={mobile}
                              onChange={(e) => setMobile(e.target.value)}
                            />
                          </div>

                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="email"
                              required
                              placeholder="Parent Email"
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            placeholder="Address Line 1"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Address Line 2 (Opt)"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all sm:col-span-1"
                            value={addressLine2}
                            onChange={(e) => setAddressLine2(e.target.value)}
                          />
                          <input
                            type="text"
                            required
                            placeholder="City"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          />
                          <input
                            type="text"
                            required
                            placeholder="Pincode (6 Digits)"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Price Summary */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold space-y-2 mt-4">
                        <div className="flex justify-between text-gray-500">
                          <span>Items Total (MRP Incl. GST)</span>
                          <span className="font-mono">₹{itemsTotal.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-500">
                          <span>Delivery & Handling Fee</span>
                          <span className="font-mono">₹{deliveryBase.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-500">
                          <span>Delivery GST (18%)</span>
                          <span className="font-mono">₹{deliveryGst.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200/50 pt-2 mt-2">
                          <span>Grand Total</span>
                          <span className="font-mono text-base text-himgiri-primary">₹{grandTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isPlacingOrder}
                        className="w-full mt-2 py-4 rounded-2xl bg-himgiri-primary text-white font-extrabold hover:bg-himgiri-primary-dark transition-all active:scale-98 shadow-lg shadow-himgiri-primary/20 flex items-center justify-center gap-2"
                      >
                        {isPlacingOrder ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating Checkout Invoice...</span>
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
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
