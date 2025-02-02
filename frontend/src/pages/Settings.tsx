import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '../store/auth/AuthContext';
import styles from '../styles/Dashboard.module.css';

export const Settings = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className={styles.dashboardContainer}>
        <div className={styles.welcomeCard}>
          <h1 className="text-2xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your account preferences and security settings</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className="text-sm font-medium text-gray-400 mb-2">Account Status</div>
            <div className="text-2xl font-bold text-white">Active</div>
          </div>
          <div className={styles.statCard}>
            <div className="text-sm font-medium text-gray-400 mb-2">2FA Status</div>
            <div className="text-2xl font-bold text-white">Disabled</div>
          </div>
          <div className={styles.statCard}>
            <div className="text-sm font-medium text-gray-400 mb-2">Last Login</div>
            <div className="text-2xl font-bold text-white">Today</div>
          </div>
          <div className={styles.statCard}>
            <div className="text-sm font-medium text-gray-400 mb-2">Account Type</div>
            <div className="text-2xl font-bold text-white">Standard</div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Profile Settings</h2>
          <div className="text-gray-400 text-center py-8">
            Settings configuration coming soon.
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 