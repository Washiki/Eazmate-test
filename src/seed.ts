import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Clear out any old data first (optional, but good for testing)
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // Create our fake menu
    await prisma.category.create({
        data: {
            name: 'Pizzas',
            products: {
                create: [
                    {
                        name: 'Margherita Pizza',
                        variants: { create: [{ size: 'Large', price: 15.00 }] }
                    },
                    {
                        name: 'Pepperoni Pizza',
                        variants: { create: [{ size: 'Large', price: 18.00 }] }
                    }
                ]
            }
        }
    });

    await prisma.category.create({
        data: {
            name: 'Drinks',
            products: {
                create: [
                    {
                        name: 'Coca Cola',
                        variants: { create: [{ size: 'Regular', price: 2.50 }] }
                    }
                ]
            }
        }
    });

    console.log('✅ Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
