import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, ShieldAlert, ShoppingBag, IndianRupee, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { inventoryService } from '../../services/inventoryService';

export default function DashboardPage() {
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
      link: "/admin/accounts/orders",
      icon: ShoppingBag,
      color: "blue",
    },
    {
      label: "REVENUE TODAY",
      value: stats?.revenueToday !== undefined ? `₹${stats.revenueToday.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : "₹0",
      link: "/admin/reports/accounts",
      icon: IndianRupee,
      color: "emerald",
    },
    {
      label: "PENDING ORDERS",
      value: stats?.pendingOrders ?? 0,
      link: "/admin/accounts/orders",
      icon: Clock,
      color: "amber",
      alert: (stats?.pendingOrders ?? 0) > 0,
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
          } else if (card.color === "blue") {
            iconBgClass = "bg-blue-50 text-blue-600";
          } else if (card.color === "emerald") {
            iconBgClass = "bg-emerald-50 text-emerald-600";
          }

          const cardContent = (
            <div className="flex items-center justify-between w-full h-full">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={clsx("text-xs font-bold uppercase tracking-wider block", labelColorClass)}>
                    {card.label}
                  </span>
                </div>
                <span className={clsx("text-3xl font-black font-mono block", textClass)}>
                  {card.value}
                </span>
                {card.link && (
                  <span className={clsx(
                    "text-xs font-bold block group-hover:underline",
                    card.label === "TOTAL ORDERS" ? "text-blue-600" :
                    card.label === "REVENUE TODAY" ? "text-emerald-600" :
                    card.alert ? "text-amber-700" : 
                    card.danger ? "text-red-700" : "text-himgiri-primary"
                  )}>
                    {card.label === "TOTAL ORDERS" ? "View All Orders →" :
                     card.label === "REVENUE TODAY" ? "View Accounts Report →" :
                     card.alert ? "Review Action Items →" : 
                     card.danger ? "Fix Stock-Outs →" : "Manage Catalog →"}
                  </span>
                )}
              </div>
              <div className={clsx("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105", iconBgClass)}>
                <CardIcon className="h-6 w-6" />
              </div>
            </div>
          );

          if (!card.link) {
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
}
