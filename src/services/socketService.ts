import { Server, Socket } from 'socket.io';
import { SocketUser, SocketNotification } from '../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Setup socket event handlers
export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const user: SocketUser = socket.data.user;
    
    console.log(`👤 User connected: ${user.name} (${user.role}) - Socket ID: ${socket.id}`);

    // Handle joining specific rooms
    socket.on('join-room', (room: string) => {
      socket.join(room);
      console.log(`🏠 User ${user.name} joined room: ${room}`);
    });

    // Handle leaving specific rooms
    socket.on('leave-room', (room: string) => {
      socket.leave(room);
      console.log(`🚪 User ${user.name} left room: ${room}`);
    });

    // Handle order status updates (sellers)
    socket.on('order-status-update', async (data: { orderId: string; status: string; notes?: string }): Promise<void> => {
      try {
        if (user.role !== 'SELLER' && user.role !== 'ADMIN') {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Get order details
        const order = await prisma.order.findUnique({
          where: { id: data.orderId },
          include: {
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true, businessName: true } },
            items: {
              include: {
                product: { select: { title: true } }
              }
            }
          }
        });

        if (!order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }

        // Check if user owns this order (sellers can only update their own orders)
        if (user.role === 'SELLER' && order.sellerId !== user.id) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Notify buyer about status change
        const notification: SocketNotification = {
          id: `notif_${Date.now()}`,
          title: 'Order Status Updated',
          message: `Your order #${order.orderNumber} status has been updated to ${data.status}`,
          type: 'order_status',
          userId: order.buyerId,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: data.status,
            notes: data.notes,
          },
          createdAt: new Date(),
        };

        // Send notification to buyer
        io.to(`user_${order.buyerId}`).emit('notification', notification);
        
        // Send order update to all relevant users
        io.to(`user_${order.buyerId}`).emit('order-updated', {
          orderId: order.id,
          status: data.status,
          notes: data.notes,
        });

        // Acknowledge to sender
        socket.emit('order-status-updated', {
          success: true,
          orderId: order.id,
          status: data.status,
        });

        console.log(`📦 Order ${order.orderNumber} status updated to ${data.status} by ${user.name}`);
      } catch (error: any) {
        console.error('Error updating order status:', error);
        socket.emit('error', { message: 'Failed to update order status' });
      }
    });

    // Handle new order notifications (to sellers)
    socket.on('new-order', async (data: { orderId: string }): Promise<void> => {
      try {
        if (user.role !== 'BUYER') {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const order = await prisma.order.findUnique({
          where: { id: data.orderId },
          include: {
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true, businessName: true } },
            items: {
              include: {
                product: { select: { title: true } }
              }
            }
          }
        });

        if (!order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }

        // Notify seller about new order
        const notification: SocketNotification = {
          id: `notif_${Date.now()}`,
          title: 'New Order Received',
          message: `You have received a new order #${order.orderNumber} from ${order.buyer.name}`,
          type: 'order_status',
          userId: order.sellerId,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            buyerName: order.buyer.name,
            total: order.total,
            itemCount: order.items.length,
          },
          createdAt: new Date(),
        };

        // Send notification to seller
        io.to(`user_${order.sellerId}`).emit('notification', notification);
        
        // Send to all sellers (for dashboard updates)
        io.to('sellers').emit('new-order', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          buyerName: order.buyer.name,
          total: order.total,
        });

        console.log(`🆕 New order ${order.orderNumber} notification sent to seller ${order.seller.name}`);
      } catch (error: any) {
        console.error('Error sending new order notification:', error);
        socket.emit('error', { message: 'Failed to send notification' });
      }
    });

    // Handle payment status updates
    socket.on('payment-status-update', async (data: { orderId: string; status: string; transactionId?: string }): Promise<void> => {
      try {
        const order = await prisma.order.findUnique({
          where: { id: data.orderId },
          include: {
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true } }
          }
        });

        if (!order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }

        const notification: SocketNotification = {
          id: `notif_${Date.now()}`,
          title: 'Payment Status Updated',
          message: `Payment for order #${order.orderNumber} has been ${data.status.toLowerCase()}`,
          type: 'payment',
          userId: order.buyerId,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentStatus: data.status,
            transactionId: data.transactionId,
          },
          createdAt: new Date(),
        };

        // Send to buyer
        io.to(`user_${order.buyerId}`).emit('notification', notification);
        
        // Send to seller
        io.to(`user_${order.sellerId}`).emit('payment-updated', {
          orderId: order.id,
          status: data.status,
          transactionId: data.transactionId,
        });

        console.log(`💳 Payment status updated for order ${order.orderNumber}: ${data.status}`);
      } catch (error: any) {
        console.error('Error updating payment status:', error);
        socket.emit('error', { message: 'Failed to update payment status' });
      }
    });

    // Handle typing indicators (for chat/messages)
    socket.on('typing', (data: { room: string; userName: string }) => {
      socket.to(data.room).emit('user-typing', {
        userName: data.userName,
        userId: user.id,
      });
    });

    socket.on('stop-typing', (data: { room: string; userName: string }) => {
      socket.to(data.room).emit('user-stop-typing', {
        userName: data.userName,
        userId: user.id,
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason: string) => {
      console.log(`👋 User disconnected: ${user.name} (${user.role}) - Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error: any) => {
      console.error(`Socket error for user ${user.name}:`, error);
    });
  });

  // Broadcast system-wide announcements
  io.on('system-announcement', (data: { title: string; message: string; type: string }) => {
    io.emit('announcement', {
      id: `announcement_${Date.now()}`,
      title: data.title,
      message: data.message,
      type: data.type,
      createdAt: new Date(),
    });
  });
};

// Helper functions for sending notifications
export const sendNotificationToUser = (userId: string, notification: SocketNotification) => {
  if (global.io) {
    global.io.to(`user_${userId}`).emit('notification', notification);
  }
};

export const sendOrderUpdate = (buyerId: string, sellerId: string, orderData: any) => {
  if (global.io) {
    global.io.to(`user_${buyerId}`).emit('order-updated', orderData);
    global.io.to(`user_${sellerId}`).emit('order-updated', orderData);
  }
};

export const sendNewOrderNotification = (sellerId: string, orderData: any) => {
  if (global.io) {
    global.io.to(`user_${sellerId}`).emit('new-order', orderData);
    global.io.to('sellers').emit('new-order', orderData);
  }
};

export const sendPaymentUpdate = (buyerId: string, sellerId: string, paymentData: any) => {
  if (global.io) {
    global.io.to(`user_${buyerId}`).emit('payment-updated', paymentData);
    global.io.to(`user_${sellerId}`).emit('payment-updated', paymentData);
  }
};

export const broadcastToRole = (role: string, event: string, data: any) => {
  if (global.io) {
    const roomMap = {
      admin: 'admins',
      seller: 'sellers',
      buyer: 'buyers',
    };
    
    const room = roomMap[role as keyof typeof roomMap];
    if (room) {
      global.io.to(room).emit(event, data);
    }
  }
};

export const broadcastSystemAnnouncement = (announcement: { title: string; message: string; type: string }) => {
  if (global.io) {
    global.io.emit('announcement', {
      id: `announcement_${Date.now()}`,
      ...announcement,
      createdAt: new Date(),
    });
  }
};