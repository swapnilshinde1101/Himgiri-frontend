// ── Enums ──
export type AdminRole = 'SuperAdmin' | 'InventoryManager' | 'OrderManager';
export type StorageStatus = 'InStock' | 'PreOrder';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Packed' | 'Dispatched' | 'Delivered' | 'Refunded' | 'StockOut';
export type PaymentStatus = 'Pending' | 'Success' | 'Failed';
export type ItemCategory = 'Textbook' | 'Stationery' | 'Bag' | 'Journal' | 'DeliveryFee';

// ── Auth ──
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  token: string;
  name: string;
  email: string;
  role: AdminRole;
  expiresAt: string;
}

// ── Items ──
export interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  purchasePrice?: number;
  mrp: number;
  categoryName: string;
  categoryId: string;
  gradeNames: string;
  gradeIds: string[];
  stockQty: number;
  targetQty: number;
  unit: string;
  storageStatus: StorageStatus;
  isActive: boolean;
  isStockInitialized: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface CreateItemRequest {
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  purchasePrice?: number;
  mrp: number;
  categoryId: string;
  gradeIds: string[];
  stockQty: number;
  targetQty: number;
  unit: string;
  storageStatus: StorageStatus;
  isActive: boolean;
  isStockInitialized: boolean;
}

export interface CompletedStats {
  totalCompletedCount: number;
  totalPurchaseValue: number;
  totalRetailValue: number;
  mostCompletedCategory: string;
}

export interface DashboardStats {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalOrders: number;
  revenueToday: number;
  pendingOrders: number;
}

// ── Cart (frontend only) ──
export interface CartItem {
  item: Item;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  grade: number | null;
  includeDelivery: boolean;
}

// ── Orders ──
export interface CreateOrderRequest {
  customerName: string;
  email: string;
  mobile: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  grade: number;
  items: { itemId: string; quantity: number }[];
}

export interface OrderSummary {
  id: string;
  invoiceNumber: string;
  customerName: string;
  mobile: string;
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface OrderDetail extends OrderSummary {
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  grade: number;
  subTotal: number;
  totalGst: number;
  deliveryFee: number;
  deliveryGst: number;
  adminNotes?: string;
  items: OrderItemDto[];
}

export interface OrderItemDto {
  itemName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  gstPercent: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  lineTotal: number;
}

// ── API ──
export interface BaseRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
  onlyInitializedStock?: boolean;
  categoryId?: string;
  gradeId?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  stockStatus?: string;
  isCompleted?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  appError?: string;
  meta?: Meta;
}

export interface Meta {
  totalPages: number;
  pageSize: number;
  currentPage: number;
  totalRecords: number;
}

export interface StockLog {
  id: string;
  itemId: string;
  itemName: string;
  oldQty: number;
  newQty: number;
  changedBy: string;
  reason: string;
  createdAt: string;
}

export interface BulkInwardRequest {
  items: BulkInwardItem[];
  reason: string;
}

export interface BulkInwardItem {
  itemId: string;
  quantityToAdd: number;
}
