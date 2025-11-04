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

1. **Register User** - Create a new account
   - Automatically saves tokens to environment variables
2. **Login User** - Login with existing credentials
   - Automatically saves tokens to environment variables
3. **Get Profile** - Test authentication with saved token

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

## Testing Tips

1. **Start with Health Check** - Ensure server is running
2. **Register/Login First** - Most endpoints require authentication
3. **Check Console** - Postman console shows helpful logs
4. **Use Variables** - Leverage environment variables for IDs and tokens
5. **Test Error Cases** - Try requests without tokens to test error handling

## Troubleshooting

### Common Issues

1. **401 Unauthorized**

   - Check if you're logged in
   - Verify access token is set in environment
   - Try refreshing token

2. **404 Not Found**

   - Ensure server is running on correct port
   - Check if endpoint exists (some are placeholders)

3. **500 Internal Server Error**
   - Check server console for detailed error
   - Ensure database is connected
   - Verify environment variables are set

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
