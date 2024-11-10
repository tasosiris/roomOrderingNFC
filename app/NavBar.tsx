"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaUserCircle } from 'react-icons/fa';

const NavBar = () => {
  const [storedRoomNumber, setStoredRoomNumber] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve the room number from sessionStorage when the component mounts
    const roomNumber = sessionStorage.getItem('roomNumber');
    setStoredRoomNumber(roomNumber);
  }, []);

  return (
    <nav className="navbar bg-white border-b border-gray-200 p-3 flex items-center justify-between text-black w-full">
      {/* Left Icon: User Profile */}
      <Link href="/personal" className="text-gray-700 hover:text-black flex items-center">
        <FaUserCircle size={22} />
      </Link>

      {/* Center: Menu Link */}
      <div className="flex items-center justify-center flex-1">
        <Link
          href={storedRoomNumber ? `/menu/${storedRoomNumber}` : '#'}
          className={`text-base font-medium whitespace-nowrap ${!storedRoomNumber ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-black'}`}
          onClick={(e) => {
            if (!storedRoomNumber) {
              e.preventDefault();
            }
          }}
        >
          Menu
        </Link>
      </div>

      {/* Right Icon: Shopping Cart */}
      <Link href="/cart" className="text-gray-700 hover:text-black flex items-center">
        <FaShoppingCart size={22} />
      </Link>
    </nav>
  );
};

export default NavBar;
