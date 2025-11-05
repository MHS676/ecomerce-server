<!-- @format -->

# E-commerce API Postman Collection

This folder contains Postman collection and environment files for testing the E-commerce API endpoints.

## Files

- `E-commerce-API.postman_collection.json` - Complete API collection with all endpoints
- `E-commerce-API.postman_environment.json` - Environment variables for the collection

## How to Import

### 1. Import Collection

1. Open Postman
2. Click "Import" button
3. Drag and drop `E-commerce-API.postman_collection.json` or click "Upload Files"
4. Click "Import"

### 2. Import Environment

1. In Postman, go to "Environments" tab (gear icon)
2. Click "Import"
3. Drag and drop `E-commerce-API.postman_environment.json` or click "Upload Files"
4. Click "Import"

### 3. Set Environment

1. In the top right corner, select "E-commerce API Environment" from the dropdown
2. Make sure your server is running on `http://localhost:5000`

## Quick Start Guide

### 1. Start Your Server

```bash
npm run dev
# or
npm start
```

### 2. Test Basic Endpoints

1. **Health Check** - Test if server is running
2. **API Info** - Get information about available endpoints

### 3. Authentication Flow

1. **Register User** - Create a new buyer account
   - Uses role: "BUYER" (default)
   - Automatically saves tokens to environment variables
2. **Register Seller** - Create a seller account with business information
   - Uses role: "SELLER"
   - Requires additional fields: sellerRole, businessName, businessPhone, businessAddress
   - Available sellerRoles: "MANAGER", "ACCOUNTANT", "INVENTORY_STAFF"
   - Automatically saves tokens to environment variables
3. **Login User** - Login with existing credentials
   - Automatically saves tokens to environment variables
4. **Get Profile** - Test authentication with saved token

### 4. Product Management (Requires Authentication)

1. **Create Product** - Add a new product (Seller/Admin role required)
2. **Get All Products** - View all products (Public)
3. **Update Product** - Modify existing product (Owner/Admin only)
4. **Delete Product** - Remove product (Owner/Admin only)

## Environment Variables

The collection automatically manages these variables:

- `baseUrl`: API base URL (default: http://localhost:5000)
- `accessToken`: JWT access token (auto-set on login/register)
- `refreshToken`: JWT refresh token (auto-set on login/register)
- `userId`: Current user ID
- `productId`: Product ID for testing (default: 1)
- `categoryId`: Category ID for testing (default: 1)

## Authentication

The collection includes automatic token management:

- **Auto Token Storage**: Login and Register requests automatically save tokens
- **Auto Token Usage**: Protected endpoints automatically use saved tokens
- **Token Refresh**: Use the "Refresh Token" endpoint when access token expires

## API Endpoints Included

### Health & Info

- `GET /health` - Server health check
- `GET /api` - API information and available endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `GET /me` - Get user profile
- `GET /verify` - Verify token validity
- `GET /check` - Check auth status
- `POST /change-password` - Change password
- `POST /logout` - Logout current device
- `POST /logout-all` - Logout all devices

### Products (`/api/products`)

- `GET /` - Get all products (with filters)
- `GET /search` - Search products
- `GET /:id` - Get product by ID
- `GET /seller/my-products` - Get seller's products
- `POST /` - Create product (Seller/Admin)
- `PUT /:id` - Update product (Owner/Admin)
- `DELETE /:id` - Delete product (Owner/Admin)

### Other Endpoints

- Categories (`/api/categories`)
- Orders (`/api/orders`)
- Users (`/api/users`)
- Admin (`/api/admin`)
- Upload (`/api/upload`)
- Payments (`/api/payments`)

_Note: Some endpoints are placeholders and will return "coming soon" messages._

## User Roles & Permissions

### Available User Roles

- **BUYER** (default): Can browse products, place orders, manage their profile
- **SELLER**: Can manage their own products, view their orders, business account features
- **ADMIN**: Full system access, can manage all users, products, and orders

### Seller Roles (for SELLER users)

- **MANAGER**: Full business management access
- **ACCOUNTANT**: Financial and reporting access
- **INVENTORY_STAFF**: Product and stock management access

### Role-based Access Examples

- **Public Access**: Health check, API info, browse products
- **BUYER Access**: Place orders, manage cart, user profile
- **SELLER Access**: Create/manage own products, view seller dashboard
- **ADMIN Access**: Manage all users, products, system administration

## Testing Tips

1. **Start with Health Check** - Ensure server is running
2. **Register/Login First** - Most endpoints require authentication
3. **Check Console** - Postman console shows helpful logs
4. **Use Variables** - Leverage environment variables for IDs and tokens
5. **Test Error Cases** - Try requests without tokens to test error handling

## Troubleshooting

### Common Issues

1. **401 Unauthorized - "Invalid or expired access token"**

   - ⚠️ **Most Common Issue**: No login performed first
   - **Solution**: Run "Register User" or "Login User" first to get tokens
   - **Check**: Use "🔍 Debug Token Status" to verify token validity
   - **Token Expiry**: Access tokens expire in 15 minutes - login again if expired
   - **Environment**: Verify token is saved in environment variables

2. **404 Not Found**

   - Ensure server is running on correct port (http://localhost:5000)
   - Check if endpoint exists (some are placeholders)
   - Verify API path is correct

3. **500 Internal Server Error**

   - Check server console for detailed error
   - Ensure database is connected and migrated (`npx prisma migrate dev`)
   - Verify environment variables are set in `.env` file

4. **Token Debugging Steps**
   - Use "🔍 Debug Token Status" endpoint to check token validity
   - Check Postman Console for token information
   - Verify tokens are auto-saved after login/register
   - Ensure Authorization header format: `Bearer <token>`

### Server Requirements

Make sure your `.env` file has these variables configured:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh secret
- `PORT` - Server port (default: 5000)

## Collection Features

- **Auto Token Management** - Automatically handles JWT tokens
- **Error Handling** - Global tests for common error scenarios
- **Variable Management** - Uses environment variables for flexibility
- **Documentation** - Each request includes detailed descriptions
- **Pre-request Scripts** - Automatic token refresh logic
- **Test Scripts** - Automatic response validation

Happy Testing! 🚀
