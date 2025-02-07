/**
 * MainLayout.tsx
 * 
 * This component provides the main layout for the application, including a sidebar and a header.
 * It also handles user authentication and provides a logout function.
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/store/auth/Auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Toaster } from 'react-hot-toast';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobileView);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex bg-gray-900">
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            background: '#374151',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-800 z-40 px-4 flex items-center justify-between">
        <div className="text-xl font-bold text-blue-400">XRWebsites.io</div>
        <button
          className="p-2 rounded-lg bg-gray-700 text-white"
          onClick={toggleSidebar}
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

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} isMobile={isMobileView} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isMobileView ? 'pt-16' : ''}`}>
        {children}
      </div>

      {/* Mobile Overlay */}
      {isMobileView && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}; 