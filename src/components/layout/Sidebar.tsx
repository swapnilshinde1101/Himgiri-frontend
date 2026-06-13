import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  BarChart3,
  X,
  Settings,
  Info as InfoIcon
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';
import { Menu, Transition } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../services/inventoryService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

export default function Sidebar({ isOpen, onClose, isCollapsed }: SidebarProps) {
  const user = useAuthStore((s) => s.user);

  const { data: lowStockData } = useQuery({
    queryKey: ['lowStockCount'],
    queryFn: () => inventoryService.getLowStock(),
    refetchInterval: 30000,
    enabled: !!user,
  });
  const lowStockCount = lowStockData?.data?.length || 0;

  const menuItems = [
    { 
      label: 'Dashboard', 
      path: '/admin/dashboard', 
      icon: LayoutDashboard,
      roles: ['SuperAdmin', 'InventoryManager', 'OrderManager']
    },
    { 
      label: 'Inventory', 
      path: '/admin/inventory', 
      icon: Package,
      roles: ['SuperAdmin', 'InventoryManager']
    },
    { 
      label: 'Account', 
      path: '/admin/orders', 
      icon: Receipt,
      roles: ['SuperAdmin', 'OrderManager']
    },
    { 
      label: 'Report', 
      path: '/admin/reports', 
      icon: BarChart3,
      roles: ['SuperAdmin']
    },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (!item.roles) return true;
    if (!user) return false;
    
    const userRole = user.role.toString();
    // Check if user has permission (matches string role OR numeric equivalent)
    return item.roles.some(r => 
      r === userRole || 
      (userRole === "0" && r === "SuperAdmin") ||
      (userRole === "1" && r === "InventoryManager") ||
      (userRole === "2" && r === "OrderManager")
    );
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-himgiri-secondary-dark/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-soft",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-50 bg-himgiri-primary flex-shrink-0">
            <div className="flex items-center gap-3 text-white overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold italic flex-shrink-0">HG</div>
              {!isCollapsed && <span className="font-bold text-lg tracking-tight whitespace-nowrap animate-in fade-in duration-500">Himgiri Admin</span>}
            </div>
            <button className="lg:hidden p-2 text-white/80 hover:text-white transition-colors" onClick={onClose}>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
            {filteredMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : ""}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) => clsx(
                  "flex items-center text-sm font-bold rounded-xl transition-all group overflow-hidden",
                  isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3",
                  isActive 
                    ? "bg-himgiri-primary text-white shadow-lg shadow-blue-100" 
                    : "text-himgiri-secondary hover:bg-himgiri-secondary-light hover:text-himgiri-primary"
                )}
              >
                {({ isActive }) => (
                  <>
                    <div className="relative flex items-center justify-center">
                      <item.icon className={clsx(
                        "h-5 w-5 transition-transform group-hover:scale-110 flex-shrink-0",
                        !isCollapsed && "mr-3"
                      )} />
                      {isCollapsed && item.label === 'Inventory' && lowStockCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                    {!isCollapsed && <span className="whitespace-nowrap animate-in fade-in duration-500">{item.label}</span>}
                    {!isCollapsed && item.label === 'Inventory' && lowStockCount > 0 && (
                      <span className={clsx(
                        "ml-auto text-[10px] font-black px-2 py-0.5 rounded-full transition-colors",
                        isActive ? "bg-white text-himgiri-primary" : "bg-red-500 text-white"
                      )}>
                        {lowStockCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex-shrink-0">
            <div className={clsx(
                "flex items-center bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300",
                isCollapsed ? "justify-center p-2" : "justify-between p-3"
            )}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-himgiri-primary-light flex items-center justify-center text-himgiri-primary font-bold">
                  {user?.name.charAt(0)}
                </div>
                {!isCollapsed && (
                    <div className="overflow-hidden animate-in fade-in duration-500">
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-himgiri-secondary-dark/50 font-black">{user?.role}</p>
                    </div>
                )}
              </div>

              {!isCollapsed && (
                <Menu as="div" className="relative">
                  <Menu.Button className="p-2 text-himgiri-secondary hover:text-himgiri-primary hover:bg-himgiri-secondary-light rounded-lg transition-all">
                    <Settings className="h-5 w-5" />
                  </Menu.Button>
                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <Menu.Items className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 focus:outline-none z-[60]">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={clsx(
                              "flex w-full items-center px-4 py-2.5 text-sm font-medium transition-colors",
                              active ? "bg-himgiri-primary-light text-himgiri-primary" : "text-gray-700"
                            )}
                          >
                            <InfoIcon className="mr-3 h-4 w-4" />
                            About System
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
