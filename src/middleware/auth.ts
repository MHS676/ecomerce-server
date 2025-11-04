import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole, SellerRole } from '../types';
import { JWTUtil, ErrorUtil, PermissionUtil } from '../utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Authentication middleware
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Check for token in cookies
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ErrorUtil.createUnauthorizedError('Access token required');
    }

    // Verify token
    const decoded = JWTUtil.verifyAccessToken(token);

    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        sellerRole: true,
        status: true,
      },
    });

    if (!user) {
      throw ErrorUtil.createUnauthorizedError('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw ErrorUtil.createUnauthorizedError('Account is suspended or banned');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Check for token in cookies
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        // Verify token
        const decoded = JWTUtil.verifyAccessToken(token);

        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            sellerRole: true,
            status: true,
          },
        });

        if (user && user.status === 'ACTIVE') {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ErrorUtil.createUnauthorizedError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw ErrorUtil.createForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Seller role-based authorization middleware
export const authorizeSellerRole = (...allowedSellerRoles: SellerRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ErrorUtil.createUnauthorizedError('Authentication required');
      }

      if (req.user.role !== UserRole.SELLER && req.user.role !== UserRole.ADMIN) {
        throw ErrorUtil.createForbiddenError('Seller access required');
      }

      // Admin bypass
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      if (!req.user.sellerRole || !allowedSellerRoles.includes(req.user.sellerRole)) {
        throw ErrorUtil.createForbiddenError('Insufficient seller permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Permission-based middleware
export const requirePermission = (permissionCheck: (role: UserRole, sellerRole?: SellerRole | null) => boolean) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ErrorUtil.createUnauthorizedError('Authentication required');
      }

      const hasPermission = permissionCheck(req.user.role, req.user.sellerRole);
      
      if (!hasPermission) {
        throw ErrorUtil.createForbiddenError('Permission denied');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Admin only middleware
export const adminOnly = authorize(UserRole.ADMIN);

// Seller only middleware (any seller role)
export const sellerOnly = authorize(UserRole.SELLER);

// Buyer only middleware
export const buyerOnly = authorize(UserRole.BUYER);

// Manager role middleware
export const managerOnly = authorizeSellerRole(SellerRole.MANAGER);

// Manager or Accountant middleware
export const managerOrAccountant = authorizeSellerRole(SellerRole.MANAGER, SellerRole.ACCOUNTANT);

// Manager or Inventory middleware
export const managerOrInventory = authorizeSellerRole(SellerRole.MANAGER, SellerRole.INVENTORY_STAFF);

// Product management permission middleware
export const canManageProducts = requirePermission(PermissionUtil.canManageProducts);

// Order management permission middleware
export const canManageOrders = requirePermission(PermissionUtil.canManageOrders);

// Financial access permission middleware
export const canViewFinancials = requirePermission(PermissionUtil.canViewFinancials);

// Resource ownership middleware (for users to access their own resources)
export const requireOwnership = (resourceIdParam: string = 'id', allowAdminAccess: boolean = true) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ErrorUtil.createUnauthorizedError('Authentication required');
      }

      const resourceId = req.params[resourceIdParam];
      
      // Admin bypass if allowed
      if (allowAdminAccess && req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Check if user owns the resource
      if (resourceId !== req.user.id) {
        throw ErrorUtil.createForbiddenError('Access denied: You can only access your own resources');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Seller ownership middleware (for sellers to access their own products/orders)
export const requireSellerOwnership = (resourceField: string = 'sellerId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ErrorUtil.createUnauthorizedError('Authentication required');
      }

      // Admin bypass
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Only sellers can use this middleware
      if (req.user.role !== UserRole.SELLER) {
        throw ErrorUtil.createForbiddenError('Seller access required');
      }

      // The actual ownership check will be done in the controller
      // as it requires database access to check the resource
      req.body._requireSellerOwnership = {
        sellerId: req.user.id,
        field: resourceField,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};