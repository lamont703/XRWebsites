/**
 * MainLayout.tsx
 * 
 * This component provides the main layout for the application, including a sidebar and a header.
 * It also handles user authentication and provides a logout function.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {} from '@/store/auth/Auth';
import {} from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Toaster } from 'react-hot-toast';
import { debounce } from 'lodash';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize states with window check to prevent hydration mismatch
  const [isMobileView, setIsMobileView] = useState(true); // Default to mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to closed

  const handleResize = useCallback(
    debounce(() => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileView(isMobile);
      // Only auto-open sidebar when switching to desktop
      if (!isMobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false); // Ensure sidebar is closed on mobile
      }
    }, 100),
    []
  );

  useEffect(() => {
    // Set initial states after component mount
    setIsMobileView(window.innerWidth < 1024);
    setIsSidebarOpen(window.innerWidth >= 1024);
    
    window.addEventListener('resize', handleResize);
    return () => {
      handleResize.cancel();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  const handleClose = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  return (
    <div className="min-h-screen flex bg-gray-900">
      <Toaster position="top-right" />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-800 z-50 px-4 flex items-center justify-between">
        <div className="text-xl font-bold text-blue-400">XRWebsites.io</div>
        <button
          className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isSidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar with overlay */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={handleClose} 
        isMobile={isMobileView} 
      />
      
      {/* Overlay */}
      {isMobileView && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={handleClose}
        />
      )}

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          isMobileView ? 'pt-16' : ''
        } ${
          isSidebarOpen && !isMobileView ? 'ml-64' : ''
        }`}
      >
        {children}
      </main>
    </div>
  );
}; 