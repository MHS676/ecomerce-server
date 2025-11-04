import express from 'express';
import { ProductController } from '../controllers/productController';
import { 
  authenticate, 
  optionalAuth, 
  canManageProducts,
  requireSellerOwnership 
} from '../middleware/auth';
import { validateRequest } from '../utils/validation';
import { 
  createProductSchema, 
  updateProductSchema, 
  productFilterSchema,
  searchSchema 
} from '../utils/validation';

const router = express.Router();
const productController = new ProductController();

// Public routes
router.get('/', optionalAuth, validateRequest(productFilterSchema), productController.getProducts);
router.get('/search', optionalAuth, validateRequest(searchSchema), productController.searchProducts);
router.get('/:id', optionalAuth, productController.getProduct);

// Protected routes - Seller/Admin only
router.use(authenticate);

// Seller routes
router.get('/seller/my-products', canManageProducts, productController.getSellerProducts);
router.post('/', canManageProducts, validateRequest(createProductSchema), productController.createProduct);
router.put('/:id', canManageProducts, requireSellerOwnership('sellerId'), validateRequest(updateProductSchema), productController.updateProduct);
router.delete('/:id', canManageProducts, requireSellerOwnership('sellerId'), productController.deleteProduct);

export default router;