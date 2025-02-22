/**
 * Header.tsx
 * 
 * This component provides the header for the application, including user profile and logout functionality.
 */ 
import React from 'react';
import { useAuth } from '@/store/auth/Auth';
import type User from '@/types/user';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const { user } = useAuth() as { user: User | null };

  return (
    <header className="bg-gray-800 fixed w-full z-50 shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="text-gray-400 hover:text-white focus:outline-none focus:text-white lg:hidden"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6 fill-current"
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
          <div className="ml-4 lg:hidden">
            <span className="text-white text-lg font-semibold">XRWebsites.io</span>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-gray-300">{user?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}; 