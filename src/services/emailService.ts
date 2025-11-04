import nodemailer from 'nodemailer';
import { OrderStatusEmailData, WelcomeEmailData } from '../types';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html,
      });

      console.log(`📧 Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error };
    }
  }

  // Welcome email template
  private getWelcomeEmailTemplate(data: WelcomeEmailData): string {
    const roleMessage = data.role === 'SELLER' 
      ? 'Thank you for joining as a seller! You can now start listing your products.'
      : data.role === 'BUYER'
      ? 'Welcome to our marketplace! Start exploring amazing products.'
      : 'Welcome to the admin panel!';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #2563eb; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .highlight { background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Lagbe Kichu! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            <p>${roleMessage}</p>
            
            <div class="highlight">
              <strong>What's next?</strong>
              <ul>
                <li>Complete your profile information</li>
                ${data.role === 'SELLER' ? '<li>Add your first product</li><li>Set up your business details</li>' : ''}
                ${data.role === 'BUYER' ? '<li>Browse our product categories</li><li>Add items to your wishlist</li>' : ''}
                <li>Explore all the features we offer</li>
              </ul>
            </div>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <a href="${process.env.CLIENT_URL}" class="button">Visit Lagbe Kichu</a>
          </div>
          <div class="footer">
            <p>&copy; 2025 Lagbe Kichu. All rights reserved.</p>
            <p>This email was sent to ${data.name}. If you didn't create this account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Order status email template
  private getOrderStatusEmailTemplate(data: OrderStatusEmailData): string {
    const statusColors: { [key: string]: string } = {
      'PENDING_APPROVAL': '#f59e0b',
      'PROCESSING': '#3b82f6',
      'OUT_FOR_DELIVERY': '#8b5cf6',
      'COMPLETED': '#10b981',
      'CANCELLED': '#ef4444',
      'REJECTED': '#ef4444',
    };

    const statusColor = statusColors[data.status] || '#6b7280';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: ${statusColor}; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          .status-badge { display: inline-block; padding: 6px 12px; background-color: ${statusColor}; color: white; border-radius: 20px; font-size: 14px; margin: 10px 0; }
          .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .item { border-bottom: 1px solid #e5e5e5; padding: 10px 0; }
          .item:last-child { border-bottom: none; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
            <p>Order #${data.orderNumber}</p>
          </div>
          <div class="content">
            <h2>Hello ${data.buyerName}!</h2>
            <p>Your order status has been updated:</p>
            
            <div class="status-badge">${data.status.replace('_', ' ')}</div>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Seller:</strong> ${data.sellerName}</p>
              <p><strong>Total Amount:</strong> ৳${data.total.toLocaleString()}</p>
              
              <h4>Items:</h4>
              ${data.items.map(item => `
                <div class="item">
                  <strong>${item.name}</strong><br>
                  Quantity: ${item.quantity} × ৳${item.price.toLocaleString()} = ৳${(item.quantity * item.price).toLocaleString()}
                </div>
              `).join('')}
            </div>
            
            ${data.status === 'OUT_FOR_DELIVERY' ? 
              '<p>🚚 Your order is on its way! You should receive it soon.</p>' : 
              data.status === 'COMPLETED' ? 
              '<p>✅ Your order has been delivered successfully! Thank you for shopping with us.</p>' :
              data.status === 'CANCELLED' || data.status === 'REJECTED' ?
              '<p>❌ Unfortunately, your order has been cancelled. If you have any questions, please contact support.</p>' :
              '<p>We will keep you updated as your order progresses.</p>'
            }
            
            <a href="${process.env.CLIENT_URL}/orders/${data.orderNumber}" class="button">Track Order</a>
          </div>
          <div class="footer">
            <p>&copy; 2025 Lagbe Kichu. All rights reserved.</p>
            <p>For support, contact us at support@lagbe-kichu.xyz</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send welcome email
  async sendWelcomeEmail(email: string, data: WelcomeEmailData) {
    const subject = `Welcome to Lagbe Kichu, ${data.name}! 🎉`;
    const html = this.getWelcomeEmailTemplate(data);
    return this.sendEmail(email, subject, html);
  }

  // Send order status email
  async sendOrderStatusEmail(email: string, data: OrderStatusEmailData) {
    const subject = `Order Update: ${data.orderNumber} - ${data.status.replace('_', ' ')}`;
    const html = this.getOrderStatusEmailTemplate(data);
    return this.sendEmail(email, subject, html);
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, resetToken: string, userName: string) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #ef4444; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; color: #7f1d1d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>We received a request to reset your password for your Lagbe Kichu account.</p>
            
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
            </div>
            
            <p>To reset your password, click the button below:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace;">${resetUrl}</p>
            
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Lagbe Kichu. All rights reserved.</p>
            <p>For security questions, contact us at security@lagbe-kichu.xyz</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = 'Reset Your Lagbe Kichu Password 🔒';
    return this.sendEmail(email, subject, html);
  }

  // Send verification email
  async sendVerificationEmail(email: string, verificationToken: string, userName: string) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #10b981; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Thank you for signing up with Lagbe Kichu! To complete your registration, please verify your email address.</p>
            
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace;">${verificationUrl}</p>
            
            <p><strong>This verification link will expire in 24 hours.</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Lagbe Kichu. All rights reserved.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = 'Verify Your Lagbe Kichu Account ✉️';
    return this.sendEmail(email, subject, html);
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();