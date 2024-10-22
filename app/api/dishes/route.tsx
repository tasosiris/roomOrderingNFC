import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import prisma from '@/prisma/client'; // Assuming Prisma client is set up correctly

// Define a schema for the incoming data
const orderSchema = z.object({
  roomNumber: z.string(), // Room number from the QR code
  items: z.array(
    z.object({
      menuId: z.number(),  // ID of the menu item
      quantity: z.number().min(1), // Quantity ordered
    })
  )
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the incoming request body
    const body = await request.json();
    const validation = orderSchema.safeParse(body);
    
    // If the request data is invalid, return a 400 Bad Request response
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { roomNumber, items } = validation.data;

    // Find the room by the room number (which is obtained from the QR code)
    const room = await prisma.room.findUnique({
      where: { roomNumber },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Create a new order for the room
    const newOrder = await prisma.order.create({
      data: {
        room: { connect: { id: room.id } },  // Connect the order to the existing room
        status: "pending",  // New order starts with status "pending"
        orderItems: {
          create: items.map((item) => ({
            menu: { connect: { id: item.menuId } },  // Connect each item to its respective menu
            quantity: item.quantity,
          })),
        },
      },
      include: {
        orderItems: {
          include: { menu: true },  // Include the menu item details in the response
        },
        room: true,
      },
    });

    // Return the newly created order as a response with status 201 (Created)
    return NextResponse.json(newOrder, { status: 201 });

  } catch (error) {
    // Handle unexpected errors with a 500 Internal Server Error response
    return NextResponse.json({ error: "An error occurred while processing the order." }, { status: 500 });
  }
}
