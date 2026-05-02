/**
 * EMI Selector Component
 * Shows EMI eligibility upfront and validates before selection
 * Bug Fix 2.11.6: Shows clear feedback if EMI is unavailable
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

const PaymentTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
`;

const PaymentTypeOption = styled.label`
  position: relative;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
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
    border-color: #2196F3;
    background: #e3f2fd;
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);

    .name {
      color: #2196F3;
      font-weight: 600;
    }
  }

  &:hover span {
    ${props => !props.disabled && 'border-color: #2196F3;'}
  }
`;

const EligibilityBox = styled.div`
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid ${props => props.eligible ? '#4CAF50' : '#ff9800'};
  background: ${props => props.eligible ? '#e8f5e9' : '#fff3e0'};
  color: ${props => props.eligible ? '#2e7d32' : '#e65100'};
  font-size: 14px;

  .title {
    font-weight: 600;
    margin-bottom: 8px;
  }

  .details {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 13px;
  }

  .reason {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid ${props => props.eligible ? 'rgba(46, 125, 50, 0.2)' : 'rgba(230, 81, 0, 0.2)'};
  }
`;

const WarningBox = styled(EligibilityBox)`
  background: #fff3e0;
  border-left-color: #ff9800;
  color: #e65100;
  margin-top: 15px;
`;

const ErrorBox = styled(EligibilityBox)`
  background: #ffebee;
  border-left-color: #f44336;
  color: #c62828;
`;

const DueDay = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    font-weight: 500;
    color: #333;

    input {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
  }

  .info {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
  }
`;

/**
 * EMI Selector Component
 * @param {string} paymentType - Current payment type (full, emi)
 * @param {function} onPaymentTypeChange - Callback when type changes
 * @param {number} amount - Course amount in rupees
 * @param {string} courseType - Type of course (regular, emi, tutor)
 * @param {boolean} emiEligible - Whether user is eligible for EMI
 * @param {object} emiValidation - EMI validation result from backend
 * @param {number} emiDueDay - Currently selected EMI due day
 * @param {function} onEmiDueDayChange - Callback for EMI due day change
 */
const EMISelector = ({
  paymentType = 'full',
  onPaymentTypeChange = () => {},
  amount = 0,
  courseType = 'regular',
  emiEligible = false,
  emiValidation = null,
  emiDueDay = 1,
  onEmiDueDayChange = () => {},
}) => {
  const [selected, setSelected] = useState(paymentType || 'full');
  const [dueDay, setDueDay] = useState(emiDueDay || 1);
  const [validation, setValidation] = useState(emiValidation);

  useEffect(() => {
    setSelected(paymentType || 'full');
  }, [paymentType]);

  useEffect(() => {
    setValidation(emiValidation);
  }, [emiValidation]);

  const handlePaymentTypeChange = (type) => {
    if (type === 'emi' && !emiEligible && !validation?.isEligible) {
      return; // Don't allow selection if not eligible
    }

    setSelected(type);
    onPaymentTypeChange(type);
  };

  const handleDueDayChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= 31) {
      setDueDay(value);
      onEmiDueDayChange(value);
    }
  };

  const isEmiEnabled = courseType !== 'tutor'; // Tutor courses don't support EMI
  const monthlyEmi = amount > 0 ? Math.ceil(amount / 12) : 0;

  return (
    <SelectorContainer>
      <SelectorTitle>Select Payment Type</SelectorTitle>

      <PaymentTypeGrid>
        <PaymentTypeOption disabled={false}>
          <input
            type="radio"
            name="paymentType"
            value="full"
            checked={selected === 'full'}
            onChange={() => handlePaymentTypeChange('full')}
            aria-label="Pay full amount"
          />
          <span>
            <div className="icon">💰</div>
            <div className="name">Full Payment</div>
            <div className="info">Pay entire amount now</div>
          </span>
        </PaymentTypeOption>

        <PaymentTypeOption disabled={!isEmiEnabled || !emiEligible}>
          <input
            type="radio"
            name="paymentType"
            value="emi"
            checked={selected === 'emi'}
            onChange={() => handlePaymentTypeChange('emi')}
            disabled={!isEmiEnabled || !emiEligible}
            aria-label="Pay in EMI"
          />
          <span>
            <div className="icon">📅</div>
            <div className="name">EMI Payment</div>
            <div className="info">
              {isEmiEnabled ? `₹${monthlyEmi}/month` : 'Not available'}
            </div>
          </span>
        </PaymentTypeOption>
      </PaymentTypeGrid>

      {/* EMI Eligibility Information */}
      {isEmiEnabled && (
        <>
          {validation?.isEligible && selected === 'emi' ? (
            <EligibilityBox eligible={true}>
              <div className="title">EMI Eligibility Confirmed</div>
              <div className="details">
                <div>Amount: ₹{amount}</div>
                <div>Estimated Monthly EMI: ₹{monthlyEmi}</div>
                <div>Loan Period: 12 months</div>
              </div>
            </EligibilityBox>
          ) : !emiEligible && validation?.reason ? (
            <WarningBox eligible={false}>
              <div className="title">EMI Not Available</div>
              <div className="reason">{validation.reason}</div>
              {validation.minAmount && (
                <div className="reason">Minimum amount for EMI: ₹{validation.minAmount}</div>
              )}
            </WarningBox>
          ) : null}

          {/* EMI Due Day Selector */}
          {selected === 'emi' && emiEligible && (
            <DueDay>
              <label>
                EMI Due Day:
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={handleDueDayChange}
                  aria-label="EMI due day"
                />
              </label>
              <div className="info">
                Select the day of the month when your EMI payment will be due (1-31)
              </div>
            </DueDay>
          )}
        </>
      )}

      {/* Tutor Course Message */}
      {!isEmiEnabled && (
        <WarningBox eligible={false}>
          <div className="title">Tutor Courses</div>
          <div className="reason">
            Tutor courses require full payment only. EMI is not available for this course type.
          </div>
        </WarningBox>
      )}
    </SelectorContainer>
  );
};

export default EMISelector;
