import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import AdminLayout from '../components/layout/AdminLayout';
import AdminLoginPage from '../pages/admin/LoginPage';
import CustomerHome from '../pages/customer/CustomerHome';
import DashboardPage from '../pages/admin/DashboardPage';

// Accounts features
import AccountsDashboard from '../features/accounts/AccountsDashboard';
import OrdersPage from '../features/accounts/OrdersPage';
import InvoicesPage from '../features/accounts/InvoicesPage';
import VendorsPage from '../features/accounts/VendorsPage';

// Inventory features
import InventoryDashboard from '../features/inventory/InventoryDashboard';
import ItemsPage from '../features/inventory/ItemsPage';
import StockPage from '../features/inventory/StockPage';
import KitsPage from '../features/inventory/KitsPage';
import GradesPage from '../features/inventory/GradesPage';
import CategoriesPage from '../features/inventory/CategoriesPage';
import StockHistoryPage from '../features/inventory/StockHistoryPage';

// Reports features
import ReportsDashboard from '../features/reports/ReportsDashboard';
import InventoryReportsPage from '../features/reports/InventoryReportsPage';
import AccountReportsPage from '../features/reports/AccountReportsPage';
import StaffReportsPage from '../features/reports/StaffReportsPage';

// Settings features
import SettingsDashboard from '../features/settings/SettingsDashboard';
import AccountSettingsPage from '../features/settings/AccountSettingsPage';
import EntitySettingsPage from '../features/settings/EntitySettingsPage';
import GstRatesPage from '../features/settings/GstRatesPage';
import StaffSettingsPage from '../features/settings/StaffSettingsPage';

export default function AppRoutes() {
  return (
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
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Nested Inventory Module with Tabs */}
        <Route path="inventory" element={<InventoryDashboard />}>
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
          <Route path="orders" element={<OrdersPage />} />
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
  );
}
