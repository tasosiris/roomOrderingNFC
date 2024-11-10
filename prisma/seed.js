// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.item.deleteMany();
  // Seed additional items with image paths
  const items = await prisma.item.createMany({
    data: [
      { name: 'Caesar Salad', description: 'Romaine lettuce with Caesar dressing, croutons, and parmesan.', price: 7.99, course: 'appetizer', imagePath: '/images/items/caesar-salad.jpg' },
      { name: 'Tomato Soup', description: 'Creamy tomato soup garnished with basil.', price: 5.50, course: 'appetizer', imagePath: '/images/items/tomato-soup.jpg' },
      { name: 'Grilled Salmon', description: 'Salmon with seasonal vegetables and lemon butter sauce.', price: 18.99, course: 'main', imagePath: '/images/items/grilled-salmon.jpg' },
      { name: 'Spaghetti Bolognese', description: 'Classic spaghetti with rich Bolognese sauce.', price: 12.99, course: 'main', imagePath: '/images/items/spaghetti-bolognese.jpg' },
      { name: 'Chicken Parmesan', description: 'Breaded chicken with marinara and mozzarella.', price: 15.99, course: 'main', imagePath: '/images/items/chicken-parmesan.jpg' },
      { name: 'Chocolate Cake', description: 'Rich chocolate cake with dark chocolate ganache.', price: 6.50, course: 'dessert', imagePath: '/images/items/chocolate-cake.jpg' },
      { name: 'Cheesecake', description: 'Creamy cheesecake with berry compote.', price: 6.75, course: 'dessert', imagePath: '/images/items/cheesecake.jpg' },
      { name: 'Ice Cream Sundae', description: 'Vanilla ice cream with chocolate sauce, nuts, and a cherry.', price: 4.99, course: 'dessert', imagePath: '/images/items/ice-cream-sundae.jpg' },
      { name: 'Soft Drink', description: 'Choice of cola, lemon-lime, or ginger ale.', price: 2.50, course: 'beverage', imagePath: '/images/items/soft-drink.jpg' },
      { name: 'Coffee', description: 'Freshly brewed coffee.', price: 3.00, course: 'beverage', imagePath: '/images/items/coffee.jpg' },
    ],
  });

  // Fetch the items created above to use in orders
  const [caesarSalad, tomatoSoup, grilledSalmon, spaghetti, chickenParmesan, chocolateCake, cheesecake, sundae, softDrink, coffee] = await prisma.item.findMany({
    where: { name: { in: ['Caesar Salad', 'Tomato Soup', 'Grilled Salmon', 'Spaghetti Bolognese', 'Chicken Parmesan', 'Chocolate Cake', 'Cheesecake', 'Ice Cream Sundae', 'Soft Drink', 'Coffee'] }},
  });

  // Seed orders with order items
  await prisma.order.create({
    data: {
      roomNumber: '101',
      status: 'pending',
      totalPrice: 36.98, // Adjusted for total of ordered items
      orderItems: {
        create: [
          { quantity: 2, item: { connect: { id: caesarSalad.id } } },
          { quantity: 1, item: { connect: { id: grilledSalmon.id } } },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      roomNumber: '102',
      status: 'completed',
      totalPrice: 21.50, // Total for items ordered
      orderItems: {
        create: [
          { quantity: 1, item: { connect: { id: tomatoSoup.id } } },
          { quantity: 1, item: { connect: { id: chickenParmesan.id } } },
          { quantity: 1, item: { connect: { id: softDrink.id } } },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      roomNumber: '103',
      status: 'pending',
      totalPrice: 25.48,
      orderItems: {
        create: [
          { quantity: 2, item: { connect: { id: chocolateCake.id } } },
          { quantity: 1, item: { connect: { id: sundae.id } } },
          { quantity: 1, item: { connect: { id: coffee.id } } },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      roomNumber: '104',
      status: 'completed',
      totalPrice: 46.96,
      orderItems: {
        create: [
          { quantity: 1, item: { connect: { id: spaghetti.id } } },
          { quantity: 2, item: { connect: { id: chickenParmesan.id } } },
          { quantity: 2, item: { connect: { id: softDrink.id } } },
        ],
      },
    },
  });

  console.log('Extended database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
