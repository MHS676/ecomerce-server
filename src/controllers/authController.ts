import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, ApiResponse, JwtPayload } from '../types';
import { 
  JWTUtil, 
  PasswordUtil, 
  ResponseUtil, 
  ErrorUtil, 
  ValidationUtil 
} from '../utils';

const prisma = new PrismaClient();

export class AuthController {
  // Register new user
  async register(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const {
        email,
        password,
        name,
        phone,
        role = 'BUYER',
        sellerRole,
        businessName,
        businessPhone,
        businessAddress,
      } = req.validatedData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw ErrorUtil.createError('Email already registered', 409);
      }

      // Hash password
      const hashedPassword = await PasswordUtil.hashPassword(password);

      // Create user
      const userData: any = {
        email,
        password: hashedPassword,
        name: ValidationUtil.sanitizeString(name),
        role,
        status: 'ACTIVE',
      };

      // Add optional fields
      if (phone) userData.phone = phone;

      // Add seller-specific fields
      if (role === 'SELLER') {
        userData.sellerRole = sellerRole;
        userData.businessName = ValidationUtil.sanitizeString(businessName);
        userData.businessPhone = businessPhone;
        userData.businessAddress = ValidationUtil.sanitizeString(businessAddress);
      }

      const user = await prisma.user.create({
        data: userData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          sellerRole: true,
          businessName: true,
          businessPhone: true,
          businessAddress: true,
          status: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const { accessToken, refreshToken } = JWTUtil.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        sellerRole: user.sellerRole,
      });

      // Save refresh token to database
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json(
        ResponseUtil.success('Account created successfully', {
          user,
          tokens: {
            accessToken,
            refreshToken,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Login user
  async login(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { email, password } = req.validatedData;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          phone: true,
          role: true,
          sellerRole: true,
          businessName: true,
          businessPhone: true,
          businessAddress: true,
          status: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw ErrorUtil.createUnauthorizedError('Invalid email or password');
      }

      // Check if account is active
      if (user.status !== 'ACTIVE') {
        throw ErrorUtil.createUnauthorizedError('Account is suspended or banned');
      }

      // Verify password
      const isValidPassword = await PasswordUtil.comparePassword(password, user.password);
      if (!isValidPassword) {
        throw ErrorUtil.createUnauthorizedError('Invalid email or password');
      }

      // Generate tokens
      const { accessToken, refreshToken } = JWTUtil.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        sellerRole: user.sellerRole,
      });

      // Save refresh token to database
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Remove password from response
      const { password: _, ...userResponse } = user;

      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(
        ResponseUtil.success('Login successful', {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Refresh access token
  async refreshToken(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { refreshToken } = req.validatedData;

      // Verify refresh token
      const decoded = JWTUtil.verifyRefreshToken(refreshToken);

      // Check if refresh token exists in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              sellerRole: true,
              status: true,
            },
          },
        },
      });

      if (!tokenRecord) {
        throw ErrorUtil.createUnauthorizedError('Invalid refresh token');
      }

      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        // Clean up expired token
        await prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });
        throw ErrorUtil.createUnauthorizedError('Refresh token expired');
      }

      // Check if user is still active
      if (tokenRecord.user.status !== 'ACTIVE') {
        throw ErrorUtil.createUnauthorizedError('Account is suspended or banned');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = JWTUtil.generateTokenPair({
        userId: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        sellerRole: tokenRecord.user.sellerRole,
      });

      // Update refresh token in database
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Set new cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(
        ResponseUtil.success('Token refreshed successfully', {
          user: tokenRecord.user,
          tokens: {
            accessToken,
            refreshToken: newRefreshToken,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Logout user
  async logout(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        // Remove refresh token from database
        await prisma.refreshToken.deleteMany({
          where: { 
            token: refreshToken,
            userId: req.user!.id 
          },
        });
      }

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json(ResponseUtil.success('Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }

  // Logout from all devices
  async logoutAll(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      // Remove all refresh tokens for the user
      await prisma.refreshToken.deleteMany({
        where: { userId: req.user!.id },
      });

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json(ResponseUtil.success('Logged out from all devices successfully'));
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.validatedData;
      const userId = req.user!.id;

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) {
        throw ErrorUtil.createNotFoundError('User');
      }

      // Verify current password
      const isValidPassword = await PasswordUtil.comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        throw ErrorUtil.createUnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await PasswordUtil.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      // Logout from all devices (invalidate all refresh tokens)
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json(ResponseUtil.success('Password changed successfully. Please login again.'));
    } catch (error) {
      next(error);
    }
  }

  // Get user profile
  async getProfile(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          sellerRole: true,
          businessName: true,
          businessPhone: true,
          businessAddress: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw ErrorUtil.createNotFoundError('User');
      }

      res.json(ResponseUtil.success('Profile retrieved successfully', { user }));
    } catch (error) {
      next(error);
    }
  }

  // Verify token
  async verifyToken(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      res.json(
        ResponseUtil.success('Token is valid', {
          user: req.user,
          isAuthenticated: true,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Check authentication status
  async checkAuth(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      res.json(
        ResponseUtil.success('Authentication status retrieved', {
          user: req.user || null,
          isAuthenticated: !!req.user,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}