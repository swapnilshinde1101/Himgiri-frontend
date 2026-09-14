import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddressAutofillFields {
  city?: string;
  pincode?: string;
  addressLine1?: string;
}

interface Props {
  isHomeDelivery: boolean;
  mapLocation: { lat: number; lng: number } | null;
  onLocationChange: (loc: { lat: number; lng: number } | null) => void;
  city: string;
  addressLine1: string;
  pincode: string;
  onAddressAutofill: (fields: AddressAutofillFields) => void;
}

export default function DeliveryMapPicker({
  isHomeDelivery,
  mapLocation,
  onLocationChange,
  city,
  addressLine1,
  pincode,
  onAddressAutofill
}: Props) {
  const [showMap, setShowMap] = useState<boolean>(false);
  const [mapSearchVal, setMapSearchVal] = useState('');
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    toast.loading('Detecting your location...', { id: 'geo-locating' });

    // Try high accuracy (GPS) first with a short timeout
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const lat = parseFloat(latitude.toFixed(6));
        const lng = parseFloat(longitude.toFixed(6));
        onLocationChange({ lat, lng });
        toast.success('Location detected with high accuracy!', { id: 'geo-locating' });

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerInstanceRef.current.setLatLng([lat, lng]);
        }
      },
      (highAccError) => {
        // Fallback to low accuracy (Wi-Fi/IP) if GPS fails or times out (e.g. on desktops)
        navigator.geolocation.getCurrentPosition(
          (fallbackPosition) => {
            const { latitude, longitude } = fallbackPosition.coords;
            const lat = parseFloat(latitude.toFixed(6));
            const lng = parseFloat(longitude.toFixed(6));
            onLocationChange({ lat, lng });
            toast.success('Location detected (approximate)!', { id: 'geo-locating' });

            if (mapInstanceRef.current && markerInstanceRef.current) {
              mapInstanceRef.current.setView([lat, lng], 16);
              markerInstanceRef.current.setLatLng([lat, lng]);
            }
          },
          (fallbackError) => {
            let msg = 'Could not retrieve your location. Please select it manually on the map.';
            if (fallbackError.code === fallbackError.PERMISSION_DENIED) {
              msg = 'Location access blocked. Please enable location permissions in your browser settings.';
            } else if (fallbackError.code === fallbackError.TIMEOUT) {
              msg = 'Location detection timed out. Please search or select manually.';
            }
            toast.error(msg, { id: 'geo-locating' });
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
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

        onLocationChange({ lat: latitude, lng: longitude });
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

  // Auto detect location when map picker is shown
  useEffect(() => {
    if (showMap) {
      handleDetectLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const defaultLat = mapLocation ? mapLocation.lat : 18.5204;
    const defaultLng = mapLocation ? mapLocation.lng : 73.8567;

    const mapContainer = document.getElementById('delivery-map');
    if (!mapContainer || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const map = L.map('delivery-map').setView([defaultLat, defaultLng], 14);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Fix grey map tiles by invalidating size after render
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

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
      onLocationChange({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
    });

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onLocationChange({ lat: parseFloat(position.lat.toFixed(6)), lng: parseFloat(position.lng.toFixed(6)) });
    });

    if (!mapLocation) {
      onLocationChange({ lat: defaultLat, lng: defaultLng });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          const autofillFields: AddressAutofillFields = {};
          let autofilled = false;

          // Auto-fill City if empty
          if (!city.trim()) {
            autofillFields.city = addr.city || addr.town || addr.village || addr.suburb || 'Pune';
            autofilled = true;
          }

          // Auto-fill Pincode if empty
          if (!pincode.trim() && addr.postcode) {
            autofillFields.pincode = addr.postcode.replace(/\s/g, '');
            autofilled = true;
          }

          // Auto-fill Address Line 1 if empty
          if (!addressLine1.trim()) {
            const road = addr.road || addr.suburb || addr.neighbourhood || '';
            const suburb = addr.suburb || addr.county || '';
            let line1 = `${road}${road && suburb ? ', ' : ''}${suburb}`;
            if (data.display_name && !line1) {
              line1 = data.display_name.split(',').slice(0, 2).join(', ');
            }
            if (line1) {
              autofillFields.addressLine1 = line1;
              autofilled = true;
            }
          }

          if (autofilled) {
            onAddressAutofill(autofillFields);
            toast.success('Address auto-filled from map pin!', { id: 'reverse-geo' });
          }
        }
      } catch (err) {
        // Ignore lookup errors
      }
    }, 800);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLocation]);

  if (!isHomeDelivery) return null;

  return (
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
                  onLocationChange(null);
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
  );
}
