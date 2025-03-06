import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import styles from '@/styles/Tokenomics.module.css';
import {} from '@/store/auth/Auth';
import {} from '../styles/Dashboard.module.css';

interface TokenMetrics {
  price: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  holders: number;
  activeAddresses: number;
  transactions24h: number;
  stakingRatio: number;
}

// Helper function to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
};

export const Tokenomics = () => {
  const tokenId = 'xrv-token'; // Default token ID for XRV
  const [metrics, setMetrics] = useState<TokenMetrics>({
    price: 0,
    marketCap: 0,
    volume24h: 0,
    circulatingSupply: 0,
    totalSupply: 0,
    holders: 0,
    activeAddresses: 0,
    transactions24h: 0,
    stakingRatio: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch token metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/tokenomics/metrics/${tokenId}`);
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError('Failed to load token metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <MainLayout>
      <div className={styles.container}>
        {isLoading ? (
          <div className={styles.loadingState}>
            Loading token metrics...
          </div>
        ) : error ? (
          <div className={styles.errorMessage}>{error}</div>
        ) : (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Token Analytics</h1>
              <p className={styles.subtitle}>Comprehensive analytics for your token</p>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Current Price</div>
                <div className={styles.statValue}>
                  ${metrics?.price ? metrics.price.toFixed(4) : '0.00'}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Market Cap</div>
                <div className={styles.statValue}>
                  ${metrics?.marketCap ? formatNumber(metrics.marketCap) : '0.00'}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>24h Volume</div>
                <div className={styles.statValue}>
                  ${metrics?.volume24h ? formatNumber(metrics.volume24h) : '0.00'}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Holders</div>
                <div className={styles.statValue}>
                  {metrics?.holders ? metrics.holders.toLocaleString() : '0'}
                </div>
              </div>
            </div>

            <div className={styles.metricsCard}>
              <h2 className={styles.chartTitle}>Supply Metrics</h2>
              <div className={styles.metricsGrid}>
                <div>
                  <div className={styles.statLabel}>Circulating Supply</div>
                  <div className={styles.statValue}>
                    {metrics?.circulatingSupply ? formatNumber(metrics.circulatingSupply) : '0'} tokens
                  </div>
                </div>
                <div>
                  <div className={styles.statLabel}>Total Supply</div>
                  <div className={styles.statValue}>
                    {metrics?.totalSupply ? formatNumber(metrics.totalSupply) : '0'} tokens
                  </div>
                </div>
                <div>
                  <div className={styles.statLabel}>Staking Ratio</div>
                  <div className={styles.statValue}>
                    {metrics?.stakingRatio ? metrics.stakingRatio.toFixed(2) : '0.00'}%
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.chartContainer}>
              <h2 className={styles.chartTitle}>Price History</h2>
              <div className={styles.chart}>
                <LineChart data={[]} />
              </div>
            </div>

            <div className={styles.chartContainer}>
              <h2 className={styles.chartTitle}>Token Distribution</h2>
              <div className={styles.chart}>
                <BarChart data={[]} />
              </div>
            </div>

            <div className={styles.activityGrid}>
              <div className={styles.card}>
                <h2 className={styles.chartTitle}>Network Activity</h2>
                <div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Active Addresses (24h)</span>
                    <span className={styles.metricValue}>
                      {metrics?.activeAddresses?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Transactions (24h)</span>
                    <span className={styles.metricValue}>
                      {metrics?.transactions24h?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h2 className={styles.chartTitle}>Holder Statistics</h2>
                <div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Total Holders</span>
                    <span className={styles.metricValue}>
                      {metrics?.holders?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Staking Participants</span>
                    <span className={styles.metricValue}>
                      {metrics?.holders && metrics?.stakingRatio 
                        ? Math.round(metrics.holders * (metrics.stakingRatio / 100)).toLocaleString()
                        : '0'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}; 