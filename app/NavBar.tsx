import React from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaUserCircle } from 'react-icons/fa';

const NavBar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link href="/personal" className="nav-link">
          <FaUserCircle size={24} /> Personal
        </Link>
      </div>
      
      <div className="navbar-center">
        <ul className="nav-menu">
          <li className="nav-item">
            <Link href="/menu" className="nav-link">Menu</Link>
          </li>
        </ul>
      </div>
      
      <div className="navbar-right">
        <Link href="/cart" className="nav-link">
          <FaShoppingCart size={24} /> My Cart
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
