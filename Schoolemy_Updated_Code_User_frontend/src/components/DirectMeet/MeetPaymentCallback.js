import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { verifyMeetPayment } from '../../service/meetPaymentApi';
import { joinMeet } from '../../service/userCourseMeetApi';

const MeetPaymentCallback = () => {
  const { id: meetId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Log all URL parameters for debugging
      console.log(' Full URL:', window.location.href);
      console.log(' Search string:', window.location.search);
      console.log(' SearchParams entries:', Array.from(searchParams.entries()));
      
      // Try multiple possible parameter names that Cashfree might use
      let orderId = searchParams.get('order_id') || 
                    searchParams.get('orderId') || 
                    searchParams.get('cf_order_id') ||
                    searchParams.get('order');
      
      // If no order_id in URL, try to get from localStorage
      if (!orderId) {
        orderId = localStorage.getItem('pending_payment_order');
        console.log(' Retrieved order_id from localStorage:', orderId);
      }
      
      console.log(' Extracted order_id:', orderId);
      
      if (!orderId) {
        console.error(' No order_id found in URL');
        console.error(' Available params:', Object.fromEntries(searchParams));
        setStatus('error');
        setMessage(`Invalid payment callback - No order ID found. Available params: ${Array.from(searchParams.keys()).join(', ') || 'none'}`);
        return;
      }

      console.log(' Verifying payment for order:', orderId);

      // Verify payment with backend
      const result = await verifyMeetPayment(orderId);

      if (result.success && result.payment_status === 'completed') {
        setStatus('success');
        setMessage('Payment successful! Redirecting to meet page...');
        
        // Clear stored order_id
        localStorage.removeItem('pending_payment_order');
        localStorage.removeItem('pending_payment_meet');

        // Just redirect to meet page - let user click Join button there
        setTimeout(() => {
          navigate(`/user/meets/${meetId}`, { 
            state: { paymentCompleted: true },
            replace: true 
          });
        }, 2000);

      } else if (result.payment_status === 'pending') {
        setStatus('pending');
        setMessage('Payment is being processed. Please wait...');
        
        // Retry verification after 3 seconds
        setTimeout(verifyPayment, 3000);
      } else {
        setStatus('failed');
        setMessage('Payment failed or was cancelled. Please try again.');
        
        setTimeout(() => {
          navigate(`/user/meets/${meetId}`);
        }, 3000);
      }

    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('error');
      setMessage('Error verifying payment. Please contact support if amount was deducted.');
      
      setTimeout(() => {
        navigate(`/user/meets/${meetId}`);
      }, 5000);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '';
      case 'failed':
        return '';
      case 'error':
        return '';
      case 'pending':
        return '';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'failed':
      case 'error':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ ...styles.icon, color: getStatusColor() }}>
          {getStatusIcon()}
        </div>
        <h2 style={styles.title}>Payment Status</h2>
        <p style={styles.message}>{message}</p>
        {status === 'verifying' && (
          <div style={styles.spinner}></div>
        )}
        {status !== 'verifying' && (
          <button 
            style={styles.button}
            onClick={() => navigate(`/user/meets/${meetId}`)}
          >
            Back to Meet Details
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px'
  },
  message: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.5'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
  },
  button: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginTop: '16px'
  }
};

// Add keyframe animation - inject into a new style element to avoid CORS issues
if (typeof document !== 'undefined' && !document.getElementById('meet-payment-spinner-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'meet-payment-spinner-styles';
  styleElement.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleElement);
}

export default MeetPaymentCallback;
