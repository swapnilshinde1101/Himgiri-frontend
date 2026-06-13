import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../services/inventoryService';
import { 
  History, 
  Search, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  CalendarDays,
  FileSpreadsheet
} from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '../../components/shared/Badge';

export default function StockHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['global-stock-logs'],
    queryFn: () => inventoryService.getAllStockLogs(),
  });

  const logs = logsData?.data || [];

  // Filter logs by search term (item name, reason, or user)
  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.itemName.toLowerCase().includes(term) ||
      log.changedBy.toLowerCase().includes(term) ||
      log.reason.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-himgiri-primary" />
            Stock History & Audit Report
          </h2>
          <p className="text-xs text-himgiri-secondary-dark/60 mt-0.5">
            View historical log records for all inventory stock adjustments and inward updates.
          </p>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs by item name, user, or reason..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      {isLoading ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-12 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-himgiri-primary animate-spin" />
            <span className="text-sm font-bold text-gray-500">Loading stock logs history...</span>
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-20 text-center">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 border border-gray-100">
              <FileSpreadsheet className="h-8 w-8 text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold">No stock logs found.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Date & Time</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest">Item details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">Prev Stock</th>
                  <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-center">New Stock</th>
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
  );
}
