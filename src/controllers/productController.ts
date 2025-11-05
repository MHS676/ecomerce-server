import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, ApiResponse, ProductFilter } from '../types';
import { 
  ResponseUtil, 
  ErrorUtil, 
  ValidationUtil,
  StringUtil,
  PermissionUtil 
} from '../utils';

const prisma = new PrismaClient();

export class ProductController {
  // Get all products with filtering and pagination
  async getProducts(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const {
        page: pageParam = '1',
        limit: limitParam = '10',
        category,
        search,
        minPrice,
        maxPrice,
        sellerId,
        inStock,
        isActive = true,
        sort = 'createdAt',
        order = 'desc',
      } = req.query as any;

      // Convert string parameters to numbers
      const page = parseInt(pageParam as string, 10) || 1;
      const limit = parseInt(limitParam as string, 10) || 10;
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where: any = {
        isActive: isActive === 'true' || isActive === true,
      };

      if (category) {
        where.category = {
          OR: [
            { slug: category },
            { id: category },
            { name: { contains: category, mode: 'insensitive' } },
          ],
        };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
      }

      if (sellerId) {
        where.sellerId = sellerId;
      }

      if (inStock === 'true') {
        where.stock = { gt: 0 };
      }

      // Build order by clause
      const orderBy: any = {};
      orderBy[sort] = order;

      // Get products
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
            seller: {
              select: { 
                id: true, 
                name: true, 
                businessName: true,
                avatar: true 
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                reviews: true,
                orderItems: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      // Calculate average ratings
      const productsWithRatings = products.map((product: any) => {
        const avgRating = product.reviews.length > 0
          ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length
          : 0;
        
        const { reviews: _, ...productWithoutReviews } = product;
        
        return {
          ...productWithoutReviews,
          avgRating: Math.round(avgRating * 10) / 10,
          totalReviews: product._count.reviews,
          totalSales: product._count.orderItems,
        };
      });

      const totalPages = Math.ceil(total / limit);

      res.json(
        ResponseUtil.success('Products retrieved successfully', 
          ResponseUtil.paginate(productsWithRatings, page, limit, total)
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // Get single product by ID
  async getProduct(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          seller: {
            select: { 
              id: true, 
              name: true, 
              businessName: true,
              businessPhone: true,
              avatar: true,
            },
          },
          reviews: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
      });

      if (!product) {
        throw ErrorUtil.createNotFoundError('Product');
      }

      // Calculate average rating
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length
        : 0;

      const productWithRating = {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: product._count.reviews,
        totalSales: product._count.orderItems,
      };

      res.json(ResponseUtil.success('Product retrieved successfully', { product: productWithRating }));
    } catch (error) {
      next(error);
    }
  }

  // Create new product (Seller only)
  async createProduct(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const {
        title,
        description,
        price,
        discountPrice,
        discountEndDate,
        stock,
        categoryId,
        images,
        video,
        isActive = true,
      } = req.validatedData;

      const userId = req.user!.id;

      // Check permission
      if (!PermissionUtil.canManageProducts(req.user!.role, req.user!.sellerRole)) {
        throw ErrorUtil.createForbiddenError('You do not have permission to manage products');
      }

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw ErrorUtil.createNotFoundError('Category');
      }

      // Generate SKU
      const sku = StringUtil.generateSKU(title, category.name);

      // Create product
      const product = await prisma.product.create({
        data: {
          title: ValidationUtil.sanitizeString(title),
          description: ValidationUtil.sanitizeString(description),
          price,
          discountPrice,
          discountEndDate: discountEndDate ? new Date(discountEndDate) : null,
          stock,
          sku,
          categoryId,
          sellerId: userId,
          images,
          video,
          isActive,
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          seller: {
            select: { 
              id: true, 
              name: true, 
              businessName: true 
            },
          },
        },
      });

      res.status(201).json(ResponseUtil.success('Product created successfully', { product }));
    } catch (error) {
      next(error);
    }
  }

  // Update product (Seller only - own products)
  async updateProduct(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.validatedData;
      const userId = req.user!.id;

      // Check permission
      if (!PermissionUtil.canManageProducts(req.user!.role, req.user!.sellerRole)) {
        throw ErrorUtil.createForbiddenError('You do not have permission to manage products');
      }

      // Get existing product
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!existingProduct) {
        throw ErrorUtil.createNotFoundError('Product');
      }

      // Check ownership (sellers can only update their own products)
      if (req.user!.role === 'SELLER' && existingProduct.sellerId !== userId) {
        throw ErrorUtil.createForbiddenError('You can only update your own products');
      }

      // Validate category if being updated
      if (updateData.categoryId && updateData.categoryId !== existingProduct.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: updateData.categoryId },
        });

        if (!category) {
          throw ErrorUtil.createNotFoundError('Category');
        }
      }

      // Sanitize string fields
      if (updateData.title) {
        updateData.title = ValidationUtil.sanitizeString(updateData.title);
      }
      if (updateData.description) {
        updateData.description = ValidationUtil.sanitizeString(updateData.description);
      }

      // Handle discount end date
      if (updateData.discountEndDate) {
        updateData.discountEndDate = new Date(updateData.discountEndDate);
      }

      // Update product
      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          seller: {
            select: { 
              id: true, 
              name: true, 
              businessName: true 
            },
          },
        },
      });

      res.json(ResponseUtil.success('Product updated successfully', { product }));
    } catch (error) {
      next(error);
    }
  }

  // Delete product (Seller only - own products)
  async deleteProduct(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check permission
      if (!PermissionUtil.canManageProducts(req.user!.role, req.user!.sellerRole)) {
        throw ErrorUtil.createForbiddenError('You do not have permission to manage products');
      }

      // Get existing product
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw ErrorUtil.createNotFoundError('Product');
      }

      // Check ownership (sellers can only delete their own products)
      if (req.user!.role === 'SELLER' && existingProduct.sellerId !== userId) {
        throw ErrorUtil.createForbiddenError('You can only delete your own products');
      }

      // Check if product has orders
      const orderCount = await prisma.orderItem.count({
        where: { productId: id },
      });

      if (orderCount > 0) {
        // Soft delete by deactivating instead of hard delete
        await prisma.product.update({
          where: { id },
          data: { isActive: false },
        });

        res.json(ResponseUtil.success('Product deactivated successfully (has existing orders)'));
      } else {
        // Hard delete if no orders exist
        await prisma.product.delete({
          where: { id },
        });

        res.json(ResponseUtil.success('Product deleted successfully'));
      }
    } catch (error) {
      next(error);
    }
  }

  // Get seller's products
  async getSellerProducts(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const {
        page: pageParam = '1',
        limit: limitParam = '10',
        search,
        isActive,
        sort = 'createdAt',
        order = 'desc',
      } = req.query as any;

      // Convert string parameters to numbers
      const page = parseInt(pageParam as string, 10) || 1;
      const limit = parseInt(limitParam as string, 10) || 10;
      const sellerId = req.user!.id;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { sellerId };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      // Build order by clause
      const orderBy: any = {};
      orderBy[sort] = order;

      // Get products
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
            _count: {
              select: {
                reviews: true,
                orderItems: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      res.json(
        ResponseUtil.success('Seller products retrieved successfully', 
          ResponseUtil.paginate(products, page, limit, total)
        )
      );
    } catch (error) {
      next(error);
    }
  }

  // Search products
  async searchProducts(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const {
        q: query = '',
        category,
        minPrice,
        maxPrice,
        rating,
        sortBy = 'newest',
        page: pageParam = '1',
        limit: limitParam = '10',
      } = req.query as any;

      // Convert string parameters to numbers
      const page = parseInt(pageParam as string, 10) || 1;
      const limit = parseInt(limitParam as string, 10) || 10;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        isActive: true,
        stock: { gt: 0 },
      };

      if (query) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ];
      }

      if (category) {
        where.categoryId = category;
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
      }

      // Build order by clause
      let orderBy: any = {};
      switch (sortBy) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'popular':
          orderBy = { orderItems: { _count: 'desc' } };
          break;
        case 'rating':
          // This would require a computed field or subquery
          orderBy = { createdAt: 'desc' }; // Fallback
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      // Get products
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
            seller: {
              select: { 
                id: true, 
                name: true, 
                businessName: true,
                avatar: true 
              },
            },
            reviews: {
              select: { rating: true },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      // Calculate average ratings and filter by rating if specified
      let filteredProducts = products.map((product: any) => {
        const avgRating = product.reviews.length > 0
          ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length
          : 0;
        
        const { reviews: _, ...productWithoutReviews } = product;
        
        return {
          ...productWithoutReviews,
          avgRating: Math.round(avgRating * 10) / 10,
        };
      });

      if (rating) {
        filteredProducts = filteredProducts.filter((product: any) => 
          product.avgRating >= parseFloat(rating)
        );
      }

      res.json(
        ResponseUtil.success('Search completed successfully', 
          ResponseUtil.paginate(filteredProducts, page, limit, total)
        )
      );
    } catch (error) {
      next(error);
    }
  }
}