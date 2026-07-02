import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import TabManager from '../../components/shared/TabManager';
import { Package, Database, School, Tags, History, Briefcase, Percent, Users } from 'lucide-react';

export default function SettingsDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'accounts', label: 'Accounts', icon: Package, path: '/admin/settings/accounts' },
    { id: 'entity', label: 'Entity Management', icon: Database, path: '/admin/settings/entity' },
    { id: 'gst', label: 'GST', icon: Percent, path: '/admin/settings/gst' },
    { id: 'staff', label: 'Staff Management', icon: Users, path: '/admin/settings/staff' },
  ];

  // Map current path to tab index
  const currentIndex = tabs.findIndex(tab => location.pathname.includes(tab.path)) ?? 0;

  const handleTabChange = (index: number) => {
    navigate(tabs[index].path);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Settings Management</h1>
        <p className="text-himgiri-secondary-dark/60 mt-1">Configure settings and preferences.</p>
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
