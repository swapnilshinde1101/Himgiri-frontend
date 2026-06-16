import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import TabManager from '../../components/shared/TabManager';
import { BarChart3, Receipt, ShieldCheck } from 'lucide-react';

export default function ReportsDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'inventory', label: 'Inventory Reports', icon: BarChart3, path: '/admin/reports/inventory' },
    { id: 'accounts', label: 'Account Reports', icon: Receipt, path: '/admin/reports/accounts' },
    { id: 'staff', label: 'Staff Reports', icon: ShieldCheck, path: '/admin/reports/staff' },
  ];

  // Map current path to tab index
  const currentIndex = tabs.findIndex(tab => location.pathname.includes(tab.path));

  const handleTabChange = (index: number) => {
    navigate(tabs[index].path);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Reports & Analytics</h1>
        <p className="text-himgiri-secondary-dark/60 mt-1">Audit stock logs, tracking revenues, tax distributions, and staff activity records.</p>
      </div>

      {/* Tab Navigation */}
      <TabManager 
        tabs={tabs} 
        selectedIndex={currentIndex === -1 ? 0 : currentIndex} 
        onChange={handleTabChange} 
      />

      {/* Nested Sub-Module Page Content */}
      <div className="min-h-[500px]">
        <Outlet />
      </div>
    </div>
  );
}
