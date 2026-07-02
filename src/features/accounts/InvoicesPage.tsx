import React from 'react';

export default function InvoicesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Invoices</h1>
        <p className="text-himgiri-secondary-dark/60 mt-1">Track financial transaction receipts, generated PDF bills, and download counts.</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400 font-medium">
        Module is under development (will hold pdf download links and invoice history).
      </div>
    </div>
  );
}
