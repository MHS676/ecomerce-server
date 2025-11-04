import { Socket } from 'socket.io';
import { JWTUtil } from '../utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const socketAuth = async (socket: Socket, next: Function) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

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

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    if (user.status !== 'ACTIVE') {
      return next(new Error('Authentication error: Account is suspended or banned'));
    }

    // Attach user to socket
    socket.data.user = user;
    
    // Join user to their personal room for private notifications
    socket.join(`user_${user.id}`);
    
    // Join seller-specific rooms if applicable
    if (user.role === 'SELLER') {
      socket.join('sellers');
      if (user.sellerRole) {
        socket.join(`seller_${user.sellerRole.toLowerCase()}`);
      }
    }
    
    // Join admin room if applicable
    if (user.role === 'ADMIN') {
      socket.join('admins');
    }
    
    // Join buyer room if applicable
    if (user.role === 'BUYER') {
      socket.join('buyers');
    }

    next();
  } catch (error: any) {
    next(new Error(`Authentication error: ${error.message}`));
  }
};