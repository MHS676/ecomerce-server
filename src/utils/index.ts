import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JwtPayload, UserRole, SellerRole } from '../types';

// JWT utility functions
export class JWTUtil {
  private static accessSecret = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
  private static refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
  private static accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  private static refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  static generateAccessToken(payload: {
    userId: string;
    email: string;
    role: UserRole;
    sellerRole?: SellerRole | null;
  }): string {
    const jwtPayload: JwtPayload = {
      ...payload,
      type: 'access',
    };
    
    return jwt.sign(jwtPayload as any, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
    } as any);
  }

  static generateRefreshToken(payload: {
    userId: string;
    email: string;
    role: UserRole;
    sellerRole?: SellerRole | null;
  }): string {
    const jwtPayload: JwtPayload = {
      ...payload,
      type: 'refresh',
    };
    
    return jwt.sign(jwtPayload as any, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
    } as any);
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.accessSecret) as JwtPayload;
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.refreshSecret) as JwtPayload;
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static generateTokenPair(payload: {
    userId: string;
    email: string;
    role: UserRole;
    sellerRole?: SellerRole | null;
  }) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }
}

// Password utility functions
export class PasswordUtil {
  private static saltRounds = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Response utility functions
export class ResponseUtil {
  static success<T>(message: string, data?: T, meta?: any) {
    return {
      success: true,
      message,
      data,
      meta,
    };
  }

  static error(message: string, statusCode: number = 400, error?: any) {
    return {
      success: false,
      message,
      error,
      statusCode,
    };
  }

  static paginate<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}

// Validation utility functions
export class ValidationUtil {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+8801|8801|01)[3-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  static sanitizeString(str: string): string {
    return str.trim().replace(/\s+/g, ' ');
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidImageType(mimetype: string): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(mimetype);
  }

  static isValidVideoType(mimetype: string): boolean {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    return validTypes.includes(mimetype);
  }
}

// Date utility functions
export class DateUtil {
  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  static formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  static isDateExpired(date: Date): boolean {
    return date < new Date();
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static getMonthStart(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  static getMonthEnd(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
}

// String utility functions
export class StringUtil {
  static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `ORD-${timestamp.toUpperCase()}-${randomStr.toUpperCase()}`;
  }

  static generateSKU(title: string, category: string): string {
    const titlePart = title.slice(0, 3).toUpperCase();
    const categoryPart = category.slice(0, 2).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${titlePart}${categoryPart}-${randomPart}`;
  }

  static truncate(text: string, length: number = 100): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}

// File utility functions
export class FileUtil {
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  static isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = this.getFileExtension(filename);
    return imageExtensions.includes(extension);
  }

  static isVideoFile(filename: string): boolean {
    const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
    const extension = this.getFileExtension(filename);
    return videoExtensions.includes(extension);
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static generateFileName(originalName: string, prefix?: string): string {
    const extension = this.getFileExtension(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const prefixPart = prefix ? `${prefix}_` : '';
    
    return `${prefixPart}${timestamp}_${random}.${extension}`;
  }
}

// Permission utility functions
export class PermissionUtil {
  static canManageProducts(role: UserRole, sellerRole?: SellerRole | null): boolean {
    if (role === UserRole.ADMIN) return true;
    if (role === UserRole.SELLER) {
      return sellerRole === SellerRole.MANAGER || sellerRole === SellerRole.INVENTORY_STAFF;
    }
    return false;
  }

  static canViewOrders(role: UserRole, sellerRole?: SellerRole | null): boolean {
    if (role === UserRole.ADMIN) return true;
    if (role === UserRole.SELLER) return true;
    if (role === UserRole.BUYER) return true;
    return false;
  }

  static canManageOrders(role: UserRole, sellerRole?: SellerRole | null): boolean {
    if (role === UserRole.ADMIN) return true;
    if (role === UserRole.SELLER) {
      return sellerRole === SellerRole.MANAGER;
    }
    return false;
  }

  static canViewFinancials(role: UserRole, sellerRole?: SellerRole | null): boolean {
    if (role === UserRole.ADMIN) return true;
    if (role === UserRole.SELLER) {
      return sellerRole === SellerRole.MANAGER || sellerRole === SellerRole.ACCOUNTANT;
    }
    return false;
  }

  static canManageUsers(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }
}

// Error utility functions
export class ErrorUtil {
  static createError(message: string, statusCode: number = 400, code?: string) {
    const error = new Error(message) as any;
    error.statusCode = statusCode;
    error.code = code;
    return error;
  }

  static createValidationError(field: string, message: string) {
    const error = new Error(message) as any;
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    error.field = field;
    return error;
  }

  static createNotFoundError(resource: string) {
    const error = new Error(`${resource} not found`) as any;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    return error;
  }

  static createUnauthorizedError(message: string = 'Unauthorized') {
    const error = new Error(message) as any;
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    return error;
  }

  static createForbiddenError(message: string = 'Forbidden') {
    const error = new Error(message) as any;
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    return error;
  }
}