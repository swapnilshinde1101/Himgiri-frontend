import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  UserMinus, 
  Activity, 
  CalendarDays, 
  KeyRound, 
  Search, 
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '../../components/shared/Badge';

// Mock staff list for administration audit
const MOCK_STAFF = [
  { id: '1', name: 'Super Administrator', email: 'admin@himgiri.com', role: 'SuperAdmin', lastLogin: '2026-06-16T16:40:00Z', status: 'Active' },
  { id: '2', name: 'Swapnil (Inventory Manager)', email: 'swapnil@himgiri.com', role: 'InventoryManager', lastLogin: '2026-06-16T15:20:00Z', status: 'Active' },
  { id: '3', name: 'Order Processing Manager', email: 'orders@himgiri.com', role: 'OrderManager', lastLogin: '2026-06-16T11:10:00Z', status: 'Active' },
  { id: '4', name: 'Support Associate', email: 'support@himgiri.com', role: 'OrderManager', lastLogin: '2026-06-15T09:00:00Z', status: 'Inactive' },
];

// Mock audit logs of administrative actions
const MOCK_ADMIN_ACTIONS = [
  { id: '101', staffName: 'Super Administrator', action: 'Confirmed Jodo payment webhook', detail: 'Invoice #HG-2026-0001 confirmed', timestamp: '2026-06-16T16:44:00Z' },
  { id: '102', staffName: 'Swapnil (Inventory Manager)', action: 'Adjusted Stock Level', detail: 'Item "Grade 1 Math Notebook" quantity +150', timestamp: '2026-06-16T15:45:00Z' },
  { id: '103', staffName: 'Swapnil (Inventory Manager)', action: 'Created Catalog Item', detail: 'Added "Grade 3 Drawing Kit" with base cost ₹120', timestamp: '2026-06-16T15:30:00Z' },
  { id: '104', staffName: 'Order Processing Manager', action: 'Added Order Note', detail: 'Added shipping tracker link to order ID #5142', timestamp: '2026-06-16T11:22:00Z' },
  { id: '105', staffName: 'Super Administrator', action: 'Processed Refund Request', detail: 'Refunded ₹452.00 for order #HG-2026-0002', timestamp: '2026-06-15T18:10:00Z' },
];

export default function StaffReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = MOCK_ADMIN_ACTIONS.filter(log => 
    log.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.detail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-himgiri-primary" />
            Staff Directory & Activity Logs
          </h2>
          <p className="text-xs text-himgiri-secondary-dark/60 mt-0.5">
            Audit administrative login records, role assignments, and catalog/stock update action histories.
          </p>
        </div>
      </div>

      {/* Grid: Staff Members & Roles List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Staff Directory & Security Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-himgiri-primary" />
              Administrative Staff Directory ({MOCK_STAFF.length})
            </h3>
            
            <div className="divide-y divide-gray-50">
              {MOCK_STAFF.map(member => (
                <div key={member.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm",
                      member.status === 'Active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                    )}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">{member.name}</h4>
                      <p className="text-xs text-gray-400 font-medium">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right">
                    <div className="flex flex-col sm:items-end">
                      <span className={clsx(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider block w-fit",
                        member.role === 'SuperAdmin' && 'bg-purple-50 text-purple-700 border border-purple-100',
                        member.role === 'InventoryManager' && 'bg-blue-50 text-blue-700 border border-blue-100',
                        member.role === 'OrderManager' && 'bg-amber-50 text-amber-700 border border-amber-100'
                      )}>
                        {member.role}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold mt-1">
                        Last online: {new Date(member.lastLogin).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <Badge variant={member.status === 'Active' ? 'success' : 'gray'}>
                      {member.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Permissions Matrix */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-himgiri-primary" />
              Role Permissions Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 font-black text-gray-500 uppercase tracking-widest">Administrative Role</th>
                    <th className="px-4 py-3 font-black text-gray-500 uppercase tracking-widest text-center">Catalog Edit</th>
                    <th className="px-4 py-3 font-black text-gray-500 uppercase tracking-widest text-center">Stock Inward</th>
                    <th className="px-4 py-3 font-black text-gray-500 uppercase tracking-widest text-center">Orders & Refunds</th>
                    <th className="px-4 py-3 font-black text-gray-500 uppercase tracking-widest text-center">Audit Trails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-900">SuperAdmin</td>
                    <td className="px-4 py-3 text-center text-green-600 font-extrabold">✓ Allowed</td>
                    <td className="px-4 py-3 text-center text-green-600 font-extrabold">✓ Allowed</td>
                    <td className="px-4 py-3 text-center text-green-600 font-extrabold">✓ Allowed</td>
                    <td className="px-4 py-3 text-center text-green-600 font-extrabold">✓ Allowed</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-900">InventoryManager</td>
                    <td className="px-4 py-3 text-center text-green-600 font-extrabold">✓ Allowed</td>
                    <td className="px-4 py-3 text-center text-green-600 font-extrabold">✓ Allowed</td>
                    <td className="px-4 py-3 text-center text-red-500 font-extrabold">✕ Denied</td>
                    <td className="px-4 py-3 text-center text-red-500 font-extrabold">✕ Denied</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-900">OrderManager</td>
                    <td className="px-4 py-3 text-center text-red-500 font-extrabold">✕ Denied</td>
                    <td className="px-4 py-3 text-center text-red-500 font-extrabold">✕ Denied</td>
                    <td className="px-4 py-3 text-center text-green-600 font-extrabold">✓ Allowed (Excl. Refunds)</td>
                    <td className="px-4 py-3 text-center text-red-500 font-extrabold">✕ Denied</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Staff Activity Logs */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft h-full flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Activity className="h-4 w-4 text-himgiri-primary" />
                Staff System Activities
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Real-time log of administrative state adjustments.</p>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff logs..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/15 focus:bg-white focus:border-himgiri-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[360px] pr-1 scrollbar-thin">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 font-medium">
                  No system logs match search term.
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                      <span>{log.staffName}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="text-xs font-black text-gray-900 block leading-tight">{log.action}</span>
                    <span className="text-[10px] text-himgiri-secondary-dark/75 block leading-normal">{log.detail}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
