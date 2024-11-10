// app/api/menu/[roomNumber]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';

// API route to fetch menu items for a specific room
export async function GET(request: Request, { params }: { params: { roomNumber: string } }) {
  const { roomNumber } = params;

  try {
    // Fetch all menu items; modify the filter if items depend on roomNumber
    const menuItems = await prisma.item.findMany();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}
