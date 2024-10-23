import React, { useState } from 'react';

// Define the Item type matching the database schema
type Item = {
    id: number;
    name: string;
    description: string | null;  // Allowing null values
    price: number;
    course: string | null;  // Allowing null values
  };

// Define the OrderItem type for the order
type OrderItem = Item & { quantity: number };

const OrderForm = ({ menuItems }: { menuItems: Item[] }) => {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

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
    const updatedOrder = order
      .map((orderItem) =>
        orderItem.id === item.id && orderItem.quantity > 1
          ? { ...orderItem, quantity: orderItem.quantity - 1 }
          : orderItem
      )
      .filter((orderItem) => orderItem.quantity > 0);

    setOrder(updatedOrder);
    setTotalPrice((prevPrice) => prevPrice - item.price);
  };

  const handlePlaceOrder = async () => {
    const orderData = {
      roomNumber: "101",  // Replace with dynamic room number if needed
      items: order.map((orderItem) => ({
        itemId: orderItem.id,
        quantity: orderItem.quantity,
      })),
    };

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const result = await res.json();
        console.log('Order placed successfully:', result);
        setOrder([]);
        setTotalPrice(0);
      } else {
        console.error('Error placing order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-10">
      <div className="menu-items flex-1">
        {menuItems.map((item: Item) => (
          <div key={item.id} className="card w-full bg-base-100 shadow-xl mb-4">
            <div className="card-body">
              <h2 className="card-title">{item.name}</h2>
              <p>{item.description}</p>
              <p>Course: {item.course}</p>
              <p className="text-lg font-bold">Price: ${item.price.toFixed(2)}</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary" onClick={() => handleAddItem(item)}>
                  Add to Order
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="order-summary flex-1">
        <div className="card bg-base-200 p-4">
          <h2 className="text-2xl font-bold mb-4">Your Order</h2>
          {order.length === 0 ? (
            <p>No items added yet.</p>
          ) : (
            <ul className="list-none">
              {order.map((orderItem: OrderItem) => (
                <li key={orderItem.id} className="flex justify-between items-center mb-2">
                  <span>
                    {orderItem.name} x {orderItem.quantity}
                  </span>
                  <span>${(orderItem.price * orderItem.quantity).toFixed(2)}</span>
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => handleRemoveItem(orderItem)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <h3 className="text-xl font-bold mt-4">Total: ${totalPrice.toFixed(2)}</h3>
          {order.length > 0 && (
            <button className="btn btn-success mt-4" onClick={handlePlaceOrder}>
              Place Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
