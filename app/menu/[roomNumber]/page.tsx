"use client";

import OrderForm from '@/app/components/orderForm'; // Adjust path as needed

const RoomMenu = ({ params }: { params: { roomNumber: string } }) => {
  const { roomNumber } = params;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">Order - Room {roomNumber}</h1>
      <OrderForm roomNumber={roomNumber} />
    </div>
  );
};

export default RoomMenu;
