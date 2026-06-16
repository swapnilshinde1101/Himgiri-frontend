import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../services/inventoryService';
import { masterDataService } from '../../services/masterDataService';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import { AddButton, EditButton, DeleteButton } from '../../components/shared/ActionButtons';
import ActionModal from '../../components/shared/ActionModal';
import toast from 'react-hot-toast';
import type { Item, BaseRequest } from '../../types';
import { clsx } from 'clsx';
import ItemModal from './components/ItemModal';
import BulkInwardModal from './components/BulkInwardModal';
import { CalendarDays, Search, Loader2, ChevronLeft, ChevronRight, History, TrendingUp, TrendingDown, CheckCircle2, Layers, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [params, setParams] = useState<BaseRequest>({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
    sortColumn: 'CreatedAt',
    sortDirection: 'DESC',
    isCompleted: false
  });

  const [searchVal, setSearchVal] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  // Selection states for Bulk Inwarding
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [isBulkInwardOpen, setIsBulkInwardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Query to get count of completed items for the history badge
  const { data: completedItemsData } = useQuery({
    queryKey: ['items', 'completed-count'],
    queryFn: () => inventoryService.getItems({ pageNumber: 1, pageSize: 1, isCompleted: true }),
  });
  const completedCount = completedItemsData?.meta?.totalRecords || 0;

  // Query to get completed stats
  const { data: statsData } = useQuery({
    queryKey: ['items', 'completed-stats'],
    queryFn: () => inventoryService.getCompletedStats().then(res => res.data),
    enabled: activeTab === 'history'
  });

  // ── Master Data Queries ──
  const { data: grades } = useQuery({
    queryKey: ['grades', 'dropdown'],
    queryFn: () => masterDataService.getGrades({ pageNumber: 1, pageSize: 100 }).then(res => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', 'dropdown'],
    queryFn: () => masterDataService.getCategories({ pageNumber: 1, pageSize: 100 }).then(res => res.data),
  });

  // ── Data Fetching ──
  const { data, isLoading } = useQuery({
    queryKey: ['items', params],
    queryFn: () => inventoryService.getItems(params),
  });

  // ── Mutations ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item deleted successfully');
      setIsDeleteModalOpen(false);
      // Remove deleted item from selection if it was selected
      if (itemToDelete) {
        setSelectedItems(prev => prev.filter(i => i.id !== itemToDelete.id));
      }
    }
  });

  // ── Bulk Mutations ──
  const bulkToggleMutation = useMutation({
    mutationFn: ({ itemIds, isActive }: { itemIds: string[]; isActive: boolean }) =>
      inventoryService.bulkToggleActive(itemIds, isActive),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success(variables.isActive ? 'Selected items activated' : 'Selected items deactivated');
      setSelectedItems([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update items');
    }
  });

  const handleBulkToggleActive = (isActive: boolean) => {
    const ids = selectedItems.map(i => i.id);
    bulkToggleMutation.mutate({ itemIds: ids, isActive });
  };

  // ── Handlers ──
  const handleAdd = () => {
    setSelectedItem(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(p => ({ ...p, searchTerm: searchVal, pageNumber: 1 }));
  };

  const handleFilterChange = (key: keyof BaseRequest, value: any) => {
    setParams(prev => {
      const updated = { ...prev, [key]: value === '' ? undefined : value, pageNumber: 1 };
      // If start date is cleared, clear end date too
      if (key === 'startDate' && !value) {
        updated.endDate = undefined;
      }
      return updated;
    });
  };

  const handleTabChange = (tab: 'catalog' | 'history') => {
    setActiveTab(tab);
    setExpandedItemId(null);
    setParams(prev => ({
      ...prev,
      pageNumber: 1,
      isCompleted: tab === 'history',
      sortColumn: tab === 'history' ? 'CompletedAt' : 'CreatedAt',
      sortDirection: 'DESC'
    }));
    setSelectedItems([]);
  };

  const currentPageItems = data?.data || [];
  const allCurrentSelected = currentPageItems.length > 0 && currentPageItems.every(item => selectedItems.some(i => i.id === item.id));

  const handleSelectAllToggle = () => {
    if (allCurrentSelected) {
      // Remove all current page items from selection
      const currentIds = currentPageItems.map(item => item.id);
      setSelectedItems(prev => prev.filter(i => !currentIds.includes(i.id)));
    } else {
      // Add all current page items to selection (preventing duplicates)
      setSelectedItems(prev => {
        const toAdd = currentPageItems.filter(item => !prev.some(i => i.id === item.id));
        return [...prev, ...toAdd];
      });
    }
  };

  const toggleItemSelection = (item: Item) => {
    setSelectedItems(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  // Group current page items by their completed/created date
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, Item[]> = {};
    currentPageItems.forEach(item => {
      const dateToUse = (activeTab === 'history' && item.completedAt) ? item.completedAt : item.createdAt;
      if (!dateToUse) return;
      const dateStr = new Date(dateToUse).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(item);
    });
    return groups;
  }, [currentPageItems, activeTab]);

  const uniqueDates = React.useMemo(() => {
    const dates: string[] = [];
    currentPageItems.forEach(item => {
      const dateToUse = (activeTab === 'history' && item.completedAt) ? item.completedAt : item.createdAt;
      if (!dateToUse) return;
      const dateStr = new Date(dateToUse).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      if (!dates.includes(dateStr)) {
        dates.push(dateStr);
      }
    });
    return dates;
  }, [currentPageItems, activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">
            {activeTab === 'catalog' ? 'Inventory Items' : 'Completed Items History'}
          </h1>
          <p className="text-sm text-himgiri-secondary-dark/60">
            {activeTab === 'catalog'
              ? 'Manage active school kits, textbooks, and stationery items.'
              : 'View fully inwarded stock items and their transaction history.'}
          </p>
        </div>
        {activeTab === 'catalog' && (
          <div className="flex items-center gap-3">
            <AddButton onClick={handleAdd}>Add New Item</AddButton>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => handleTabChange('catalog')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'catalog'
              ? 'border-himgiri-primary text-himgiri-primary font-black'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
          }`}
        >
          Active Catalog
        </button>
        <button
          onClick={() => handleTabChange('history')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-himgiri-primary text-himgiri-primary font-black'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
          }`}
        >
          Items History
          {completedCount > 0 && (
            <span className={`px-2 py-0.5 text-[10px] font-black rounded-full transition-colors ${
              activeTab === 'history'
                ? 'bg-himgiri-primary/10 text-himgiri-primary'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {completedCount}
            </span>
          )}
        </button>
      </div>

      {/* High-Level Completion Statistics (for Items History tab) */}
      {activeTab === 'history' && statsData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          {/* Card 1: Completed Items Count */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Completed Items</span>
              <span className="text-xl font-black text-gray-900 mt-1 block">{statsData.totalCompletedCount}</span>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Fully resolved stock</span>
            </div>
          </div>

          {/* Card 2: Purchase cost value */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Total Purchase Cost</span>
              <span className="text-xl font-black text-gray-900 mt-1 block">
                ₹{statsData.totalPurchaseValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Stock cost valuation</span>
            </div>
          </div>

          {/* Card 3: Retail Selling value */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Total Retail Value</span>
              <span className="text-xl font-black text-gray-900 mt-1 block">
                ₹{statsData.totalRetailValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Selling price valuation</span>
            </div>
          </div>

          {/* Card 4: Most completed category */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Top Category</span>
              <span className="text-xl font-black text-gray-900 mt-1 block truncate max-w-[150px]">{statsData.mostCompletedCategory}</span>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">Highest completion count</span>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Selection Notification Bar */}
      {selectedItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 animate-in slide-in-from-top-4 duration-300 shadow-sm gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-bold text-blue-800">
              {selectedItems.length} item(s) selected
            </span>
            <button 
              onClick={() => setSelectedItems([])} 
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold ml-2"
            >
              Clear Selection
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <Button 
              onClick={() => setIsBulkInwardOpen(true)} 
              className="px-3.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-100"
            >
              Update Stock
            </Button>

            <Button 
              variant="outline"
              onClick={() => handleBulkToggleActive(true)} 
              isLoading={bulkToggleMutation.isPending}
              className="px-3.5 py-1.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-100/50 rounded-xl font-bold"
            >
              Activate
            </Button>

            <Button 
              variant="outline"
              onClick={() => handleBulkToggleActive(false)} 
              isLoading={bulkToggleMutation.isPending}
              className="px-3.5 py-1.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-100/50 rounded-xl font-bold"
            >
              Deactivate
            </Button>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 focus:text-himgiri-primary" />
            <input
              type="text"
              placeholder="Search items by name, category, or grade..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 bg-gray-50/50 rounded-2xl px-4 py-3 text-xs font-bold text-gray-600 border border-gray-100">
              <input
                type="checkbox"
                checked={allCurrentSelected}
                onChange={handleSelectAllToggle}
                className="w-4 h-4 text-himgiri-primary border-gray-300 rounded focus:ring-himgiri-primary cursor-pointer"
              />
              <span className="select-none text-[11px]">Select All on Page</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Clear all filters
                setParams({
                  pageNumber: 1,
                  pageSize: 10,
                  searchTerm: '',
                  sortColumn: 'CreatedAt',
                  sortDirection: 'DESC',
                  isCompleted: false
                });
                setSearchVal('');
              }}
              className="rounded-2xl border-gray-200 text-xs font-bold px-4 py-3 h-auto"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-50">
          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Category</label>
            <select
              value={params.categoryId || ''}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:bg-white focus:border-himgiri-primary transition-all"
            >
              <option value="">All Categories</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Grade Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Grade</label>
            <select
              value={params.gradeId || ''}
              onChange={(e) => handleFilterChange('gradeId', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:bg-white focus:border-himgiri-primary transition-all"
            >
              <option value="">All Grades</option>
              {grades?.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</label>
            <select
              value={params.isActive === undefined ? '' : params.isActive ? 'true' : 'false'}
              onChange={(e) => {
                const val = e.target.value;
                handleFilterChange('isActive', val === '' ? undefined : val === 'true');
              }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:bg-white focus:border-himgiri-primary transition-all"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={params.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:bg-white focus:border-himgiri-primary transition-all"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">End Date</label>
            <input
              type="date"
              disabled={!params.startDate}
              value={params.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:bg-white focus:border-himgiri-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Main Grouped List Content */}
      {isLoading ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-12 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-himgiri-primary animate-spin" />
            <span className="text-sm font-bold text-gray-500">Loading catalog items...</span>
          </div>
        </div>
      ) : currentPageItems.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-20 text-center">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 border border-gray-100">
              <Search className="h-8 w-8 text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold">No catalog items found.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {uniqueDates.map(dateStr => {
            const items = groupedItems[dateStr] || [];
            return (
              <div key={dateStr} className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Date Header Container (Unique layout block) */}
                <div className="bg-gray-50/50 px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700">
                    <CalendarDays className="h-4 w-4 text-himgiri-primary" />
                    <span className="font-bold text-sm tracking-tight">
                      {activeTab === 'history' ? `Completed On: ${dateStr}` : dateStr}
                    </span>
                  </div>
                  <span className="text-xs bg-white border border-gray-200 text-gray-500 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Items Vertical Stack List */}
                <div className="divide-y divide-gray-50">
                  {items.map(item => (
                    <React.Fragment key={item.id}>
                      <div 
                        className={clsx(
                          "group flex flex-col md:flex-row md:items-center justify-between p-6 gap-6 transition-all duration-200",
                          activeTab === 'history' 
                            ? "bg-slate-50/60 hover:bg-slate-100/40 text-gray-500 border-l-4 border-slate-300"
                            : "hover:bg-himgiri-primary/[0.01]"
                        )}
                      >
                      
                      {/* Left: Checkbox + Details */}
                      <div className="flex items-center gap-4 flex-1">
                        {activeTab === 'catalog' && (
                          <input
                            type="checkbox"
                            checked={selectedItems.some(i => i.id === item.id)}
                            onChange={() => toggleItemSelection(item)}
                            className="w-4 h-4 text-himgiri-primary border-gray-300 rounded focus:ring-himgiri-primary flex-shrink-0 cursor-pointer"
                          />
                        )}
                        <div className="h-12 w-12 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className={clsx("h-full w-full object-cover", activeTab === 'history' && "grayscale opacity-80")} 
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">{item.name.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <h4 className={clsx(
                            "font-bold leading-tight transition-colors",
                            activeTab === 'history' ? "text-gray-700" : "text-gray-900 group-hover:text-himgiri-primary"
                          )}>
                            {item.name}
                          </h4>
                          <div className="text-[10px] text-gray-500 mt-1.5 flex gap-2 flex-wrap">
                            <span className="bg-gray-100 px-2 py-0.5 rounded uppercase font-bold tracking-wider">{item.categoryName}</span>
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase font-bold tracking-wider">{item.gradeNames}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Pricing, Inventory & Status Grid */}
                      <div className={clsx(
                        "grid gap-6 text-left items-center",
                        activeTab === 'history' ? "grid-cols-2 md:w-[32%]" : "grid-cols-2 sm:grid-cols-3 md:w-[45%]"
                      )}>
                        {/* Pricing Info */}
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">Pricing</span>
                          <div className="text-xs font-semibold text-gray-600 space-y-0.5">
                            <div>Selling: <span className="font-bold text-gray-900">₹{item.price.toFixed(2)}</span></div>
                            <div>MRP: <span className="font-bold text-gray-700">₹{item.mrp.toFixed(2)}</span></div>
                            {item.purchasePrice !== undefined && item.purchasePrice !== null && (
                              <div className="text-[10px] text-gray-400">Cost: ₹{item.purchasePrice.toFixed(2)}</div>
                            )}
                          </div>
                        </div>

                        {/* Inventory Info */}
                        {activeTab === 'catalog' && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">Inventory</span>
                            <div className="text-xs font-semibold text-gray-600 space-y-0.5">
                              <div>Target: <span className="font-bold text-gray-900">{item.targetQty}</span></div>
                              <div>In-Stock: <span className={`font-bold ${item.stockQty <= 5 ? 'text-red-600' : 'text-green-600'}`}>{item.stockQty}</span></div>
                              {item.targetQty - item.stockQty > 0 ? (
                                <div className="flex items-center gap-1">
                                  <span>Pending:</span>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    {item.targetQty - item.stockQty}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-gray-400 font-medium">Inwarded</div>
                              )}
                            </div>
                            <div className="pt-1">
                              <Badge variant={item.storageStatus === 'InStock' ? 'success' : 'warning'}>
                                {item.storageStatus === 'InStock' ? 'Ready' : 'Pre-Order'}
                              </Badge>
                            </div>
                          </div>
                        )}

                        {/* Status badge */}
                        <div className={clsx(activeTab === 'catalog' && "col-span-2 sm:col-span-1")}>
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1.5">Status</span>
                          {activeTab === 'history' ? (
                            <Badge variant="success" className="bg-green-50 text-green-700 border-green-200 font-black">
                              Fully Inwarded
                            </Badge>
                          ) : (
                            <Badge variant={item.isActive ? 'success' : 'danger'}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex items-center justify-end gap-1.5 border-t border-gray-50 pt-4 md:border-t-0 md:pt-0">
                        {activeTab === 'history' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={clsx(
                              "rounded-xl text-xs font-bold transition-all mr-1.5",
                              expandedItemId === item.id ? "bg-slate-200/60 text-slate-800" : "text-gray-600 hover:bg-gray-100"
                            )}
                            onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                            icon={History}
                          >
                            Logs
                          </Button>
                        )}
                        {(activeTab === 'catalog' || user?.role === 'SuperAdmin' || user?.role === 'InventoryManager') && (
                          <EditButton onClick={() => handleEdit(item)} />
                        )}
                        {activeTab === 'catalog' && (
                          <DeleteButton onClick={() => handleDeleteClick(item)} />
                        )}
                      </div>
                    </div>

                    {/* History Panel */}
                      {activeTab === 'history' && expandedItemId === item.id && (
                        <div className="col-span-full bg-slate-50/50 p-6 border-t border-b border-slate-100/60 animate-in slide-in-from-top-2 duration-250">
                          <HistoryPanel itemId={item.id} />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta && data.meta.totalRecords > 0 && (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-xs font-bold text-himgiri-secondary-dark/50 uppercase tracking-widest">
            Showing <span className="text-gray-900 font-black">{(params.pageNumber - 1) * params.pageSize + 1}</span> to{' '}
            <span className="text-gray-900 font-black">
              {Math.min(params.pageNumber * params.pageSize, data.meta.totalRecords)}
            </span> of{' '}
            <span className="text-gray-900 font-black">{data.meta.totalRecords}</span> results
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl px-4 border-gray-200 font-bold"
              disabled={params.pageNumber === 1}
              onClick={() => setParams(p => ({ ...p, pageNumber: p.pageNumber - 1 }))}
              icon={ChevronLeft}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl px-4 border-gray-200 font-bold"
              disabled={params.pageNumber * params.pageSize >= data.meta.totalRecords}
              onClick={() => setParams(p => ({ ...p, pageNumber: p.pageNumber + 1 }))}
              icon={ChevronRight}
              iconPosition="right"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
      />

      {/* Bulk Inward Modal */}
      <BulkInwardModal
        isOpen={isBulkInwardOpen}
        onClose={() => setIsBulkInwardOpen(false)}
        selectedItems={selectedItems}
        onSuccess={() => {
          setIsBulkInwardOpen(false);
          setSelectedItems([]);
        }}
      />

      {/* Delete Confirmation */}
      <ActionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        variant="delete"
        title="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />

    </div>
  );
}

// ── Stock History Panel Accordion Component ──
function HistoryPanel({ itemId }: { itemId: string }) {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['stock-logs', itemId],
    queryFn: () => inventoryService.getStockLogs(itemId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-3">
        <Loader2 className="h-5 w-5 text-himgiri-primary animate-spin" />
        <span className="text-sm font-bold text-gray-500">Loading audit history...</span>
      </div>
    );
  }

  const logs = logsData?.data || [];

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-black uppercase tracking-wider text-himgiri-secondary-dark/60 flex items-center gap-2">
        <History className="h-4 w-4 text-himgiri-primary" />
        Stock Transaction Audit Trail ({logs.length} adjustments)
      </h4>

      {logs.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-400 font-medium bg-white rounded-2xl border border-gray-100">
          No stock adjustment records available for this item.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-center">Previous Qty</th>
                <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-center">New Qty</th>
                <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-center">Change</th>
                <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest">Adjusted By</th>
                <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest">Reason / Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const diff = log.newQty - log.oldQty;
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 font-mono font-medium">{log.oldQty}</td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono font-bold">{log.newQty}</td>
                    <td className="px-4 py-3 text-center">
                      {diff === 0 ? (
                        <span className="text-gray-400 font-mono font-bold">No change</span>
                      ) : diff > 0 ? (
                        <span className="text-green-600 font-mono font-black flex items-center justify-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          +{diff}
                        </span>
                      ) : (
                        <span className="text-red-600 font-mono font-black flex items-center justify-center gap-1">
                          <TrendingDown className="h-3.5 w-3.5" />
                          {diff}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-semibold">{log.changedBy}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        log.reason === 'Manual Update' ? 'bg-slate-100 text-slate-700' :
                        log.reason.includes('Placed') ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        log.reason.includes('Cancelled') ? 'bg-red-50 text-red-700 border border-red-100' :
                        log.reason.includes('Received') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.reason}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
