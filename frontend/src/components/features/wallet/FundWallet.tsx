import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import styles from '@/styles/FundWallet.module.css';

interface FundWalletProps {
    onFund: (amount: number) => Promise<void>;
    className?: string;
    walletId: string;
}

// Instead, create a function to get the Stripe promise
const getStripePromise = () => {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!key) {
        console.error('Stripe public key is missing');
        return null;
    }
    return loadStripe(key);
};

const PaymentForm: React.FC<{ clientSecret: string; amount: number; onSuccess: () => void }> = ({ 
    amount, 
    onSuccess 
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) {
            console.error('Stripe or Elements not initialized');
            return;
        }

        setProcessing(true);
        setError(null);
        console.log('🚀 Starting payment submission...');

        try {
            const { error: submitError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/wallet`,
                },
                redirect: 'if_required',
            });

            console.log('💳 Payment confirmation result:', { submitError, paymentIntent });

            if (submitError) {
                console.error('❌ Payment error:', submitError);
                setError(submitError.message || 'Payment failed');
                setProcessing(false);
                return;
            }

            if (!paymentIntent) {
                setError('Payment requires confirmation. Please wait...');
                return;
            }

            switch (paymentIntent.status) {
                case 'succeeded':
                    console.log('✅ Payment succeeded:', paymentIntent);
                    setProcessing(false);
                    onSuccess();
                    break;
                case 'processing':
                    console.log('⏳ Payment is processing');
                    setError('Your payment is processing. Please wait...');
                    break;
                case 'requires_payment_method':
                    console.log('❌ Payment failed, requires new payment method');
                    setError('Payment failed. Please try another payment method.');
                    setProcessing(false);
                    break;
                default:
                    console.log('❌ Unexpected status:', paymentIntent.status);
                    setError(`Unexpected payment status: ${paymentIntent.status}`);
                    setProcessing(false);
            }
        } catch (err) {
            console.error('❌ Payment submission error:', err);
            setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {error && (
                <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 
                    disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            </button>
        </form>
    );
};

export const FundWallet: React.FC<FundWalletProps> = ({ onFund, className = '', walletId }) => {
    const [amount, setAmount] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [stripePromise] = useState(() => getStripePromise());

    // Add useEffect to handle success message timeout
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (successMessage) {
            timeoutId = setTimeout(() => {
                setSuccessMessage(null);
            }, 10000);
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [successMessage]);

    const initializePayment = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/payments/create-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({ amount: parseFloat(amount) }),
            });

            if (!response.ok) {
                throw new Error('Failed to initialize payment');
            }

            const { data } = await response.json();
            setClientSecret(data.clientSecret);
            setShowPayment(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize payment');
        }
    };

    const handleSuccess = async () => {
        console.log('🎉 Payment success handler started');
        try {
            // First update the wallet balance
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_API_URL}/wallet/${walletId}/balance`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ amount: parseFloat(amount) }),
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update wallet balance');
            }

            // Then update UI state
            setShowPayment(false);
            setClientSecret(null);
            setError(null);
            setAmount('');
            setSuccessMessage('Payment successful! Your wallet has been updated.');
            
            console.log('💰 Calling onFund with amount:', parseFloat(amount));
            await onFund(parseFloat(amount));
            console.log('✅ onFund completed successfully');
        } catch (err) {
            console.error('❌ Payment success handler error:', err);
            setError('Payment successful, but wallet update failed. Please refresh.');
        }
    };

    return (
        <div className={`${styles.fundContainer} ${className}`}>
            <h2 className={styles.title}>Fund Your Wallet</h2>
            {successMessage && (
                <div className={styles.successMessage}>
                    {successMessage}
                </div>
            )}
            {!showPayment ? (
                <div className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="amount" className={styles.label}>
                            Amount (USD)
                        </label>
                        <div className={styles.inputWrapper}>
                            <span className={styles.currencySymbol}>$</span>
                            <input
                                type="number"
                                id="amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={styles.input}
                                placeholder="0.00"
                                min="1"
                                step="0.01"
                            />
                        </div>
                    </div>
                    <button
                        onClick={initializePayment}
                        disabled={!amount || parseFloat(amount) <= 0}
                        className={styles.button}
                    >
                        Continue to Payment
                    </button>
                </div>
            ) : showPayment && clientSecret && stripePromise ? (
                <Elements 
                    stripe={stripePromise} 
                    options={{
                        clientSecret,
                        appearance: { theme: 'night' },
                        loader: 'auto'
                    }}
                >
                    <PaymentForm 
                        clientSecret={clientSecret}
                        amount={parseFloat(amount)} 
                        onSuccess={handleSuccess} 
                    />
                </Elements>
            ) : null}
            {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
    );
}; 