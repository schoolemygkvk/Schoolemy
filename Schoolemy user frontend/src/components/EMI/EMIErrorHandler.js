import React from "react";
import styled, { keyframes } from "styled-components";
import {
  FaLock,
  FaExclamationTriangle,
  FaCreditCard,
  FaArrowRight,
} from "react-icons/fa";

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;

const ErrorContainer = styled.div`
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin: 16px 0;
  animation: ${slideDown} 0.4s ease-out;
  box-shadow: 0 8px 25px rgba(238, 90, 82, 0.3);
`;

const PaymentRequiredContainer = styled.div`
  background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin: 16px 0;
  animation: ${slideDown} 0.4s ease-out;
  box-shadow: 0 8px 25px rgba(255, 152, 0, 0.3);
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .icon {
    font-size: 1.5rem;
    animation: ${pulse} 2s infinite;
  }

  h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
  }
`;

const ErrorMessage = styled.p`
  margin: 0 0 20px 0;
  font-size: 1rem;
  line-height: 1.5;
  opacity: 0.95;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }

  &.primary {
    background: white;
    color: #ff6b6b;
    border-color: white;

    &:hover {
      background: #f8f9fa;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }
  }

  &.warning {
    color: #ffa726;

    &.primary {
      color: #ff9800;
    }
  }
`;

const EMIDetails = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
      font-weight: 600;
      font-size: 1.1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding-top: 8px;
      margin-top: 8px;
    }
  }
`;

const EMIErrorHandler = ({
  error,
  errorCode,
  onPayOverdue,
  onGoToPayment,
  onRetry,
  overdueDetails,
}) => {
  // Handle EMI overdue error
  if (errorCode === "EMI_OVERDUE") {
    return (
      <ErrorContainer>
        <ErrorHeader>
          <FaLock className="icon" />
          <h3>Course Access Locked</h3>
        </ErrorHeader>

        <ErrorMessage>
          Your course access has been temporarily locked due to overdue EMI
          payments. Please complete your pending payments to restore access.
        </ErrorMessage>

        {overdueDetails && (
          <EMIDetails>
            <div className="detail-row">
              <span>Overdue Payments:</span>
              <span>{overdueDetails.count} EMI(s)</span>
            </div>
            <div className="detail-row">
              <span>Amount Due:</span>
              <span>₹{overdueDetails.expectedAmount}</span>
            </div>
          </EMIDetails>
        )}

        <ActionButtons>
          <ActionButton
            className="primary"
            onClick={() =>
              onPayOverdue && onPayOverdue(overdueDetails?.expectedAmount)
            }
          >
            <FaCreditCard />
            Pay Now ₹{overdueDetails?.expectedAmount || "Amount"}
          </ActionButton>

          <ActionButton onClick={onRetry}>Refresh Status</ActionButton>
        </ActionButtons>
      </ErrorContainer>
    );
  }

  // Handle payment required error
  if (errorCode === "PAYMENT_REQUIRED") {
    return (
      <PaymentRequiredContainer>
        <ErrorHeader className="warning">
          <FaExclamationTriangle className="icon" />
          <h3>Payment Required</h3>
        </ErrorHeader>

        <ErrorMessage>
          This course requires payment to access the content. Choose your
          preferred payment option to get started.
        </ErrorMessage>

        <ActionButtons>
          <ActionButton
            className="primary warning"
            onClick={() => onGoToPayment && onGoToPayment()}
          >
            <FaCreditCard />
            Go to Payment
            <FaArrowRight />
          </ActionButton>

          <ActionButton onClick={onRetry}>Refresh Status</ActionButton>
        </ActionButtons>
      </PaymentRequiredContainer>
    );
  }

  // Handle other errors
  if (error) {
    return (
      <ErrorContainer>
        <ErrorHeader>
          <FaExclamationTriangle className="icon" />
          <h3>Access Error</h3>
        </ErrorHeader>

        <ErrorMessage>
          {error || "Unable to access course content. Please try again."}
        </ErrorMessage>

        <ActionButtons>
          <ActionButton className="primary" onClick={onRetry}>
            Try Again
          </ActionButton>
        </ActionButtons>
      </ErrorContainer>
    );
  }

  return null;
};

export default EMIErrorHandler;
