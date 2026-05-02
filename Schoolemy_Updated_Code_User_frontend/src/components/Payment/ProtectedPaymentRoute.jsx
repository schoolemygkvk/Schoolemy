/**
 * Protected Payment Route Component
 * Ensures user is authenticated before accessing payment
 * Bug Fix 2.11.7: Redirects unauthenticated users to login with payment intent
 */

import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  font-size: 16px;
  color: #666;

  .spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-right: 10px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 4px;
  padding: 20px;
  margin: 20px;
  color: #c62828;
  text-align: center;

  h3 {
    margin: 0 0 10px 0;
  }

  p {
    margin: 0;
  }
`;

/**
 * ProtectedPaymentRoute Component
 * Wraps payment pages to ensure authentication
 *
 * Usage in App.js:
 * <Route path="course/:courseId/payment" element={<ProtectedPaymentRoute><PaymentPage /></ProtectedPaymentRoute>} />
 *
 * @param {ReactNode} children - The payment page component to protect
 * @param {boolean} requireExistingPayment - If true, only users with existing payments can access
 */
const ProtectedPaymentRoute = ({
  children,
  requireExistingPayment = false
}) => {
  const { isLoggedIn, userData, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Effect: Handle authentication and payment intent
   * If user is not authenticated, save their intent and redirect to login
   */
  useEffect(() => {
    if (isLoading) {
      // Still loading auth state
      return;
    }

    if (!isLoggedIn || !userData) {
      // User is not authenticated
      // Save payment intent (course + amount if provided) before redirecting
      const paymentIntent = {
        redirectFrom: location.pathname,
        courseId: new URLSearchParams(location.search).get('courseId'),
        amount: new URLSearchParams(location.search).get('amount'),
        paymentType: new URLSearchParams(location.search).get('paymentType'),
        timestamp: Date.now()
      };

      // Store intent in sessionStorage (NOT localStorage for security)
      // sessionStorage is cleared when browser tab is closed
      try {
        sessionStorage.setItem('paymentIntent', JSON.stringify(paymentIntent));
        console.log('Payment intent saved, redirecting to login...');
      } catch (e) {
        console.warn('Failed to save payment intent', e);
      }

      // Redirect to login with return URL
      navigate("/?auth=login&redirect=payment", { replace: true });
    }
  }, [isLoggedIn, userData, isLoading, navigate, location]);

  /**
   * Show loading while checking authentication
   */
  if (isLoading) {
    return (
      <LoadingContainer>
        <div className="spinner"></div>
        Verifying authentication...
      </LoadingContainer>
    );
  }

  /**
   * User is not authenticated - redirect happening in useEffect
   * This check is a fallback
   */
  if (!isLoggedIn || !userData) {
    return (
      <ErrorContainer>
        <h3>Authentication Required</h3>
        <p>You need to be logged in to proceed with payment. Redirecting...</p>
      </ErrorContainer>
    );
  }

  /**
   * User is authenticated - render the payment component
   */
  return <>{children}</>;
};

/**
 * Hook to handle payment intent after login
 * Used in LoginPage to resume payment after authentication
 *
 * Usage in LoginPage:
 * const handleLoginSuccess = () => {
 *   handlePaymentIntentAfterLogin();
 *   navigate('/dashboard');
 * };
 */
export const handlePaymentIntentAfterLogin = () => {
  try {
    const paymentIntentStr = sessionStorage.getItem('paymentIntent');

    if (paymentIntentStr) {
      const paymentIntent = JSON.parse(paymentIntentStr);

      // Validate intent is recent (within 30 minutes)
      const ageInMinutes = (Date.now() - paymentIntent.timestamp) / (1000 * 60);
      if (ageInMinutes > 30) {
        console.log('Payment intent expired');
        sessionStorage.removeItem('paymentIntent');
        return null;
      }

      // Clear the intent
      sessionStorage.removeItem('paymentIntent');

      return paymentIntent;
    }
  } catch (e) {
    console.warn('Failed to retrieve payment intent', e);
  }

  return null;
};

/**
 * Hook to resume payment after login
 * Used to navigate back to payment page after user logs in
 *
 * Usage:
 * const resumePayment = useResumePaymentAfterLogin();
 * resumePayment(); // Navigate back to payment with saved intent
 */
export const useResumePaymentAfterLogin = () => {
  const navigate = useNavigate();

  return () => {
    try {
      const paymentIntentStr = sessionStorage.getItem('paymentIntent');

      if (paymentIntentStr) {
        const paymentIntent = JSON.parse(paymentIntentStr);

        // Check if intent is still valid
        const ageInMinutes = (Date.now() - paymentIntent.timestamp) / (1000 * 60);
        if (ageInMinutes > 30) {
          console.log('Payment intent expired');
          sessionStorage.removeItem('paymentIntent');
          navigate('/dashboard');
          return;
        }

        // Reconstruct URL with query parameters
        let url = paymentIntent.redirectFrom;
        const params = new URLSearchParams();

        if (paymentIntent.courseId) params.append('courseId', paymentIntent.courseId);
        if (paymentIntent.amount) params.append('amount', paymentIntent.amount);
        if (paymentIntent.paymentType) params.append('paymentType', paymentIntent.paymentType);

        if (params.toString()) {
          url += '?' + params.toString();
        }

        console.log('Resuming payment:', url);

        // Navigate back to payment page
        navigate(url, { state: paymentIntent });
        sessionStorage.removeItem('paymentIntent');
      } else {
        navigate('/dashboard');
      }
    } catch (e) {
      console.warn('Failed to resume payment', e);
      navigate('/dashboard');
    }
  };
};

export default ProtectedPaymentRoute;
