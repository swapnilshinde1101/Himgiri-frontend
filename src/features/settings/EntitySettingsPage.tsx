import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Building2, Mail, Phone, Hash, Globe, FileText, 
  AlertCircle, ShieldCheck, CheckCircle2, Save, Sparkles 
} from 'lucide-react';
import api from '../../services/api';
import { masterDataService } from '../../services/masterDataService';
import type { ApiResponse, StateDto } from '../../types';

interface VendorSettingsDto {
  id: string;
  companyName: string;
  gstin: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  invoicePrefix: string;
  lastInvoiceNumber: number;
  stateId: string | null;
  stateName: string | null;
}

export default function EntitySettingsPage(): JSX.Element {
  const queryClient = useQueryClient();

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [contactPhone, setContactPhone] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('HG');
  const [stateId, setStateId] = useState('');

  // Fetch settings & states
  const { data: settingsData, isLoading: isLoadingSettings, isError: isErrorSettings } = useQuery({
    queryKey: ['vendorSettings'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<VendorSettingsDto>>('/vendorsettings');
      return data.data;
    }
  });

  const { data: statesData, isLoading: isLoadingStates } = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const res = await masterDataService.getStates();
      return res.data;
    }
  });

  // Sync state values when data arrives
  useEffect(() => {
    if (settingsData) {
      setCompanyName(settingsData.companyName || '');
      setGstin(settingsData.gstin || '');
      setAddress(settingsData.address || '');
      setContactEmail(settingsData.contactEmail || '');
      setInvoicePrefix(settingsData.invoicePrefix || 'HG');
      setStateId(settingsData.stateId || '');

      // Parse phone number into country code + 10 digits
      const phoneRaw = settingsData.contactPhone || '';
      if (phoneRaw.startsWith('+')) {
        const spaceIdx = phoneRaw.indexOf(' ');
        if (spaceIdx > 0) {
          setCountryCode(phoneRaw.substring(0, spaceIdx));
          setContactPhone(phoneRaw.substring(spaceIdx + 1).replace(/[^0-9]/g, ''));
        } else {
          if (phoneRaw.length > 10) {
            setCountryCode(phoneRaw.substring(0, phoneRaw.length - 10));
            setContactPhone(phoneRaw.substring(phoneRaw.length - 10).replace(/[^0-9]/g, ''));
          } else {
            setCountryCode('+91');
            setContactPhone(phoneRaw.replace(/[^0-9]/g, ''));
          }
        }
      } else {
        setCountryCode('+91');
        setContactPhone(phoneRaw.replace(/[^0-9]/g, ''));
      }
    }
  }, [settingsData]);

  // Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: Omit<VendorSettingsDto, 'id' | 'lastInvoiceNumber' | 'stateName'>) => {
      const { data } = await api.put<ApiResponse<boolean>>('/vendorsettings', payload);
      return data;
    },
    onSuccess: (res) => {
      if (res.statusCode === 200) {
        toast.success('Configurations locked successfully!');
        queryClient.invalidateQueries({ queryKey: ['vendorSettings'] });
      } else {
        toast.error(res.message || 'Failed to save settings.');
      }
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || err?.message || 'Error occurred while saving.';
      toast.error(errMsg);
    }
  });

  // Handlers
  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGstin(e.target.value.toUpperCase());
  };

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoicePrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''));
  };

  const selectedState = statesData?.find(s => s.id === stateId);
  
  // Real-time Validation States
  const isPlaceholder = gstin.includes('PENDING') || gstin.includes('GSTIN_');
  const isGstinLengthValid = !gstin || isPlaceholder || gstin.length === 15;
  const isGstinPrefixValid = !gstin || isPlaceholder || !selectedState || gstin.substring(0, 2) === selectedState.gstStateCode;
  
  const isGstinValid = isGstinLengthValid && isGstinPrefixValid;
  const isPrefixValid = invoicePrefix.length >= 2 && invoicePrefix.length <= 5;
  const isCompanyNameValid = companyName.trim().length > 0;
  const isAddressValid = address.trim().length > 0;
  const isPhoneValid = !contactPhone || /^[0-9]{10}$/.test(contactPhone);

  const isFormValid = isCompanyNameValid && isAddressValid && isGstinValid && isPrefixValid && isPhoneValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please resolve validation errors before saving.');
      return;
    }

    const fullPhone = contactPhone.trim() ? `${countryCode} ${contactPhone.trim()}` : '';

    updateMutation.mutate({
      companyName: companyName.trim(),
      gstin: gstin.trim(),
      address: address.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: fullPhone,
      invoicePrefix: invoicePrefix.trim(),
      stateId: stateId || null
    });
  };

  if (isLoadingSettings || isLoadingStates) {
    return (
      <div className="space-y-8 animate-pulse p-2">
        <div className="space-y-3">
          <div className="h-9 bg-gray-200/80 rounded-xl w-48"></div>
          <div className="h-4 bg-gray-100 rounded-lg w-96"></div>
        </div>
        <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200/60 rounded w-24"></div>
                <div className="h-12 bg-gray-50 rounded-2xl w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isErrorSettings) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 text-center text-rose-700 font-medium flex flex-col items-center gap-3">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <div>
          <p className="font-bold text-lg">Configuration Sync Failure</p>
          <p className="text-sm text-rose-600/80 mt-1">Make sure the backend database services are running and try refreshing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-1">
      
      {/* Premium Header Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight flex items-center gap-2">
            Entity Settings
            <Sparkles className="h-5 w-5 text-himgiri-primary animate-pulse" />
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            Manage tax configurations, active jurisdictions, legal credentials, and invoicing rules.
          </p>
        </div>

        {/* Dynamic Compliance Status Badge */}
        {isPlaceholder ? (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold shadow-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Tax Invoices Blocked (Configure Valid GSTIN)</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Pan-India Compliance Active</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: Legal Registration & GST Details */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-50 bg-gray-50/40 px-8 py-5">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-himgiri-primary" />
              Legal & Tax Configurations
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Configure state settings and tax identity mappings.</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Company Registered Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  Company Registered Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all duration-300 font-medium text-gray-800 text-sm shadow-sm"
                  placeholder="e.g. Himgiri Goods Pvt. Ltd"
                  required
                />
              </div>

              {/* Operating Home State */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  Operating State (Base Jurisdiction) *
                </label>
                <select
                  value={stateId}
                  onChange={e => setStateId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all duration-300 font-medium text-gray-800 text-sm bg-white shadow-sm"
                  required
                >
                  <option value="">Select Operating State</option>
                  {statesData?.map(state => (
                    <option key={state.id} value={state.id}>
                      {state.stateName} (GST State Code: {state.gstStateCode}) {state.isUnionTerritory ? '[Union Territory]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* GSTIN */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Seller GSTIN (15-character alphanumeric format)</span>
                  {selectedState && (
                    <span className="text-gray-400 font-normal normal-case">
                      Must start with state prefix <strong className="text-himgiri-primary font-bold">"{selectedState.gstStateCode}"</strong>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={gstin}
                    onChange={handleGstinChange}
                    maxLength={15}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all duration-300 font-mono font-bold tracking-wider text-sm shadow-sm ${
                      gstin && !isGstinValid 
                        ? 'border-red-300 bg-red-50/20 text-red-900 focus:ring-red-200' 
                        : 'border-gray-200 text-gray-800'
                    }`}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                  />
                  {gstin && (
                    <div className="absolute right-3.5 top-3.5 flex items-center">
                      {isGstinValid ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4.5 w-4.5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>

                {/* Validation Warnings */}
                {gstin && !isPlaceholder && !isGstinLengthValid && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1 animate-pulse">
                    <AlertCircle className="h-3.5 w-3.5" />
                    GSTIN length must be exactly 15 characters (currently {gstin.length}).
                  </p>
                )}
                {gstin && !isPlaceholder && isGstinLengthValid && !isGstinPrefixValid && selectedState && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1 animate-pulse">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Prefix mismatch: GSTIN must start with "{selectedState.gstStateCode}" to match {selectedState.stateName}.
                  </p>
                )}
              </div>

              {/* Registered Address */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  Official Registered Address *
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all duration-300 font-medium text-gray-800 text-sm h-24 resize-none shadow-sm"
                  placeholder="Provide registered physical office address..."
                  required
                />
              </div>

            </div>
          </div>
        </div>

        {/* SECTION 2: Billing Mappings & Sequences */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card: Invoice Prefix */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-himgiri-primary" />
              <span className="text-sm font-bold text-gray-800">Invoice Prefix</span>
            </div>
            <input
              type="text"
              value={invoicePrefix}
              onChange={handlePrefixChange}
              maxLength={5}
              className={`w-full px-4 py-2.5 rounded-xl border text-center font-black tracking-widest text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all ${
                !isPrefixValid ? 'border-red-300 bg-red-50/20 text-red-900' : 'border-gray-200 text-gray-800'
              }`}
              placeholder="HG"
              required
            />
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Series identifier. Generates numbers like: <strong>{invoicePrefix}-2026-0001</strong>.
            </p>
          </div>

          {/* Card: Contact Email */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-himgiri-primary" />
              <span className="text-sm font-bold text-gray-800">Billing Email</span>
            </div>
            <input
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
              placeholder="billing@himgiri.com"
            />
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Used for electronic tax declarations and invoice copies.
            </p>
          </div>

          {/* Card: Contact Phone */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-himgiri-primary" />
              <span className="text-sm font-bold text-gray-800">Billing Support Phone</span>
            </div>
            
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="w-1/3 px-2 py-2.5 rounded-xl border border-gray-200 text-xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all bg-white"
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+971">+971 (UAE)</option>
                <option value="+65">+65 (SG)</option>
              </select>

              {/* 10-digit Phone Number */}
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={10}
                className={`w-2/3 px-3 py-2.5 rounded-xl border text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all ${
                  contactPhone && !isPhoneValid ? 'border-red-300 bg-red-50/20 text-red-900 focus:ring-red-200' : 'border-gray-200 text-gray-800'
                }`}
                placeholder="9876543210"
              />
            </div>

            {contactPhone && !isPhoneValid && (
              <p className="text-[10px] text-red-500 font-semibold text-center animate-pulse">
                Phone number must be exactly 10 digits.
              </p>
            )}
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Printed directly onto transaction invoices for parent inquiries.
            </p>
          </div>

        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 bg-gray-50/50 border border-gray-100 rounded-3xl px-8 py-5">
          <button
            type="submit"
            disabled={!isFormValid || updateMutation.isPending}
            className={`inline-flex items-center gap-2 px-8 py-3.5 text-white rounded-2xl font-bold transition-all duration-300 shadow-md ${
              isFormValid && !updateMutation.isPending
                ? 'bg-gray-950 hover:bg-gray-900 hover:-translate-y-0.5 cursor-pointer'
                : 'bg-gray-300 opacity-60 cursor-not-allowed'
            }`}
          >
            <Save className="h-4.5 w-4.5 text-emerald-400" />
            <span>{updateMutation.isPending ? 'Locking Configurations...' : 'Commit Configurations'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
