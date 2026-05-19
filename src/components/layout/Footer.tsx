import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto py-6 px-8 border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-500 font-medium">
          © {currentYear} Himgiri Goods Pvt. Ltd. All rights reserved.
        </p>
        
        <div className="flex items-center gap-6">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            v1.0.0
          </span>
          <div className="h-4 w-px bg-gray-200" />
          <p className="text-sm text-gray-500">
            Powered by <span className="text-blue-600 font-bold">SmartPOD Tech</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
