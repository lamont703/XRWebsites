import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import styles from '@/styles/NotFound.module.css';

export const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <MainLayout>
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundContent}>
          <div className={styles.notFoundIcon}>404</div>
          <h1>Page Not Found</h1>
          <p>The page you are looking for doesn't exist or has been moved.</p>
          <button 
            className={styles.primaryButton}
            onClick={() => navigate('/spatial-tokens')}
          >
            Return to Spatial Platform
          </button>
        </div>
      </div>
    </MainLayout>
  );
}; 