import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import AdminLayout from '../components/layout/AdminLayout';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import CustomerHome from '../pages/customer/CustomerHome';
import ConfirmationPage from '../pages/customer/ConfirmationPage';

// Lazy loaded admin routes for code-splitting
const AdminLoginPage = lazy(() => import('../pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const AdminOrdersPage = lazy(() => import('../pages/admin/orders/OrdersPage'));
const AdminOrderDetailPage = lazy(() => import('../pages/admin/orders/OrderDetailPage'));

// Accounts features
const AccountsDashboard = lazy(() => import('../features/accounts/AccountsDashboard'));
const InvoicesPage = lazy(() => import('../features/accounts/InvoicesPage'));
const VendorsPage = lazy(() => import('../features/accounts/VendorsPage'));

// Inventory features
const InventoryDashboard = lazy(() => import('../features/inventory/InventoryDashboard'));
const ItemsPage = lazy(() => import('../features/inventory/ItemsPage'));
const StockPage = lazy(() => import('../features/inventory/StockPage'));
const KitsPage = lazy(() => import('../features/inventory/KitsPage'));
const GradesPage = lazy(() => import('../features/inventory/GradesPage'));
const CategoriesPage = lazy(() => import('../features/inventory/CategoriesPage'));
const StockHistoryPage = lazy(() => import('../features/inventory/StockHistoryPage'));

// Reports features
const ReportsDashboard = lazy(() => import('../features/reports/ReportsDashboard'));
const InventoryReportsPage = lazy(() => import('../features/reports/InventoryReportsPage'));
const AccountReportsPage = lazy(() => import('../features/reports/AccountReportsPage'));
const StaffReportsPage = lazy(() => import('../features/reports/StaffReportsPage'));

// Settings features
const SettingsDashboard = lazy(() => import('../features/settings/SettingsDashboard'));
const AccountSettingsPage = lazy(() => import('../features/settings/AccountSettingsPage'));
const EntitySettingsPage = lazy(() => import('../features/settings/EntitySettingsPage'));
const GstRatesPage = lazy(() => import('../features/settings/GstRatesPage'));
const StaffSettingsPage = lazy(() => import('../features/settings/StaffSettingsPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-50"><LoadingSpinner size="lg" /></div>}>
      <Routes>
      {/* Public customer routes */}
      <Route path="/" element={<CustomerHome />} />
      <Route path="/lookup" element={<CustomerHome />} />
      <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />

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
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Nested Inventory Module with Tabs */}
        <Route
          path="inventory"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'InventoryManager']}>
              <InventoryDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="items" replace />} />
          <Route path="items" element={<ItemsPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="kits" element={<KitsPage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="history" element={<StockHistoryPage />} />
        </Route>
        
        {/* Nested Accounts & Billing Module with Tabs */}
        <Route
          path="accounts"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'OrderManager']}>
              <AccountsDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="vendors" element={<VendorsPage />} />
        </Route>

        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <ReportsDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="inventory" replace />} />
          <Route path="inventory" element={<InventoryReportsPage />} />
          <Route path="accounts" element={<AccountReportsPage />} />
          <Route path="staff" element={<StaffReportsPage />} />
        </Route>

         {/* Nested Settings Module with Tabs */}
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <SettingsDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="accounts" replace />} />
          <Route path="accounts" element={<AccountSettingsPage />} />
          <Route path="entity" element={<EntitySettingsPage />} />
          <Route path="gst" element={<GstRatesPage />} />
          <Route path="staff" element={<StaffSettingsPage />} />
        </Route>
      </Route>      

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
  );
}
