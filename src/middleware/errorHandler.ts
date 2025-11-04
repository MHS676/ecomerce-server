import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { ResponseUtil, ErrorUtil } from '../utils';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Handle different types of errors
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code;

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // Prisma errors
  if (error.code === 'P2002') {
    statusCode = 409;
    message = `Duplicate entry: ${error.meta?.target?.join(', ') || 'field'} already exists`;
    code = 'DUPLICATE_ENTRY';
  } else if (error.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
    code = 'NOT_FOUND';
  } else if (error.code?.startsWith('P')) {
    statusCode = 400;
    message = 'Database operation failed';
    code = 'DATABASE_ERROR';
  }

  // Zod validation errors
  if (error.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    
    const validationErrors = error.issues.map((issue: any) => ({
      field: issue.path.join('.'),
      message: issue.message,
      value: issue.received,
    }));
    
    res.status(statusCode).json(
      ResponseUtil.error(message, statusCode, { validation: validationErrors })
    );
    return;
  }

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File size too large';
    code = 'FILE_SIZE_ERROR';
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
    code = 'INVALID_FILE_FIELD';
  }

  // MongoDB/Mongoose errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    
    const validationErrors = Object.values(error.errors as any).map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));
    
    res.status(statusCode).json(
      ResponseUtil.error(message, statusCode, { validation: validationErrors })
    );
    return;
  }

  // CORS errors
  if (error.message === 'Not allowed by CORS') {
    statusCode = 403;
    message = 'CORS policy violation';
    code = 'CORS_ERROR';
  }

  // Rate limiting errors
  if (error.message && error.message.includes('Too many requests')) {
    statusCode = 429;
    message = 'Too many requests, please try again later';
    code = 'RATE_LIMIT_EXCEEDED';
  }

  // Network/Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Service unavailable';
    code = 'SERVICE_UNAVAILABLE';
  }

  // Development vs Production error details
  const errorResponse: any = {
    success: false,
    message,
    error: {
      code,
      statusCode,
    },
  };

  // Include stack trace and additional details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = {
      name: error.name,
      originalMessage: error.message,
      code: error.code,
    };
  }

  // Log error for monitoring
  if (statusCode >= 500) {
    console.error(`Server Error [${statusCode}]:`, {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as AuthenticatedRequest).user?.id,
    });
  }

  res.status(statusCode).json(errorResponse);
}