import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import ProtectedRoute from './components/shared/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import AdminLoginPage from './pages/admin/LoginPage';
import ItemsPage from './features/inventory/ItemsPage';
import InventoryDashboard from './features/inventory/InventoryDashboard';
import StockPage from './features/inventory/StockPage';
import GradesPage from './features/inventory/GradesPage';
import CategoriesPage from './features/inventory/CategoriesPage';
import api from './services/api';

// ── TanStack Query Client ──
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
      retry: 1,                   // Retry failed requests once
      staleTime: 5 * 60 * 1000,   // Cache data for 5 minutes
    },
  },
});

// Placeholder pages
const AdminDashboard = () => (
  <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
    <p className="mt-2 text-himgiri-secondary-dark/60 font-medium">Welcome back to the Himgiri Goods Portal.</p>
  </div>
);

const AdminOrders = () => <div className="p-8 text-gray-600">Account & Billing Module — Building...</div>;
const CustomerHome = () => <div className="p-8 text-gray-600">Public Portal — Building...</div>;

export default function App() {
  // ── Startup Security Check ──
  React.useEffect(() => {
    const checkConnection = async () => {
      const storage = sessionStorage.getItem('himgiri-auth-storage');
      if (storage) {
        try {
          await api.get('/auth/validate');
        } catch (err) {
          // Handled by api.ts interceptor
        }
      }
    };
    checkConnection();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            {/* Public customer routes */}
            <Route path="/" element={<CustomerHome />} />

            {/* Auth routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Admin routes with shared Layout */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              
              {/* Nested Inventory Module with Tabs */}
              <Route path="inventory" element={<InventoryDashboard />}>
                <Route index element={<Navigate to="items" replace />} />
                <Route path="items" element={<ItemsPage />} />
                <Route path="stock" element={<StockPage />} />
                <Route path="grades" element={<GradesPage />} />
                <Route path="categories" element={<CategoriesPage />} />
              </Route>
              
              <Route
                path="orders"
                element={
                  <ProtectedRoute allowedRoles={['SuperAdmin', 'OrderManager']}>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
