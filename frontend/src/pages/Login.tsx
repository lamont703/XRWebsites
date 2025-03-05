import { useState, useEffect } from 'react';
import { useAuth } from '../store/auth/Auth';
import { useNavigate } from 'react-router-dom';
import styles from '@/styles/Login.module.css';


interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  name: string;
  confirmPassword: string;
}

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        console.log('Login attempt with URL:', import.meta.env.VITE_BACKEND_API_URL);
        console.log('Full login URL:', `${import.meta.env.VITE_BACKEND_API_URL}/users/login`);
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        console.log('Register attempt with URL:', import.meta.env.VITE_BACKEND_API_URL);
        console.log('Full register URL:', `${import.meta.env.VITE_BACKEND_API_URL}/users/register`);
        
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Registration failed');
        }

        await login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.gradientOverlay}>
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
      </div>
    </div>
  );
}; 