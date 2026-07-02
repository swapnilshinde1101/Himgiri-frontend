import React from 'react';

export default function VendorsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Vendors</h1>
        <p className="text-himgiri-secondary-dark/60 mt-1">Configure school kit distribution suppliers, dispatch locations, and vendor profiles.</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400 font-medium">
        Module is under development (will hold school uniform and school supplies distributor registry).
      </div>
    </div>
  );
}
