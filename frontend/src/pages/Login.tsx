import { useState, useEffect } from 'react';
import { useAuth } from '../store/auth/Auth';
import { useNavigate } from 'react-router-dom';
import styles from '@/styles/Login.module.css';
import { ConnectWallet } from '../components/features/wallet/ConnectWallet';
import { OnboardingFlow } from '../components/features/onboarding/OnboardingFlow';
import { RoleSelector } from '../components/features/auth/RoleSelector';


interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  name: string;
  confirmPassword: string;
  referralCode?: string;  // Optional referral code
}

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    referralCode: '',
    role: 'developer'
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [roleOptions] = useState([
    { value: 'developer', label: 'Developer' },
    { value: 'client', label: 'Client' }
  ]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/wallet/check-onboarding-nft`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to check NFT status');
      
      const { data } = await response.json();
      
      if (!data.onboardingComplete) {
        setShowOnboarding(true);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true); // Show onboarding on error as fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        setShowOnboarding(true);
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            referralCode: formData.referralCode || undefined
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Registration failed');
        }

        await login(formData.email, formData.password);
        setShowOnboarding(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnected = async (address: string) => {
    try {
      navigate('/dashboard');
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !showOnboarding && !showWalletConnect) {
      checkOnboardingStatus();
    }
  }, [isAuthenticated]);

  if (showOnboarding) {
    return <OnboardingFlow initialStep={0} />;
  }

  if (showWalletConnect) {
    return (
      <div className={styles.walletContainer}>
        <h2>Connect Your Wallet</h2>
        <p>Link your Solana wallet to access all features</p>
        <ConnectWallet 
          onConnect={handleWalletConnected}
          referralCode={formData.referralCode}
        />
        <button 
          className={styles.skipButton}
          onClick={() => navigate('/dashboard')}
        >
          Skip for now
        </button>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      {!showWalletConnect ? (
        <div className={styles.formContainer}>
          <h2 className={styles.title}>
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className={styles.subtitle}>
            Or{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className={styles.toggleButton}
            >
              {isLogin ? 'create a new account' : 'sign in to existing account'}
            </button>
          </p>

          {error && (
            <div className={styles.errorContainer}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            {!isLogin && (
              <input
                id="name"
                name="name"
                type="text"
                required
                className={styles.input}
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}

            <input
              id="email"
              name="email"
              type="email"
              required
              className={styles.input}
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <input
              id="password"
              name="password"
              type="password"
              required
              className={styles.input}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            {!isLogin && (
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={styles.input}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            )}

            {!isLogin && (
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                className={styles.input}
                placeholder="Referral Code (Optional)"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
              />
            )}

            {!isLogin && (
              <div className="my-6">
                <RoleSelector
                  selectedRole={formData.role}
                  onChange={(role) => setFormData({ ...formData, role })}
                />
              </div>
            )}

            <button type="submit" className={styles.submitButton}>
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
            
            <div className={styles.subtitle}>
              <a
                href="https://xrwebsites.io"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Visit XRWebsites.io
              </a>
            </div>
          </form>

          {isLoading && <div>Loading...</div>}
        </div>
      ) : (
        <div className={styles.walletContainer}>
          <h2>Connect Your Wallet</h2>
          <p>Link your Solana wallet to access all features</p>
          <ConnectWallet 
            onConnect={handleWalletConnected}
            referralCode={formData.referralCode}
          />
          <button 
            className={styles.skipButton}
            onClick={() => navigate('/dashboard')}
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}; 