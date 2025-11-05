import { z } from 'zod';
import { UserRole, SellerRole, OrderStatus, PaymentMethod } from '../types';

// Base validation schemas
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(1, 'Email is required');

export const phoneSchema = z.string()
  .regex(/^(\+8801|8801|01)[3-9]\d{8}$/, 'Invalid Bangladesh phone number format')
  .transform((phone: string) => phone.replace(/\s/g, ''));

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/, 'Password must contain at least one special character');

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .transform((name: string) => name.trim());

export const paginationSchema = z.object({
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100').default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Authentication schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema.optional(),
  role: z.nativeEnum(UserRole).default(UserRole.BUYER),
  sellerRole: z.nativeEnum(SellerRole).optional(),
  businessName: z.string().min(1, 'Business name is required').optional(),
  businessPhone: phoneSchema.optional(),
  businessAddress: z.string().min(1, 'Business address is required').optional(),
}).refine(
  (data: any) => {
    if (data.role === UserRole.SELLER) {
      return data.sellerRole && data.businessName && data.businessPhone && data.businessAddress;
    }
    return true;
  },
  {
    message: 'Seller role, business name, phone, and address are required for seller registration',
    path: ['sellerRole'],
  }
);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(
  (data: any) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// User schemas
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema.optional(),
  businessName: z.string().min(1).optional(),
  businessPhone: phoneSchema.optional(),
  businessAddress: z.string().min(1).optional(),
  avatar: z.string().url().optional(),
});

export const userFilterSchema = paginationSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
  search: z.string().optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
  reason: z.string().optional(),
});

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name must be less than 50 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  image: z.string().url('Invalid image URL').optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

// Product schemas
export const createProductSchema = z.object({
  title: z.string().min(1, 'Product title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Product description is required').max(2000, 'Description must be less than 2000 characters'),
  price: z.coerce.number().positive('Price must be positive').max(9999999.99, 'Price too high'),
  discountPrice: z.coerce.number().positive().max(9999999.99).optional(),
  discountEndDate: z.coerce.date().min(new Date(), 'Discount end date must be in the future').optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative').max(999999, 'Stock too high'),
  categoryId: z.string().uuid('Invalid category ID'),
  images: z.array(z.string().url()).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
  video: z.string().url('Invalid video URL').optional(),
  isActive: z.boolean().default(true),
}).refine(
  (data: any) => {
    if (data.discountPrice && data.price) {
      return data.discountPrice < data.price;
    }
    return true;
  },
  {
    message: 'Discount price must be less than regular price',
    path: ['discountPrice'],
  }
);

export const updateProductSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  discountPrice: z.number().positive().optional(),
  discountEndDate: z.string().datetime().optional(),
  quantity: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  images: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const productFilterSchema = paginationSchema.extend({
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sellerId: z.string().uuid().optional(),
  inStock: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

// Order schemas
export const shippingAddressSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  address: z.string().min(1, 'Address is required').max(500, 'Address too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  postalCode: z.string().min(1, 'Postal code is required').max(20, 'Postal code too long'),
  country: z.string().min(1, 'Country is required').max(100, 'Country name too long'),
});

export const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(999, 'Quantity too high'),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export const orderFilterSchema = paginationSchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  buyerId: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});

// Cart schemas
export const addToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(999, 'Quantity too high'),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(999, 'Quantity too high'),
});

// Review schemas
export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000, 'Comment too long').optional(),
  images: z.array(z.string().url()).max(5, 'Maximum 5 images allowed').optional(),
});

export const reviewFilterSchema = paginationSchema.extend({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  productId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  type: z.enum(['image', 'video']),
  folder: z.string().optional(),
});

// Payment schemas
export const bkashPaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  amount: z.coerce.number().positive('Amount must be positive'),
});

export const bkashCallbackSchema = z.object({
  paymentID: z.string().min(1, 'Payment ID is required'),
  status: z.string().min(1, 'Status is required'),
});

// Analytics schemas
export const analyticsFilterSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sellerId: z.string().uuid().optional(),
});

// Notification schemas
export const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  type: z.enum(['order_status', 'payment', 'general', 'promotion']),
  data: z.record(z.any()).optional(),
  userId: z.string().uuid('Invalid user ID'),
});

// Search schemas
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'popular']).default('newest'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// Validation middleware helper
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse({
        ...req.body,
        ...req.query,
        ...req.params,
      });
      
      // Separate body, query, and params
      req.validatedData = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};