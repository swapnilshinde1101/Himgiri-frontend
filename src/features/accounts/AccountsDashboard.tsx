import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import TabManager from '../../components/shared/TabManager';
import { Receipt, FileText, Store } from 'lucide-react';

export default function AccountsDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'orders', label: 'Orders', icon: Receipt, path: '/admin/accounts/orders' },
    { id: 'invoices', label: 'Invoices', icon: FileText, path: '/admin/accounts/invoices' },
    { id: 'vendors', label: 'Vendors', icon: Store, path: '/admin/accounts/vendors' },
  ];

  // Map current path to tab index
  const currentIndex = tabs.findIndex(tab => location.pathname.includes(tab.path)) ?? 0;

  const handleTabChange = (index: number) => {
    navigate(tabs[index].path);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account & Billing Management</h1>
        <p className="text-himgiri-secondary-dark/60 mt-1">Manage parent orders, billing invoices, and school uniform vendor configurations.</p>
      </div>

      {/* Professional Sub-Module Navigation */}
      <TabManager 
        tabs={tabs} 
        selectedIndex={currentIndex === -1 ? 0 : currentIndex} 
        onChange={handleTabChange} 
      />

      {/* Sub-Module Page Content */}
      <div className="min-h-[500px]">
        <Outlet />
      </div>
    </div>
  );
}
