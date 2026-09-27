import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';
import { useAuthStore } from '../../store/authStore';
import { 
  ShieldCheck, 
  Users, 
  Activity, 
  CalendarDays, 
  KeyRound, 
  Search, 
  RefreshCw,
  Loader2,
  Lock,
  Clock
} from 'lucide-react';
import { clsx } from 'clsx';
import Badge from '../../components/shared/Badge';

export default function StaffReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  const { data: staffDataRes, isLoading, refetch } = useQuery({
    queryKey: ['staff-activity-report'],
    queryFn: () => reportService.getStaffActivityReport(100),
    enabled: isSuperAdmin,
  });

  const staffMembers = staffDataRes?.data?.staffMembers || [];
  const activities = staffDataRes?.data?.recentActivities || [];

  const filteredLogs = activities.filter(log => 
    log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.reference && log.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-himgiri-primary" />
            Staff Directory & System Activity Logs
          </h2>
          <p className="text-xs text-himgiri-secondary-dark/60 mt-0.5">
            Audit administrative login records, role assignments, and real-time database action streams.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-white border border-gray-150 text-gray-500 hover:text-himgiri-primary hover:bg-gray-50 transition-all shadow-sm"
            title="Refresh Activity Log"
          >
            <RefreshCw className={clsx("h-4 w-4", isLoading && "animate-spin text-himgiri-primary")} />
          </button>
        )}
      </div>

      {!isSuperAdmin ? (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3">
          <Lock className="h-8 w-8 text-amber-600" />
          <h3 className="font-bold text-amber-900 text-sm">SuperAdmin Access Required</h3>
          <p className="text-amber-700 text-xs max-w-md">
            Staff directory records and real-time system audit trails are restricted to SuperAdmin accounts in accordance with Himgiri's security policy.
          </p>
        </div>
      ) : null}

      {/* Grid: Staff Members & Roles List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Staff Directory & Security Matrix */}
        <div className="lg:col-span-2 space-y-6">
          {isSuperAdmin && (
            <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-soft">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-himgiri-primary" />
                Administrative Staff Directory ({staffMembers.length})
              </h3>
              
              {isLoading ? (
                <div className="py-12 flex items-center justify-center text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin text-himgiri-primary mr-2" />
                  <span className="text-xs font-bold">Loading staff directory...</span>
                </div>
              ) : staffMembers.length === 0 ? (
                <p className="text-xs text-gray-400 font-bold py-6 text-center">No staff members found.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {staffMembers.map(member => (
                    <div key={member.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm",
                          member.isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
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
                            {member.lastLoginAt ? `Last login: ${new Date(member.lastLoginAt).toLocaleDateString()}` : 'Never logged in'}
                          </span>
                        </div>
                        
                        <Badge variant={member.isActive ? 'success' : 'gray'}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security Permissions Matrix */}
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-soft space-y-4">
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

        {/* Right 1 Column: Real-time System Audit Activity Stream */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-soft h-full flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Activity className="h-4 w-4 text-himgiri-primary" />
                Live System Audit Trail
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Real-time log of administrative inventory, order, and pricing adjustments.</p>
            </div>

            {isSuperAdmin && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter audit logs..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/15 focus:bg-white focus:border-himgiri-primary transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}

            {!isSuperAdmin ? (
              <div className="text-center py-16 text-xs text-gray-400 font-medium">
                Audit stream restricted to SuperAdmin.
              </div>
            ) : isLoading ? (
              <div className="py-16 flex items-center justify-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin text-himgiri-primary mr-2" />
                <span className="text-xs font-bold">Streaming audit entries...</span>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400 font-medium">
                    No recent system audit records found.
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div key={log.id} className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1.5 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                        <span className="text-gray-700 font-extrabold">{log.adminName}</span>
                        <div className="flex items-center gap-1 font-mono text-gray-400">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-gray-900 block leading-tight">
                          {log.actionType}
                        </span>
                        {log.reference && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                            {log.reference}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 leading-normal font-medium">
                        {log.details}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
