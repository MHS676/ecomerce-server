import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { ResponseUtil } from '../utils';

export const notFound = (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  const message = `Route ${req.originalUrl} not found`;
  
  res.status(404).json(
    ResponseUtil.error(message, 404, {
      code: 'ROUTE_NOT_FOUND',
      method: req.method,
      url: req.originalUrl,
    })
  );
};