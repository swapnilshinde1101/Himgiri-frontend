import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import TabManager from '../../components/shared/TabManager';
import { Package, Database, School, Tags, History } from 'lucide-react';

export default function InventoryDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'items', label: 'Items', icon: Package, path: '/admin/inventory/items' },
    { id: 'stock', label: 'Stock', icon: Database, path: '/admin/inventory/stock' },
    { id: 'grades', label: 'Grades', icon: School, path: '/admin/inventory/grades' },
    { id: 'categories', label: 'Categories', icon: Tags, path: '/admin/inventory/categories' },
    { id: 'history', label: 'Stock History', icon: History, path: '/admin/inventory/history' },
  ];

  // Map current path to tab index
  const currentIndex = tabs.findIndex(tab => location.pathname.includes(tab.path)) ?? 0;

  const handleTabChange = (index: number) => {
    navigate(tabs[index].path);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inventory Management</h1>
        <p className="text-himgiri-secondary-dark/60 mt-1">Configure your school products, stock levels, and kit categories.</p>
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
