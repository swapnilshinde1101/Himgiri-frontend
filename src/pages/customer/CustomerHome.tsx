import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { kitService } from '../../services/kitService';
import { orderService } from '../../services/orderService';
import { masterDataService } from '../../services/masterDataService';
import { catalogService } from '../../services/catalogService';
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
  BookOpen,
  ArrowLeft,
  Search,
  X
} from 'lucide-react';
import Button from '../../components/shared/Button';
import toast from 'react-hot-toast';
import { 
  validateIndianMobile, 
  validatePincode, 
  validateEmail, 
  validateRequired 
} from '../../utils/validation';
import { clsx } from 'clsx';
import type { SchoolKit, Item } from '../../types';

interface CartDisplayItem {
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
  const [includeDelivery, setIncludeDelivery] = useState<boolean>(true);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedDetailItem]);

  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [mapSearchVal, setMapSearchVal] = useState('');
  const mapInstanceRef = React.useRef<any>(null);
  const markerInstanceRef = React.useRef<any>(null);

  // Load Leaflet Script and Stylesheet dynamically
  useEffect(() => {
    if (!showMap) return;
    if (document.getElementById('leaflet-css')) return;

    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    document.body.appendChild(script);
  }, [showMap]);

  // Auto detect location when map picker is shown
  useEffect(() => {
    if (showMap) {
      handleDetectLocation();
    }
  }, [showMap]);

  // Initialize/Update Map container
  useEffect(() => {
    if (!showMap) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
      return;
    }

    const timer = setInterval(() => {
      if (!(window as any).L) return; // Wait for Leaflet to be fully loaded
      clearInterval(timer);

      const defaultLat = mapLocation ? mapLocation.lat : 18.5204;
      const defaultLng = mapLocation ? mapLocation.lng : 73.8567;

      const mapContainer = document.getElementById('delivery-map');
      if (!mapContainer || mapInstanceRef.current) return;

      const L = (window as any).L;
      const map = L.map('delivery-map').setView([defaultLat, defaultLng], 14);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Custom red SVG marker with pulse radar ring
      const redMarkerIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="relative flex items-center justify-center">
                 <div class="w-8 h-8 rounded-full bg-blue-500/25 absolute animate-ping" style="animation-duration: 2s;" />
                 <svg class="w-8 h-8 text-red-500 filter drop-shadow relative z-10" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                 </svg>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([defaultLat, defaultLng], { draggable: true, icon: redMarkerIcon }).addTo(map);
      markerInstanceRef.current = marker;

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setMapLocation({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
      });

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setMapLocation({ lat: parseFloat(position.lat.toFixed(6)), lng: parseFloat(position.lng.toFixed(6)) });
      });

      if (!mapLocation) {
        setMapLocation({ lat: defaultLat, lng: defaultLng });
      }
    }, 200);

    return () => clearInterval(timer);
  }, [showMap]);

  // Reverse Geocoding to auto-fill address details with 800ms debounce
  useEffect(() => {
    if (!mapLocation) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${mapLocation.lat}&lon=${mapLocation.lng}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          
          // Auto-fill City
          const detectedCity = addr.city || addr.town || addr.village || addr.suburb || 'Pune';
          setCity(detectedCity);

          // Auto-fill Pincode
          if (addr.postcode) {
            setPincode(addr.postcode.replace(/\s/g, ''));
          }

          // Auto-fill Address Line 1
          const road = addr.road || addr.suburb || addr.neighbourhood || '';
          const suburb = addr.suburb || addr.county || '';
          let line1 = `${road}${road && suburb ? ', ' : ''}${suburb}`;
          if (data.display_name && !line1) {
            line1 = data.display_name.split(',').slice(0, 2).join(', ');
          }
          if (line1) {
            setAddressLine1(line1);
          }
          toast.success('Address auto-filled from map pin!', { id: 'reverse-geo' });
        }
      } catch (err) {
        // Ignore lookup errors
      }
    }, 800);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [mapLocation]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    toast.loading('Detecting your location...', { id: 'geo-locating' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const lat = parseFloat(latitude.toFixed(6));
        const lng = parseFloat(longitude.toFixed(6));
        setMapLocation({ lat, lng });
        toast.success('Location detected successfully!', { id: 'geo-locating' });

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerInstanceRef.current.setLatLng([lat, lng]);
        }
      },
      () => {
        toast.error('Could not retrieve your location. Please select it manually on the map.', { id: 'geo-locating' });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchVal.trim()) return;

    toast.loading(`Searching for "${mapSearchVal}"...`, { id: 'map-search' });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(mapSearchVal)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        setMapLocation({ lat: latitude, lng: longitude });
        toast.success('Location found!', { id: 'map-search' });

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerInstanceRef.current.setLatLng([latitude, longitude]);
        }
      } else {
        toast.error('Location not found. Please try another place name.', { id: 'map-search' });
      }
    } catch (err) {
      toast.error('Search failed. Please select manually.', { id: 'map-search' });
    }
  };


  // Search & Category filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);

  // Reset page number on category change
  useEffect(() => {
    setPageNumber(1);
  }, [selectedCategoryId]);

  // Reset active suggestion index when suggestions list or dropdown status changes
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [suggestions, showSuggestions]);

  // Autocomplete matching text highlight
  const highlightMatch = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <strong key={i} className="text-blue-600 font-extrabold">{part}</strong> 
            : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  // Keyboard navigation for suggestions dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
          const selected = suggestions[activeSuggestionIndex];
          setSearchQuery(selected);
          setDebouncedSearchQuery(selected);
          setPageNumber(1);
          setShowSuggestions(false);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  
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
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorStatus, setSimulatorStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [simulatorMessage, setSimulatorMessage] = useState('');

  // ── Queries ──
  const { data: kitsRes, isLoading: kitsLoading } = useQuery({
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

  // ── Fetch autocomplete search suggestions ──
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await catalogService.getSuggestions(searchQuery);
        if (res.data) {
          setSuggestions(res.data);
        }
      } catch (err) {
        // Silently ignore suggestions errors
      }
    }, 150);

    return () => clearTimeout(timer);
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

  // ── Safety Rule: Force Home Delivery if Grade is Null (General Shop) ──
  useEffect(() => {
    if (selectedGradeId === null) {
      setIncludeDelivery(true);
    }
  }, [selectedGradeId]);

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

  const updateAddOnQty = (itemId: string, delta: number, item: any) => {
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

  const itemsSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemsGst = cartItems.reduce((sum, item) => {
    const gstPercent = getGstPercentByName(item.categoryName);
    return sum + (item.price * item.quantity * (gstPercent / 100));
  }, 0);
  const itemsTotal = itemsSubtotal + itemsGst;

  const deliveryBase = includeDelivery ? 211.86 : 0;
  const deliveryGst = includeDelivery ? 38.14 : 0;
  const grandTotal = itemsTotal + deliveryBase + deliveryGst;

  // Filter catalog items for display in the Add-on catalog grid
  const displayCatalogItems = catalogItems.filter(item => {
    // Hide items that are already in the mandatory kit (Option A)
    const isInKit = kitItems.some(ki => ki.itemId === item.id);
    return !isInKit;
  });

  // ── Place Order ──
  const handlePlaceOrder = async (e: React.FormEvent) => {
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
    if (email.trim() && !validateEmail(email)) {
      toast.error('Please enter a valid parent email address.');
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

    if (includeDelivery && !mapLocation) {
      toast.error('Please select your delivery location on the map to help us deliver your order.');
      setShowMap(true);
      return;
    }

    if (!customerStateId) {
      toast.error('Please select your state.');
      return;
    }

    setIsPlacingOrder(true);
    try {
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

  // ── Simulator Actions ──
  const handlePaymentSuccess = async () => {
    if (!createdOrder) return;
    setSimulatorStatus('processing');
    setSimulatorMessage('Initiating webhook transaction check on server...');

    try {
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
    setSelectedGradeId(undefined); // Reset back to welcome/landing state
    setSelectedKit(null);
    setAddOnQuantities({});
    setFirstName('');
    setLastName('');
    setEmail('');
    setMobile('');
    setAddressLine1('');
    setAddressLine2('');
    setCreatedOrder(null);
    setShowSimulator(false);
    setSimulatorStatus('idle');
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
                      Back to Mode Selection
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
        ) : selectedGradeId === undefined ? (
          /* WELCOME / LANDING MODE SELECTION STATE */
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
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
                <p className="text-sm lg:text-base font-semibold text-blue-100 leading-relaxed">
                  Welcome to the DPS Hinjawadi Parent Portal. Select your child's grade package below or skip directly to browsing the general items shop.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: Grade Select */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="h-12 w-12 bg-himgiri-primary/10 text-himgiri-primary rounded-2xl flex items-center justify-center">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">Option A: Shop by Grade / Class</h3>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    Select your child's grade below to automatically load the mandatory kit bundle and see recommended school items for that class.
                  </p>
                </div>

                <div className="space-y-4">
                  {gradesLoading ? (
                    <div className="flex items-center justify-center py-6 gap-3">
                      <Loader2 className="h-5 w-5 text-himgiri-primary animate-spin" />
                      <span className="text-xs font-bold text-gray-500">Loading grades...</span>
                    </div>
                  ) : activeGrades.length === 0 ? (
                    <p className="text-xs text-gray-400 font-bold">No active grades found.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {activeGrades.map(grade => (
                        <button
                          key={grade.id}
                          type="button"
                          onClick={() => handleGradeSelect(grade.id)}
                          className="p-3 rounded-xl border border-gray-200 text-center hover:border-himgiri-primary hover:bg-himgiri-primary/5 transition-all text-xs font-extrabold text-gray-700 hover:text-himgiri-primary active:scale-95"
                        >
                          {grade.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Option B: General Shop */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">Option B: General Items Shop</h3>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    Skip grade selection and browse all items directly. Perfect for buying individual textbooks, notebooks, school bags, drawing items, or replacements.
                  </p>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleGradeSelect(null)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-extrabold active:scale-98 transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2"
                  >
                    <span>Browse General Catalog</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                  <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-himgiri-primary bg-himgiri-primary/10 px-2.5 py-1 rounded-full">
                        Section A: Mandatory Kit
                      </span>
                      {selectedKit ? (
                        <>
                          <h3 className="text-lg font-black text-gray-900 tracking-tight mt-2.5">
                            {selectedKit.name}
                          </h3>
                          <p className="text-xs text-gray-400 font-semibold leading-relaxed mt-1">
                            {selectedKit.description || 'Constituent package items required for this grade:'}
                          </p>
                        </>
                      ) : (
                        <div className="mt-3 p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl text-xs font-semibold text-amber-800 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>No official pre-defined kit bundle active for this grade. Select individual items below.</span>
                        </div>
                      )}
                    </div>

                    {selectedKit && (
                      <div className="divide-y divide-gray-100 border border-gray-150 rounded-2xl overflow-hidden bg-slate-50/20">
                        {kitItems.map((item, idx) => (
                          <div key={idx} className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/40 transition-colors">
                            <div 
                              className="flex items-center gap-3 cursor-pointer group/item" 
                              onClick={() => {
                                const catItem = catalogItems.find(ci => ci.id === item.itemId);
                                if (catItem) {
                                  setSelectedDetailItem(catItem);
                                } else {
                                  setSelectedDetailItem({
                                    id: item.itemId,
                                    name: item.itemName,
                                    price: item.price,
                                    mrp: item.mrp,
                                    categoryName: item.categoryName,
                                    unit: item.unit,
                                    imageUrl: item.imageUrl,
                                    storageStatus: item.storageStatus,
                                    description: 'This is a constituent item inside the selected School Kit.',
                                    stockQty: item.storageStatus === 'InStock' ? 999 : 0
                                  });
                                }
                              }}
                            >
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl.split(',')[0]} 
                                  alt={item.itemName} 
                                  className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0 bg-white"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl border border-gray-100 flex-shrink-0 bg-white flex items-center justify-center text-gray-400">
                                  <BookOpen className="h-5 w-5" />
                                </div>
                              )}
                              
                              <div className="space-y-0.5">
                                <span className="font-bold text-sm text-gray-900">{item.itemName}</span>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-450 font-extrabold uppercase">
                                  <span className="bg-white text-gray-650 border border-gray-150 px-1.5 py-0.5 rounded">{item.categoryName}</span>
                                  <span>•</span>
                                  <span>Qty: {item.quantity} {item.unit}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <span className="font-mono font-black text-sm text-gray-800">
                                ₹{(item.mrp * item.quantity).toFixed(2)}
                              </span>
                              <span className="text-[9px] text-gray-450 font-semibold block leading-none">
                                (Incl. GST)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Section B: Add-on items Catalog */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      {selectedKit ? "Section B: Optional Add-ons" : "Available Catalog Items"}
                    </span>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight mt-2.5">
                      {selectedKit ? "Add Additional Items" : "Browse & Add Items"}
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold mt-1">
                      {selectedKit 
                        ? "Customize your bundle by adding extra drawing tools, bags, notebooks, or replacement items:"
                        : "Choose the items you wish to purchase below:"}
                    </p>
                  </div>

                  {/* Amazon-style unified Search & Category Selector Bar */}
                  <div className="relative">
                    <div className="flex bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:ring-4 focus-within:ring-himgiri-primary/10 focus-within:border-himgiri-primary overflow-hidden transition-all h-14">
                      {/* Left: Category Selector Dropdown */}
                      <div className="bg-slate-50 border-r border-gray-200 flex items-center px-4 hover:bg-slate-100 transition-colors shrink-0 max-w-[150px] sm:max-w-[180px]">
                        <select
                          className="bg-transparent text-[11px] font-black uppercase tracking-wider text-gray-600 focus:outline-none cursor-pointer border-none py-1 w-full"
                          value={selectedCategoryId}
                          onChange={(e) => {
                            setSelectedCategoryId(e.target.value);
                            setPageNumber(1);
                          }}
                        >
                          <option value="All">All Categories</option>
                          {activeCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Middle: Input field */}
                      <input
                        type="text"
                        placeholder="Search for textbooks, bags, stationery, journals..."
                        className="flex-1 px-4 py-3 bg-transparent text-xs font-semibold focus:outline-none border-none text-gray-800 placeholder:text-gray-400"
                        value={searchQuery}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPageNumber(1);
                        }}
                      />

                      {/* Right: Search icon button */}
                      <button
                        type="button"
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Search className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        {suggestions.map((suggestion, idx) => {
                          const isActive = idx === activeSuggestionIndex;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSearchQuery(suggestion);
                                setDebouncedSearchQuery(suggestion);
                                setPageNumber(1);
                                setShowSuggestions(false);
                              }}
                              className={clsx(
                                "w-full text-left px-4 py-2.5 text-xs font-semibold hover:text-gray-950 transition-colors flex items-center gap-2 border-b border-slate-50 last:border-0",
                                isActive ? "bg-slate-100 text-slate-900" : "text-gray-700 hover:bg-slate-50"
                              )}
                            >
                              <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{highlightMatch(suggestion, searchQuery)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Items catalog grid */}
                  {catalogLoading ? (
                    <div className="flex items-center justify-center py-12 gap-3">
                      <Loader2 className="h-5 w-5 text-himgiri-primary animate-spin" />
                      <span className="text-xs font-bold text-gray-500 font-mono">Loading catalog items...</span>
                    </div>
                  ) : displayCatalogItems.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-gray-250 rounded-2xl">
                      <p className="text-gray-400 font-bold text-xs">No active shop items match your search or category filter.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {displayCatalogItems.map(item => (
                        <div 
                          key={item.id} 
                          className="bg-white rounded-2xl border border-gray-150 p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-300 flex flex-col justify-between gap-4"
                        >
                          <div className="space-y-3 cursor-pointer group" onClick={() => setSelectedDetailItem(item)}>
                            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-gray-100 flex items-center justify-center">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl.split(',')[0]} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <BookOpen className="h-10 w-10 text-slate-400" />
                              )}
                              
                              <span className="absolute bottom-2 right-2 text-[8px] font-black bg-slate-900/75 text-white px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-sm">
                                {item.categoryName}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1 leading-tight" title={item.name}>
                                {item.name}
                              </h4>
                              {item.description ? (
                                <p className="text-[11px] text-gray-400 font-semibold line-clamp-2 leading-snug">
                                  {item.description}
                                </p>
                              ) : (
                                <p className="text-[11px] text-gray-300 font-semibold italic">No description available</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                {(() => {
                                  const gstPercent = getGstPercentByName(item.categoryName);
                                  const sellingPriceWithGst = item.price * (1 + gstPercent / 100);
                                  const isDiscounted = sellingPriceWithGst < item.mrp - 0.05;
                                  return (
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="font-mono font-black text-sm text-himgiri-primary">
                                          ₹{sellingPriceWithGst.toFixed(2)}
                                        </span>
                                        {isDiscounted && (
                                          <span className="font-mono text-[10px] text-gray-450 line-through">
                                            ₹{item.mrp.toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                          Incl. GST
                                        </span>
                                        {isDiscounted && (
                                          <span className="text-[9px] bg-green-50 text-green-700 font-bold px-1.5 py-0.5 rounded">
                                            Save ₹{(item.mrp - sellingPriceWithGst).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                                
                                {item.storageStatus === 'InStock' && item.stockQty <= 0 && (
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider block text-red-500 font-black">
                                    Out of Stock
                                  </span>
                                )}
                                {item.storageStatus === 'PreOrder' && (
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-500 block">
                                    Pre-order Available
                                  </span>
                                )}
                              </div>
                              
                              <div>
                                {(addOnQuantities[item.id] || 0) > 0 ? (
                                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner scale-95">
                                    <button
                                      type="button"
                                      onClick={() => updateAddOnQty(item.id, -1, item)}
                                      className="h-7 w-7 rounded-lg bg-white shadow-sm hover:bg-gray-100 text-gray-700 active:scale-90 transition-all flex items-center justify-center font-black text-sm border border-gray-200"
                                    >
                                      -
                                    </button>
                                    <span className="w-5 text-center font-black text-xs text-gray-805">
                                      {addOnQuantities[item.id]}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateAddOnQty(item.id, 1, item)}
                                      disabled={item.storageStatus === 'InStock' && (addOnQuantities[item.id] || 0) >= item.stockQty}
                                      className="h-7 w-7 rounded-lg bg-white shadow-sm hover:bg-gray-150 text-gray-800 active:scale-90 disabled:opacity-40 disabled:hover:bg-white disabled:active:scale-100 transition-all flex items-center justify-center font-black text-sm border border-gray-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={item.storageStatus === 'InStock' && item.stockQty <= 0}
                                    onClick={() => updateAddOnQty(item.id, 1, item)}
                                    className={clsx(
                                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border shadow-sm",
                                      item.storageStatus === 'InStock' && item.stockQty <= 0
                                        ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                                    )}
                                  >
                                    {item.storageStatus === 'InStock' && item.stockQty <= 0 ? "Sold Out" : "Add to Cart"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Numbered Pagination Controls */}
                  {(() => {
                    const meta = catalogRes?.meta;
                    if (!meta || meta.totalPages <= 1) return null;
                    return (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100 mt-6">
                        <span className="text-[11px] font-bold text-gray-500">
                          Showing page <strong className="text-gray-800">{meta.currentPage}</strong> of <strong className="text-gray-800">{meta.totalPages}</strong> (Total <strong className="text-gray-800">{meta.totalRecords}</strong> items)
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Previous Button */}
                          <button
                            type="button"
                            disabled={meta.currentPage === 1 || catalogLoading}
                            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                            className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:active:scale-100 transition-all shadow-sm flex items-center gap-1"
                          >
                            &lt; Prev
                          </button>

                          {/* Page Numbers */}
                          {Array.from({ length: meta.totalPages }, (_, index) => {
                            const pageIdx = index + 1;
                            const isCurrent = pageIdx === meta.currentPage;
                            return (
                              <button
                                key={pageIdx}
                                type="button"
                                disabled={catalogLoading}
                                onClick={() => setPageNumber(pageIdx)}
                                className={clsx(
                                  "h-8 w-8 flex items-center justify-center rounded-xl text-[10px] font-black transition-all active:scale-95",
                                  isCurrent
                                    ? "bg-slate-900 border border-slate-900 text-white shadow-md shadow-slate-900/10"
                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                                )}
                              >
                                {pageIdx}
                              </button>
                            );
                          })}

                          {/* Next Button */}
                          <button
                            type="button"
                            disabled={meta.currentPage === meta.totalPages || catalogLoading}
                            onClick={() => setPageNumber(p => Math.min(meta.totalPages, p + 1))}
                            className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:active:scale-100 transition-all shadow-sm flex items-center gap-1"
                          >
                            Next &gt;
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right Column: Checkout & Cart summary (4 Columns) */}
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
                  
                  {selectedGradeId === null && (
                    <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-2xl text-[10px] font-semibold text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <span>Classroom Delivery requires grade class selection. Forced Home Delivery is selected.</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIncludeDelivery(true)}
                      className={clsx(
                        "p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all select-none",
                        includeDelivery 
                          ? "border-himgiri-primary bg-himgiri-primary/[0.03] ring-2 ring-himgiri-primary/10" 
                          : "border-gray-200 hover:bg-gray-50/50"
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
                      disabled={selectedGradeId === null}
                      onClick={() => setIncludeDelivery(false)}
                      className={clsx(
                        "p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all select-none",
                        !includeDelivery 
                          ? "border-himgiri-primary bg-himgiri-primary/[0.03] ring-2 ring-himgiri-primary/10" 
                          : "border-gray-200 hover:bg-gray-50/50",
                        selectedGradeId === null && "opacity-45 cursor-not-allowed bg-slate-50 border-gray-200"
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

                {/* Form & Price summary */}
                <form onSubmit={handlePlaceOrder} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
                    Student & Shipping Info
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
                          onChange={(e) => setFirstName(e.target.value)}
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
                          onChange={(e) => setLastName(e.target.value)}
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
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        />
                      </div>

                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          placeholder="Parent Email (Optional)"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
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
                        placeholder="Address Line 1 *"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Address Line 2 (Optional)"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                      />
                      <input
                        type="text"
                        required
                        placeholder="City *"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <select
                          required
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all cursor-pointer"
                          value={customerStateId}
                          onChange={(e) => setCustomerStateId(e.target.value)}
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
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                    </div>

                    {/* Delivery Map Picker */}
                    {includeDelivery && (
                      <div className="pt-1">
                        {!showMap ? (
                          <button
                            type="button"
                            onClick={() => setShowMap(true)}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 border border-slate-200 shadow-sm"
                          >
                            <MapPin className="h-4 w-4 text-slate-600 animate-pulse" />
                            <span>Select Delivery Location on Map</span>
                          </button>
                        ) : (
                          <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-150 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                            {/* Search form */}
                            <form onSubmit={handleMapSearch} className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Search society, colony, or landmark..."
                                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm"
                                value={mapSearchVal}
                                onChange={(e) => setMapSearchVal(e.target.value)}
                              />
                              <button
                                type="submit"
                                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                              >
                                Search
                              </button>
                            </form>

                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                                Or drag pin directly on map:
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={handleDetectLocation}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                                >
                                  Detect Me
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowMap(false);
                                    setMapLocation(null);
                                  }}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                            
                            <div id="delivery-map" className="w-full h-44 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-inner relative z-10" />
                            
                            {mapLocation && (
                              <div className="flex items-center justify-between text-[9px] text-slate-450 font-mono font-bold mt-1">
                                <span>GPS: {mapLocation.lat}, {mapLocation.lng}</span>
                                <span className="text-green-600 font-bold uppercase tracking-wider">📍 Pin Selected</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
            </div>
          </div>
        )}
      </main>

      {/* Product Details Modal (Popup) */}
      {selectedDetailItem && (() => {
        const detailImages = selectedDetailItem.imageUrl 
          ? selectedDetailItem.imageUrl.split(',').filter((u: string) => u.trim() !== '') 
          : [];
        const isItemInSelectedKit = !!(selectedKit && selectedKit.items.some((ki: any) => ki.itemId === selectedDetailItem.id));
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-250 cursor-pointer" 
              onClick={() => setSelectedDetailItem(null)} 
            />
            
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-slate-100 animate-in zoom-in-95 duration-200">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedDetailItem(null)} 
                className="absolute top-4 right-4 z-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full p-2.5 hover:rotate-90 transition-all focus:outline-none shadow-sm"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Left Column: Image Gallery (Carousel) */}
              <div className="w-full md:w-1/2 p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/40">
                <div className="w-full flex flex-col justify-center items-center gap-4">
                  {/* Large Main Display Image */}
                  <div className="relative aspect-square w-full max-w-[280px] rounded-2xl overflow-hidden bg-white border border-slate-150 flex items-center justify-center shadow-soft">
                    {detailImages.length > 0 ? (
                      <img 
                        src={detailImages[activeImageIndex]} 
                        alt={selectedDetailItem.name} 
                        className="w-full h-full object-contain p-3"
                      />
                    ) : (
                      <BookOpen className="h-16 w-16 text-slate-300" />
                    )}

                    <span className="absolute top-3 left-3 text-[8px] font-black bg-slate-900/80 text-white px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-sm">
                      {selectedDetailItem.categoryName}
                    </span>
                  </div>

                  {/* Thumbnail Previews List */}
                  {detailImages.length > 1 && (
                    <div className="flex flex-wrap gap-2 justify-center max-h-16 overflow-y-auto py-1">
                      {detailImages.map((url: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={clsx(
                            "w-12 h-12 rounded-xl border overflow-hidden bg-white p-1 hover:border-blue-500 transition-all focus:outline-none flex-shrink-0 flex items-center justify-center",
                            activeImageIndex === index ? "border-blue-600 ring-4 ring-blue-500/10 shadow-sm" : "border-slate-200"
                          )}
                        >
                          <img 
                            src={url} 
                            alt={`Thumbnail ${index + 1}`} 
                            className="w-full h-full object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Information & Cart Actions */}
              <div className="w-full md:w-1/2 p-6 flex flex-col justify-between max-h-[45vh] md:max-h-none overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {selectedDetailItem.name}
                    </h3>
                    <p className="text-[9px] text-blue-600 font-extrabold uppercase mt-1.5 tracking-wider bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                      {selectedDetailItem.unit || 'Pieces (Pcs)'}
                    </p>
                  </div>

                  {/* Pricing Details */}
                  {(() => {
                    const gstPercent = getGstPercentByName(selectedDetailItem.categoryName);
                    const sellingPriceWithGst = selectedDetailItem.price * (1 + gstPercent / 100);
                    const isDiscounted = sellingPriceWithGst < selectedDetailItem.mrp - 0.05;
                    return (
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="text-[10px] text-gray-450 block font-semibold mb-0.5">Selling Price (incl. GST)</span>
                            <span className="font-mono font-black text-xl text-himgiri-primary">
                              ₹{sellingPriceWithGst.toFixed(2)}
                            </span>
                          </div>
                          
                          {isDiscounted && (
                            <div className="text-right">
                              <span className="text-[10px] text-gray-450 block font-semibold mb-0.5">MRP</span>
                              <span className="font-mono text-xs text-gray-400 block line-through">
                                ₹{selectedDetailItem.mrp.toFixed(2)}
                              </span>
                              <span className="text-[10px] bg-green-50 text-green-700 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">
                                Save ₹{(selectedDetailItem.mrp - sellingPriceWithGst).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-200/50 pt-2 flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>Base Price: <strong className="font-mono text-slate-700">₹{selectedDetailItem.price.toFixed(2)}</strong></span>
                          <span>GST ({gstPercent}%): <strong className="font-mono text-slate-700">₹{(sellingPriceWithGst - selectedDetailItem.price).toFixed(2)}</strong></span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Description */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Product Details</span>
                    {selectedDetailItem.description ? (
                      <p className="text-xs text-slate-600 leading-relaxed max-h-32 overflow-y-auto pr-1">
                        {selectedDetailItem.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-450 italic">No detailed description provided for this item.</p>
                    )}
                  </div>

                  {/* Availability / Stock Status */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-400 font-black uppercase tracking-wider">Availability:</span>
                    <div>
                      {selectedDetailItem.storageStatus === 'InStock' ? (
                        selectedDetailItem.stockQty > 0 ? (
                          <span className="bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded">
                            In Stock
                          </span>
                        ) : (
                          <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded">
                            Out of Stock
                          </span>
                        )
                      ) : (
                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                          Pre-order (Dispatched in 2-3 Days)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* School Kit Inclusion Banner */}
                  {isItemInSelectedKit && (
                    <div className="bg-blue-50/70 border border-blue-150 rounded-2xl p-3.5 flex items-start gap-2.5 text-[11px] text-blue-800 animate-in fade-in duration-200">
                      <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-extrabold text-blue-900 block mb-0.5">Included in Selected Kit</span>
                        This item is already included in your selected <span className="font-extrabold text-blue-900">{selectedKit?.name}</span>. You only need to add it here if you want to buy an <span className="font-bold underline">additional</span> copy.
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart Action Buttons */}
                <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between gap-4">
                  <div className="text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    Add to Cart
                  </div>

                  {(addOnQuantities[selectedDetailItem.id] || 0) > 0 ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner">
                        <button
                          type="button"
                          onClick={() => updateAddOnQty(selectedDetailItem.id, -1, selectedDetailItem)}
                          className="h-8 w-8 rounded-lg bg-white shadow-sm hover:bg-gray-100 text-gray-700 active:scale-95 transition-all flex items-center justify-center font-black text-sm border border-gray-200"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-slate-900 text-sm min-w-4 text-center">
                          {addOnQuantities[selectedDetailItem.id]}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateAddOnQty(selectedDetailItem.id, 1, selectedDetailItem)}
                          disabled={selectedDetailItem.storageStatus === 'InStock' && (addOnQuantities[selectedDetailItem.id] || 0) >= selectedDetailItem.stockQty}
                          className="h-8 w-8 rounded-lg bg-white shadow-sm hover:bg-gray-100 text-gray-700 active:scale-95 transition-all flex items-center justify-center font-black text-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      {isItemInSelectedKit && (
                        <span className="text-[10px] text-gray-400 font-bold mt-0.5">
                          (1 in Kit + {addOnQuantities[selectedDetailItem.id]} extra)
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={selectedDetailItem.storageStatus === 'InStock' && selectedDetailItem.stockQty <= 0}
                      onClick={() => updateAddOnQty(selectedDetailItem.id, 1, selectedDetailItem)}
                      className="px-5 py-2.5 bg-himgiri-primary hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-xl shadow-md shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedDetailItem.storageStatus === 'InStock' && selectedDetailItem.stockQty <= 0 
                        ? 'Sold Out' 
                        : (isItemInSelectedKit ? 'Add Extra Copy' : 'Add To Cart')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
