import React, { useState } from 'react';
import { Menu, LogOut, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import ActionModal from '../shared/ActionModal';
import toast from 'react-hot-toast';

interface HeaderProps {
  onOpenSidebar: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Header({ onOpenSidebar, isCollapsed, onToggleCollapse }: HeaderProps) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <button 
          className="p-2 rounded-md text-himgiri-secondary lg:hidden hover:bg-himgiri-secondary-light"
          onClick={onOpenSidebar}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Sidebar Toggle Button (Desktop) */}
        <button 
          onClick={onToggleCollapse}
          className="hidden lg:flex p-2 rounded-xl text-himgiri-secondary hover:text-himgiri-primary hover:bg-himgiri-secondary-light transition-all border border-transparent hover:border-himgiri-primary-light"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        <h2 className="ml-2 text-lg font-bold text-gray-800 hidden sm:block tracking-tight">
          Himgiri <span className="text-himgiri-primary">Goods</span> Portal
        </h2>
      </div>

      <div className="flex items-center space-x-2">
        {/* Notifications Placeholder */}
        <button className="p-2 text-himgiri-secondary hover:text-himgiri-primary hover:bg-himgiri-secondary-light rounded-full transition-all relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-himgiri-danger rounded-full border-2 border-white"></span>
        </button>

        <div className="h-6 w-px bg-gray-200 mx-2" />
        
        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center gap-2 text-sm font-bold text-himgiri-danger hover:bg-himgiri-danger-light px-4 py-2 rounded-xl transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline font-sans uppercase tracking-wider text-xs">Logout</span>
        </button>
      </div>

      <ActionModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        variant="warning"
        title="Confirm Logout"
        message="Are you sure you want to log out of the Himgiri Portal?"
        confirmText="Logout Now"
      />
    </header>
  );
}
