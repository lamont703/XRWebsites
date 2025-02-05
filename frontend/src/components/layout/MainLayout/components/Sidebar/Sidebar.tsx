/**
 * Sidebar.tsx
 * 
 * This component provides the sidebar for the application, including navigation and user information.
 */ 
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth/Auth';
import styles from '../../../../../styles/Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigationItems = [
    { name: 'Overview', path: '/dashboard', icon: 'grid' },
    { name: 'Wallet', path: '/wallet', icon: 'wallet' },
    { name: 'NFT Assets', path: '/nft-assets', icon: 'cube' },
    { name: 'Create Token', path: '/token-creator', icon: 'plus-circle' },
    { name: 'Tokenomics', path: '/tokenomics', icon: 'plus-circle' },
    { name: 'My Jobs', path: '/jobs', icon: 'briefcase' },
    { name: 'Marketplace', path: '/marketplace', icon: 'shopping-cart' },
    { name: 'Settings', path: '/settings', icon: 'cog' },
    { name: 'Forum', path: '/forum', icon: 'chat' },
  ];

  const sidebarClasses = `
    fixed lg:relative w-64 h-full bg-gray-800 p-4 transition-transform duration-300 ease-in-out z-40
    ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
    ${isMobile ? 'top-16' : 'top-0'}
  `;

  return (
    <div className={sidebarClasses}>
      {!isMobile && <div className="text-2xl font-bold text-blue-400 mb-8">XRWebsites.io</div>}
      
      <div className={`${styles.userCard} mb-6 p-4`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <div className="text-white font-medium">{user?.fullName}</div>
            <div className="text-sm text-gray-400">{user?.email}</div>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`${styles.navItem} block p-2 rounded ${
              location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {item.name}
          </Link>
        ))}
        
        <button
          onClick={handleLogout}
          className="w-full mt-4 p-2 rounded bg-red-600 hover:bg-red-700 text-white transition-all hover:-translate-y-0.5"
        >
          Logout
        </button>
      </nav>
    </div>
  );
}; 