/**
 * Header.tsx
 * 
 * This component provides the header for the application, including user profile and logout functionality.
 */ 
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/store/auth/Auth';
import { useNavigate } from 'react-router-dom';
import styles from '../../../../../styles/Header.module.css'; 

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Page Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
          </div>

          {/* Right side - User Profile */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`${styles.profileButton} flex items-center space-x-3 text-gray-300 hover:text-white focus:outline-none`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-white">{user?.fullName}</div>
                <div className="text-xs text-gray-400">{user?.email}</div>
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className={`${styles.dropdownMenu} absolute right-0 mt-2 w-48 rounded-md z-50`}>
                <div className="px-4 py-2 border-b border-gray-600">
                  <p className="text-sm text-white">{user?.fullName}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                
                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                >
                  Your Profile
                </a>
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                >
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}; 