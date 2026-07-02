import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import { 
  History, 
  Search, 
  CalendarDays, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  AlertTriangle, 
  IndianRupee, 
  Layers, 
  ClipboardList,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '../../components/shared/Badge';

export default function InventoryReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'stock-audit';
  const initialSearch = searchParams.get('search') || '';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [reasonFilter, setReasonFilter] = useState('');

  // Sync search term state if search query param changes
  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal !== null) {
      setSearchTerm(searchVal);
    }
  }, [searchParams]);

  // Fetch all stock logs
  const { data: logsRes, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['global-stock-logs-report'],
    queryFn: () => inventoryService.getAllStockLogs(),
    enabled: activeTab === 'stock-audit',
  });

  // Fetch all items for Valuation and Reorder reports
  const { data: itemsRes, isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['all-items-report'],
    queryFn: () => inventoryService.getItems({ pageNumber: 1, pageSize: 1000, onlyInitializedStock: true, isActive: true }),
    enabled: activeTab === 'valuation' || activeTab === 'reorder',
  });

  const logs = logsRes?.data || [];
  const items = itemsRes?.data || [];

  // ── Stock Audit Trail Filtered Logs ──
  const filteredLogs = logs.filter(log => {
    const matchSearch = searchTerm === '' || 
      log.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.changedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchReason = reasonFilter === '' || log.reason === reasonFilter;

    return matchSearch && matchReason;
  });

  // ── Inventory Valuation Computations ──
  const totalStockQty = items.reduce((sum, item) => sum + item.stockQty, 0);
  const totalPurchaseValue = items.reduce((sum, item) => sum + ((item.purchasePrice || 0) * item.stockQty), 0);
  const totalRetailValue = items.reduce((sum, item) => sum + (item.mrp * item.stockQty), 0);
  const totalMarginValue = totalRetailValue - totalPurchaseValue;

  // Valuation category breakdown
  const categoryBreakdown = items.reduce((acc: Record<string, { count: number; qty: number; value: number }>, item) => {
    const cat = item.categoryName || 'Uncategorized';
    if (!acc[cat]) {
      acc[cat] = { count: 0, qty: 0, value: 0 };
    }
    acc[cat].count += 1;
    acc[cat].qty += item.stockQty;
    acc[cat].value += item.mrp * item.stockQty;
    return acc;
  }, {});

  // ── Reorder Alerts Filtering ──
  const reorderItems = items.filter(item => item.stockQty < 10); // Low Stock + Out of Stock

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    if (activeTab === 'stock-audit') {
      const headers = ['Date', 'Item Name', 'Old Qty', 'New Qty', 'Change', 'Adjusted By', 'Reason'];
      const rows = filteredLogs.map(log => [
        new Date(log.createdAt).toLocaleString(),
        `"${log.itemName.replace(/"/g, '""')}"`,
        log.oldQty,
        log.newQty,
        log.newQty - log.oldQty,
        log.changedBy,
        log.reason
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Stock_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (activeTab === 'valuation') {
      const headers = ['Item Name', 'Category', 'Stock Qty', 'Purchase Price', 'Retail Price (MRP)', 'Total Valuation (MRP)'];
      const rows = items.map(item => [
        `"${item.name.replace(/"/g, '""')}"`,
        item.categoryName,
        item.stockQty,
        item.purchasePrice || 0,
        item.mrp,
        item.mrp * item.stockQty
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Inventory_Valuation_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    if (tabId !== 'stock-audit') {
      setSearchTerm('');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchParams({ tab: activeTab });
  };

  return (
    <div className="space-y-6">
      {/* Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-himgiri-primary" />
            Inventory Stock & valuation Reports
          </h2>
          <p className="text-xs text-himgiri-secondary-dark/60 mt-0.5">
            Audit item modifications, total stock asset valuation, and low stock warnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => activeTab === 'stock-audit' ? refetchLogs() : refetchItems()}
            className="p-2 ml-auto rounded-xl bg-white border border-gray-155 text-gray-500 hover:text-himgiri-primary hover:bg-gray-50 transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          {(activeTab === 'stock-audit' || activeTab === 'valuation') && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-himgiri-primary text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-150/70 gap-2">
        <button
          onClick={() => handleTabChange('stock-audit')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs transition-all -mb-px",
            activeTab === 'stock-audit'
              ? "border-himgiri-primary text-himgiri-primary"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-205"
          )}
        >
          <History className="h-4 w-4" />
          Stock Audit Trail
        </button>

        <button
          onClick={() => handleTabChange('valuation')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs transition-all -mb-px",
            activeTab === 'valuation'
              ? "border-himgiri-primary text-himgiri-primary"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-205"
          )}
        >
          <IndianRupee className="h-4 w-4" />
          Inventory Valuation
        </button>

        <button
          onClick={() => handleTabChange('reorder')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs transition-all -mb-px relative",
            activeTab === 'reorder'
              ? "border-himgiri-primary text-himgiri-primary"
              : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-205"
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          Reorder Alert Checklist
          {items.some(item => item.stockQty < 10) && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Tab Content Panel */}
      <div className="min-h-[400px]">
        
        {/* TAB 1: STOCK AUDIT TRAIL */}
        {activeTab === 'stock-audit' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search Toolbar */}
            <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search audit trail by item name, user, or reason..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="w-full md:w-64 space-y-1">
                <select
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
                >
                  <option value="">All Adjustment Reasons</option>
                  <option value="Manual Update">Manual Update</option>
                  <option value="Order Placed">Order Placed</option>
                  <option value="Order Cancelled">Order Cancelled</option>
                  <option value="Purchase Received">Purchase Received</option>
                  <option value="Purchase Cancelled">Purchase Cancelled</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {logsLoading ? (
              <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-12 flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-himgiri-primary animate-spin" />
                  <span className="text-sm font-bold text-gray-500">Loading audit history...</span>
                </div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-20 text-center">
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 border border-gray-100">
                    <ClipboardList className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-bold">No matching stock transaction logs found.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Date & Time</th>
                        <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Item Name</th>
                        <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Previous Qty</th>
                        <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">New Qty</th>
                        <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Delta Change</th>
                        <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Adjusted By</th>
                        <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredLogs.map((log) => {
                        const diff = log.newQty - log.oldQty;
                        return (
                          <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                              <div className="flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                                {new Date(log.createdAt).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-900 leading-tight block">
                                {log.itemName}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-mono font-bold text-gray-500 text-xs">
                              {log.oldQty}
                            </td>
                            <td className="px-6 py-4 text-center font-mono font-bold text-gray-700 text-xs">
                              {log.newQty}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {diff === 0 ? (
                                <span className="text-gray-400 font-mono font-bold text-xs">No change</span>
                              ) : diff > 0 ? (
                                <span className="text-green-600 font-mono font-black text-xs flex items-center justify-center gap-1">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  +{diff}
                                </span>
                              ) : (
                                <span className="text-red-600 font-mono font-black text-xs flex items-center justify-center gap-1">
                                  <TrendingDown className="h-3.5 w-3.5" />
                                  {diff}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-600 font-semibold text-xs">
                              {log.changedBy}
                            </td>
                            <td className="px-6 py-4">
                              <span className={clsx(
                                "text-[10px] px-2.5 py-1 rounded-full font-bold",
                                log.reason === 'Manual Update' && "bg-slate-100 text-slate-700",
                                log.reason.includes('Placed') && "bg-blue-50 text-blue-700 border border-blue-100",
                                log.reason.includes('Cancelled') && "bg-red-50 text-red-700 border border-red-100",
                                log.reason.includes('Received') && "bg-green-50 text-green-700 border border-green-100"
                              )}>
                                {log.reason}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVENTORY VALUATION */}
        {activeTab === 'valuation' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {itemsLoading ? (
              <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-12 flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-himgiri-primary animate-spin" />
                  <span className="text-sm font-bold text-gray-500">Calculating stock values...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Value Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Items */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Stock Items</span>
                      <p className="text-3xl font-black text-gray-900 font-mono">{totalStockQty}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Layers className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Purchase Valuation */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Asset Cost Value</span>
                      <p className="text-3xl font-black text-gray-900 font-mono">₹{totalPurchaseValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center">
                      <IndianRupee className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Retail Valuation */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Asset Retail Value (MRP)</span>
                      <p className="text-3xl font-black text-gray-900 font-mono">₹{totalRetailValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Potential Gross Margin */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Potential Gross Margin</span>
                      <p className="text-3xl font-black text-emerald-600 font-mono">₹{totalMarginValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50/50 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* Category Analysis List */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-soft space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Category-wise Valuation Breakdown</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Asset value weights distributed across various item types.</p>
                  </div>

                  <div className="space-y-5">
                    {Object.entries(categoryBreakdown).map(([categoryName, stats]) => {
                      const percentage = totalRetailValue > 0 ? (stats.value / totalRetailValue) * 100 : 0;
                      return (
                        <div key={categoryName} className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800">{categoryName}</span>
                              <span className="text-xs text-gray-400">({stats.count} items, {stats.qty} in stock)</span>
                            </div>
                            <span className="font-mono font-bold text-gray-900">
                              ₹{stats.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span className="text-xs text-gray-400 font-medium">({percentage.toFixed(1)}%)</span>
                            </span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                            <div 
                              className={clsx(
                                "h-full rounded-full transition-all duration-500",
                                categoryName === 'Textbook' && 'bg-blue-500',
                                categoryName === 'Stationery' && 'bg-amber-500',
                                categoryName === 'Bag' && 'bg-purple-500',
                                categoryName === 'Journal' && 'bg-emerald-500',
                                categoryName !== 'Textbook' && categoryName !== 'Stationery' && categoryName !== 'Bag' && categoryName !== 'Journal' && 'bg-slate-400'
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: REORDER ALERT CHECKLIST */}
        {activeTab === 'reorder' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {itemsLoading ? (
              <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-12 flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-himgiri-primary animate-spin" />
                  <span className="text-sm font-bold text-gray-500">Checking stock levels...</span>
                </div>
              </div>
            ) : reorderItems.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-20 text-center">
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mb-4 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">All Stock Levels Normal</h3>
                  <p className="text-gray-400 text-xs mt-1">No items are currently running critically low on inventory.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-3xl p-5 flex items-start gap-3.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-sm font-bold block">Replenishment Action Required</span>
                    <span className="text-xs text-amber-700 block">
                      The following {reorderItems.length} products have dropped below the safety stock threshold (10 units). Ensure purchases are made to reach Target Quantity settings.
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Item Name</th>
                          <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Category</th>
                          <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Current Stock</th>
                          <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Target Stock</th>
                          <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Deficit (To Order)</th>
                          <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {reorderItems.map((item) => {
                          const deficit = Math.max(0, item.targetQty - item.stockQty);
                          return (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-bold text-gray-900 block leading-tight">{item.name}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                  {item.categoryName}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center font-mono font-bold text-red-600 text-sm">
                                {item.stockQty} {item.unit}
                              </td>
                              <td className="px-6 py-4 text-center font-mono font-semibold text-gray-600 text-sm">
                                {item.targetQty} {item.unit}
                              </td>
                              <td className="px-6 py-4 text-center font-mono font-black text-gray-900 text-sm">
                                +{deficit} {item.unit}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant={item.stockQty === 0 ? 'danger' : 'warning'}>
                                  <div className="flex items-center gap-1">
                                    {item.stockQty === 0 ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                    {item.stockQty === 0 ? 'Out of Stock' : 'Low Stock'}
                                  </div>
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
