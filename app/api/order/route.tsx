// app/api/order/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';

interface OrderItem {
  itemId: number;
  quantity: number;
}

interface CreateOrderRequest {
  roomNumber: string;
  items: OrderItem[];
}

interface StatusCheckRequest {
  action: 'getStatus';
  orderId: string;
  roomNumber: string;
}

interface UpdateStatusRequest {
  status: string;
}

interface UpdateOrderRequest {
  items: OrderItem[];
}

type OrderRequest = CreateOrderRequest | StatusCheckRequest;

// PATCH: Update order status or items
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const data = await req.json();

    // Handle status update
    if ('status' in data) {
      const { status } = data as UpdateStatusRequest;
      
      const validStatuses = ['pending', 'in-progress', 'completed', 'canceled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: parseInt(id) },
        data: { status },
        include: {
          orderItems: {
            include: {
              item: true
            }
          }
        }
      });

      return NextResponse.json(updatedOrder);
    }

    // Handle items update
    if ('items' in data) {
      const { items } = data as UpdateOrderRequest;

      // Calculate new total price
      let totalPrice = 0;
      const itemPromises = items.map(async (item) => {
        const itemData = await prisma.item.findUnique({
          where: { id: item.itemId },
        });
        if (!itemData) {
          throw new Error(`Item with ID ${item.itemId} not found`);
        }
        totalPrice += itemData.price * item.quantity;
        return { itemData, quantity: item.quantity };
      });

      await Promise.all(itemPromises);

      // First, delete existing order items
      await prisma.orderItem.deleteMany({
        where: {
          orderId: parseInt(id),
        },
      });

      // Then update the order with new items
      const updatedOrder = await prisma.order.update({
        where: { 
          id: parseInt(id),
        },
        data: {
          totalPrice,
          orderItems: {
            create: items.map((item) => ({
              item: { connect: { id: item.itemId } },
              quantity: item.quantity,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              item: true,
            },
          },
        },
      });

      return NextResponse.json(updatedOrder);
    }

    return NextResponse.json(
      { error: 'Invalid update request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// POST: Create a new order or get status
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Handle status check
    if (data.action === 'getStatus') {
      const { orderId } = data as StatusCheckRequest;
      
      if (!orderId) {
        return NextResponse.json(
          { error: 'Order ID is required for status check' },
          { status: 400 }
        );
      }

      const order = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        select: {
          status: true,
          createdAt: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        status: order.status,
        updatedAt: order.createdAt.toISOString(),
      });
    }

    // Handle order creation
    const createData = data as CreateOrderRequest;
    
    // Validate required fields for order creation
    if (!createData.roomNumber || !createData.items || !Array.isArray(createData.items)) {
      return NextResponse.json(
        { error: 'Invalid request data. Room number and items array are required.' },
        { status: 400 }
      );
    }

    // Calculate total price
    let totalPrice = 0;
    const itemPromises = createData.items.map(async (item) => {
      const itemData = await prisma.item.findUnique({
        where: { id: item.itemId },
      });
      if (!itemData) {
        throw new Error(`Item with ID ${item.itemId} not found`);
      }
      totalPrice += itemData.price * item.quantity;
      return { itemData, quantity: item.quantity };
    });

    await Promise.all(itemPromises);

    // Create the order in the database
    const newOrder = await prisma.order.create({
      data: {
        roomNumber: createData.roomNumber,
        status: 'pending',
        totalPrice,
        orderItems: {
          create: createData.items.map((item) => ({
            item: { connect: { id: item.itemId } },
            quantity: item.quantity,
          })),
        },
      },
      include: { 
        orderItems: {
          include: {
            item: true
          }
        }
      },
    });

    return NextResponse.json({
      orderId: newOrder.id,
      message: 'Order created successfully',
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    );
  }
}

// GET: Fetch order status
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      select: {
        status: true,
        createdAt: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: order.status,
      updatedAt: order.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching order status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order status' },
      { status: 500 }
    );
  }
}