import { useState } from 'react';
import { NetworkType } from '@/lib/solana/config';
import styles from '@/styles/NetworkSelector.module.css';

interface NetworkSelectorProps {
  currentNetwork: NetworkType;
  onNetworkChange: (network: NetworkType) => void;
}

export const NetworkSelector = ({ currentNetwork, onNetworkChange }: NetworkSelectorProps) => {
  return (
    <div className={styles.networkSelector}>
      <select
        value={currentNetwork}
        onChange={(e) => onNetworkChange(e.target.value as NetworkType)}
        className={styles.select}
        title="Select network"
      >
        <option value="mainnet">Mainnet</option>
        <option value="devnet">Devnet</option>
      </select>
      <div className={`${styles.indicator} ${styles[currentNetwork]}`} />
    </div>
  );
}; 