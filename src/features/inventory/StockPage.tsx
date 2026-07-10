import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import { masterDataService } from '../../services/masterDataService';
import { 
  Database, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Loader2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import type { Item, BaseRequest } from '../../types';
import { useGradesDropdown, useCategoriesDropdown } from '../../hooks/useMasterData';
import { useDebounce } from '../../hooks/useDebounce';
import EmptyState from '../../components/shared/EmptyState';

// Strict dropdown reason mapping to system constants
const REASONS = [
  'Manual Update',
  'Order Placed',
  'Order Cancelled',
  'Purchase Received',
  'Purchase Cancelled'
];

export default function StockPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<BaseRequest>({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
    sortColumn: 'StockQty',
    sortDirection: 'ASC',
    onlyInitializedStock: true,
    isActive: true
  });

  const [searchVal, setSearchVal] = useState('');
  const debouncedSearchVal = useDebounce(searchVal, 400);

  React.useEffect(() => {
    setParams(p => ({ ...p, searchTerm: debouncedSearchVal, pageNumber: 1 }));
  }, [debouncedSearchVal]);
  
  const navigate = useNavigate();

  // Update Stock Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState<number>(0);
  const [selectedReason, setSelectedReason] = useState<string>('Manual Update');

  // ── Master Data Queries ──
  const { data: grades } = useGradesDropdown();
  const { data: categories } = useCategoriesDropdown();

  // ── Queries ──
  const { data, isLoading } = useQuery({
    queryKey: ['items', params],
    queryFn: () => inventoryService.getItems(params),
  });

  // ── Mutations ──
  const adjustStockMutation = useMutation({
    mutationFn: ({ id, adjustmentQty, reason, lastSeenStockQty }: { id: string; adjustmentQty: number; reason: string; lastSeenStockQty?: number }) => 
      inventoryService.updateStock(id, adjustmentQty, reason, lastSeenStockQty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      if (selectedItem) {
        queryClient.invalidateQueries({ queryKey: ['stock-logs', selectedItem.id] });
      }
      // Also invalidate low stock count query for sidebar/dashboard counters
      queryClient.invalidateQueries({ queryKey: ['lowStockCount'] });
      toast.success('Stock adjusted successfully');
      setIsModalOpen(false);
      setSelectedItem(null);
    }
  });

  // ── Handlers ──
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleFilterChange = (key: keyof BaseRequest, value: any) => {
    setParams(prev => ({ ...prev, [key]: value === '' ? undefined : value, pageNumber: 1 }));
  };

  const handleAdjustClick = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(item);
    setStockAdjustment(0);
    setSelectedReason('Manual Update');
    setIsModalOpen(true);
  };

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (stockAdjustment === 0) {
      toast.error('Adjustment cannot be zero');
      return;
    }
    const estimatedNewStock = selectedItem.stockQty + stockAdjustment;
    if (estimatedNewStock < 0) {
      toast.error('Stock level cannot fall below 0');
      return;
    }
    if (estimatedNewStock > selectedItem.targetQty) {
      toast.error(`Stock level cannot exceed Target Quantity (${selectedItem.targetQty})`);
      return;
    }
    adjustStockMutation.mutate({
      id: selectedItem.id,
      adjustmentQty: stockAdjustment,
      reason: selectedReason,
      lastSeenStockQty: selectedItem.stockQty
    });
  };



  const handlePageChange = (newPage: number) => {
    setParams(p => ({ ...p, pageNumber: newPage }));
  };

  // Helper to get status indicators
  const getStockStatus = (qty: number, threshold = 10) => {
    if (qty === 0) return { label: 'Out of Stock', variant: 'danger' as const, bg: 'bg-red-50/40 hover:bg-red-50/80 border-l-4 border-red-500' };
    if (qty <= threshold) return { label: 'Low Stock', variant: 'warning' as const, bg: 'bg-amber-50/40 hover:bg-amber-50/80 border-l-4 border-amber-500' };
    return { label: 'In Stock', variant: 'success' as const, bg: 'border-l-4 border-transparent hover:bg-gray-50/40' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search and Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search stock by item name..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              type="button" 
              onClick={() => setParams(p => ({ ...p, sortColumn: 'StockQty', sortDirection: p.sortDirection === 'ASC' ? 'DESC' : 'ASC' }))}
              className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Sort Stock Qty ({params.sortDirection})
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setParams({
                  pageNumber: 1,
                  pageSize: 10,
                  searchTerm: '',
                  sortColumn: 'StockQty',
                  sortDirection: 'ASC',
                  onlyInitializedStock: true,
                  isActive: true
                });
                setSearchVal('');
              }}
              className="rounded-2xl border-gray-200 text-xs font-bold px-4 py-3 h-auto"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-50">
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

          {/* Stock Status Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Stock Status</label>
            <select
              value={params.stockStatus || ''}
              onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:bg-white focus:border-himgiri-primary transition-all"
            >
              <option value="">All Statuses</option>
              <option value="InStock">In Stock (&gt;= 10)</option>
              <option value="LowStock">Low Stock (&lt; 10)</option>
              <option value="OutOfStock">Out of Stock (= 0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Item Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Category / Grade</th>
                <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Current Stock</th>
                <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Alert State</th>
                <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Audit Trail</th>
                <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5"></td>
                    <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded-full w-2/3"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded-full w-12 mx-auto"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded-full w-16 mx-auto"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded-full w-20 mx-auto"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded-full w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <EmptyState
                      title="No stock items found"
                      description="No products match your current filters or search terms."
                      icon={Database}
                      className="border-0 shadow-none bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                data?.data.map((item) => {
                  const threshold = item.resolvedThreshold ?? 10;
                  const status = getStockStatus(item.stockQty, threshold);
                  return (
                    <tr 
                      key={item.id}
                      className={clsx(
                        "transition-all duration-200 border-l-4 border-transparent hover:bg-gray-50/40", 
                        status.bg
                      )}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-150 flex items-center justify-center bg-white">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl.split(',')[0]} 
                                alt={item.name} 
                                className="h-full w-full object-cover" 
                              />
                            ) : (
                              <BookOpen className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="font-semibold text-gray-900 leading-tight">{item.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="bg-gray-100 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{item.categoryName}</span>
                          <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">{item.gradeNames}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={clsx(
                          "text-lg font-black font-mono",
                          item.stockQty === 0 && "text-himgiri-danger",
                          item.stockQty > 0 && item.stockQty <= threshold && "text-himgiri-warning",
                          item.stockQty > threshold && "text-himgiri-success"
                        )}>
                          {item.stockQty}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <Badge variant={status.variant}>
                          <div className="flex items-center gap-1">
                            {item.stockQty === 0 && <XCircle className="h-3 w-3" />}
                            {item.stockQty > 0 && item.stockQty <= threshold && <AlertTriangle className="h-3 w-3" />}
                            {item.stockQty > threshold && <CheckCircle2 className="h-3 w-3" />}
                            {status.label}
                          </div>
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/reports/inventory?tab=stock-audit&search=${encodeURIComponent(item.name)}`)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-himgiri-primary hover:underline hover:text-blue-700"
                        >
                          <History className="h-3.5 w-3.5" />
                          View Logs
                        </button>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl border-gray-200 text-xs font-bold hover:bg-himgiri-primary hover:text-white hover:border-himgiri-primary transition-all"
                            onClick={(e) => handleAdjustClick(item, e)}
                          >
                            Adjust Stock
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {data && data.meta && data.meta.totalRecords > 0 && (
          <div className="px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-gray-50/30 gap-4">
            <div className="text-xs font-bold text-himgiri-secondary-dark/50 uppercase tracking-widest">
              Showing <span className="text-gray-900 font-black">{(params.pageNumber - 1) * params.pageSize + 1}</span> to{' '}
              <span className="text-gray-900 font-black">
                {Math.min(params.pageNumber * params.pageSize, data.meta.totalRecords)}
              </span> of{' '}
              <span className="text-gray-900 font-black">{data.meta.totalRecords}</span> records
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl px-4 border-gray-200"
                disabled={params.pageNumber === 1}
                onClick={() => handlePageChange(params.pageNumber - 1)}
                icon={ChevronLeft}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl px-4 border-gray-200"
                disabled={params.pageNumber * params.pageSize >= data.meta.totalRecords}
                onClick={() => handlePageChange(params.pageNumber + 1)}
                icon={ChevronRight}
                iconPosition="right"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-himgiri-secondary-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 p-8 transform scale-100 transition-all duration-300 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Database className="h-5 w-5 text-himgiri-primary" />
                  Adjust Stock Level
                </h3>
                <p className="text-sm text-gray-500 mt-1">Manual adjustment for "{selectedItem.name}"</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ChevronUp className="h-5 w-5 transform rotate-90" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-5">
              <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Current Inventory</span>
                  <span className="text-2xl font-black text-gray-700 font-mono">{selectedItem.stockQty}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Category & Grade</span>
                  <span className="text-xs bg-white border border-gray-200 text-gray-600 font-bold px-2.5 py-1 rounded-lg inline-block mt-1">
                    {selectedItem.categoryName} • {selectedItem.gradeNames}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-himgiri-secondary-dark/70 mb-2">
                    Adjustment (e.g. +5 or -3)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Enter integer adjustment"
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:border-himgiri-primary transition-all"
                    value={stockAdjustment === 0 ? '' : stockAdjustment}
                    onChange={(e) => setStockAdjustment(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="flex flex-col justify-center bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                    Estimated New Stock
                  </span>
                  <p className="text-2xl font-black text-blue-700 mt-1">
                    {Math.max(0, (selectedItem?.stockQty ?? 0) + stockAdjustment)}{' '}
                    <span className="text-sm font-medium text-blue-600">
                      {selectedItem?.unit || 'Units'}
                    </span>
                  </p>
                  <span className="text-[10px] text-gray-500 mt-1">
                    Stock cannot fall below 0
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-himgiri-secondary-dark/70 mb-2">
                  Adjustment Reason
                </label>
                <select
                  className="w-full px-5 py-3 border border-gray-200 rounded-2xl text-sm font-semibold bg-white focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:border-himgiri-primary transition-all"
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                >
                  {REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  type="button" 
                  className="rounded-xl px-5" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl px-6 bg-himgiri-primary text-white hover:bg-himgiri-primary-dark transition-all"
                  isLoading={adjustStockMutation.isPending}
                >
                  Update Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


