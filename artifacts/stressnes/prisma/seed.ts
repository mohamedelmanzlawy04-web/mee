/**
 * STRESSNES Database Seed
 * Task 2: Database Architecture
 *
 * Creates:
 * - 1 Admin user
 * - 3 Collections (Summer, Core, Limited)
 * - 5 Categories (Tops, Bottoms, Outerwear, Accessories, Footwear)
 * - 3 Shipping methods (Bosta standard, Bosta express, Aramex)
 * - 10 Products with variants, inventory, and images
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting STRESSNES seed...');

  // ─── Admin User ───────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@Str3ssnes!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@stressnes.com' },
    update: {},
    create: {
      email: 'admin@stressnes.com',
      passwordHash: adminPassword,
      fullName: 'STRESSNES Admin',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ─── Collections ──────────────────────────────────────────────
  const [summerCollection, coreCollection, limitedCollection] = await Promise.all([
    prisma.collection.upsert({
      where: { slug: 'summer-collection' },
      update: {},
      create: {
        name: 'Summer Collection',
        slug: 'summer-collection',
        description: 'Effortless warm-weather pieces crafted for the discerning wardrobe.',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'core-collection' },
      update: {},
      create: {
        name: 'Core Collection',
        slug: 'core-collection',
        description: 'Timeless essentials that anchor every luxury wardrobe.',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.collection.upsert({
      where: { slug: 'limited-edition' },
      update: {},
      create: {
        name: 'Limited Edition',
        slug: 'limited-edition',
        description: 'Exclusive pieces produced in strictly limited quantities.',
        sortOrder: 3,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Collections: Summer, Core, Limited');

  // ─── Categories ───────────────────────────────────────────────
  const [tops, bottoms, outerwear, accessories, footwear] = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'tops' },
      update: {},
      create: { name: 'Tops', slug: 'tops', description: 'Shirts, blouses, and knitwear', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'bottoms' },
      update: {},
      create: { name: 'Bottoms', slug: 'bottoms', description: 'Trousers, skirts, and shorts', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'outerwear' },
      update: {},
      create: { name: 'Outerwear', slug: 'outerwear', description: 'Coats, jackets, and blazers', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: { name: 'Accessories', slug: 'accessories', description: 'Bags, belts, and jewellery', sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { slug: 'footwear' },
      update: {},
      create: { name: 'Footwear', slug: 'footwear', description: 'Shoes, boots, and sandals', sortOrder: 5 },
    }),
  ]);
  console.log('✅ Categories: Tops, Bottoms, Outerwear, Accessories, Footwear');

  // ─── Shipping Methods ─────────────────────────────────────────
  await Promise.all([
    prisma.shippingMethod.upsert({
      where: { id: 'sm-bosta-standard' },
      update: {},
      create: {
        id: 'sm-bosta-standard',
        name: 'Bosta Standard Delivery',
        carrier: 'BOSTA',
        price: 50,
        estimatedDays: 3,
        isActive: true,
        minOrderAmount: 3000,
      },
    }),
    prisma.shippingMethod.upsert({
      where: { id: 'sm-bosta-express' },
      update: {},
      create: {
        id: 'sm-bosta-express',
        name: 'Bosta Express',
        carrier: 'BOSTA',
        price: 100,
        estimatedDays: 1,
        isActive: true,
      },
    }),
    prisma.shippingMethod.upsert({
      where: { id: 'sm-aramex' },
      update: {},
      create: {
        id: 'sm-aramex',
        name: 'Aramex International',
        carrier: 'ARAMEX',
        price: 350,
        estimatedDays: 7,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Shipping methods: Bosta Standard, Bosta Express, Aramex');

  // ─── Products ─────────────────────────────────────────────────
  const productDefs = [
    // TOPS (Summer + Core)
    {
      title: 'Linen Relaxed Shirt',
      slug: 'linen-relaxed-shirt',
      sku: 'TOP-LRS-001',
      shortDescription: 'Breathable linen shirt with a relaxed silhouette.',
      description: 'Cut from the finest European linen, this shirt embodies the effortless luxury of warm-weather dressing. The relaxed fit allows for ease of movement while maintaining a polished presence.',
      price: 1850,
      comparePrice: 2200,
      costPrice: 680,
      categoryId: tops.id,
      collectionId: summerCollection.id,
      status: 'ACTIVE' as const,
      published: true,
      featured: true,
      weight: 0.2,
      seoTitle: 'Linen Relaxed Shirt | STRESSNES',
      seoDescription: 'Breathable European linen shirt. Relaxed luxury silhouette.',
      variants: [
        { sku: 'TOP-LRS-001-S-WHT', size: 'S', color: 'White', material: 'Linen', stock: 12 },
        { sku: 'TOP-LRS-001-M-WHT', size: 'M', color: 'White', material: 'Linen', stock: 18 },
        { sku: 'TOP-LRS-001-L-WHT', size: 'L', color: 'White', material: 'Linen', stock: 10 },
        { sku: 'TOP-LRS-001-M-SND', size: 'M', color: 'Sand', material: 'Linen', stock: 14 },
      ],
    },
    {
      title: 'Silk Crêpe Blouse',
      slug: 'silk-crepe-blouse',
      sku: 'TOP-SCB-001',
      shortDescription: 'Fluid silk crêpe blouse with delicate drape.',
      description: 'Woven from pure Mulberry silk, this blouse captures the essence of refined femininity. The crêpe weave lends a subtle texture while maintaining the luminous quality unique to silk.',
      price: 3200,
      costPrice: 1100,
      categoryId: tops.id,
      collectionId: coreCollection.id,
      status: 'ACTIVE' as const,
      published: true,
      featured: true,
      weight: 0.15,
      variants: [
        { sku: 'TOP-SCB-001-XS-IVR', size: 'XS', color: 'Ivory', material: 'Silk', stock: 6 },
        { sku: 'TOP-SCB-001-S-IVR', size: 'S', color: 'Ivory', material: 'Silk', stock: 8 },
        { sku: 'TOP-SCB-001-M-IVR', size: 'M', color: 'Ivory', material: 'Silk', stock: 8 },
        { sku: 'TOP-SCB-001-S-BLK', size: 'S', color: 'Black', material: 'Silk', stock: 10 },
        { sku: 'TOP-SCB-001-M-BLK', size: 'M', color: 'Black', material: 'Silk', stock: 10 },
      ],
    },
    // BOTTOMS
    {
      title: 'Tailored Wide-Leg Trousers',
      slug: 'tailored-wide-leg-trousers',
      sku: 'BOT-TWL-001',
      shortDescription: 'Precision-cut wide-leg trousers in Italian wool.',
      description: 'These wide-leg trousers are constructed from single-ply Italian wool, offering remarkable structure without weight. A high waist and generous leg create an elegant, commanding silhouette.',
      price: 2750,
      comparePrice: 3100,
      costPrice: 950,
      categoryId: bottoms.id,
      collectionId: coreCollection.id,
      status: 'ACTIVE' as const,
      published: true,
      featured: false,
      weight: 0.45,
      variants: [
        { sku: 'BOT-TWL-001-36-CHR', size: '36', color: 'Charcoal', material: 'Wool', stock: 8 },
        { sku: 'BOT-TWL-001-38-CHR', size: '38', color: 'Charcoal', material: 'Wool', stock: 10 },
        { sku: 'BOT-TWL-001-40-CHR', size: '40', color: 'Charcoal', material: 'Wool', stock: 8 },
        { sku: 'BOT-TWL-001-38-CRM', size: '38', color: 'Cream', material: 'Wool', stock: 6 },
        { sku: 'BOT-TWL-001-40-CRM', size: '40', color: 'Cream', material: 'Wool', stock: 6 },
      ],
    },
    {
      title: 'Asymmetric Silk Skirt',
      slug: 'asymmetric-silk-skirt',
      sku: 'BOT-ASS-001',
      shortDescription: 'Bias-cut asymmetric skirt in liquid silk charmeuse.',
      description: 'This asymmetric midi skirt flows in silk charmeuse, a fabric known for its liquid drape and luminous surface. The bias cut ensures perfect movement with every step.',
      price: 2400,
      categoryId: bottoms.id,
      collectionId: summerCollection.id,
      status: 'ACTIVE' as const,
      published: true,
      featured: false,
      weight: 0.2,
      variants: [
        { sku: 'BOT-ASS-001-XS-GLD', size: 'XS', color: 'Gold', material: 'Silk', stock: 4 },
        { sku: 'BOT-ASS-001-S-GLD', size: 'S', color: 'Gold', material: 'Silk', stock: 6 },
        { sku: 'BOT-ASS-001-M-GLD', size: 'M', color: 'Gold', material: 'Silk', stock: 6 },
        { sku: 'BOT-ASS-001-S-BLK', size: 'S', color: 'Black', material: 'Silk', stock: 8 },
      ],
    },
    // OUTERWEAR
    {
      title: 'Oversized Cashmere Coat',
      slug: 'oversized-cashmere-coat',
      sku: 'OUT-OCC-001',
      shortDescription: 'Double-faced cashmere coat with oversized silhouette.',
      description: 'The pinnacle of winter luxury. This coat is constructed from Scottish double-faced cashmere, eliminating the need for a lining while creating a sumptuous weight and warmth.',
      price: 12500,
      comparePrice: 14000,
      costPrice: 4200,
      categoryId: outerwear.id,
      collectionId: limitedCollection.id,
      status: 'ACTIVE' as const,
      published: true,
      featured: true,
      weight: 1.8,
      variants: [
        { sku: 'OUT-OCC-001-S-CAM', size: 'S', color: 'Camel', material: 'Cashmere', stock: 3 },
        { sku: 'OUT-OCC-001-M-CAM', size: 'M', color: 'Camel', material: 'Cashmere', stock: 4 },
        { sku: 'OUT-OCC-001-L-CAM', size: 'L', color: 'Camel', material: 'Cashmere', stock: 3 },
        { sku: 'OUT-OCC-001-M-OAT', size: 'M', color: 'Oatmeal', material: 'Cashmere', stock: 3 },
      ],
    },
    {
      title: 'Structured Blazer',
      slug: 'structured-blazer',
      sku: 'OUT-SBL-001',
      shortDescription: 'Precisely tailored Italian wool blazer.',
      description: 'Tailored in partnership with a Neapolitan workshop, this blazer represents the pinnacle of craft. The half-canvassed construction gives the lapel its natural roll, while the Italian wool suiting offers both comfort and authority.',
      price: 6800,
      costPrice: 2200,
      categoryId: outerwear.id,
      collectionId: coreCollection.id,
      status: 'ACTIVE' as const,
      published: true,
      featured: true,
      weight: 0.9,
      variants: [
        { sku: 'OUT-SBL-001-36-BLK', size: '36', color: 'Black', material: 'Wool', stock: 5 },
        { sku: 'OUT-SBL-001-38-BLK', size: '38', color: 'Black', material: 'Wool', stock: 7 },
        { sku: 'OUT-SBL-001-40-BLK', size: '40', color: 'Black', material: 'Wool', stock: 6 },
        { sku: 'OUT-SBL-001-38-NVY', size: '38', color: 'Navy', material: 'Wool', stock: 5 },
      ],
    },
    // ACCESSORIES
    {
      title: 'Mini Structured Bag',
      slug: 'mini-structured-bag',
      sku: 'ACC-MSB-001',
      shortDescription: 'Hand-stitched calfskin mini bag.',
      description: 'This compact structured bag is hand-stitched in full-grain calfskin at our partner atelier in Florence. Gold-tone hardware complements the leather\'s natural warmth.',
      price: 8900,
      comparePrice: 9500,
      costPrice: 2800,
      categoryId: accessories.id,
      collectionId: limitedCollection.id,
      status: 'ACTIVE' as const,
      published: true,
      featured: true,
      weight: 0.35,
      variants: [
        { sku: 'ACC-MSB-001-ONE-BLK', size: 'One Size', color: 'Black', material: 'Calfskin', stock: 5 },
        { sku: 'ACC-MSB-001-ONE-TAN', size: 'One Size', color: 'Tan', material: 'Calfskin', stock: 4 },
        { sku: 'ACC-MSB-001-ONE-BRG', size: 'One Size', color: 'Burgundy', material: 'Calfskin', stock: 3 },
      ],
    },
    {
      title: 'Silk Scarf',
      slug: 'silk-scarf',
      sku: 'ACC-SSC-001',
      shortDescription: '100% silk twill hand-rolled scarf.',
      description: 'A 90cm square of pure silk twill, hand-printed in Lyon, France. The hand-rolled edges are the mark of authentic luxury, requiring several minutes of careful work per metre.',
      price: 1600,
      costPrice: 480,
      categoryId: accessories.id,
      collectionId: summerCollection.id,
      status: 'ACTIVE' as const,
      published: true,
      featured: false,
      weight: 0.08,
      variants: [
        { sku: 'ACC-SSC-001-ONE-FLR', size: 'One Size', color: 'Floral Multi', material: 'Silk', stock: 20 },
        { sku: 'ACC-SSC-001-ONE-GEO', size: 'One Size', color: 'Geometric Navy', material: 'Silk', stock: 18 },
      ],
    },
    // FOOTWEAR
    {
      title: 'Leather Mule',
      slug: 'leather-mule',
      sku: 'FTW-LMU-001',
      shortDescription: 'Backless leather mule with block heel.',
      description: 'Crafted in vegetable-tanned calf leather from a Tuscan tannery, these mules feature a comfortable 6cm block heel. The slip-on silhouette embodies effortless sophistication.',
      price: 3900,
      comparePrice: 4400,
      costPrice: 1300,
      categoryId: footwear.id,
      collectionId: coreCollection.id,
      status: 'ACTIVE' as const,
      published: true,
      featured: false,
      weight: 0.65,
      variants: [
        { sku: 'FTW-LMU-001-37-BLK', size: '37', color: 'Black', material: 'Calf Leather', stock: 4 },
        { sku: 'FTW-LMU-001-38-BLK', size: '38', color: 'Black', material: 'Calf Leather', stock: 6 },
        { sku: 'FTW-LMU-001-39-BLK', size: '39', color: 'Black', material: 'Calf Leather', stock: 6 },
        { sku: 'FTW-LMU-001-40-BLK', size: '40', color: 'Black', material: 'Calf Leather', stock: 4 },
        { sku: 'FTW-LMU-001-38-NUD', size: '38', color: 'Nude', material: 'Calf Leather', stock: 5 },
        { sku: 'FTW-LMU-001-39-NUD', size: '39', color: 'Nude', material: 'Calf Leather', stock: 5 },
      ],
    },
    {
      title: 'Suede Chelsea Boot',
      slug: 'suede-chelsea-boot',
      sku: 'FTW-SCB-001',
      shortDescription: 'Spanish suede Chelsea boot with leather sole.',
      description: 'Made in Spain from Grade A suede and finished with a Blake-stitched leather sole, this Chelsea boot is the definitive transitional-season staple. The elastic gore ensures a precise, comfortable fit.',
      price: 5200,
      costPrice: 1750,
      categoryId: footwear.id,
      collectionId: coreCollection.id,
      status: 'ACTIVE' as const,
      published: true,
      featured: false,
      weight: 0.85,
      variants: [
        { sku: 'FTW-SCB-001-37-CHR', size: '37', color: 'Charcoal', material: 'Suede', stock: 3 },
        { sku: 'FTW-SCB-001-38-CHR', size: '38', color: 'Charcoal', material: 'Suede', stock: 5 },
        { sku: 'FTW-SCB-001-39-CHR', size: '39', color: 'Charcoal', material: 'Suede', stock: 5 },
        { sku: 'FTW-SCB-001-40-CHR', size: '40', color: 'Charcoal', material: 'Suede', stock: 3 },
        { sku: 'FTW-SCB-001-38-TAN', size: '38', color: 'Tan', material: 'Suede', stock: 4 },
        { sku: 'FTW-SCB-001-39-TAN', size: '39', color: 'Tan', material: 'Suede', stock: 4 },
      ],
    },
  ];

  for (const def of productDefs) {
    const { variants, ...productData } = def;

    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: {
        ...productData,
        price: productData.price,
        comparePrice: 'comparePrice' in productData ? productData.comparePrice : undefined,
        costPrice: 'costPrice' in productData ? productData.costPrice : undefined,
        images: {
          create: {
            url: `https://placehold.co/800x1000/121212/FAFAFA?text=${encodeURIComponent(productData.title)}`,
            altText: productData.title,
            isPrimary: true,
            sortOrder: 0,
          },
        },
        variants: {
          create: variants.map(({ stock, ...v }) => ({
            ...v,
            inventory: {
              create: {
                currentStock: stock,
                reservedStock: 0,
                lowStockThreshold: 3,
                trackInventory: true,
              },
            },
          })),
        },
      },
    });

    console.log(`  ✅ ${product.title}`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('   Admin: admin@stressnes.com / Admin@Str3ssnes!');
  console.log('   Products: 10');
  console.log('   Collections: 3 (Summer, Core, Limited)');
  console.log('   Categories: 5 (Tops, Bottoms, Outerwear, Accessories, Footwear)');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
