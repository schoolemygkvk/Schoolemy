/**
 * Payment Method Selector Component
 * Allows users to select payment method before payment
 * Bug Fix 2.11.1: Replaces hardcoded payment method
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SelectorContainer = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  border: 1px solid #e0e0e0;
`;

const SelectorTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
`;

const MethodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
`;

const MethodOption = styled.label`
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;

  input {
    display: none;
  }

  span {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 15px;
    border: 2px solid #ddd;
    border-radius: 8px;
    background: white;
    transition: all 0.3s ease;
    text-align: center;

    .icon {
      font-size: 24px;
    }

    .name {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .info {
      font-size: 12px;
      color: #999;
    }
  }

  input:checked + span {
    border-color: #4CAF50;
    background: #e8f5e9;
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);

    .name {
      color: #4CAF50;
      font-weight: 600;
    }
  }

  &:hover span {
    border-color: #4CAF50;
  }
`;

const MethodDetails = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: #e8f5e9;
  border-left: 4px solid #4CAF50;
  border-radius: 4px;
  font-size: 14px;
  color: #2e7d32;
`;

const ErrorMessage = styled.div`
  margin-top: 10px;
  padding: 10px;
  background: #ffebee;
  border-left: 4px solid #f44336;
  border-radius: 4px;
  font-size: 13px;
  color: #c62828;
`;

/**
 * Payment method configurations
 */
const PAYMENT_METHODS = {
  cashfree: {
    id: 'cashfree',
    name: 'Cashfree',
    icon: '💳',
    description: 'Fast & Secure',
    details: 'Multiple payment options: UPI, Credit/Debit Card, Net Banking, Wallet',
    supported: true
  },
  razorpay: {
    id: 'razorpay',
    name: 'Razorpay',
    icon: '🔐',
    description: 'Secure Payments',
    details: 'Card, UPI, Net Banking, Wallet - Instant confirmation',
    supported: false // Currently disabled, for future support
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    icon: '🌐',
    description: 'International',
    details: 'Credit/Debit cards for international users',
    supported: false // Currently disabled, for future support
  }
};

/**
 * PaymentMethodSelector Component
 * @param {string} selectedMethod - Currently selected payment method
 * @param {function} onMethodChange - Callback when method is selected
 * @param {boolean} disabled - Whether selector is disabled
 */
const PaymentMethodSelector = ({
  selectedMethod = 'cashfree',
  onMethodChange = () => {},
  disabled = false
}) => {
  const [selected, setSelected] = useState(selectedMethod || 'cashfree');
  const [error, setError] = useState('');

  useEffect(() => {
    setSelected(selectedMethod || 'cashfree');
    setError('');
  }, [selectedMethod]);

  const handleMethodChange = (methodId) => {
    if (disabled) return;

    const method = PAYMENT_METHODS[methodId];

    if (!method) {
      setError('Invalid payment method selected');
      return;
    }

    if (!method.supported) {
      setError(`${method.name} is not currently available. Please select another method.`);
      return;
    }

    setSelected(methodId);
    setError('');
    onMethodChange(methodId);
  };

  const selectedMethodData = PAYMENT_METHODS[selected];

  return (
    <SelectorContainer>
      <SelectorTitle>Select Payment Method</SelectorTitle>

      <MethodGrid>
        {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
          <MethodOption key={key}>
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selected === method.id}
              onChange={() => handleMethodChange(method.id)}
              disabled={disabled || !method.supported}
              aria-label={`Pay with ${method.name}`}
            />
            <span>
              <div className="icon">{method.icon}</div>
              <div className="name">{method.name}</div>
              <div className="info">{method.description}</div>
              {!method.supported && <div className="info">Coming soon</div>}
            </span>
          </MethodOption>
        ))}
      </MethodGrid>

      {selectedMethodData && selectedMethodData.supported && (
        <MethodDetails>
          <strong>{selectedMethodData.name}:</strong> {selectedMethodData.details}
        </MethodDetails>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </SelectorContainer>
  );
};

export default PaymentMethodSelector;
