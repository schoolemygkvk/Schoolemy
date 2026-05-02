import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import api, { setCsrfToken } from "../../service/api"; // Use centralized API instance
import {
  FaCalendarAlt,
  FaCreditCard,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaRupeeSign,
} from "react-icons/fa";
import EMIService from "../../service/emiService";

// Animations
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

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

// Styled Components
const PaymentContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin: 16px 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  animation: ${slideIn} 0.3s ease-out;
`;

const PaymentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;

  h3 {
    margin: 0;
    color: #333;
    font-size: 1.3rem;
    font-weight: 600;
  }

  .icon {
    color: #667eea;
    font-size: 1.4rem;
  }
`;

const StatusAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;

  ${(props) => {
    if (props.status === "overdue") {
      return `
        background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
        color: white;
        animation: ${pulse} 2s infinite;
      `;
    } else if (props.status === "grace") {
      return `
        background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
        color: white;
      `;
    } else if (props.status === "upcoming") {
      return `
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
      `;
    } else {
      return `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      `;
    }
  }}

  .icon {
    font-size: 1.2rem;
  }
`;

const PaymentDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const DetailCard = styled.div`
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;

  .label {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .value {
    font-size: 1.4rem;
    font-weight: bold;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .amount {
    color: #667eea;
  }

  .date {
    color: #ff6b6b;
  }
`;

const PaymentOptions = styled.div`
  display: grid;
  gap: 12px;
  margin-bottom: 24px;
`;

const PaymentOption = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
    background: #f8f9ff;
  }

  &.selected {
    border-color: #667eea;
    background: #f8f9ff;
  }

  &.recommended {
    border-color: #4caf50;
    background: #f1f8e9;
  }

  .option-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .icon {
      color: #667eea;
      font-size: 1.1rem;
    }

    .details {
      text-align: left;

      .title {
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .description {
        font-size: 0.9rem;
        color: #666;
      }
    }
  }

  .amount {
    font-size: 1.2rem;
    font-weight: bold;
    color: #667eea;
  }
`;

const PaymentButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .icon {
    font-size: 1.1rem;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #667eea;
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

const MonthlyEmiPayment = ({
  courseId,
  monthlyDueData,
  emiPlan,
  onPaymentSuccess,
  onError,
}) => {
  const [dueData, setDueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // If we have EMI plan data passed as props, use it directly
    if (emiPlan) {
      processEmiPlanData(emiPlan);
    } else if (courseId) {
      fetchMonthlyDueAmount();
    }
  }, [courseId, emiPlan]);

  const processEmiPlanData = (plan) => {
    try {
      setLoading(true);
      setError("");

      console.log(" Processing EMI plan data:", plan);

      // Find overdue and due EMIs from the plan
      const currentDate = new Date();
      console.log(" Current date:", currentDate);

      const overdueEmis = [];
      let nextDueEmi = null;

      plan.emis.forEach((emi, index) => {
        console.log(` Processing EMI ${index + 1}:`, {
          month: emi.monthName,
          status: emi.status,
          dueDate: emi.dueDate,
          amount: emi.amount,
        });

        const dueDate = new Date(emi.dueDate);
        console.log(` Parsed due date for ${emi.monthName}:`, dueDate);

        if (
          emi.status === "late" ||
          (emi.status === "pending" && dueDate <= currentDate)
        ) {
          overdueEmis.push(emi);
          console.log(` Added ${emi.monthName} to overdue EMIs`);
        } else if (emi.status === "pending" && !nextDueEmi) {
          nextDueEmi = emi;
          console.log(` Set ${emi.monthName} as next due EMI`);
        }
      });

      console.log(" Overdue EMIs:", overdueEmis);
      console.log(" Next due EMI:", nextDueEmi);

      // Calculate total overdue amount
      const totalOverdueAmount = overdueEmis.reduce(
        (sum, emi) => sum + emi.amount,
        0
      );
      console.log(" Total overdue amount:", totalOverdueAmount);

      // Create payment options
      const paymentOptions = {};
      let isDue = false;

      if (overdueEmis.length > 0) {
        isDue = true;
        paymentOptions.singleEmi = {
          amount: overdueEmis[0].amount,
          description: `${overdueEmis[0].monthName} EMI (Overdue)`,
          emiMonth: overdueEmis[0].monthName,
          isOverdue: true,
        };

        if (overdueEmis.length > 1) {
          paymentOptions.allOverdue = {
            amount: totalOverdueAmount,
            description: `All ${overdueEmis.length} overdue EMIs`,
            count: overdueEmis.length,
            isOverdue: true,
          };
        }
      } else if (nextDueEmi) {
        const dueDate = new Date(nextDueEmi.dueDate);
        const daysDiff = Math.ceil(
          (dueDate - currentDate) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff <= 7) {
          // Due within a week
          isDue = true;
          paymentOptions.singleEmi = {
            amount: nextDueEmi.amount,
            description: `${nextDueEmi.monthName} EMI (Due ${
              daysDiff <= 0 ? "today" : `in ${daysDiff} days`
            })`,
            emiMonth: nextDueEmi.monthName,
            isOverdue: false,
          };
        }
      }

      console.log(" Payment options:", paymentOptions);
      console.log(" Is due:", isDue);

      const processedData = {
        isDue,
        hasOverdue: overdueEmis.length > 0,
        overdueCount: overdueEmis.length,
        totalOverdueAmount,
        nextDueAmount: nextDueEmi?.amount || 0,
        paymentOptions,
        status:
          overdueEmis.length > 0
            ? "overdue"
            : nextDueEmi
            ? "upcoming"
            : "uptodate",
        message:
          overdueEmis.length > 0
            ? `You have ${overdueEmis.length} overdue EMI payment(s)`
            : nextDueEmi
            ? `Your next EMI is due on ${new Date(
                nextDueEmi.dueDate
              ).toLocaleDateString()}`
            : "All EMI payments are up to date",
        // Add the first overdue/due EMI for display
        currentEmi: overdueEmis.length > 0 ? overdueEmis[0] : nextDueEmi,
        // Add properties that the component expects for display
        dueAmount:
          overdueEmis.length > 0
            ? overdueEmis[0].amount
            : nextDueEmi?.amount || 0,
        currentMonth:
          overdueEmis.length > 0
            ? overdueEmis[0].monthName
            : nextDueEmi?.monthName || "",
        dueDate:
          overdueEmis.length > 0
            ? overdueEmis[0].dueDate
            : nextDueEmi?.dueDate || "",
      };

      console.log(" Processed data:", processedData);

      setDueData(processedData);

      // Auto-select the primary payment option
      if (isDue && paymentOptions.singleEmi) {
        const selectedOpt = {
          type: "single",
          amount: paymentOptions.singleEmi.amount,
          description: paymentOptions.singleEmi.description,
        };
        console.log(" Auto-selecting payment option:", selectedOpt);
        setSelectedOption(selectedOpt);
      }
    } catch (error) {
      console.error(" Error processing EMI plan data:", error);
      setError("Failed to process EMI information. Please try again.");
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyDueAmount = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await EMIService.getMonthlyDueAmount(courseId);

      if (response.success) {
        setDueData(response.data);

        // Auto-select the primary payment option
        if (response.data.isDue && response.data.paymentOptions?.singleEmi) {
          setSelectedOption({
            type: "single",
            amount: response.data.paymentOptions.singleEmi.amount,
            description: response.data.paymentOptions.singleEmi.description,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching monthly due amount:", error);
      setError("Failed to load payment information. Please try again.");
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Ensure CSRF token is available before payment verification
  const ensureCsrfToken = async () => {
    try {
      const res = await api.get("/csrf-token");
      if (res.data?.csrfToken) {
        setCsrfToken(res.data.csrfToken);
      }
    } catch (err) {
      console.warn("Failed to fetch CSRF token for EMI payment verification:", err.message);
      // Continue anyway - token might still be available from previous session
    }
  };

  const handlePayment = async () => {
    console.log(" handlePayment called");
    console.log(" selectedOption:", selectedOption);
    console.log(" dueData:", dueData);
    console.log(" dueData.isDue:", dueData?.isDue);

    if (!selectedOption || !dueData?.isDue) {
      console.log(" Early return - missing selectedOption or not due");
      console.log(" selectedOption exists:", !!selectedOption);
      console.log(" dueData.isDue:", dueData?.isDue);
      return;
    }

    try {
      setPaymentLoading(true);
      setError("");

      console.log(" Calling EMIService.payMonthlyEmi with:", {
        courseId,
        amount: selectedOption.amount,
      });

      const response = await EMIService.payMonthlyEmi(
        courseId,
        selectedOption.amount
      );

      console.log(" EMI Service response:", response);

      if (response.success) {
        console.log(" EMI Service successful, initializing Razorpay");

        // Check if Razorpay is loaded
        if (!window.Razorpay) {
          throw new Error("Razorpay SDK not loaded");
        }

        // Initialize Razorpay payment
        const options = {
          key: response.data.razorpayKeyId,
          amount: response.data.amount * 100,
          currency: response.data.currency,
          order_id: response.data.orderId,
          name: "Course EMI Payment",
          description: selectedOption.description,
          handler: async function (paymentResponse) {
            console.log(" Razorpay payment successful:", paymentResponse);

            try {
              // Ensure CSRF token is available before verification
              await ensureCsrfToken();

              // Verify the payment on backend
              console.log(" Verifying payment with backend...");
              const verifyResponse = await api.post(
                `/api/v1/payments/user/emi/verify-payment`,
                {
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                  courseId: courseId,
                  amount: selectedOption.amount,
                }
              );

              const verifyResult = verifyResponse.data;
              console.log(" Payment verification result:", verifyResult);

              if (verifyResult.success) {
                // Payment verified successfully
                if (onPaymentSuccess) {
                  onPaymentSuccess({
                    paymentId: paymentResponse.razorpay_payment_id,
                    orderId: paymentResponse.razorpay_order_id,
                    signature: paymentResponse.razorpay_signature,
                    amount: selectedOption.amount,
                    courseId: courseId,
                    verificationData: verifyResult.data,
                  });
                }
              } else {
                throw new Error(
                  verifyResult.message || "Payment verification failed"
                );
              }
            } catch (verifyError) {
              console.error(" Payment verification error:", verifyError);
              setError(
                `Payment completed but verification failed: ${verifyError.message}`
              );
            } finally {
              setPaymentLoading(false);
            }
          },
          // SECURITY FIX 3.31.1: Validate localStorage data before use
          prefill: {
            name: (() => {
              const { getStorageString } = require('../../utils/storageValidator');
              return getStorageString("userName", "");
            })(),
            email: (() => {
              const { getStorageEmail } = require('../../utils/storageValidator');
              return getStorageEmail("userEmail", "");
            })(),
          },
          theme: {
            color: "#667eea",
          },
          modal: {
            ondismiss: function () {
              console.log(" Razorpay modal dismissed");
              setPaymentLoading(false);
            },
          },
        };

        console.log(" Razorpay options:", options);
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        console.log(" EMI Service failed:", response);
        throw new Error(response.message || "Payment service returned failure");
      }
    } catch (error) {
      console.error(" Error initiating payment:", error);
      console.error(" Error details:", {
        message: error.message,
        response: error.response,
        stack: error.stack,
      });

      setError("Failed to initiate payment. Please try again.");
      if (onError) {
        onError(error);
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "overdue":
        return <FaExclamationTriangle />;
      case "grace":
        return <FaClock />;
      case "upcoming":
        return <FaCheckCircle />;
      default:
        return <FaCalendarAlt />;
    }
  };

  const getStatusText = (data) => {
    if (data.isOverdue) {
      return `EMI is overdue by ${data.daysOverdue} day(s)`;
    } else if (data.isInGracePeriod) {
      return "EMI is in grace period";
    } else {
      return "EMI payment is upcoming";
    }
  };

  if (loading) {
    return (
      <LoadingSpinner>
        <div className="spinner"></div>
      </LoadingSpinner>
    );
  }

  if (!dueData) {
    return (
      <PaymentContainer>
        <PaymentHeader>
          <FaExclamationTriangle className="icon" />
          <h3>Payment Information Unavailable</h3>
        </PaymentHeader>
        <p>Unable to load payment information for this course.</p>
      </PaymentContainer>
    );
  }

  if (!dueData.isDue) {
    return (
      <PaymentContainer>
        <PaymentHeader>
          <FaCheckCircle className="icon" style={{ color: "#4CAF50" }} />
          <h3>No Payment Due</h3>
        </PaymentHeader>
        {dueData.allPaid ? (
          <p> All EMI payments have been completed for this course!</p>
        ) : (
          <p>No EMI payment is currently due for this course.</p>
        )}
      </PaymentContainer>
    );
  }

  return (
    <PaymentContainer>
      <PaymentHeader>
        <FaCreditCard className="icon" />
        <h3>Monthly EMI Payment</h3>
      </PaymentHeader>

      <StatusAlert status={dueData.emiStatus}>
        <span className="icon">{getStatusIcon(dueData.emiStatus)}</span>
        <span>{getStatusText(dueData)}</span>
      </StatusAlert>

      <PaymentDetails>
        <DetailCard>
          <div className="label">Due Amount</div>
          <div className="value amount">
            <FaRupeeSign />
            {dueData.dueAmount?.toLocaleString("en-IN")}
          </div>
        </DetailCard>
        <DetailCard>
          <div className="label">Due Month</div>
          <div className="value">{dueData.currentMonth}</div>
        </DetailCard>
        <DetailCard>
          <div className="label">Due Date</div>
          <div className="value date">
            {new Date(dueData.dueDate).toLocaleDateString("en-IN")}
          </div>
        </DetailCard>
        {dueData.totalOverdueAmount > 0 && (
          <DetailCard>
            <div className="label">Total Overdue</div>
            <div className="value" style={{ color: "#ff4757" }}>
              <FaRupeeSign />
              {dueData.totalOverdueAmount?.toLocaleString("en-IN")}
            </div>
          </DetailCard>
        )}
      </PaymentDetails>

      {dueData.dueAmount > 0 && (() => {
        const bd = dueData.currentEmi?.breakdown;
        const baseValue = bd?.baseValue || Math.round(dueData.dueAmount / 1.20);
        const cgst = bd?.cgst || Math.round(baseValue * 0.09);
        const sgst = bd?.sgst || Math.round(baseValue * 0.09);
        const gstTotal = bd?.gstTotal || (cgst + sgst);
        const txnFee = bd?.transactionFee || Math.round(baseValue * 0.02);
        return (
          <div style={{
            background: "#f8f9ff",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            border: "1px solid #e0e7ff",
            fontSize: "0.9rem",
          }}>
            <div style={{ fontWeight: "600", marginBottom: "8px", color: "#333" }}>
              Monthly Breakdown
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#555" }}>
              <span>Course Value</span>
              <span>₹{baseValue.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#555" }}>
              <span>CGST (9%)</span>
              <span>₹{cgst.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#555" }}>
              <span>SGST (9%)</span>
              <span>₹{sgst.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontWeight: "600", color: "#4f46e5" }}>
              <span>Total GST (18%)</span>
              <span>₹{gstTotal.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#555" }}>
              <span>Transaction Fee (2%)</span>
              <span>₹{txnFee.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "6px", borderTop: "1px solid #e0e7ff", fontWeight: "700", color: "#333" }}>
              <span>Monthly EMI</span>
              <span>₹{dueData.dueAmount?.toLocaleString("en-IN")}</span>
            </div>
          </div>
        );
      })()}

      <PaymentOptions>
        <PaymentOption
          className={
            selectedOption?.type === "single"
              ? "selected recommended"
              : "recommended"
          }
          onClick={() =>
            setSelectedOption({
              type: "single",
              amount: dueData.paymentOptions.singleEmi.amount,
              description: dueData.paymentOptions.singleEmi.description,
            })
          }
        >
          <div className="option-info">
            <FaCalendarAlt className="icon" />
            <div className="details">
              <div className="title">
                {dueData.paymentOptions.singleEmi.description}
              </div>
              <div className="description">
                Recommended: Pay current month's EMI
              </div>
            </div>
          </div>
          <div className="amount">
            ₹{dueData.paymentOptions.singleEmi.amount?.toLocaleString("en-IN")}
          </div>
        </PaymentOption>

        {dueData.paymentOptions.allOverdue && (
          <PaymentOption
            className={selectedOption?.type === "all_overdue" ? "selected" : ""}
            onClick={() =>
              setSelectedOption({
                type: "all_overdue",
                amount: dueData.paymentOptions.allOverdue.amount,
                description: dueData.paymentOptions.allOverdue.description,
              })
            }
          >
            <div className="option-info">
              <FaExclamationTriangle className="icon" />
              <div className="details">
                <div className="title">
                  {dueData.paymentOptions.allOverdue.description}
                </div>
                <div className="description">Clear all overdue payments</div>
              </div>
            </div>
            <div className="amount">
              ₹
              {dueData.paymentOptions.allOverdue.amount?.toLocaleString(
                "en-IN"
              )}
            </div>
          </PaymentOption>
        )}
      </PaymentOptions>

      {error && (
        <div
          style={{
            color: "#ff4757",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      <PaymentButton
        onClick={handlePayment}
        disabled={!selectedOption || paymentLoading}
      >
        {paymentLoading ? (
          <>
            <div
              className="spinner"
              style={{ width: "20px", height: "20px" }}
            ></div>
            Processing...
          </>
        ) : (
          <>
            <FaCreditCard className="icon" />
            Pay ₹{selectedOption?.amount?.toLocaleString("en-IN")}
          </>
        )}
      </PaymentButton>
    </PaymentContainer>
  );
};

export default MonthlyEmiPayment;
