import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { MainLayout } from '../components/layout/MainLayout';
import { ConnectWallet } from '../components/features/wallet/ConnectWallet';
import styles from '../styles/Profile.module.css';

export const Profile = () => {
  const wallet = useWallet();
  
  return (
    <MainLayout>
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <h1 className={styles.profileTitle}>
            <span className={styles.profileIcon}>👤</span> 
            User Profile
          </h1>
        </div>
        
        {!wallet.connected ? (
          <div className={styles.connectWalletContainer}>
            <p className={styles.subtitle}>Connect your wallet to view your profile</p>
            <ConnectWallet />
          </div>
        ) : (
          <div className={styles.profileContent}>
            <div className={styles.profileCard}>
              <div className={styles.profileSection}>
                <h2>Wallet Information</h2>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Wallet Address:</span>
                  <span className={styles.infoValue}>{wallet.publicKey?.toString()}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Wallet Type:</span>
                  <span className={styles.infoValue}>{wallet.wallet?.adapter.name || 'Unknown'}</span>
                </div>
              </div>
              
              <div className={styles.profileSection}>
                <h2>Account Settings</h2>
                <p className={styles.comingSoon}>
                  Profile customization options coming soon!
                </p>
              </div>
            </div>
            
            <div className={styles.activityCard}>
              <h2>Recent Activity</h2>
              <p className={styles.comingSoon}>
                Your activity history will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}; 