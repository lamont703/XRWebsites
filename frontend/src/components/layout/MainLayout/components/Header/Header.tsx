/**
 * Header.tsx
 * 
 * This component provides the header for the application, including user profile and logout functionality.
 */ 
import React from 'react';
import { useAuth } from '@/store/auth/Auth';
import type User from '@/types/user';
import styles from '@/styles/Header.module.css';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const { user } = useAuth() as { user: User | null };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className={styles.menuButton}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isSidebarOpen ? (
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                />
              )}
            </svg>
          </button>
          <div className={styles.logo}>XRWebsites.io</div>
        </div>
        
        <div className={styles.userInfo}>
          <span>{user?.email}</span>
        </div>
      </div>
    </header>
  );
}; 