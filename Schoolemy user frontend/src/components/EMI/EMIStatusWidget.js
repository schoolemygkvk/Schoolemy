import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import api from "../../service/api"; // Use centralized API instance
import {
  FaExclamationTriangle,
  FaCreditCard,
  FaClock,
  FaCheckCircle,
  FaCalendarAlt,
  FaRupeeSign,
} from "react-icons/fa";
import EMIService from "../../service/emiService";

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const EMIStatusContainer = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  color: white;
  animation: ${slideIn} 0.3s ease-out;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;

const StatusCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  backdrop-filter: blur(10px);

  .value {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 4px;
  }

  .label {
    font-size: 0.8rem;
    opacity: 0.9;
  }
`;

const GracePeriodWarning = styled.div`
  background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${pulse} 2s infinite;

  .icon {
    font-size: 1.2rem;
    color: white;
  }

  .content {
    flex: 1;
    color: white;

    .title {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .message {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .countdown {
      font-weight: 700;
      font-size: 1rem;
      margin-top: 4px;
    }
  }
`;

const OverdueAlert = styled.div`
  background: #ff4757;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${pulse} 2s infinite;

  .icon {
    font-size: 1.2rem;
  }

  .content {
    flex: 1;

    .title {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .message {
      font-size: 0.9rem;
      opacity: 0.9;
    }
  }
`;

const ActionButton = styled.button`
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #ee5a52;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(238, 90, 82, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const MonthlyPaymentSection = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;

  .payment-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .icon {
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .details {
      .title {
        font-weight: 600;
        margin-bottom: 4px;
      }

      .amount {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 2px;
      }

      .due-date {
        font-size: 0.8rem;
        opacity: 0.8;
      }
    }
  }
`;

const NextPaymentInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;

  .icon {
    color: #4ecdc4;
  }

  .info {
    .date {
      font-weight: 600;
    }
    .amount {
      font-size: 0.9rem;
      opacity: 0.9;
    }
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const EMIStatusWidget = ({ courseId, onPayOverdue }) => {
  const [emiStatus, setEmiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingOverdue, setPayingOverdue] = useState(false);

  const formatTimeRemaining = (gracePeriodEnd) => {
    const today = new Date();
    const endDate = new Date(gracePeriodEnd);
    const timeRemaining = endDate - today;

    if (timeRemaining <= 0) return "Grace period ended";

    const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));

    if (daysRemaining >= 1) {
      return `${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining`;
    } else if (hoursRemaining > 0) {
      return `${hoursRemaining} hour${hoursRemaining > 1 ? "s" : ""} remaining`;
    } else {
      return "Grace period ending soon";
    }
  };

  const fetchEmiStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/user/emi/status/${courseId}`);

      const data = response.data;
      if (data.success) {
        setEmiStatus(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch EMI status");
      }
    } catch (err) {
      console.error("Error fetching EMI status:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchEmiStatus();
    }
  }, [courseId]);

  const handlePayOverdue = async () => {
    setPayingOverdue(true);
    try {
      if (onPayOverdue) {
        await onPayOverdue(emiStatus.overdueAmount);
        // Refresh EMI status after payment
        await fetchEmiStatus();
      }
    } catch (error) {
      console.error("Error paying overdue EMIs:", error);
    } finally {
      setPayingOverdue(false);
    }
  };

  const handleMonthlyPayment = async () => {
    setPayingOverdue(true);
    try {
      const response = await EMIService.payMonthlyEmi(
        courseId,
        emiStatus.nextDueAmount
      );

      if (response.success) {
        // Initialize Razorpay payment
        const options = {
          key: response.data.razorpayKeyId,
          amount: response.data.amount * 100,
          currency: response.data.currency,
          order_id: response.data.orderId,
          name: "Monthly EMI Payment",
          description: "Course EMI Payment",
          handler: function (paymentResponse) {
            console.log("Payment successful:", paymentResponse);
            // Refresh EMI status after payment
            fetchEmiStatus();
          },
          prefill: {
            name: localStorage.getItem("userName") || "",
            email: localStorage.getItem("userEmail") || "",
          },
          theme: {
            color: "#667eea",
          },
          modal: {
            ondismiss: function () {
              setPayingOverdue(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error("Error processing monthly payment:", error);
      setPayingOverdue(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <EMIStatusContainer>
        <LoadingSpinner>
          <div className="spinner"></div>
        </LoadingSpinner>
      </EMIStatusContainer>
    );
  }

  if (error || !emiStatus) {
    return null; // Don't show widget if there's an error or no EMI plan
  }

  // Handle full payment users - show success message
  if (emiStatus.paymentType === "full") {
    return (
      <EMIStatusContainer
        style={{
          background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
        }}
      >
        <StatusHeader>
          <FaCheckCircle />
          <h3>Payment Complete</h3>
        </StatusHeader>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "rgba(255,255,255,0.15)",
            padding: "16px",
            borderRadius: "8px",
            marginTop: "12px",
          }}
        >
          <FaCheckCircle style={{ color: "#ffffff", fontSize: "1.5rem" }} />
          <div>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
              Course Fully Paid
            </div>
            <div style={{ opacity: "0.9", fontSize: "0.9rem" }}>
              Amount: ₹{emiStatus.paidAmount} • Paid on:{" "}
              {formatDate(emiStatus.paymentDate)}
            </div>
            <div
              style={{ opacity: "0.8", fontSize: "0.85rem", marginTop: "4px" }}
            >
              Transaction ID: {emiStatus.transactionId}
            </div>
          </div>
        </div>
      </EMIStatusContainer>
    );
  }

  // Handle users with no payment - show purchase prompt
  if (emiStatus.paymentType === "none") {
    return null; // Don't show widget if no payment found
  }

  // Handle EMI users (existing logic)
  return (
    <EMIStatusContainer>
      <StatusHeader>
        <FaCreditCard />
        <h3>EMI Payment Status</h3>
      </StatusHeader>

      {/* Grace Period Warning - Show for EMIs that are overdue but within grace period */}
      {emiStatus.gracePeriodInfo && (
        <GracePeriodWarning>
          <FaClock className="icon" />
          <div className="content">
            <div className="title">Payment Past Due - Grace Period Active</div>
            <div className="message">
              EMI was due: {formatDate(emiStatus.gracePeriodInfo.dueDate)}
            </div>
            <div className="countdown">
              Course access ends in:{" "}
              {formatTimeRemaining(emiStatus.gracePeriodInfo.gracePeriodEnd)}
            </div>
          </div>
          <ActionButton
            onClick={() => handlePayOverdue(emiStatus.gracePeriodInfo.amount)}
            disabled={payingOverdue}
            style={{
              backgroundColor: "#ff9800",
              fontSize: "0.9rem",
              padding: "8px 16px",
            }}
          >
            {payingOverdue
              ? "Processing..."
              : `Pay ₹${emiStatus.gracePeriodInfo.amount} Now`}
          </ActionButton>
        </GracePeriodWarning>
      )}

      {/* True Overdue Alert - Show when grace period has expired */}
      {emiStatus.overdueEmis > 0 && (
        <OverdueAlert>
          <FaExclamationTriangle className="icon" />
          <div className="content">
            <div className="title">Payment Overdue!</div>
            <div className="message">
              {emiStatus.overdueEmis} EMI payment(s) are overdue. Course access
              is locked until payment.
            </div>
          </div>
          <ActionButton onClick={handlePayOverdue} disabled={payingOverdue}>
            {payingOverdue
              ? "Processing..."
              : `Pay ₹${emiStatus.overdueAmount}`}
          </ActionButton>
        </OverdueAlert>
      )}

      {/* Monthly Payment Section for Current Month */}
      {emiStatus.nextDueAmount > 0 && emiStatus.overdueEmis === 0 && (
        <MonthlyPaymentSection>
          <div className="payment-info">
            <FaCalendarAlt className="icon" />
            <div className="details">
              <div className="title">Monthly EMI Due</div>
              <div className="amount">
                ₹{emiStatus.nextDueAmount?.toLocaleString("en-IN")}
              </div>
              {emiStatus.nextDueDate && (
                <div className="due-date">
                  Due: {formatDate(emiStatus.nextDueDate)}
                </div>
              )}
            </div>
          </div>
          <ActionButton
            onClick={handleMonthlyPayment}
            disabled={payingOverdue}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            {payingOverdue ? "Processing..." : "Pay Monthly EMI"}
          </ActionButton>
        </MonthlyPaymentSection>
      )}

      <StatusGrid>
        <StatusCard>
          <div className="value">
            {emiStatus.paidEmis}/{emiStatus.totalEmis}
          </div>
          <div className="label">EMIs Paid</div>
        </StatusCard>

        <StatusCard>
          <div className="value">{emiStatus.upcomingEmis}</div>
          <div className="label">Upcoming</div>
        </StatusCard>

        <StatusCard>
          <div className="value">
            {emiStatus.planStatus === "active" ? (
              <FaCheckCircle style={{ color: "#2ed573" }} />
            ) : (
              <FaExclamationTriangle style={{ color: "#ff6b6b" }} />
            )}
          </div>
          <div className="label">Status</div>
        </StatusCard>
      </StatusGrid>

      {emiStatus.nextDueDate &&
        emiStatus.overdueEmis === 0 &&
        !emiStatus.gracePeriodInfo && (
          <NextPaymentInfo>
            <FaClock className="icon" />
            <div className="info">
              <div className="date">
                Next Payment: {formatDate(emiStatus.nextDueDate)}
              </div>
              <div className="amount">
                Amount: ₹{emiStatus.overdueAmount || "2000"}
              </div>
            </div>
          </NextPaymentInfo>
        )}
    </EMIStatusContainer>
  );
};

export default EMIStatusWidget;
