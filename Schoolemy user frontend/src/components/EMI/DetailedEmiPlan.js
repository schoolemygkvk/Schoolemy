import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import api from "../../service/api"; // Use centralized API instance
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaRupeeSign,
  FaCreditCard,
  FaChartLine,
} from "react-icons/fa";
import EMIService from "../../service/emiService";

// Animations
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
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
const EMIPlanContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin: 20px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  animation: ${slideIn} 0.4s ease-out;
`;

const PlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const CourseInfo = styled.div`
  flex: 1;

  h2 {
    font-size: 1.5rem;
    color: #1a202c;
    margin: 0 0 8px 0;
    font-weight: 700;
  }

  p {
    color: #718096;
    margin: 0;
    font-size: 0.95rem;
  }
`;

const PlanStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${(props) => {
    if (props.status === "active") {
      return `
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        color: white;
      `;
    } else if (props.status === "locked") {
      return `
        background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
        color: white;
        animation: ${pulse} 2s infinite;
      `;
    } else {
      return `
        background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
        color: white;
      `;
    }
  }}
`;

const ProgressSection = styled.div`
  margin-bottom: 32px;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h3 {
    font-size: 1.1rem;
    color: #2d3748;
    margin: 0;
    font-weight: 600;
  }

  span {
    font-size: 1rem;
    color: #4f46e5;
    font-weight: 600;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
  border-radius: 12px;
  width: ${(props) => props.progress}%;
  transition: width 0.6s ease;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 24px 0;
`;

const StatCard = styled.div`
  background: ${(props) => {
    if (props.type === "paid")
      return "linear-gradient(135deg, #48bb78 0%, #38a169 100%)";
    if (props.type === "pending")
      return "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)";
    if (props.type === "upcoming")
      return "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)";
    if (props.type === "overdue")
      return "linear-gradient(135deg, #f56565 0%, #e53e3e 100%)";
    return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
  }};
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }

  .icon {
    font-size: 1.8rem;
    margin-bottom: 8px;
    opacity: 0.9;
  }

  .value {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .label {
    font-size: 0.85rem;
    opacity: 0.95;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const EMIListSection = styled.div`
  margin-top: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  color: #2d3748;
  margin: 0 0 20px 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;

  .icon {
    color: #4f46e5;
  }
`;

const EMIItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: ${(props) => {
    if (props.status === "paid") return "#f0fdf4";
    if (props.status === "late" || props.isOverdue) return "#fef2f2";
    if (props.isDue) return "#fff7ed";
    return "#f8fafc";
  }};
  border-left: 4px solid
    ${(props) => {
      if (props.status === "paid") return "#48bb78";
      if (props.status === "late" || props.isOverdue) return "#f56565";
      if (props.isDue) return "#ed8936";
      return "#cbd5e0";
    }};
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateX(4px);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const EMIInfo = styled.div`
  flex: 1;

  .month {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a202c;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .date {
    font-size: 0.9rem;
    color: #718096;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .amount {
    font-size: 1rem;
    font-weight: 600;
    color: #4f46e5;
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const EMIStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${(props) => {
    if (props.status === "paid") {
      return `
        background: #48bb78;
        color: white;
      `;
    } else if (props.status === "late" || props.isOverdue) {
      return `
        background: #f56565;
        color: white;
        animation: ${pulse} 2s infinite;
      `;
    } else if (props.isDue) {
      return `
        background: #ed8936;
        color: white;
      `;
    } else {
      return `
        background: #cbd5e0;
        color: #4a5568;
      `;
    }
  }}
`;

const PayNowButton = styled.button`
  padding: 10px 24px;
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: ${pulse} 2s infinite;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(245, 101, 101, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    animation: none;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #4f46e5;
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

  p {
    color: #718096;
    font-size: 1rem;
  }
`;

const ErrorContainer = styled.div`
  padding: 24px;
  background: #fef2f2;
  border-left: 4px solid #f56565;
  border-radius: 8px;
  color: #c53030;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #718096;

  .icon {
    font-size: 4rem;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  h3 {
    font-size: 1.3rem;
    color: #2d3748;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 1rem;
    margin: 0;
  }
`;

const DetailedEmiPlan = ({ courseId, courseName, planData }) => {
  const [emiPlan, setEmiPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(null);

  useEffect(() => {
    if (planData) {
      // Use provided plan data instead of fetching
      console.log("DetailedEmiPlan received planData:", planData);
      setEmiPlan(planData);
      setLoading(false);
    } else if (courseId) {
      // Fallback to API call if no plan data provided
      fetchEMIPlan();
    }
  }, [courseId, planData]);

  const fetchEMIPlan = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/user/emi/status/${courseId}`);
      const data = response.data;
      console.log("EMI Plan Data:", data);

      if (data.success && data.data.paymentType === "emi") {
        setEmiPlan(data.data);
      } else {
        setError("No EMI plan found for this course");
      }
    } catch (err) {
      console.error("Error fetching EMI plan:", err);
      setError("Failed to load EMI details");
    } finally {
      setLoading(false);
    }
  };

  const handlePayEMI = async (emiMonth, amount) => {
    try {
      setPaymentLoading(emiMonth);

      const token = localStorage.getItem("token");

      // Create Razorpay order
      const orderResponse = await api.post(`/user/emi/pay-monthly`, {
        courseId,
        amount: amount,
      });

      const orderData = orderResponse.data;
      console.log("Order created:", orderData);

      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create payment order");
      }

      // Initialize Razorpay
      const options = {
        key: "rzp_test_E2s1LWy4wMdE7d", // Replace with your Razorpay key
        amount: orderData.data.order.amount,
        currency: "INR",
        name: "Course EMI Payment",
        description: `${emiMonth} EMI Payment`,
        order_id: orderData.data.order.id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await api.post(
              `/user/emi/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: courseId,
              }
            );

            const verifyData = verifyResponse.data;

            if (verifyData.success) {
              alert("Payment successful! EMI paid.");
              fetchEMIPlan(); // Refresh the EMI plan
            } else {
              alert("Payment verification failed: " + verifyData.message);
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed");
          } finally {
            setPaymentLoading(null);
          }
        },
        prefill: {
          name: localStorage.getItem("username") || "",
          email: localStorage.getItem("email") || "",
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert(err.message || "Payment failed. Please try again.");
      setPaymentLoading(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isEMIDue = (dueDate, status) => {
    if (status === "paid") return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due <= today;
  };

  const isEMIOverdue = (dueDate, gracePeriodEnd, status) => {
    if (status === "paid") return false;
    const today = new Date();
    const grace = new Date(gracePeriodEnd);
    return grace < today;
  };

  if (loading) {
    return (
      <LoadingContainer>
        <div className="spinner" />
        <p>Loading EMI plan details...</p>
      </LoadingContainer>
    );
  }

  if (error) {
    return <ErrorContainer>{error}</ErrorContainer>;
  }

  if (!emiPlan) {
    return (
      <EmptyState>
        <div className="icon">📋</div>
        <h3>No EMI Plan</h3>
        <p>No EMI plan found for this course</p>
      </EmptyState>
    );
  }

  console.log("Rendering EMI plan:", emiPlan);
  const progress = (emiPlan.paidEmis / emiPlan.totalEmis) * 100;

  return (
   <div></div>
  );
};

export default DetailedEmiPlan;
