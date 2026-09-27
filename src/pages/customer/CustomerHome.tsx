import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { kitService } from '../../services/kitService';
import { orderService } from '../../services/orderService';
import { masterDataService } from '../../services/masterDataService';
import { catalogService } from '../../services/catalogService';
import { GraduationCap, ShoppingBag, ArrowLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  validateIndianMobile,
  validatePincode,
  validateEmail,
  validateRequired
} from '../../utils/validation';
import type { SchoolKit, Item } from '../../types';
import WelcomeScreen from './components/WelcomeScreen';
import MandatoryKitSection from './components/MandatoryKitSection';
import CatalogSection from './components/CatalogSection';
import CheckoutSidebar from './components/CheckoutSidebar';
import ItemDetailModal from './components/ItemDetailModal';
import CheckoutConfirmationModal from './components/CheckoutConfirmationModal';
import OrderLookupDrawer from './components/OrderLookupDrawer';
import StickyCartBar from './components/StickyCartBar';

export interface CartDisplayItem {
  itemId: string;
  itemName: string;
  price: number;
  mrp: number;
  quantity: number;
  categoryName: string;
  unit: string;
  imageUrl?: string;
  storageStatus: 'InStock' | 'PreOrder';
  isKitItem: boolean;
}

// The minimal shape updateAddOnQty actually needs to enforce its stock cap — deliberately
// narrower than the full Item type so it also accepts the kit-item detail object
// (which isn't a real catalog Item) without needing an `any` escape hatch.
export interface StockAdjustableItem {
  storageStatus: 'InStock' | 'PreOrder';
  stockQty: number;
  unit: string;
}

export default function CustomerHome() {
  // ── States ──
  // selectedGradeId can be:
  // - undefined: Landing state (Welcome screen)
  // - null: General Shop (Path B)
  // - string: Grade-specific shop (Path A)
  const [selectedGradeId, setSelectedGradeId] = useState<string | null | undefined>(undefined);
  const [selectedKit, setSelectedKit] = useState<SchoolKit | null>(null);

  // Add-on item quantities: itemId -> quantity
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({});
  const [isHomeDelivery, setIsHomeDelivery] = useState<boolean>(true);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedDetailItem]);

  // Delivery map location — owned here since executeOrderPlacement needs it for the
  // Google Maps link appended to addressLine2; DeliveryMapPicker owns everything else
  // map-related (Leaflet instance, search, geolocation) as a controlled child.
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Search & Category filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');

  // Reset page number on category change
  useEffect(() => {
    setPageNumber(1);
  }, [selectedCategoryId]);

  // Pagination & Catalog list states
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);

  // Form info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Pune');
  const [pincode, setPincode] = useState('411057');
  const [customerStateId, setCustomerStateId] = useState('');

  // Fetch states master data
  const { data: statesResponse } = useQuery({
    queryKey: ['states'],
    queryFn: () => masterDataService.getStates(),
  });
  const states = statesResponse?.data || [];

  // Set default state to Maharashtra (27 / MH)
  useEffect(() => {
    if (states.length > 0 && !customerStateId) {
      const mh = states.find(s => s.stateCode === 'MH' || s.gstStateCode === '27');
      if (mh) {
        setCustomerStateId(mh.id);
      } else {
        setCustomerStateId(states[0].id);
      }
    }
  }, [states, customerStateId]);

  // Checkout states
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Reset pending order if cart contents or checkout details change, so a payment
  // retry never silently reuses stale data from before the customer's edit.
  useEffect(() => {
    setPendingOrderId(null);
  }, [
    selectedKit, addOnQuantities,
    firstName, lastName, email, mobile,
    addressLine1, addressLine2, city, pincode, customerStateId,
    isHomeDelivery, mapLocation
  ]);

  // Lookup & Tracking states
  const [showLookupPanel, setShowLookupPanel] = useState(false);
  const [lookupMobile, setLookupMobile] = useState('');
  const [lookupPincode, setLookupPincode] = useState('');
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [isSearchingLookup, setIsSearchingLookup] = useState(false);

  useEffect(() => {
    if (window.location.pathname === '/lookup') {
      setShowLookupPanel(true);
    }
  }, []);

  // ── Queries ──
  const { data: kitsRes } = useQuery({
    queryKey: ['public-kits'],
    queryFn: () => kitService.getKits({ pageNumber: 1, pageSize: 100 }),
  });

  const { data: gradesRes, isLoading: gradesLoading } = useQuery({
    queryKey: ['public-grades'],
    queryFn: () => masterDataService.getGrades({ pageNumber: 1, pageSize: 100 }),
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['public-categories'],
    queryFn: () => masterDataService.getCategories({ pageNumber: 1, pageSize: 100 }),
  });

  const { data: catalogRes, isFetching: catalogLoading } = useQuery({
    queryKey: ['public-catalog', selectedGradeId, selectedCategoryId, debouncedSearchQuery, pageNumber],
    queryFn: ({ signal }) => catalogService.getCatalog({
      gradeId: null, // Fetch all items so that parents can add any catalog item as an optional add-on
      categoryId: selectedCategoryId === 'All' ? null : selectedCategoryId,
      searchTerm: debouncedSearchQuery,
      pageNumber,
      pageSize: 6 // Reduced page size so they can test pagination with 11 items
    }, signal),
    enabled: selectedGradeId !== undefined,
  });

  const kits = kitsRes?.data || [];
  const grades = gradesRes?.data || [];
  const categories = categoriesRes?.data || [];

  const activeKits = kits.filter(k => k.isActive);
  const activeGrades = grades
    .filter(g => g.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const activeCategories = categories.filter(c => c.isActive);

  // ── Debounce Search Query (300ms) ──
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPageNumber(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ── Update items on page load ──
  useEffect(() => {
    if (catalogRes?.data) {
      setCatalogItems(catalogRes.data);
      if (catalogRes.meta) {
        setHasMore(catalogRes.meta.currentPage < catalogRes.meta.totalPages);
      } else {
        setHasMore(catalogRes.data.length >= 6);
      }
    }
  }, [catalogRes]);

  // ── Handlers ──
  const handleGradeSelect = (gradeId: string | null) => {
    setSelectedGradeId(gradeId);
    const kit = gradeId ? (activeKits.find(k => k.gradeId === gradeId) || null) : null;
    setSelectedKit(kit);
    setAddOnQuantities({}); // Clear previous add-ons to prevent category leak
    setSearchQuery('');
    setSelectedCategoryId('All');
    setPageNumber(1);
    setCatalogItems([]);
  };

  const updateAddOnQty = (itemId: string, delta: number, item: StockAdjustableItem) => {
    const currentQty = addOnQuantities[itemId] || 0;
    const newQty = currentQty + delta;
    if (newQty < 0) return;

    if (item.storageStatus === 'InStock' && newQty > item.stockQty) {
      toast.error(`Only ${item.stockQty} ${item.unit} available in stock.`);
      return;
    }

    setAddOnQuantities(prev => {
      const updated = { ...prev };
      if (newQty === 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = newQty;
      }
      return updated;
    });
  };

  // ── Catalog section glue callbacks (kept here because searchQuery/pageNumber drive the
  // catalog query above; CatalogSection owns its own suggestions/autocomplete state) ──
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setPageNumber(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPageNumber(1);
  };

  const handleSuggestionSelect = (value: string) => {
    setSearchQuery(value);
    setDebouncedSearchQuery(value);
    setPageNumber(1);
  };

  // Only fills fields the customer hasn't already typed into — DeliveryMapPicker
  // decides which fields qualify (reading its own city/addressLine1/pincode props).
  const handleAddressAutofill = (fields: { city?: string; pincode?: string; addressLine1?: string }) => {
    if (fields.city !== undefined) setCity(fields.city);
    if (fields.pincode !== undefined) setPincode(fields.pincode);
    if (fields.addressLine1 !== undefined) setAddressLine1(fields.addressLine1);
  };

  // ── Cart Calculations ──
  const kitItems: CartDisplayItem[] = selectedKit
    ? selectedKit.items.map(ki => ({
        itemId: ki.itemId,
        itemName: ki.itemName,
        price: ki.price,
        mrp: ki.mrp,
        quantity: ki.quantity,
        categoryName: ki.categoryName,
        unit: ki.unit,
        imageUrl: ki.imageUrl,
        storageStatus: ki.storageStatus as 'InStock' | 'PreOrder',
        isKitItem: true
      }))
    : [];

  const addOnItemsList: CartDisplayItem[] = Object.entries(addOnQuantities)
    .map(([itemId, qty]): CartDisplayItem | null => {
      const item = catalogItems.find(i => i.id === itemId);
      if (!item) return null;
      return {
        itemId: item.id,
        itemName: item.name,
        price: item.price,
        mrp: item.mrp,
        quantity: qty,
        categoryName: item.categoryName,
        unit: item.unit,
        imageUrl: item.imageUrl,
        storageStatus: item.storageStatus as 'InStock' | 'PreOrder',
        isKitItem: false
      };
    })
    .filter((item): item is CartDisplayItem => item !== null);

  const cartItems = [...kitItems, ...addOnItemsList];

  const getGstPercentByName = (categoryName: string) => {
    const cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    return cat && cat.isTaxable ? cat.gstPercent : 0;
  };

  const getInclusivePrice = (price: number, categoryName: string) => {
    const gstPercent = getGstPercentByName(categoryName);
    return price * (1 + gstPercent / 100);
  };

  const itemsTotal = cartItems.reduce((sum, item) => {
    return sum + (getInclusivePrice(item.price, item.categoryName) * item.quantity);
  }, 0);

  const deliveryBase = 0;
  const deliveryGst = 0;
  const grandTotal = itemsTotal;

  const selectedState = states.find(s => s.id === customerStateId);
  const selectedStateName = selectedState ? selectedState.stateName : '';
  const isIntraState = !selectedStateName || selectedStateName.toLowerCase().includes('maharashtra');

  const subTotal = cartItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const totalGst = cartItems.reduce((sum, item) => {
    const gstPercent = getGstPercentByName(item.categoryName);
    return sum + (item.price * item.quantity * (gstPercent / 100));
  }, 0);

  const cgstAmount = isIntraState ? (totalGst / 2) : 0;
  const sgstAmount = isIntraState ? (totalGst / 2) : 0;
  const igstAmount = isIntraState ? 0 : totalGst;

  // Filter catalog items for display in the Add-on catalog grid
  const displayCatalogItems = catalogItems.filter(item => {
    // Hide items that are already in the mandatory kit (Option A)
    const isInKit = kitItems.some(ki => ki.itemId === item.id);
    return !isInKit;
  });

  // ── Place Order ──
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Your cart is empty. Please add items to buy.');
      return;
    }

    if (!validateRequired(firstName)) {
      toast.error('First Name is required.');
      return;
    }
    if (!validateRequired(lastName)) {
      toast.error('Last Name is required.');
      return;
    }
    if (!validateIndianMobile(mobile)) {
      toast.error('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    if (!email.trim()) {
      toast.error('Email address is required.');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!validateRequired(addressLine1)) {
      toast.error('Address Line 1 is required.');
      return;
    }
    if (!validatePincode(pincode)) {
      toast.error('Pincode must be exactly 6 digits.');
      return;
    }

    if (!customerStateId) {
      toast.error('Please select your state.');
      return;
    }

    setShowCheckoutModal(true);
  };

  const executeOrderPlacement = async () => {
    setIsPlacingOrder(true);
    try {
      let targetOrderId = pendingOrderId;

      if (!targetOrderId) {
        const finalAddressLine2 = mapLocation
          ? `${addressLine2} (Map: https://maps.google.com/?q=${mapLocation.lat},${mapLocation.lng})`.trim()
          : addressLine2;

        const customerName = `${firstName} ${lastName}`.trim();

        const orderReq = {
          customerName: customerName,
          email: email,
          mobile: mobile,
          addressLine1: addressLine1,
          addressLine2: finalAddressLine2,
          city: city,
          pincode: pincode,
          customerStateId: customerStateId,
          customerGstin: null,
          gradeId: selectedGradeId || null,
          items: cartItems.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            isKitItem: item.isKitItem
          })),
          isHomeDelivery: isHomeDelivery
        };

        const res = await orderService.createOrder(orderReq);
        if (res.statusCode === 200 && res.data) {
          targetOrderId = res.data.id;
          setPendingOrderId(targetOrderId);
        } else {
          toast.error(res.message || 'Failed to place order.');
          return;
        }
      }

      setShowCheckoutModal(false);
      toast.success('Redirecting to payment...');

      // Initiate Jodo payment
      try {
        const payRes = await orderService.initiatePayment(targetOrderId);
        window.location.href = payRes.redirectUrl;
      } catch (payErr: any) {
        toast.error(payErr?.response?.data?.message || 'Payment initiation failed. Please click Checkout to retry payment.');
        setShowCheckoutModal(true); // Re-open modal so parent can retry payment on the existing order
      }
    } catch (err: any) {
      // Handled by global response interceptor
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleLookupSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupMobile.trim() || !lookupPincode.trim()) {
      toast.error('Please enter both mobile and pincode.');
      return;
    }
    setIsSearchingLookup(true);
    try {
      const res = await orderService.lookupOrders(lookupMobile.trim(), lookupPincode.trim());
      if (res.statusCode === 200 && res.data) {
        setLookupResults(res.data);
      } else {
        toast.error(res.message || 'No orders found.');
        setLookupResults([]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No orders found with provided details.');
      setLookupResults([]);
    } finally {
      setIsSearchingLookup(false);
    }
  };

  const handleDownloadLookupInvoice = async (orderId: string, invoiceNumber: string) => {
    toast.loading('Downloading invoice...', { id: 'lookup-download' });
    try {
      await orderService.downloadInvoice(orderId, invoiceNumber, lookupMobile, lookupPincode);
      toast.success('Invoice PDF downloaded successfully!', { id: 'lookup-download' });
    } catch (err: any) {
      let errorMsg = 'Failed to download invoice.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorJson = JSON.parse(text);
          errorMsg = errorJson.message || errorMsg;
        } catch {
          // Keep default
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      if (err.response?.status === 503 || errorMsg.toLowerCase().includes('gstin')) {
        errorMsg = 'Invoice not available — GSTIN configuration pending';
      }
      toast.error(errorMsg, { id: 'lookup-download' });
    }
  };

  const handleDownloadLookupChallan = async (orderId: string, invoiceNumber: string) => {
    toast.loading('Downloading delivery challan...', { id: 'lookup-challan' });
    try {
      await orderService.downloadDeliveryChallan(orderId, invoiceNumber, lookupMobile, lookupPincode);
      toast.success('Delivery Challan downloaded successfully!', { id: 'lookup-challan' });
    } catch (err: any) {
      let errorMsg = 'Failed to download delivery challan.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorJson = JSON.parse(text);
          errorMsg = errorJson.message || errorMsg;
        } catch {
          // Keep default
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg, { id: 'lookup-challan' });
    }
  };

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
            <button
              type="button"
              onClick={() => setShowLookupPanel(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 border border-slate-200"
            >
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <span>Track My Order</span>
            </button>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
              Parent Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {selectedGradeId === undefined ? (
          <WelcomeScreen
            gradesLoading={gradesLoading}
            activeGrades={activeGrades}
            onSelectGrade={handleGradeSelect}
          />
        ) : (
          /* SHOPPING & CHECKOUT INTERFACE */
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Context/Mode switcher */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedGradeId(undefined)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-900"
                  title="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block">
                    Current Portal Mode
                  </span>
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                    {selectedGradeId ? (
                      <>
                        <GraduationCap className="h-4 w-4 text-himgiri-primary" />
                        <span>Grade Kit: <strong>{activeGrades.find(g => g.id === selectedGradeId)?.name}</strong></span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4 text-emerald-600" />
                        <span>General Shop (All Items)</span>
                      </>
                    )}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGradeId(undefined)}
                className="text-xs font-black text-himgiri-primary hover:text-blue-700 bg-himgiri-primary/5 px-4 py-2 rounded-xl transition-all"
              >
                Change Mode / Grade
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Kits and Items (8 Columns) */}
              <div className="lg:col-span-8 space-y-6">

                {/* Section A: Mandatory Kit (Only for Grade Option A if kit exists) */}
                {selectedGradeId && (
                  <MandatoryKitSection
                    selectedKit={selectedKit}
                    kitItems={kitItems}
                    catalogItems={catalogItems}
                    getInclusivePrice={getInclusivePrice}
                    onItemClick={setSelectedDetailItem}
                  />
                )}

                {/* Section B: Add-on items Catalog */}
                <CatalogSection
                  selectedKit={selectedKit}
                  activeCategories={activeCategories}
                  selectedCategoryId={selectedCategoryId}
                  onCategoryChange={handleCategoryChange}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  onSuggestionSelect={handleSuggestionSelect}
                  catalogLoading={catalogLoading}
                  displayCatalogItems={displayCatalogItems}
                  addOnQuantities={addOnQuantities}
                  updateAddOnQty={updateAddOnQty}
                  onItemClick={setSelectedDetailItem}
                  getInclusivePrice={getInclusivePrice}
                  meta={catalogRes?.meta}
                  pageNumber={pageNumber}
                  onPageChange={setPageNumber}
                />
              </div>

              {/* Right Column: Checkout & Cart summary (4 Columns) */}
              <CheckoutSidebar
                cartItems={cartItems}
                catalogItems={catalogItems}
                updateAddOnQty={updateAddOnQty}
                getInclusivePrice={getInclusivePrice}
                isHomeDelivery={isHomeDelivery}
                onSetHomeDelivery={setIsHomeDelivery}
                firstName={firstName}
                onFirstNameChange={setFirstName}
                lastName={lastName}
                onLastNameChange={setLastName}
                mobile={mobile}
                onMobileChange={setMobile}
                email={email}
                onEmailChange={setEmail}
                addressLine1={addressLine1}
                onAddressLine1Change={setAddressLine1}
                addressLine2={addressLine2}
                onAddressLine2Change={setAddressLine2}
                city={city}
                onCityChange={setCity}
                customerStateId={customerStateId}
                onCustomerStateIdChange={setCustomerStateId}
                states={states}
                pincode={pincode}
                onPincodeChange={setPincode}
                mapLocation={mapLocation}
                onLocationChange={setMapLocation}
                onAddressAutofill={handleAddressAutofill}
                itemsTotal={itemsTotal}
                grandTotal={grandTotal}
                isPlacingOrder={isPlacingOrder}
                onSubmit={handlePlaceOrder}
              />
            </div>

            <StickyCartBar
              itemCount={cartItems.length}
              grandTotal={grandTotal}
              onViewCart={() => document.getElementById('checkout-sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          </div>
        )}
      </main>

      {/* Product Details Modal (Popup) */}
      <ItemDetailModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        activeImageIndex={activeImageIndex}
        onImageIndexChange={setActiveImageIndex}
        selectedKit={selectedKit}
        addOnQuantities={addOnQuantities}
        updateAddOnQty={updateAddOnQty}
        getGstPercentByName={getGstPercentByName}
        getInclusivePrice={getInclusivePrice}
      />

      {/* Pre-Checkout Invoice Confirmation Modal */}
      <CheckoutConfirmationModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        firstName={firstName}
        lastName={lastName}
        email={email}
        mobile={mobile}
        isHomeDelivery={isHomeDelivery}
        addressLine1={addressLine1}
        addressLine2={addressLine2}
        city={city}
        pincode={pincode}
        selectedStateName={selectedStateName}
        cartItems={cartItems}
        getGstPercentByName={getGstPercentByName}
        subTotal={subTotal}
        isIntraState={isIntraState}
        cgstAmount={cgstAmount}
        sgstAmount={sgstAmount}
        igstAmount={igstAmount}
        grandTotal={grandTotal}
        onConfirm={executeOrderPlacement}
      />

      {/* Lookup & Tracking Sliding Drawer */}
      <OrderLookupDrawer
        isOpen={showLookupPanel}
        onClose={() => {
          setShowLookupPanel(false);
          setLookupResults([]);
        }}
        lookupMobile={lookupMobile}
        onLookupMobileChange={setLookupMobile}
        lookupPincode={lookupPincode}
        onLookupPincodeChange={setLookupPincode}
        onSubmit={handleLookupSearch}
        isSearchingLookup={isSearchingLookup}
        lookupResults={lookupResults}
        onDownloadInvoice={handleDownloadLookupInvoice}
        onDownloadDeliveryChallan={handleDownloadLookupChallan}
      />
    </div>
  );
}
