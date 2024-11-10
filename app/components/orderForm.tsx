"use client";

import React, { useState, useEffect } from "react";

type Item = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  course?: string | null;
  imagePath?: string | null;
};

type OrderItem = Item & { quantity: number };

type OrderStatus = {
  status: string;
  updatedAt: string;
};

const OrderForm = ({ roomNumber }: { roomNumber: string }) => {
  const [menuItems, setMenuItems] = useState<Item[]>([]);
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<OrderItem[]>([]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const res = await fetch(`/api/menu/${roomNumber}`);
        const data = await res.json();
        setMenuItems(data);
      } catch (error) {
        console.error("Error fetching menu items:", error);
      }
    };

    fetchMenuItems();
  }, [roomNumber]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollOrderStatus = async () => {
      if (!currentOrderId) return;

      try {
        const response = await fetch('/api/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'getStatus',
            orderId: currentOrderId,
            roomNumber: roomNumber,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch order status');
        }

        const data: OrderStatus = await response.json();
        const status = data.status.toLowerCase();
        
        if (status === 'in-progress' || ['completed', 'cancelled', 'delivered'].includes(status)) {
          setOrderStatus(`Order Status: ${data.status} (Last Updated: ${new Date(data.updatedAt).toLocaleTimeString()})`);
          clearInterval(intervalId);
          setCurrentOrderId(null);
          setIsEditing(false);
          setOriginalOrder([]);
          setOrder([]);
        } else {
          setOrderStatus(`Order Status: ${data.status} - You can still modify your order (Last Updated: ${new Date(data.updatedAt).toLocaleTimeString()})`);
        }
      } catch (error) {
        console.error('Error polling order status:', error);
        clearInterval(intervalId);
      }
    };

    if (currentOrderId) {
      pollOrderStatus();
      intervalId = setInterval(pollOrderStatus, 10000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentOrderId, roomNumber]);

  const categorizeMenuItems = (items: Item[]) => {
    return items.reduce((acc, item) => {
      const course = item.course || "General";
      if (!acc[course]) {
        acc[course] = [];
      }
      acc[course].push(item);
      return acc;
    }, {} as { [key: string]: Item[] });
  };

  const handleAddItem = (item: Item) => {
    const existingItem = order.find((orderItem) => orderItem.id === item.id);

    if (existingItem) {
      const updatedOrder = order.map((orderItem) =>
        orderItem.id === item.id
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      );
      setOrder(updatedOrder);
    } else {
      setOrder([...order, { ...item, quantity: 1 }]);
    }

    setTotalPrice((prevPrice) => prevPrice + item.price);
  };

  const handleRemoveItem = (item: Item) => {
    const existingItem = order.find((orderItem) => orderItem.id === item.id);

    if (existingItem && existingItem.quantity > 1) {
      const updatedOrder = order.map((orderItem) =>
        orderItem.id === item.id
          ? { ...orderItem, quantity: orderItem.quantity - 1 }
          : orderItem
      );
      setOrder(updatedOrder);
    } else {
      const updatedOrder = order.filter((orderItem) => orderItem.id !== item.id);
      setOrder(updatedOrder);
    }

    setTotalPrice((prevPrice) => Math.max(prevPrice - item.price, 0));
  };

  const handlePlaceOrder = async () => {
    if (order.length === 0) {
      setOrderStatus("Cannot place empty order");
      return;
    }

    const orderData = {
      roomNumber,
      items: order.map((orderItem) => ({
        itemId: orderItem.id,
        quantity: orderItem.quantity,
      })),
    };

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        throw new Error('Failed to place order');
      }

      const result = await res.json();
      
      if (!result.orderId) {
        throw new Error('Order ID not received from server');
      }

      setCurrentOrderId(result.orderId.toString());
      setOriginalOrder([...order]);
      setOrderStatus("Order placed successfully! You can modify your order until it's in progress.");
      setIsEditing(true);

    } catch (error) {
      console.error("Error:", error);
      setOrderStatus(error instanceof Error ? error.message : "An error occurred while placing the order");
    }
  };

  const handleEditOrder = async () => {
    if (!currentOrderId || order.length === 0) {
      setOrderStatus("Cannot update with empty order");
      return;
    }
  
    try {
      const res = await fetch(`/api/order?id=${currentOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: order.map((orderItem) => ({
            itemId: orderItem.id,
            quantity: orderItem.quantity,
          })),
        }),
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update order');
      }
  
      const updatedOrder = await res.json();
      setOrderStatus("Order updated successfully! You can continue modifying until it's in progress.");
      setOriginalOrder([...order]);
      setTotalPrice(updatedOrder.totalPrice);
  
    } catch (error) {
      console.error("Error:", error);
      setOrderStatus(error instanceof Error ? error.message : "An error occurred while updating the order");
    }
  };

  const handleCancelEdit = () => {
    setOrder([...originalOrder]);
    setTotalPrice(originalOrder.reduce((total, item) => total + (item.price * item.quantity), 0));
    setIsEditing(false);
    setOrderStatus("Edit cancelled. Restored original order.");
  };

  const categorizedMenuItems = categorizeMenuItems(menuItems);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-2 lg:p-4 bg-white text-black min-h-screen">
      <div className="menu-items flex-1">
        {Object.keys(categorizedMenuItems).map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{category}</h2>
            {categorizedMenuItems[category].map((item: Item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center border border-gray-200 shadow-lg p-4 mb-4 rounded-lg bg-white"
              >
                {item.imagePath && (
                  <div className="w-full sm:w-32 h-32 relative mb-4 sm:mb-0">
                    <img
                      src={item.imagePath}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex flex-col sm:ml-4 text-center sm:text-left w-full">
                  <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-1">
                    {item.description || "No description available."}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mb-2">
                    ${item.price.toFixed(2)}
                  </p>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm
                      ${(!currentOrderId || isEditing) 
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                    onClick={() => handleAddItem(item)}
                    disabled={!!(currentOrderId && !isEditing)}
                  >
                    Add to Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="order-summary flex-1 w-full mx-0 lg:mx-4">
        <div className="border border-gray-200 shadow-lg p-4 rounded-lg bg-gray-50 sticky top-4">
          <h2 className="text-xl font-bold mb-4 text-center">Your Order</h2>
          {order.length === 0 ? (
            <p className="text-center text-gray-500">No items added yet.</p>
          ) : (
            <ul className="space-y-4">
              {order.map((orderItem: OrderItem) => (
                <li
                  key={orderItem.id}
                  className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-300"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-lg">{orderItem.name}</span>
                    <span className="text-gray-600">Quantity: {orderItem.quantity}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 text-lg">
                      ${(orderItem.price * orderItem.quantity).toFixed(2)}
                    </span>
                    <button
                      className={`w-8 h-8 rounded-full flex items-center justify-center
                        ${(!currentOrderId || isEditing)
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                      onClick={() => handleRemoveItem(orderItem)}
                      disabled={!!(currentOrderId && !isEditing)}
                    >
                      −
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          <h3 className="text-lg font-bold mt-4 text-center">
            Total: ${totalPrice.toFixed(2)}
          </h3>
          
          {!currentOrderId && order.length > 0 && (
            <button
              className="bg-green-500 text-white w-full py-3 rounded-lg text-lg mt-4 hover:bg-green-600"
              onClick={handlePlaceOrder}
            >
              Place Order
            </button>
          )}

          {isEditing && currentOrderId && (
            <div className="flex gap-2 mt-4">
              <button
                className="bg-blue-500 text-white flex-1 py-3 rounded-lg text-lg hover:bg-blue-600"
                onClick={handleEditOrder}
              >
                Update Order
              </button>
              <button
                className="bg-gray-500 text-white flex-1 py-3 rounded-lg text-lg hover:bg-gray-600"
                onClick={handleCancelEdit}
              >
                Cancel Edit
              </button>
            </div>
          )}

          {orderStatus && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-center text-gray-700">{orderStatus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderForm;