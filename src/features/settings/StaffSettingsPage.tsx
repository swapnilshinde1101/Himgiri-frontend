import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService, StaffMember, CreateStaffPayload } from '../../services/staffService';
import { useAuthStore } from '../../store/authStore';
import type { AdminRole, PermissionCode } from '../../types';
import { ROLE_PERMISSIONS, PERMISSION_DESCRIPTIONS } from '../../utils/permissions';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Package, 
  ShoppingBag, 
  Search, 
  RefreshCw, 
  Lock, 
  Unlock, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  X, 
  Eye, 
  EyeOff, 
  Loader2,
  Clock,
  Shield,
  Trash2,
  Edit2,
  Sliders
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const MODULE_GROUPS: { name: string; description: string; permissions: PermissionCode[] }[] = [
  {
    name: 'Catalog & Products',
    description: 'Products, inventory catalogs, school kits, and pricing controls',
    permissions: ['catalog:view', 'catalog:manage', 'catalog:edit_pricing']
  },
  {
    name: 'Inventory & Stock',
    description: 'Stock inwarding, supplier logs, and threshold balance adjustments',
    permissions: ['stock:view', 'stock:inward', 'stock:adjust']
  },
  {
    name: 'Orders & Fulfillment',
    description: 'Order lifecycle processing, packing, delivery notes, and refunds',
    permissions: ['orders:view', 'orders:fulfill', 'orders:notes', 'orders:refund', 'orders:export']
  },
  {
    name: 'Reports & Analytics',
    description: 'Financial ledgers, inventory valuation, and security audit logs',
    permissions: ['reports:accounts', 'reports:inventory', 'reports:staff_audit']
  },
  {
    name: 'System & Administration',
    description: 'System configurations, tax rates, and staff member privileges',
    permissions: ['settings:view', 'settings:manage', 'staff:manage']
  }
];

export default function StaffSettingsPage(): JSX.Element {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isCustomOverride, setIsCustomOverride] = useState(false);

  // Add form fields
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<AdminRole>('OrderManager');
  const [addPassword, setAddPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Edit role field
  const [newRole, setNewRole] = useState<AdminRole>('OrderManager');

  // Reset password field
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Query staff list
  const { data: staffRes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => staffService.getAllStaff(),
  });

  const staffMembers: StaffMember[] = staffRes?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateStaffPayload) => staffService.createStaff(payload),
    onSuccess: () => {
      toast.success('Staff member created successfully!');
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
      setIsAddModalOpen(false);
      resetAddForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create staff member.');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminRole }) => 
      staffService.updateStaffRole(id, role),
    onSuccess: () => {
      toast.success('Staff role updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
      setIsRoleModalOpen(false);
      setSelectedStaff(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      staffService.updateStaffStatus(id, isActive),
    onSuccess: (_, vars) => {
      toast.success(`Staff account ${vars.isActive ? 'activated' : 'deactivated'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update account status.');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => 
      staffService.resetStaffPassword(id, password),
    onSuccess: () => {
      toast.success('Password reset successfully! Existing sessions terminated.');
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
      setIsPasswordModalOpen(false);
      setSelectedStaff(null);
      setNewPassword('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    }
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => staffService.unlockStaffAccount(id),
    onSuccess: () => {
      toast.success('Account unlocked successfully.');
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to unlock account.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffService.deleteStaff(id),
    onSuccess: () => {
      toast.success('Staff account deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete staff account.');
    }
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] | null }) => 
      staffService.updateStaffPermissions(id, permissions),
    onSuccess: () => {
      toast.success('Custom permissions updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['staff-list'] });
      setIsPermissionsModalOpen(false);
      setSelectedStaff(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update permissions.');
    }
  });

  const resetAddForm = () => {
    setAddName('');
    setAddEmail('');
    setAddRole('OrderManager');
    setAddPassword('');
    setShowAddPassword(false);
  };

  const handleOpenRoleModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setNewRole(staff.role);
    setIsRoleModalOpen(true);
  };

  const handleOpenPasswordModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleOpenPermissionsModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    if (staff.customPermissions && staff.customPermissions.length > 0) {
      setSelectedPermissions([...staff.customPermissions]);
      setIsCustomOverride(true);
    } else {
      const defaults = ROLE_PERMISSIONS[staff.role] || [];
      setSelectedPermissions([...defaults]);
      setIsCustomOverride(false);
    }
    setIsPermissionsModalOpen(true);
  };

  const handleTogglePermission = (code: string) => {
    setIsCustomOverride(true);
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const handleResetToRoleDefaults = () => {
    if (!selectedStaff) return;
    const defaults = ROLE_PERMISSIONS[selectedStaff.role] || [];
    setSelectedPermissions([...defaults]);
    setIsCustomOverride(false);
  };

  const handlePermissionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    updatePermissionsMutation.mutate({
      id: selectedStaff.id,
      permissions: isCustomOverride ? selectedPermissions : null
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      toast.error('All fields are required.');
      return;
    }
    if (addPassword.trim().length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    createMutation.mutate({
      name: addName.trim(),
      email: addEmail.trim(),
      password: addPassword.trim(),
      role: addRole
    });
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    updateRoleMutation.mutate({ id: selectedStaff.id, role: newRole });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    if (newPassword.trim().length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    resetPasswordMutation.mutate({ id: selectedStaff.id, password: newPassword.trim() });
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    if (window.confirm(`Are you sure you want to remove ${staff.name} (${staff.email})? This will deactivate their login.`)) {
      deleteMutation.mutate(staff.id);
    }
  };

  // Filtered List
  const filteredStaff = staffMembers.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !roleFilter || member.role === roleFilter;

    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && member.isActive && !member.isLockedOut) ||
      (statusFilter === 'inactive' && !member.isActive) ||
      (statusFilter === 'locked' && member.isLockedOut);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Role Badge Helper
  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'SuperAdmin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldAlert className="h-3 w-3 text-purple-600" />
            SuperAdmin
          </span>
        );
      case 'InventoryManager':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="h-3 w-3 text-amber-600" />
            Inventory Manager
          </span>
        );
      case 'OrderManager':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            <ShoppingBag className="h-3 w-3 text-blue-600" />
            Order Manager
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-700">
            {role}
          </span>
        );
    }
  };

  // Calculations for KPI Cards
  const totalStaffCount = staffMembers.length;
  const activeCount = staffMembers.filter(m => m.isActive).length;
  const superAdminCount = staffMembers.filter(m => m.role === 'SuperAdmin').length;
  const managersCount = staffMembers.filter(m => m.role !== 'SuperAdmin').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-himgiri-primary" />
            Staff Accounts & Access Control
          </h2>
          <p className="text-xs text-himgiri-secondary-dark/60 mt-0.5">
            Configure system staff members, manage roles, and enforce security policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 text-xs shadow-sm cursor-pointer transition-all"
            title="View Role Permissions Guide"
          >
            <Shield className="h-3.5 w-3.5 text-indigo-600" />
            Roles Guide
          </button>

          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-himgiri-primary hover:bg-gray-50 transition-all shadow-sm"
            title="Refresh Staff List"
          >
            <RefreshCw className={clsx("h-4 w-4", (isLoading || isRefetching) && "animate-spin text-himgiri-primary")} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-himgiri-primary text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm text-xs cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Total Staff</span>
            <p className="text-2xl font-black text-gray-900 font-mono">{totalStaffCount}</p>
            <span className="text-[10px] text-gray-500 font-medium">Registered Admin Accounts</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Active Accounts</span>
            <p className="text-2xl font-black text-emerald-600 font-mono">{activeCount}</p>
            <span className="text-[10px] text-emerald-600 font-bold">Enabled for Login</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Super Admins</span>
            <p className="text-2xl font-black text-purple-700 font-mono">{superAdminCount}</p>
            <span className="text-[10px] text-purple-600 font-medium">Full System Authority</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Operations Team</span>
            <p className="text-2xl font-black text-amber-600 font-mono">{managersCount}</p>
            <span className="text-[10px] text-amber-600 font-medium">Inventory & Orders</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
            >
              <option value="">All Roles</option>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="InventoryManager">Inventory Manager</option>
              <option value="OrderManager">Order Manager</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-himgiri-primary/20 focus:border-himgiri-primary transition-all"
            >
              <option value="">All Account Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Disabled</option>
              <option value="locked">Locked Out (Failed Logins)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-himgiri-primary mb-2" />
            <span className="text-xs font-bold">Loading staff directory...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 font-medium">
            No staff accounts found matching the current search/filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-150 text-[10px] font-black uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-3.5 px-6">Staff Member</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status & Security</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.map((staff) => {
                  const isCurrent = currentUser?.email.toLowerCase() === staff.email.toLowerCase();
                  const initials = staff.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Email with Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "h-9 w-9 rounded-2xl flex items-center justify-center font-black text-xs",
                            staff.role === 'SuperAdmin' ? "bg-purple-100 text-purple-700" :
                            staff.role === 'InventoryManager' ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                              {staff.name}
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono mt-0.5">{staff.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {getRoleBadge(staff.role)}
                          {staff.customPermissions && staff.customPermissions.length > 0 && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                                <ShieldCheck className="h-2.5 w-2.5 text-purple-600" />
                                Custom ({staff.customPermissions.length})
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status & Security */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={clsx(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                              staff.isActive 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                : "bg-red-50 text-red-700 border border-red-200"
                            )}>
                              {staff.isActive ? (
                                <>
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-2.5 w-2.5 text-red-600" />
                                  Disabled
                                </>
                              )}
                            </span>

                            {staff.isLockedOut && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Lock className="h-2.5 w-2.5 text-amber-600" />
                                Locked Out
                              </span>
                            )}
                          </div>

                          {staff.isLockedOut && (
                            <button
                              onClick={() => unlockMutation.mutate(staff.id)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 underline"
                            >
                              <Unlock className="h-2.5 w-2.5" />
                              Clear Lockout
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-4 text-gray-500 font-medium">
                        {staff.lastLoginAt ? (
                          <div className="flex items-center gap-1 text-[11px] font-mono">
                            <Clock className="h-3 w-3 text-gray-400" />
                            {new Date(staff.lastLoginAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Never logged in</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active Switch */}
                          {!isCurrent && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: staff.id, isActive: !staff.isActive })}
                              className={clsx(
                                "p-1.5 rounded-lg border text-xs font-bold transition-all",
                                staff.isActive
                                  ? "border-red-200 text-red-600 hover:bg-red-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              )}
                              title={staff.isActive ? "Deactivate Account" : "Activate Account"}
                            >
                              {staff.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>
                          )}

                          {/* Customize Permissions Button */}
                          <button
                            onClick={() => handleOpenPermissionsModal(staff)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all"
                            title="Customize Permissions"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </button>

                          {/* Change Role Button */}
                          <button
                            onClick={() => handleOpenRoleModal(staff)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Change Role"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => handleOpenPasswordModal(staff)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-amber-600 hover:bg-amber-50 transition-all"
                            title="Reset Password"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Account Button */}
                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteStaff(staff)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              title="Delete Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Add New Staff Member ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-150 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Add Staff Member</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Create administrative credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kulkarni"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-himgiri-primary focus:ring-2 focus:ring-himgiri-primary/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="ramesh@himgirigoods.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-himgiri-primary focus:ring-2 focus:ring-himgiri-primary/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Administrative Role</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as AdminRole)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-himgiri-primary focus:ring-2 focus:ring-himgiri-primary/20 transition-all"
                >
                  <option value="OrderManager">Order Manager (Order fulfillment & dispatch only)</option>
                  <option value="InventoryManager">Inventory Manager (Catalog & stock inwarding only)</option>
                  <option value="SuperAdmin">SuperAdmin (Full system access & reports)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Initial Password</label>
                <div className="relative">
                  <input
                    type={showAddPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-himgiri-primary focus:ring-2 focus:ring-himgiri-primary/20 transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-himgiri-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Change Role ── */}
      {isRoleModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-150 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Change Staff Role</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedStaff.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Select New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-himgiri-primary focus:ring-2 focus:ring-himgiri-primary/20 transition-all"
                >
                  <option value="SuperAdmin">SuperAdmin (Full Access)</option>
                  <option value="InventoryManager">Inventory Manager (Catalog & Stock)</option>
                  <option value="OrderManager">Order Manager (Order Fulfillment)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/60 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  Changing roles will terminate active login sessions for this account, requiring them to re-login with updated permissions.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateRoleMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-himgiri-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {updateRoleMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save New Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Reset Password ── */}
      {isPasswordModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-150 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Reset Password</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedStaff.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-himgiri-primary focus:ring-2 focus:ring-himgiri-primary/20 transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200/60 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                  Resetting the password will terminate all active login sessions and clear any failed login lockouts immediately.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-all disabled:opacity-50"
                >
                  {resetPasswordMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Password Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Role Permissions Guide ── */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-150 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Role Permissions Reference</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Access privileges and restrictions</p>
                </div>
              </div>
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
              {/* SuperAdmin Card */}
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-purple-700" />
                    <span className="font-black text-purple-900 text-sm">SuperAdmin</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                    17 of 17 Permissions (Full Control)
                  </span>
                </div>
                <p className="text-purple-800 leading-relaxed font-medium text-[11px]">
                  Unrestricted system authority across all modules: item catalog, inventory stock, order fulfillment, refund processing, accounts & GST reporting, vendor settings, and staff credentials.
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {['catalog:*', 'stock:*', 'orders:*', 'orders:refund', 'reports:*', 'settings:*', 'staff:manage'].map(p => (
                    <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white text-purple-700 border border-purple-200">
                      ✓ {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Inventory Manager Card */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-700" />
                    <span className="font-black text-amber-900 text-sm">Inventory Manager</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                    7 Granular Permissions
                  </span>
                </div>
                <p className="text-amber-800 leading-relaxed font-medium text-[11px]">
                  Responsible for textbook and stationery catalog, grades, categories, school kit bundles, stock adjustments, and inwarding shipments.
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {['catalog:view', 'catalog:manage', 'catalog:edit_pricing', 'stock:view', 'stock:inward', 'stock:adjust', 'reports:inventory'].map(p => (
                    <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white text-amber-700 border border-amber-200">
                      ✓ {p}
                    </span>
                  ))}
                  {['orders:view', 'orders:refund', 'staff:manage'].map(p => (
                    <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-100 text-gray-400 line-through border border-gray-200">
                      ✕ {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Order Manager Card */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-blue-700" />
                    <span className="font-black text-blue-900 text-sm">Order Manager</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                    6 Granular Permissions
                  </span>
                </div>
                <p className="text-blue-800 leading-relaxed font-medium text-[11px]">
                  Handles customer order fulfillment workflow (Confirmed ➔ Packed ➔ Dispatched ➔ Delivered), internal packing notes, packing slip generation, and CSV order exports.
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {['orders:view', 'orders:fulfill', 'orders:notes', 'orders:export', 'catalog:view', 'stock:view'].map(p => (
                    <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white text-blue-700 border border-blue-200">
                      ✓ {p}
                    </span>
                  ))}
                  {['orders:refund', 'stock:adjust', 'catalog:manage', 'staff:manage'].map(p => (
                    <span key={p} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-100 text-gray-400 line-through border border-gray-200">
                      ✕ {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 transition-all"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Customize Staff Permissions ── */}
      {isPermissionsModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-150 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                    Customize Permissions
                    {getRoleBadge(selectedStaff.role)}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Configure granular overrides for <strong className="text-gray-900">{selectedStaff.name}</strong> ({selectedStaff.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPermissionsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status & Helper Info Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex-shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider",
                    isCustomOverride ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {isCustomOverride ? "Custom Override Active" : "Role Defaults Active"}
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    {selectedPermissions.length} of 17 Permissions Enabled
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  {isCustomOverride 
                    ? "This staff member has tailored privileges overriding their default role."
                    : "Currently adhering strictly to default role privileges."}
                </p>
              </div>

              {isCustomOverride && (
                <button
                  type="button"
                  onClick={handleResetToRoleDefaults}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200/60 transition-all"
                >
                  Reset to Role Defaults
                </button>
              )}
            </div>

            {/* Scrollable Permissions Checklist */}
            <form onSubmit={handlePermissionsSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 scrollbar-thin">
              {MODULE_GROUPS.map((group) => {
                const groupActiveCount = group.permissions.filter(p => selectedPermissions.includes(p)).length;
                return (
                  <div key={group.name} className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="px-4 py-2 bg-gray-50/70 border-b border-gray-150 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-gray-800 uppercase tracking-wider">{group.name}</span>
                        <p className="text-[10px] text-gray-500 font-medium">{group.description}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600">
                        {groupActiveCount} / {group.permissions.length}
                      </span>
                    </div>

                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {group.permissions.map((permCode) => {
                        const permInfo = PERMISSION_DESCRIPTIONS[permCode];
                        const isChecked = selectedPermissions.includes(permCode);
                        const isStaffManage = permCode === 'staff:manage';
                        const isSelf = currentUser?.email.toLowerCase() === selectedStaff.email.toLowerCase();
                        const isSelfDisabled = isSelf && isStaffManage;

                        return (
                          <label
                            key={permCode}
                            className={clsx(
                              "flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                              isChecked
                                ? "bg-purple-50/40 border-purple-200 text-gray-900"
                                : "bg-white border-gray-150 hover:bg-gray-50/60 text-gray-600",
                              isSelfDisabled && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isSelfDisabled}
                              onChange={() => handleTogglePermission(permCode)}
                              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 border-gray-300 h-4 w-4"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold truncate text-gray-900">{permInfo.name}</span>
                                <span className="text-[9px] font-mono text-gray-400 font-bold">{permCode}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 leading-tight mt-0.5 line-clamp-2">
                                {permInfo.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Self-protection / sole SuperAdmin caution note */}
              {currentUser?.email.toLowerCase() === selectedStaff.email.toLowerCase() && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    You are editing your own account. For security reasons, your <code>staff:manage</code> permission cannot be revoked from this modal.
                  </p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPermissionsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={updatePermissionsMutation.isPending}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-himgiri-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {updatePermissionsMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Permissions
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
