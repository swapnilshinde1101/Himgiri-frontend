import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900">
      {/* Sidebar - Desktop and Mobile handled via props */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isCollapsed={isCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden transition-all duration-300">
        <Header 
          onOpenSidebar={() => setSidebarOpen(true)} 
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 lg:p-8 flex flex-col">
          <div className="max-w-7xl mx-auto w-full flex-1">
            <Outlet />
          </div>
          
          {/* <Footer /> */}
        </main>
      </div>
    </div>
  );
}
