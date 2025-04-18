import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ConnectWallet } from '@/components/features/wallet/ConnectWallet';
import styles from '@/styles/SpatialTokenPlatform.module.css';

// Define the types of monetization models available
type MonetizationModel = 'sell' | 'rent' | 'time-slot' | 'sponsorship';

// Interface for a spatial token
interface SpatialToken {
  id: string;
  name: string;
  description: string;
  location: {
    type: 'ar' | 'vr' | 'physical';
    coordinates?: string;
    dimensions?: { width: number; height: number; depth: number };
  };
  monetizationModel: MonetizationModel;
  price: number;
  currency: string;
  owner: string;
  active: boolean;
  metrics?: {
    views: number;
    engagement: number;
    revenue: number;
  };
}

// Platform features for the dashboard
interface PlatformFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  comingSoon?: boolean;
}

export const SpatialTokenPlatform = () => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'manage' | 'analytics'>('dashboard');
  const [userTokens, setUserTokens] = useState<SpatialToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<SpatialToken | null>(null);

  // Platform features
  const platformFeatures: PlatformFeature[] = [
    {
      id: 'create-spatial-token',
      title: 'Create Spatial Token',
      description: 'Tokenize a location in virtual or physical space',
      icon: '📍',
      path: '/spatial-tokens/create'
    },
    {
      id: 'monetization-engine',
      title: 'Monetization Engine',
      description: 'Set up pricing and revenue models for your spatial tokens',
      icon: '💰',
      path: '/spatial-tokens/monetize'
    },
    {
      id: 'content-manager',
      title: 'Content Manager',
      description: 'Upload and manage AR/VR content for your spatial tokens',
      icon: '🎮',
      path: '/spatial-tokens/content'
    },
    {
      id: 'analytics-dashboard',
      title: 'Analytics Dashboard',
      description: 'Track usage, engagement, and ROI for your spatial tokens',
      icon: '📊',
      path: '/spatial-tokens/analytics'
    },
    {
      id: 'marketplace',
      title: 'Spatial Marketplace',
      description: 'Buy, sell, and trade spatial tokens',
      icon: '🏪',
      path: '/spatial-tokens/marketplace',
      comingSoon: true
    },
    {
      id: 'developer-sdk',
      title: 'Developer SDK',
      description: 'Integrate spatial tokens into your own applications',
      icon: '🧰',
      path: '/spatial-tokens/sdk',
      comingSoon: true
    }
  ];

  useEffect(() => {
    // Load user's spatial tokens
    loadUserTokens();
  }, [wallet.connected]);

  const loadUserTokens = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, you would fetch this from an API
      // For now, we'll use static data
      if (wallet.connected) {
        // Mock data for demonstration
        const tokens: SpatialToken[] = [
          {
            id: 'token-1',
            name: 'AR Showcase Zone',
            description: 'Prime AR display space in virtual gallery',
            location: {
              type: 'ar',
              coordinates: '34.052235,-118.243683',
              dimensions: { width: 10, height: 10, depth: 10 }
            },
            monetizationModel: 'rent',
            price: 5,
            currency: 'USDC',
            owner: wallet.publicKey?.toString() || '',
            active: true,
            metrics: {
              views: 1243,
              engagement: 78,
              revenue: 350
            }
          },
          {
            id: 'token-2',
            name: 'VR Conference Room',
            description: 'Virtual meeting space for presentations',
            location: {
              type: 'vr',
              dimensions: { width: 20, height: 10, depth: 20 }
            },
            monetizationModel: 'time-slot',
            price: 10,
            currency: 'USDC',
            owner: wallet.publicKey?.toString() || '',
            active: true,
            metrics: {
              views: 532,
              engagement: 45,
              revenue: 200
            }
          }
        ];
        
        setUserTokens(tokens);
      } else {
        setUserTokens([]);
      }
    } catch (error) {
      console.error('Error loading spatial tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureClick = (feature: PlatformFeature) => {
    if (feature.comingSoon) {
      // Show a coming soon message
      return;
    }
    
    // Navigate to the feature's path
    navigate(feature.path);
  };

  const handleTokenClick = (token: SpatialToken) => {
    setSelectedToken(token);
  };

  const handleTabChange = (tab: 'dashboard' | 'create' | 'manage' | 'analytics') => {
    setActiveTab(tab);
  };

  // Render the dashboard tab
  const renderDashboard = () => {
    return (
      <div className={styles.dashboardContainer}>
        <h2 className={styles.sectionTitle}>Spatial Token Platform</h2>
        <p className={styles.sectionDescription}>
          Create, manage, and monetize digital space in AR/VR environments or physical locations
        </p>
        
        <div className={styles.featuresGrid}>
          {platformFeatures.map(feature => (
            <div 
              key={feature.id} 
              className={`${styles.featureCard} ${feature.comingSoon ? styles.comingSoon : ''}`}
              onClick={() => handleFeatureClick(feature)}
            >
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
              {feature.comingSoon && (
                <div className={styles.comingSoonBadge}>Coming Soon</div>
              )}
            </div>
          ))}
        </div>
        
        {wallet.connected && userTokens.length > 0 && (
          <div className={styles.yourTokensSection}>
            <h3>Your Spatial Tokens</h3>
            <div className={styles.tokensGrid}>
              {userTokens.map(token => (
                <div 
                  key={token.id} 
                  className={styles.tokenCard}
                  onClick={() => handleTokenClick(token)}
                >
                  <div className={styles.tokenHeader}>
                    <div className={styles.tokenType}>
                      {token.location.type === 'ar' ? '📱 AR' : 
                       token.location.type === 'vr' ? '🥽 VR' : '📍 Physical'}
                    </div>
                    <div className={`${styles.tokenStatus} ${token.active ? styles.active : styles.inactive}`}>
                      {token.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <h4 className={styles.tokenName}>{token.name}</h4>
                  <p className={styles.tokenDescription}>{token.description}</p>
                  
                  <div className={styles.tokenDetails}>
                    <div className={styles.tokenDetail}>
                      <span className={styles.detailLabel}>Model:</span>
                      <span className={styles.detailValue}>
                        {token.monetizationModel.charAt(0).toUpperCase() + token.monetizationModel.slice(1)}
                      </span>
                    </div>
                    <div className={styles.tokenDetail}>
                      <span className={styles.detailLabel}>Price:</span>
                      <span className={styles.detailValue}>{token.price} {token.currency}</span>
                    </div>
                  </div>
                  
                  {token.metrics && (
                    <div className={styles.tokenMetrics}>
                      <div className={styles.metricItem}>
                        <span className={styles.metricValue}>{token.metrics.views}</span>
                        <span className={styles.metricLabel}>Views</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricValue}>{token.metrics.engagement}%</span>
                        <span className={styles.metricLabel}>Engagement</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricValue}>${token.metrics.revenue}</span>
                        <span className={styles.metricLabel}>Revenue</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render the create tab
  const renderCreate = () => {
    return (
      <div className={styles.createContainer}>
        <h2 className={styles.sectionTitle}>Create Spatial Token</h2>
        <p className={styles.sectionDescription}>
          Define and tokenize a location in virtual or physical space
        </p>
        
        {/* Create form would go here */}
        <div className={styles.comingSoonMessage}>
          <div className={styles.comingSoonIcon}>🚧</div>
          <h3>Creation Interface Coming Soon</h3>
          <p>We're building a powerful and intuitive interface for creating spatial tokens.</p>
          <p>Check back soon for updates!</p>
        </div>
      </div>
    );
  };

  // Render the manage tab
  const renderManage = () => {
    return (
      <div className={styles.manageContainer}>
        <h2 className={styles.sectionTitle}>Manage Spatial Tokens</h2>
        <p className={styles.sectionDescription}>
          View and manage your existing spatial tokens
        </p>
        
        {wallet.connected ? (
          userTokens.length > 0 ? (
            <div className={styles.tokensTable}>
              {/* Token management interface would go here */}
              <div className={styles.tableHeader}>
                <div className={styles.tableCell}>Name</div>
                <div className={styles.tableCell}>Type</div>
                <div className={styles.tableCell}>Model</div>
                <div className={styles.tableCell}>Price</div>
                <div className={styles.tableCell}>Status</div>
                <div className={styles.tableCell}>Actions</div>
              </div>
              
              {userTokens.map(token => (
                <div key={token.id} className={styles.tableRow}>
                  <div className={styles.tableCell}>{token.name}</div>
                  <div className={styles.tableCell}>
                    {token.location.type === 'ar' ? 'AR Zone' : 
                     token.location.type === 'vr' ? 'VR Space' : 'Physical Location'}
                  </div>
                  <div className={styles.tableCell}>
                    {token.monetizationModel.charAt(0).toUpperCase() + token.monetizationModel.slice(1)}
                  </div>
                  <div className={styles.tableCell}>{token.price} {token.currency}</div>
                  <div className={styles.tableCell}>
                    <span className={`${styles.statusBadge} ${token.active ? styles.activeBadge : styles.inactiveBadge}`}>
                      {token.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className={styles.tableCell}>
                    <button className={styles.actionButton}>Edit</button>
                    <button className={styles.actionButton}>
                      {token.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📍</div>
              <h3>No Spatial Tokens Yet</h3>
              <p>You haven't created any spatial tokens yet.</p>
              <button 
                className={styles.primaryButton}
                onClick={() => handleTabChange('create')}
              >
                Create Your First Token
              </button>
            </div>
          )
        ) : (
          <div className={styles.connectWalletPrompt}>
            <p>Connect your wallet to manage your spatial tokens</p>
            <ConnectWallet />
          </div>
        )}
      </div>
    );
  };

  // Render the analytics tab
  const renderAnalytics = () => {
    return (
      <div className={styles.analyticsContainer}>
        <h2 className={styles.sectionTitle}>Analytics Dashboard</h2>
        <p className={styles.sectionDescription}>
          Track usage, engagement, and ROI for your spatial tokens
        </p>
        
        {wallet.connected ? (
          userTokens.length > 0 ? (
            <div className={styles.analyticsContent}>
              <div className={styles.analyticsOverview}>
                <div className={styles.analyticCard}>
                  <div className={styles.analyticValue}>
                    {userTokens.reduce((sum, token) => sum + (token.metrics?.views || 0), 0).toLocaleString()}
                  </div>
                  <div className={styles.analyticLabel}>Total Views</div>
                </div>
                
                <div className={styles.analyticCard}>
                  <div className={styles.analyticValue}>
                    {Math.round(userTokens.reduce((sum, token) => sum + (token.metrics?.engagement || 0), 0) / userTokens.length)}%
                  </div>
                  <div className={styles.analyticLabel}>Avg. Engagement</div>
                </div>
                
                <div className={styles.analyticCard}>
                  <div className={styles.analyticValue}>
                    ${userTokens.reduce((sum, token) => sum + (token.metrics?.revenue || 0), 0).toLocaleString()}
                  </div>
                  <div className={styles.analyticLabel}>Total Revenue</div>
                </div>
              </div>
              
              <div className={styles.analyticsChartPlaceholder}>
                <div className={styles.chartIcon}>📊</div>
                <p>Detailed analytics charts coming soon</p>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📊</div>
              <h3>No Analytics Data</h3>
              <p>Create spatial tokens to start collecting analytics data.</p>
              <button 
                className={styles.primaryButton}
                onClick={() => handleTabChange('create')}
              >
                Create Your First Token
              </button>
            </div>
          )
        ) : (
          <div className={styles.connectWalletPrompt}>
            <p>Connect your wallet to view analytics</p>
            <ConnectWallet />
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className={styles.platformContainer}>
        <div className={styles.platformHeader}>
          <h1 className={styles.platformTitle}>
            <span className={styles.platformIcon}>🌐</span> 
            Spatial Token Monetization
          </h1>
          <p className={styles.platformSubtitle}>
            Turn digital space into programmable, monetizable real estate
          </p>
          <button 
            className={styles.missionControlButton}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Mission Control
          </button>
        </div>
        
        {!wallet.connected && (
          <div className={styles.walletConnectBanner}>
            <div className={styles.bannerContent}>
              <div className={styles.bannerIcon}>🔗</div>
              <div className={styles.bannerText}>
                <h3>Connect Your Wallet</h3>
                <p>Connect your wallet to create and manage spatial tokens</p>
              </div>
            </div>
            <div className={styles.bannerAction}>
              <ConnectWallet />
            </div>
          </div>
        )}
        
        <div className={styles.platformTabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'dashboard' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'create' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('create')}
          >
            Create
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'manage' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('manage')}
          >
            Manage
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('analytics')}
          >
            Analytics
          </button>
        </div>
        
        <div className={styles.platformContent}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'create' && renderCreate()}
          {activeTab === 'manage' && renderManage()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
    </MainLayout>
  );
}; 