import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/prisma/client'; // Assuming you have Prisma client setup

// Define the types for the items array
interface OrderItem {
  itemId: number;
  quantity: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { roomNumber, items }: { roomNumber: string; items: OrderItem[] } = req.body;

    try {
      // Calculate total price
      let totalPrice = 0;
      const itemDetails = await Promise.all(
        items.map(async (item: OrderItem) => {
          const itemData = await prisma.item.findUnique({
            where: { id: item.itemId },
          });
          if (!itemData) {
            throw new Error(`Item with ID ${item.itemId} not found`);
          }
          totalPrice += itemData.price * item.quantity;
          return itemData;
        })
      );

      // Create the order in the database
      const newOrder = await prisma.order.create({
        data: {
          roomNumber,
          status: 'pending', // You can adjust the status as per your logic
          totalPrice,
          orderItems: {
            create: items.map((item: OrderItem) => ({
              item: { connect: { id: item.itemId } },
              quantity: item.quantity,
            })),
          },
        },
        include: { orderItems: true },
      });

      res.status(201).json(newOrder);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
