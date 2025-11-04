import { Request } from 'express';
import { UserRole, SellerRole, UserStatus } from '@prisma/client';

// Extend Express Request interface
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    sellerRole?: SellerRole | null;
    status: UserStatus;
  };
  validatedData?: any;
}

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: string | object;
}

// Pagination interface
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Product filter interface
export interface ProductFilter extends PaginationQuery {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  inStock?: boolean;
}

// Order filter interface
export interface OrderFilter extends PaginationQuery {
  status?: string;
  buyerId?: string;
  sellerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// User filter interface
export interface UserFilter extends PaginationQuery {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

// JWT Payload interface
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  sellerRole?: SellerRole | null;
  type: 'access' | 'refresh';
}

// Socket interface
export interface SocketUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  sellerRole?: SellerRole | null;
}

// File upload interface
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

// Cloudinary response interface
export interface CloudinaryResponse {
  public_id: string;
  version: number;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder?: boolean;
  url: string;
  secure_url: string;
  folder?: string;
  original_filename?: string;
}

// Email template data interfaces
export interface OrderStatusEmailData {
  orderNumber: string;
  status: string;
  buyerName: string;
  sellerName: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface WelcomeEmailData {
  name: string;
  role: UserRole;
}

// Bkash payment interfaces
export interface BkashPaymentRequest {
  amount: number;
  orderNumber: string;
  intent: 'sale';
  currency?: string;
}

export interface BkashTokenResponse {
  statusCode: string;
  statusMessage: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface BkashPaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL: string;
  failureCallbackURL: string;
  cancelledCallbackURL: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime: string;
  transactionStatus: string;
  merchantInvoiceNumber: string;
}

export interface BkashExecutePaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  paymentExecuteTime: string;
  merchantInvoiceNumber: string;
  updateTime: string;
}

// Analytics interfaces
export interface AnalyticsData {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  topSellers: Array<{
    id: string;
    name: string;
    businessName: string;
    orders: number;
    revenue: number;
  }>;
  orderStatusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

// Notification interfaces
export interface NotificationData {
  title: string;
  message: string;
  type: 'order_status' | 'payment' | 'general' | 'promotion';
  data?: object;
  userId: string;
}

export interface SocketNotification extends NotificationData {
  id: string;
  createdAt: Date;
}

// Cart interfaces
export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: string[];
    stock: number;
  };
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

// Review interfaces
export interface ReviewData {
  rating: number;
  comment?: string;
  images?: string[];
  productId: string;
  userId: string;
}

// Search interfaces
export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

// Error interfaces
export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  field?: string;
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export { UserRole, SellerRole, UserStatus, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';