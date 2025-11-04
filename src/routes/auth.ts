import express from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema } from '../utils/validation';

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), authController.changePassword);
router.get('/me', authenticate, authController.getProfile);
router.get('/verify', authenticate, authController.verifyToken);

// Optional auth routes
router.get('/check', optionalAuth, authController.checkAuth);

export default router;