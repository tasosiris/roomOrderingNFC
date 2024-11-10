"use client";

import React, { useState } from 'react';

interface Item {
  id: number;
  name: string;
  description: string | null;
  price: number;
  course: string | null;
  imagePath: string | null;
}

interface OrderItem {
  id: number;
  quantity: number;
  itemId: number;
  orderId: number;
  item: Item;
}

interface Order {
  id: number;
  createdAt: Date;
  status: string;
  roomNumber: string;
  totalPrice: number;
  orderItems: OrderItem[];
}

interface OrdersListProps {
  orders: Order[];
}

const OrdersList: React.FC<OrdersListProps> = ({ orders: initialOrders }) => {
  const [statusUpdates, setStatusUpdates] = useState<{ [key: number]: string }>({});
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [showCompletedOnly, setShowCompletedOnly] = useState<boolean>(false);
  const [localOrders, setLocalOrders] = useState<Order[]>(initialOrders);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});

  const handleStatusChange = (orderId: number, newStatus: string) => {
    setStatusUpdates((prev) => ({ ...prev, [orderId]: newStatus }));
  };

  const updateOrderStatus = async (orderId: number) => {
    const newStatus = statusUpdates[orderId];
    if (!newStatus) return;

    setLoading((prev) => ({ ...prev, [orderId]: true }));
    setError(null);

    try {
      const res = await fetch(`/api/order?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      const updatedOrder = await res.json();
      
      setLocalOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? updatedOrder : order
        )
      );
      
      // Clear the status update state for this order
      setStatusUpdates((prev) => {
        const newUpdates = { ...prev };
        delete newUpdates[orderId];
        return newUpdates;
      });
    } catch (error) {
      console.error("Error updating status:", error);
      setError(error instanceof Error ? error.message : 'Failed to update order status');
    } finally {
      setLoading((prev) => {
        const newLoading = { ...prev };
        delete newLoading[orderId];
        return newLoading;
      });
    }
  };

  // Filter orders based on room level and completion status
  const filteredOrders = localOrders.filter((order) => {
    if (showCompletedOnly) {
      return order.status === 'completed';
    } else if (filterLevel === 'all') {
      return order.status !== 'completed';
    }
    return order.roomNumber.startsWith(filterLevel) && order.status !== 'completed';
  });

  return (
    <div className="p-6 space-y-6 bg-white shadow-lg rounded-lg">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div>
          <label htmlFor="filter-level" className="block text-sm font-medium text-gray-600 mb-1">
            Filter by Room Level:
          </label>
          <select
            id="filter-level"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="block w-full rounded-md border-gray-200 bg-white text-gray-700 shadow-sm focus:border-blue-300 focus:ring-blue-300"
          >
            <option value="all">All Levels</option>
            <option value="1">Level 1 (100s)</option>
            <option value="2">Level 2 (200s)</option>
            <option value="3">Level 3 (300s)</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="show-completed"
            checked={showCompletedOnly}
            onChange={() => setShowCompletedOnly(!showCompletedOnly)}
            className="rounded border-gray-300 bg-white text-blue-500 focus:ring-blue-300"
          />
          <label htmlFor="show-completed" className="ml-2 text-sm text-gray-600">
            Show Completed Orders Only
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Order ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Room
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Items
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {order.roomNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <ul className="list-disc list-inside">
                    {order.orderItems.map((orderItem) => (
                      <li key={orderItem.id}>
                        {orderItem.item.name} (x{orderItem.quantity})
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {order.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex flex-col gap-2 max-w-xs">
                    <select
                      value={statusUpdates[order.id] || order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="block w-full rounded-md border-gray-200 bg-white text-gray-700 shadow-sm focus:border-blue-300 focus:ring-blue-300"
                      disabled={loading[order.id]}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="canceled">Canceled</option>
                    </select>
                    <button
                      onClick={() => updateOrderStatus(order.id)}
                      disabled={!statusUpdates[order.id] || loading[order.id]}
                      className={`py-2 px-4 rounded-md text-sm font-medium text-white 
                        ${!statusUpdates[order.id] || loading[order.id]
                          ? 'bg-gray-300'
                          : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                      {loading[order.id] ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <p className="text-center text-gray-500 py-4">No orders found.</p>
        )}
      </div>
    </div>
  );
};

export default OrdersList;