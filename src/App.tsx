import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import ProtectedRoute from './components/shared/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import AdminLoginPage from './pages/admin/LoginPage';
import ItemsPage from './features/inventory/ItemsPage';
import InventoryDashboard from './features/inventory/InventoryDashboard';
import StockPage from './features/inventory/StockPage';
import GradesPage from './features/inventory/GradesPage';
import CategoriesPage from './features/inventory/CategoriesPage';
import StockHistoryPage from './features/inventory/StockHistoryPage';
import api from './services/api';
import { inventoryService } from './services/inventoryService';
import { Package, AlertTriangle, ShieldAlert, ShoppingBag, IndianRupee, Clock } from 'lucide-react';
import { clsx } from 'clsx';

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
const AdminDashboard = () => {
  const { data: statsResponse } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => inventoryService.getDashboardStats(),
  });

  const stats = statsResponse?.data;

  const dashboardCards = [
    {
      label: "TOTAL CATALOG ITEMS",
      value: stats?.totalItems ?? 0,
      link: "/admin/inventory/items",
      icon: Package,
      color: "blue",
    },
    {
      label: "LOW STOCK ALERT",
      value: stats?.lowStockCount ?? 0,
      link: "/admin/inventory/stock",
      icon: AlertTriangle,
      color: "amber",
      alert: (stats?.lowStockCount ?? 0) > 0,
    },
    {
      label: "OUT OF STOCK",
      value: stats?.outOfStockCount ?? 0,
      link: "/admin/inventory/stock",
      icon: ShieldAlert,
      color: "red",
      danger: (stats?.outOfStockCount ?? 0) > 0,
    },
    {
      label: "TOTAL ORDERS",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      color: "gray",
      badge: "Phase 3",
    },
    {
      label: "REVENUE TODAY",
      value: stats?.revenueToday !== undefined ? `₹${stats.revenueToday}` : "₹0",
      icon: IndianRupee,
      color: "gray",
      badge: "Phase 3",
    },
    {
      label: "PENDING ORDERS",
      value: stats?.pendingOrders ?? 0,
      icon: Clock,
      color: "gray",
      badge: "Phase 3",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="mt-1 text-himgiri-secondary-dark/60 font-medium">Welcome back to the Himgiri Goods Portal.</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, idx) => {
          const CardIcon = card.icon;
          const isPhase3 = !!card.badge;

          let bgClass = "bg-white border-gray-100";
          let textClass = "text-gray-900";
          let labelColorClass = "text-gray-400";
          let iconBgClass = "bg-gray-50 text-gray-400";

          if (card.alert) {
            bgClass = "bg-amber-50/55 border-amber-100 hover:bg-amber-50";
            textClass = "text-amber-600";
            iconBgClass = "bg-amber-100 text-amber-700";
          } else if (card.danger) {
            bgClass = "bg-red-50/50 border-red-100 hover:bg-red-50";
            textClass = "text-red-600";
            iconBgClass = "bg-red-100 text-red-700";
          } else if (isPhase3) {
            bgClass = "bg-gray-50/50 border-gray-200/60 opacity-60 hover:opacity-85 cursor-not-allowed";
            textClass = "text-gray-400";
            iconBgClass = "bg-gray-200/40 text-gray-400";
          } else if (card.color === "blue") {
            iconBgClass = "bg-blue-50 text-blue-600";
          }

          const cardContent = (
            <div className="flex items-center justify-between w-full h-full">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={clsx("text-xs font-bold uppercase tracking-wider block", labelColorClass)}>
                    {card.label}
                  </span>
                  {card.badge && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 uppercase tracking-widest border border-gray-300/40">
                      {card.badge}
                    </span>
                  )}
                </div>
                <span className={clsx("text-3xl font-black font-mono block", textClass)}>
                  {card.value}
                </span>
                {!isPhase3 && card.link && (
                  <span className={clsx(
                    "text-xs font-bold block group-hover:underline",
                    card.alert ? "text-amber-700" : card.danger ? "text-red-700" : "text-himgiri-primary"
                  )}>
                    {card.alert ? "Replenish Stock Immediately" : card.danger ? "Fix Stock-Outs" : "Manage Catalog "}
                  </span>
                )}
                {isPhase3 && (
                  <span className="text-xs text-gray-400 font-medium block">
                    Under Development
                  </span>
                )}
              </div>
              <div className={clsx("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105", iconBgClass)}>
                <CardIcon className="h-6 w-6" />
              </div>
            </div>
          );

          if (isPhase3 || !card.link) {
            return (
              <div 
                key={idx} 
                className={clsx("rounded-3xl p-6 border transition-all duration-300 flex items-center justify-between select-none", bgClass)}
              >
                {cardContent}
              </div>
            );
          }

          return (
            <Link
              key={idx}
              to={card.link}
              className={clsx("rounded-3xl p-6 border shadow-soft hover:shadow-lg transition-all duration-300 group flex items-center justify-between", bgClass)}
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

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
                <Route path="history" element={<StockHistoryPage />} />
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
