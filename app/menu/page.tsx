import React from 'react';
import prisma from '@/prisma/client'; // Assuming Prisma client is set up correctly
import OrderForm from '../components/orderForm'; // Adjust the path based on where you store the component

// Server component for MenuPage
const MenuPage = async () => {
  // Fetch menu items from the database using Prisma on the server
  const menuItems = await prisma.item.findMany(); // Fetch from the 'Item' model

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">Menu</h1>
      <OrderForm menuItems={menuItems} />
    </div>
  );
};

export default MenuPage;
