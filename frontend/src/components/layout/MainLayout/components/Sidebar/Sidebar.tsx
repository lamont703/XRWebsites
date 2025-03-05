/**
 * Sidebar.tsx
 * 
 * This component provides the sidebar for the application, including navigation and user information.
 */ 
import React, { memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth/Auth';
import styles from '@/styles/Sidebar.module.css';
import type User from '@/types/user';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const SidebarComponent: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
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
    { name: 'Profile', path: `/users/${user?.id}`, icon: 'user' },
    { name: 'Settings', path: '/settings', icon: 'cog' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isMobile && !isOpen) return null;

  return (
    <aside className={`${styles.sidebar} ${!isMobile ? styles.sidebarDesktop : ''} 
      ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}`}>
      {!isMobile && <div className={styles.logo}>XRWebsites.io</div>}
      
      <div className={styles.userCard}>
        <div className="flex items-center space-x-3">
          <div className={styles.userAvatar}>
            <span>{user?.fullName?.charAt(0) || 'U'}</span>
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
            className={`${styles.navItem} ${
              location.pathname === item.path ? styles.navItemActive : ''
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
          className={styles.logoutButton}
        >
          Logout
        </button>
      </nav>
    </aside>
  );
};

const areEqual = (prevProps: SidebarProps, nextProps: SidebarProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.isMobile === nextProps.isMobile
  );
};

export const Sidebar = memo(SidebarComponent, areEqual); 