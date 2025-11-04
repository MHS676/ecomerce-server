import { PrismaClient, UserRole, SellerRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.dailyStats.deleteMany();

  // Create admin user
  console.log('👨‍💼 Creating admin user...');
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);
  const admin = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || 'admin@lagbe-kichu.xyz',
      password: adminPassword,
      name: process.env.ADMIN_NAME || 'System Administrator',
      phone: '+8801700000000',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // Create seller users with different roles
  console.log('🏪 Creating seller users...');
  const sellerManagerPassword = await bcrypt.hash('Manager@123456', 12);
  const sellerManager = await prisma.user.create({
    data: {
      email: 'manager@techstore.com',
      password: sellerManagerPassword,
      name: 'John Manager',
      phone: '+8801700000001',
      role: UserRole.SELLER,
      sellerRole: SellerRole.MANAGER,
      status: UserStatus.ACTIVE,
      businessName: 'Tech Store Bangladesh',
      businessPhone: '+8801700000001',
      businessAddress: 'Dhanmondi, Dhaka-1205, Bangladesh',
    },
  });

  const sellerAccountantPassword = await bcrypt.hash('Accountant@123456', 12);
  const sellerAccountant = await prisma.user.create({
    data: {
      email: 'accountant@techstore.com',
      password: sellerAccountantPassword,
      name: 'Sarah Accountant',
      phone: '+8801700000002',
      role: UserRole.SELLER,
      sellerRole: SellerRole.ACCOUNTANT,
      status: UserStatus.ACTIVE,
      businessName: 'Tech Store Bangladesh',
      businessPhone: '+8801700000001',
      businessAddress: 'Dhanmondi, Dhaka-1205, Bangladesh',
    },
  });

  const sellerInventoryPassword = await bcrypt.hash('Inventory@123456', 12);
  const sellerInventory = await prisma.user.create({
    data: {
      email: 'inventory@techstore.com',
      password: sellerInventoryPassword,
      name: 'Mike Inventory',
      phone: '+8801700000003',
      role: UserRole.SELLER,
      sellerRole: SellerRole.INVENTORY_STAFF,
      status: UserStatus.ACTIVE,
      businessName: 'Tech Store Bangladesh',
      businessPhone: '+8801700000001',
      businessAddress: 'Dhanmondi, Dhaka-1205, Bangladesh',
    },
  });

  // Create another seller
  const seller2Password = await bcrypt.hash('Seller@123456', 12);
  const seller2 = await prisma.user.create({
    data: {
      email: 'seller@fashionhub.com',
      password: seller2Password,
      name: 'Emma Fashion',
      phone: '+8801700000004',
      role: UserRole.SELLER,
      sellerRole: SellerRole.MANAGER,
      status: UserStatus.ACTIVE,
      businessName: 'Fashion Hub BD',
      businessPhone: '+8801700000004',
      businessAddress: 'Gulshan, Dhaka-1212, Bangladesh',
    },
  });

  // Create buyer users
  console.log('🛒 Creating buyer users...');
  const buyers = [];
  for (let i = 1; i <= 5; i++) {
    const buyerPassword = await bcrypt.hash(`Buyer${i}@123456`, 12);
    const buyer = await prisma.user.create({
      data: {
        email: `buyer${i}@example.com`,
        password: buyerPassword,
        name: `Buyer ${i}`,
        phone: `+880170000000${i + 10}`,
        role: UserRole.BUYER,
        status: UserStatus.ACTIVE,
      },
    });
    buyers.push(buyer);
  }

  // Create categories
  console.log('📂 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        slug: 'electronics',
        image: 'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Fashion',
        description: 'Clothing and accessories',
        slug: 'fashion',
        image: 'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Home & Garden',
        description: 'Home appliances and garden tools',
        slug: 'home-garden',
        image: 'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Books',
        description: 'Books and educational materials',
        slug: 'books',
        image: 'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Sports',
        description: 'Sports equipment and accessories',
        slug: 'sports',
        image: 'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg',
      },
    }),
  ]);

  // Create products
  console.log('📦 Creating products...');
  const products = [];

  // Electronics products by Tech Store
  const electronicsProducts = [
    {
      title: 'iPhone 15 Pro Max',
      description: 'Latest iPhone with A17 Pro chip, 48MP camera system, and titanium design.',
      price: 149999,
      discountPrice: 139999,
      stock: 25,
      sku: 'IP15PM-256-NAT',
      categoryId: categories[0].id,
      sellerId: sellerManager.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1640835546/sample2.jpg'
      ],
      video: 'https://res.cloudinary.com/demo/video/upload/v1640835545/sample.mp4',
      discountEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      title: 'Samsung Galaxy S24 Ultra',
      description: 'Premium Android smartphone with S Pen and advanced camera system.',
      price: 134999,
      discountPrice: 124999,
      stock: 30,
      sku: 'SGS24U-512-BLK',
      categoryId: categories[0].id,
      sellerId: sellerManager.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1640835546/sample2.jpg'
      ],
      discountEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },
    {
      title: 'MacBook Pro 14"',
      description: 'Apple MacBook Pro with M3 chip, 16GB RAM, and 512GB SSD.',
      price: 249999,
      stock: 15,
      sku: 'MBP14-M3-16-512',
      categoryId: categories[0].id,
      sellerId: sellerManager.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg'
      ],
    },
    {
      title: 'Sony WH-1000XM5',
      description: 'Premium noise-canceling wireless headphones with 30-hour battery life.',
      price: 39999,
      discountPrice: 34999,
      stock: 50,
      sku: 'SONY-WH1000XM5-BLK',
      categoryId: categories[0].id,
      sellerId: sellerManager.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg'
      ],
      discountEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
  ];

  // Fashion products by Fashion Hub
  const fashionProducts = [
    {
      title: 'Premium Cotton T-Shirt',
      description: 'Comfortable 100% cotton t-shirt available in multiple colors.',
      price: 1299,
      discountPrice: 999,
      stock: 100,
      sku: 'FH-TSHIRT-COT-001',
      categoryId: categories[1].id,
      sellerId: seller2.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg'
      ],
      discountEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
    {
      title: 'Denim Jacket',
      description: 'Classic denim jacket with modern fit and premium stitching.',
      price: 4999,
      stock: 40,
      sku: 'FH-JACKET-DENIM-001',
      categoryId: categories[1].id,
      sellerId: seller2.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg'
      ],
    },
    {
      title: 'Running Shoes',
      description: 'Lightweight running shoes with advanced cushioning technology.',
      price: 7999,
      discountPrice: 6499,
      stock: 60,
      sku: 'FH-SHOES-RUN-001',
      categoryId: categories[1].id,
      sellerId: seller2.id,
      images: [
        'https://res.cloudinary.com/demo/image/upload/v1640835545/sample.jpg'
      ],
      discountEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    },
  ];

  // Create all products
  for (const productData of [...electronicsProducts, ...fashionProducts]) {
    const product = await prisma.product.create({
      data: productData,
    });
    products.push(product);
  }

  // Create some sample reviews
  console.log('⭐ Creating sample reviews...');
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const reviewsCount = Math.floor(Math.random() * 3) + 1; // 1-3 reviews per product
    
    for (let j = 0; j < reviewsCount && j < buyers.length; j++) {
      await prisma.review.create({
        data: {
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 star ratings
          comment: `Great product! Really satisfied with the quality and performance. Highly recommended.`,
          productId: product.id,
          userId: buyers[j].id,
        },
      });
    }
  }

  // Create some sample orders
  console.log('📋 Creating sample orders...');
  for (let i = 0; i < 3; i++) {
    const buyer = buyers[i];
    const product = products[i];
    const seller = product.sellerId === sellerManager.id ? sellerManager : seller2;
    
    const quantity = Math.floor(Math.random() * 3) + 1;
    const itemPrice = Number(product.discountPrice || product.price);
    const subtotal = itemPrice * quantity;
    const shippingCost = 100;
    const total = subtotal + shippingCost;

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${i + 1}`,
        status: i === 0 ? 'PENDING_APPROVAL' : i === 1 ? 'PROCESSING' : 'COMPLETED',
        paymentMethod: i % 2 === 0 ? 'CASH_ON_DELIVERY' : 'BKASH',
        paymentStatus: i === 2 ? 'COMPLETED' : 'PENDING',
        subtotal,
        shippingCost,
        total,
        shippingAddress: {
          name: buyer.name,
          phone: buyer.phone,
          address: 'House 123, Road 456, Dhaka, Bangladesh',
          city: 'Dhaka',
          postalCode: '1000',
          country: 'Bangladesh',
        },
        buyerId: buyer.id,
        sellerId: seller.id,
        items: {
          create: [
            {
              quantity,
              price: itemPrice,
              productId: product.id,
            },
          ],
        },
        statusHistory: {
          create: [
            {
              status: 'PENDING_APPROVAL',
              notes: 'Order placed successfully',
            },
          ],
        },
      },
    });

    // Add additional status history for processed/completed orders
    if (i >= 1) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'PROCESSING',
          notes: 'Order approved and processing started',
        },
      });
    }

    if (i === 2) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'OUT_FOR_DELIVERY',
          notes: 'Order out for delivery',
        },
      });
      
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'COMPLETED',
          notes: 'Order delivered successfully',
        },
      });
    }
  }

  // Create some cart items for buyers
  console.log('🛒 Creating sample cart items...');
  for (let i = 0; i < 2; i++) {
    const buyer = buyers[i];
    const product = products[i + 3]; // Different products than orders
    
    await prisma.cartItem.create({
      data: {
        quantity: Math.floor(Math.random() * 3) + 1,
        userId: buyer.id,
        productId: product.id,
      },
    });
  }

  // Create daily stats
  console.log('📊 Creating daily stats...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await prisma.dailyStats.create({
    data: {
      date: today,
      totalOrders: 3,
      totalRevenue: 50000,
      totalUsers: buyers.length + 4, // buyers + sellers + admin
      totalProducts: products.length,
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📋 Created:');
  console.log(`- 1 Admin user (${admin.email})`);
  console.log(`- 4 Seller users with different roles`);
  console.log(`- ${buyers.length} Buyer users`);
  console.log(`- ${categories.length} Categories`);
  console.log(`- ${products.length} Products`);
  console.log('- Sample orders, reviews, and cart items');
  
  console.log('\n🔑 Login Credentials:');
  console.log('Admin:', admin.email, '/ Admin@123456');
  console.log('Seller Manager:', sellerManager.email, '/ Manager@123456');
  console.log('Seller Accountant:', sellerAccountant.email, '/ Accountant@123456');
  console.log('Seller Inventory:', sellerInventory.email, '/ Inventory@123456');
  console.log('Seller 2:', seller2.email, '/ Seller@123456');
  console.log('Buyers: buyer1@example.com to buyer5@example.com / Buyer1@123456 to Buyer5@123456');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });