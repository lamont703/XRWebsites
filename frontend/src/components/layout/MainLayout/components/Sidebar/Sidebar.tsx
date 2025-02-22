/**
 * Sidebar.tsx
 * 
 * This component provides the sidebar for the application, including navigation and user information.
 */ 
import React, { memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth/Auth';
import styles from '../../../../../styles/Sidebar.module.css';
import type User from '../../../../../types/user';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const SidebarComponent: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  console.log('Sidebar rendered with isOpen:', isOpen);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth() as { user: User | null; logout: () => Promise<void> };

  const navigationItems = [
    { name: 'Overview', path: '/dashboard', icon: 'grid' },
    { name: 'Wallet', path: '/wallet', icon: 'wallet' },
    { name: 'NFT Assets', path: '/nft-assets', icon: 'cube' },
    { name: 'Create Token', path: '/token-creator', icon: 'plus-circle' },
    { name: 'Tokenomics', path: '/tokenomics', icon: 'plus-circle' },
    { name: 'My Jobs', path: '/jobs', icon: 'briefcase' },
    { name: 'Marketplace', path: '/marketplace', icon: 'shopping-cart' },
    { name: 'Forum', path: '/forum', icon: 'chat' },
    { name: 'Settings', path: '/settings', icon: 'cog' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarClasses = [
    'fixed',
    'lg:relative',
    'w-64',
    'h-screen',
    'bg-gray-800',
    'p-4',
    'transition-transform',
    'duration-300',
    'ease-in-out',
    isMobile ? 'z-40' : 'z-10',
    isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0',
    isMobile ? 'top-16 left-0' : 'top-0'
  ].join(' ');

  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <aside className={sidebarClasses}>
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
            onClick={() => isMobile && onClose()}
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
          onClick={() => {
            if (isMobile) onClose();
            handleLogout();
          }}
          className="w-full mt-4 p-2 rounded bg-red-600 hover:bg-red-700 text-white transition-all hover:-translate-y-0.5"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
};

// Add comparison function for memo
const areEqual = (prevProps: SidebarProps, nextProps: SidebarProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.isMobile === nextProps.isMobile
  );
};

export const Sidebar = memo(SidebarComponent, areEqual); 