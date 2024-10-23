import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import { PrismaClient } from '@prisma/client'; // Import the correct Prisma client module

const prisma = new PrismaClient(); // Instantiate the Prisma client

// Define a schema for the incoming data
const orderSchema = z.object({
  roomNumber: z.string(), // Room number from the QR code
  items: z.array(
    z.object({
      itemId: z.number(),  // ID of the item (changed from menuId to itemId)
      quantity: z.number().min(1), // Quantity ordered
    })
  )
});

// Handle the POST request to create a new order
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

    // Create a new order with the room number
    const newOrder = await prisma.order.create({
      data: {
        roomNumber,  // Directly store room number in the order
        status: "pending",  // New order starts with status "pending"
        orderItems: {
          create: items.map((item) => ({
            item: { connect: { id: item.itemId } },  // Connect each item to its respective menu
            quantity: item.quantity,
          })),
        },
      },
      include: {
        orderItems: {
          include: { item: true },  // Include the item details in the response
        },
      },
    });

    // Return the newly created order as a response with status 201 (Created)
    return NextResponse.json(newOrder, { status: 201 });

  } catch (error) {
    // Handle unexpected errors with a 500 Internal Server Error response
    return NextResponse.json({ error: "An error occurred while processing the order." }, { status: 500 });
  }
}

// Handle the GET request to fetch all items (dishes)
export async function GET() {
  try {
    // Fetch all items from the database
    const menuItems = await prisma.item.findMany();  // Fetch from the 'Item' model

    // Return the items as JSON with a status of 200 (OK)
    return NextResponse.json(menuItems, { status: 200 });
  } catch (error) {
    // Handle errors and return a 500 status code with the error message
    return NextResponse.json({ error: 'Error fetching items' }, { status: 500 });
  }
}
