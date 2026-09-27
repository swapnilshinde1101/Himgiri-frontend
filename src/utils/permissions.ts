import type { AdminRole, PermissionCode } from '../types';

export const ROLE_PERMISSIONS: Record<AdminRole, PermissionCode[]> = {
  SuperAdmin: [
    'catalog:view',
    'catalog:manage',
    'catalog:edit_pricing',
    'stock:view',
    'stock:inward',
    'stock:adjust',
    'orders:view',
    'orders:fulfill',
    'orders:notes',
    'orders:refund',
    'orders:export',
    'reports:accounts',
    'reports:inventory',
    'reports:staff_audit',
    'settings:view',
    'settings:manage',
    'staff:manage'
  ],
  InventoryManager: [
    'catalog:view',
    'catalog:manage',
    'catalog:edit_pricing',
    'stock:view',
    'stock:inward',
    'stock:adjust',
    'reports:inventory'
  ],
  OrderManager: [
    'catalog:view',
    'stock:view',
    'orders:view',
    'orders:fulfill',
    'orders:notes',
    'orders:export'
  ]
};

export const PERMISSION_DESCRIPTIONS: Record<PermissionCode, { name: string; module: string; description: string }> = {
  'catalog:view': { name: 'View Catalog', module: 'Catalog', description: 'Browse and search items, textbooks, and categories.' },
  'catalog:manage': { name: 'Manage Catalog', module: 'Catalog', description: 'Create, edit, and deactivate catalog products.' },
  'catalog:edit_pricing': { name: 'Edit Item Pricing', module: 'Catalog', description: 'Update item purchase prices, MRP, and selling prices.' },
  'stock:view': { name: 'View Inventory', module: 'Inventory', description: 'Check live stock levels and warehouse thresholds.' },
  'stock:inward': { name: 'Inward Stock', module: 'Inventory', description: 'Add inventory shipments and purchase stock.' },
  'stock:adjust': { name: 'Adjust Stock', module: 'Inventory', description: 'Perform manual stock adjustments with audit reason.' },
  'orders:view': { name: 'View Orders', module: 'Orders', description: 'Browse customer orders, addresses, and payment details.' },
  'orders:fulfill': { name: 'Fulfill Orders', module: 'Orders', description: 'Advance order statuses (Packed, Dispatched, Delivered).' },
  'orders:notes': { name: 'Order Notes', module: 'Orders', description: 'Append internal fulfillment and delivery notes.' },
  'orders:refund': { name: 'Process Refunds', module: 'Orders', description: 'Issue refunds and mark orders as refunded.' },
  'orders:export': { name: 'Export Orders', module: 'Orders', description: 'Download CSV and Excel order fulfillment sheets.' },
  'reports:accounts': { name: 'Financial Reports', module: 'Reports', description: 'View revenue totals, GST distributions, and accounts.' },
  'reports:inventory': { name: 'Inventory Valuation', module: 'Reports', description: 'View stock margins, retail valuation, and shortages.' },
  'reports:staff_audit': { name: 'Audit Stream', module: 'Reports', description: 'Inspect chronological system audit logs.' },
  'settings:view': { name: 'View Settings', module: 'Settings', description: 'Inspect GST rates and vendor registry parameters.' },
  'settings:manage': { name: 'Manage Settings', module: 'Settings', description: 'Configure vendor GSTIN, state codes, and taxes.' },
  'staff:manage': { name: 'Staff Management', module: 'Settings', description: 'Onboard staff, assign roles, and reset credentials.' }
};
