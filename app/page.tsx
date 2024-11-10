// app/page.tsx

import prisma from '@/prisma/client';
import OrdersList from '@/app/components/OrdersList';

export default async function Home() {
  const orders = await prisma.order.findMany({
    include: {
      orderItems: {
        include: {
          item: true,
        },
      },
    },
  });

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <OrdersList orders={orders} />
    </main>
  );
}
