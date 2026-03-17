import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import EMIService from '../../service/emiService';
import styled from 'styled-components';

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: #f7fafc;
  padding: 2rem 1rem;
  
  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
  }
`;

const ContentWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 2px solid #e2e8f0;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #f7fafc;
    border-color: #667eea;
    color: #667eea;
    transform: translateX(-5px);
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #1a202c;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const SubTitle = styled.p`
  font-size: 1.1rem;
  color: #4a5568;
  margin-bottom: 2rem;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  
  &.overdue {
    background: #fee2e2;
    color: #991b1b;
  }
  
  &.grace {
    background: #fef3c7;
    color: #92400e;
  }
  
  &.active {
    background: #d1fae5;
    color: #065f46;
  }
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const DetailCard = styled.div`
  background: ${props => props.bgColor || '#f7fafc'};
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid ${props => props.borderColor || '#e2e8f0'};
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const DetailLabel = styled.div`
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const DetailValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: ${props => props.color || '#1a202c'};
  font-family: 'Poppins', sans-serif;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const PayButton = styled.button`
  width: 100%;
  padding: 1.25rem 2rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(16, 185, 129, 0.4);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
    font-size: 1.1rem;
  }
`;

const LoadingSpinner = styled.div`
  border: 3px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const EMIPaymentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [emiStatus, setEmiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    // Try to get EMI status from navigation state first
    if (location.state?.emiStatus) {
      setEmiStatus(location.state.emiStatus);
      setLoading(false);
    } else {
      fetchEmiStatus();
    }
  }, [courseId]);

  const fetchEmiStatus = async () => {
    try {
      setLoading(true);
      const response = await EMIService.getEMIStatus(courseId);
      
      if (response.success) {
        setEmiStatus(response.data);
      } else {
        setError(response.message || 'Failed to fetch EMI status');
      }
    } catch (err) {
      setError(err.message || 'Failed to load EMI details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setPaying(true);
      
      const amountToPay = emiStatus.totalOverdue || emiStatus.nextDueAmount;
      
      console.log("\n" + "=".repeat(60));
      console.log("💳 INITIATING EMI PAYMENT");
      console.log("📊 Amount to pay:", amountToPay);
      console.log("📚 Course ID:", courseId);
      console.log("=".repeat(60) + "\n");
      
      const response = await EMIService.payOverdueEMIs(courseId, amountToPay);
      
      console.log("\n" + "=".repeat(60));
      console.log("📥 PAYMENT RESPONSE");
      console.log("✅ Success:", response.success);
      console.log("📦 Response:", JSON.stringify(response, null, 2));
      console.log("=".repeat(60) + "\n");
      
      if (response.success) {
        // Check if payment requires gateway redirect
        if (response.payment_session_id) {
          // Cashfree payment session - use SDK checkout
          console.log("🔄 Initializing Cashfree payment gateway...");
          console.log("🆔 Order ID:", response.order_id);
          console.log("🔑 Payment ID:", response.paymentId);
          console.log("💳 Session ID:", response.payment_session_id);
          
          // Store payment details in localStorage for callback page
          const paymentDetails = {
            paymentId: response.paymentId || response.order_id,
            courseId: courseId,
            orderId: response.order_id,
            paymentType: 'emi_overdue',
            amount: amountToPay,
          };
          
          console.log("💾 Storing payment details in localStorage:", paymentDetails);
          localStorage.setItem('currentPaymentDetails', JSON.stringify(paymentDetails));
          
          // Also store for session tracking
          sessionStorage.setItem('payment_return_course', courseId);
          sessionStorage.setItem('payment_type', 'emi_overdue');
          
          // Initialize Cashfree SDK
          if (typeof window.Cashfree !== "function") {
            throw new Error("Cashfree SDK not loaded. Please refresh the page.");
          }
          
          try {
            const cashfree = await window.Cashfree({
              mode: process.env.REACT_APP_CASHFREE_ENV === "PRODUCTION" ? "production" : "sandbox",
            });
            
            const checkoutOptions = {
              paymentSessionId: response.payment_session_id,
              returnUrl: `${window.location.origin}/payment/callback?order_id=${response.order_id}`,
            };
            
            console.log("🚀 Opening Cashfree checkout...");
            
            cashfree.checkout(checkoutOptions).then((result) => {
              if (result.error) {
                console.error("❌ Cashfree checkout error:", result.error);
                alert(`Payment failed: ${result.error.message}`);
                setPaying(false);
              } else if (result.paymentDetails) {
                console.log("🎉 Payment successful:", result.paymentDetails);
                // Redirect handled by returnUrl
              } else {
                console.log("ℹ️ Checkout closed by user");
                setPaying(false);
              }
            }).catch((checkoutError) => {
              console.error("❌ Checkout error:", checkoutError);
              alert(`Checkout error: ${checkoutError.message || "Unknown error"}`);
              setPaying(false);
            });
          } catch (cashfreeError) {
            console.error("❌ Cashfree initialization error:", cashfreeError);
            alert("Failed to initialize payment gateway. Please try again.");
            setPaying(false);
            return;
          }
        } else {
          // Payment successful immediately
          console.log("✅ Payment completed successfully!");
          console.log("🔓 Access unlocked:", response.accessUnlocked);
          console.log("🔓 Course unlocked:", response.courseUnlocked);
          
          // Show success message
          alert(`✅ Payment successful! Your course access has been ${response.accessUnlocked ? 'restored' : 'updated'}.`);
          
          // Clear all payment-related session flags
          sessionStorage.removeItem('emi_notified');
          sessionStorage.removeItem('payment_return_course');
          sessionStorage.removeItem('payment_type');
          
          // Redirect to course content with success state
          navigate(`/course/${courseId}/content`, {
            replace: true,
            state: { 
              paymentCompleted: true, 
              accessUnlocked: response.accessUnlocked || response.courseUnlocked || true 
            }
          });
        }
      } else {
        alert(response.message || 'Payment initiation failed');
      }
    } catch (err) {
      console.error("❌ Payment error:", err);
      alert(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const getStatusInfo = () => {
    if (!emiStatus) return { type: 'active', icon: FaCheckCircle, text: 'Active' };
    
    if (emiStatus.overdueEmis > 0) {
      return { type: 'overdue', icon: FaExclamationTriangle, text: 'Overdue Payments' };
    } else if (emiStatus.gracePeriodEmis > 0) {
      return { type: 'grace', icon: FaClock, text: 'Grace Period' };
    } else {
      return { type: 'active', icon: FaCheckCircle, text: 'Active' };
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <LoadingSpinner />
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentWrapper>
          <BackButton onClick={() => navigate(-1)}>
            <FaArrowLeft /> Go Back
          </BackButton>
          <Card>
            <Title>⚠️ Error</Title>
            <SubTitle>{error}</SubTitle>
          </Card>
        </ContentWrapper>
      </PageContainer>
    );
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <PageContainer>
      <ContentWrapper>
        <BackButton onClick={() => navigate(`/course/${courseId}/content`)}>
          <FaArrowLeft /> Back to Course
        </BackButton>

        <Card>
          <Title>💳 EMI Payment</Title>
          <SubTitle>Clear your pending payments to restore course access</SubTitle>

          <StatusBadge className={statusInfo.type}>
            <StatusIcon />
            {statusInfo.text}
          </StatusBadge>

          {emiStatus && (
            <>
              <DetailsGrid>
                <DetailCard bgColor="#fee2e2" borderColor="#fca5a5">
                  <DetailLabel>Overdue Payments</DetailLabel>
                  <DetailValue color="#991b1b">
                    {emiStatus.overdueEmis || 0}
                  </DetailValue>
                </DetailCard>

                <DetailCard bgColor="#d1fae5" borderColor="#6ee7b7">
                  <DetailLabel>Amount Due</DetailLabel>
                  <DetailValue color="#065f46">
                    ₹{(emiStatus.totalOverdue || 0).toLocaleString('en-IN')}
                  </DetailValue>
                </DetailCard>

                <DetailCard bgColor="#dbeafe" borderColor="#93c5fd">
                  <DetailLabel>Paid EMIs</DetailLabel>
                  <DetailValue color="#1e40af">
                    {emiStatus.paidEmis || 0}/{emiStatus.totalEmis || 0}
                  </DetailValue>
                </DetailCard>

                <DetailCard bgColor="#fef3c7" borderColor="#fcd34d">
                  <DetailLabel>Next Due</DetailLabel>
                  <DetailValue color="#92400e" style={{ fontSize: '1rem' }}>
                    {emiStatus.nextDueDate 
                      ? new Date(emiStatus.nextDueDate).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </DetailValue>
                </DetailCard>
              </DetailsGrid>

              {/* Monthly EMI Breakdown */}
              {emiStatus.monthlyAmount > 0 && (() => {
                const firstEmi = emiStatus.emis?.[0];
                const bd = firstEmi?.breakdown;
                const baseValue = bd?.baseValue || Math.round(emiStatus.monthlyAmount / 1.20);
                const cgst = bd?.cgst || Math.round(baseValue * 0.09);
                const sgst = bd?.sgst || Math.round(baseValue * 0.09);
                const gstTotal = bd?.gstTotal || (cgst + sgst);
                const txnFee = bd?.transactionFee || Math.round(baseValue * 0.02);
                return (
                  <div style={{
                    background: '#f0f4ff',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    border: '2px solid #c7d2fe',
                  }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#4c1d95' }}>
                      Monthly EMI Breakdown
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                      <span style={{ color: '#555' }}>Course Value</span>
                      <span>₹{baseValue.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                      <span style={{ color: '#555' }}>CGST (9%)</span>
                      <span>₹{cgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                      <span style={{ color: '#555' }}>SGST (9%)</span>
                      <span>₹{sgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '600', color: '#4f46e5' }}>
                      <span>Total GST (18%)</span>
                      <span>₹{gstTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                      <span style={{ color: '#555' }}>Transaction Fee (2%)</span>
                      <span>₹{txnFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #c7d2fe', fontSize: '1rem', fontWeight: '700' }}>
                      <span>Monthly EMI</span>
                      <span>₹{emiStatus.monthlyAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '2px solid #c7d2fe', fontSize: '1.1rem', fontWeight: '800', color: '#1a202c' }}>
                      <span>Total ({emiStatus.tenure || emiStatus.totalEmis} months)</span>
                      <span>₹{(emiStatus.totalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}

              {emiStatus.overdueEmis > 0 && (
                <div style={{
                  background: '#fef3c7',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  border: '2px solid #fcd34d',
                }}>
                  <p style={{
                    fontSize: '1rem',
                    color: '#92400e',
                    margin: 0,
                    lineHeight: 1.6,
                  }}>
                    <strong>⚠️ Action Required:</strong> You have {emiStatus.overdueEmis} overdue payment(s). 
                    Please clear ₹{(emiStatus.totalOverdue || 0).toLocaleString('en-IN')} to restore your course access immediately.
                  </p>
                </div>
              )}

              <PayButton
                onClick={handlePayment}
                disabled={paying || !emiStatus.totalOverdue}
              >
                {paying ? '⏳ Processing...' : `💰 Pay ₹${(emiStatus.totalOverdue || 0).toLocaleString('en-IN')} Now`}
              </PayButton>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <a
                  href="/user-payment"
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  📊 View Full EMI Dashboard
                </a>
              </div>
            </>
          )}
        </Card>

        {/* Info Card */}
        <Card style={{ background: '#e0e7ff', borderLeft: '4px solid #667eea' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#4c1d95' }}>💡 What happens after payment?</h3>
          <ul style={{ fontSize: '1rem', lineHeight: 1.8, paddingLeft: '1.5rem', color: '#1e293b' }}>
            <li>Your payment will be processed immediately</li>
            <li>Course access will be automatically restored</li>
            <li>You'll receive a confirmation email</li>
            <li>You can continue learning without interruption</li>
          </ul>
        </Card>
      </ContentWrapper>
    </PageContainer>
  );
};

export default EMIPaymentPage;
