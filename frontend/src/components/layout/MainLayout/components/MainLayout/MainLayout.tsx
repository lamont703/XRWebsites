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
import styles from '@/styles/MainLayout.module.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
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
    <div className={styles.container}>
      <Toaster position="top-right" />

      {/* Mobile Header */}
      <div className={styles.mobileHeader}>
        <div className={styles.headerLogo}>XRWebsites.io</div>
        <button
          className={styles.menuButton}
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isSidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
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
        <div className={styles.overlay} onClick={handleClose} />
      )}

      {/* Main Content */}
      <main className={`${styles.mainContent} ${isSidebarOpen && !isMobileView ? styles.sidebarOpen : ''}`}>
        {children}
      </main>
    </div>
  );
} 