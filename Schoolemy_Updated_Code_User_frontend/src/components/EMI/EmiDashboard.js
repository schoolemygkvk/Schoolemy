import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import {
  FaCalendarAlt,
  FaCreditCard,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
  FaRupeeSign,
  FaClock,
  FaBook,
} from "react-icons/fa";
import EMIService from "../../service/emiService";
import MonthlyEmiPayment from "./MonthlyEmiPayment";
import { TAX_CONFIG } from "../../config/dashboardConfig";

// Animations
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
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
const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  animation: ${slideIn} 0.5s ease-out;
`;

const DashboardHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 24px;
  text-align: center;

  h1 {
    margin: 0 0 16px 0;
    font-size: 2rem;
    font-weight: 600;
  }

  .subtitle {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-bottom: 20px;
  }
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const SummaryCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }

  .icon {
    font-size: 2.5rem;
    margin-bottom: 16px;
    color: ${(props) => props.iconColor || "#667eea"};
  }

  .value {
    font-size: 2rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
  }

  .label {
    font-size: 1rem;
    color: #666;
    font-weight: 500;
  }

  ${(props) =>
    props.highlight &&
    `
    border: 2px solid #ff4757;
    animation: ${pulse} 2s infinite;
  `}
`;

const QuickActions = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;

  h3 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  margin: 8px 12px 8px 0;
  border: none;
  border-radius: 8px;
  background: ${(props) =>
    props.bgColor || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"};
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

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

const CoursesGrid = styled.div`
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
`;

const CourseCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CourseHeader = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  h3 {
    margin: 0 0 8px 0;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.2);
  }
`;

const CourseContent = styled.div`
  padding: 20px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin: 16px 0;

  .progress {
    height: 100%;
    background: linear-gradient(90deg, #4caf50 0%, #45a049 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
    width: ${(props) => props.percentage}%;
  }
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 16px 0;
`;

const DetailItem = styled.div`
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;

  .label {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 4px;
  }

  .value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
`;

const OverdueAlert = styled.div`
  background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${pulse} 2s infinite;

  .icon {
    font-size: 1.2rem;
  }
`;

const PaymentSection = styled.div`
  margin-top: 20px;
  border-top: 2px solid #f0f0f0;
  padding-top: 20px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;

  .icon {
    font-size: 4rem;
    margin-bottom: 20px;
    opacity: 0.5;
  }

  h3 {
    margin: 0 0 16px 0;
    color: #333;
  }

  p {
    font-size: 1.1rem;
    line-height: 1.6;
  }
`;

const EmiDashboard = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmiSummary();
  }, []);

  const fetchEmiSummary = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await EMIService.getUserEmiSummary();

      if (response.success) {
        setSummaryData(response.data);
      }
    } catch (error) {
      console.error("Error fetching EMI summary:", error);
      setError("Failed to load EMI information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log("Payment successful:", paymentData);
    // Refresh the dashboard data
    fetchEmiSummary();
    setSelectedCourse(null);
    // Show success message or handle navigation
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    setError("Payment failed. Please try again.");
  };

  const calculateProgress = (plan) => {
    if (!plan.totalAmount || plan.totalAmount === 0) return 0;
    return Math.round((plan.totalPaid / plan.totalAmount) * 100);
  };

  if (loading) {
    return (
      <LoadingSpinner>
        <div className="spinner"></div>
      </LoadingSpinner>
    );
  }

  if (!summaryData || summaryData.totalActivePlans === 0) {
    return (
      <DashboardContainer>
        <EmptyState>
          <FaBook className="icon" />
          <h3>No EMI Plans Found</h3>
          <p>
            You don't have any active EMI plans yet. <br />
            Purchase a course with EMI option to get started!
          </p>
        </EmptyState>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <DashboardHeader>
        <h1>EMI Dashboard</h1>
        <div className="subtitle">
          Manage your {summaryData.totalActivePlans} active EMI plan
          {summaryData.totalActivePlans > 1 ? "s" : ""}
        </div>
      </DashboardHeader>

      <SummaryCards>
        <SummaryCard iconColor="#4CAF50">
          <FaCheckCircle className="icon" />
          <div className="value">{summaryData.totalActivePlans}</div>
          <div className="label">Active Plans</div>
        </SummaryCard>

        <SummaryCard
          iconColor="#ff4757"
          highlight={summaryData.hasOverduePayments}
        >
          <FaExclamationTriangle className="icon" />
          <div className="value">
            ₹{summaryData.totalOverdueAmount?.toLocaleString("en-IN")}
          </div>
          <div className="label">Total Overdue</div>
        </SummaryCard>

        <SummaryCard iconColor="#667eea">
          <FaCalendarAlt className="icon" />
          <div className="value">
            ₹{summaryData.totalMonthlyDue?.toLocaleString("en-IN")}
          </div>
          <div className="label">Current Month Due</div>
        </SummaryCard>

        <SummaryCard iconColor="#ffa726">
          <FaClock className="icon" />
          <div className="value">
            {summaryData.upcomingPayments?.length || 0}
          </div>
          <div className="label">Upcoming Payments</div>
        </SummaryCard>
      </SummaryCards>

      {(summaryData.quickActions?.payAllOverdue ||
        summaryData.quickActions?.payCurrentMonth) && (
        <QuickActions>
          <h3>
            <FaCreditCard />
            Quick Actions
          </h3>
          <div>
            {summaryData.quickActions.payAllOverdue && (
              <ActionButton
                bgColor="linear-gradient(135deg, #ff4757 0%, #ff3838 100%)"
                onClick={() => {
                  /* Handle pay all overdue */
                }}
              >
                <FaExclamationTriangle className="icon" />
                Pay All Overdue (₹
                {summaryData.quickActions.payAllOverdue.amount?.toLocaleString(
                  "en-IN"
                )}
                )
              </ActionButton>
            )}

            {summaryData.quickActions.payCurrentMonth && (
              <ActionButton
                onClick={() => {
                  /* Handle pay current month */
                }}
              >
                <FaCalendarAlt className="icon" />
                Pay Current Month (₹
                {summaryData.quickActions.payCurrentMonth.amount?.toLocaleString(
                  "en-IN"
                )}
                )
              </ActionButton>
            )}
          </div>
        </QuickActions>
      )}

      <CoursesGrid>
        {summaryData.activePlans?.map((plan) => (
          <CourseCard key={plan.planId}>
            <CourseHeader>
              <h3>
                <FaBook />
                {plan.courseName}
              </h3>
              <span className={`status ${plan.planStatus}`}>
                {plan.planStatus?.toUpperCase()}
              </span>
            </CourseHeader>

            <CourseContent>
              {plan.overdueCount > 0 && (
                <OverdueAlert>
                  <FaExclamationTriangle className="icon" />
                  <span>
                    {plan.overdueCount} EMI{plan.overdueCount > 1 ? "s" : ""}{" "}
                    overdue - ₹{plan.overdueAmount?.toLocaleString("en-IN")}
                  </span>
                </OverdueAlert>
              )}

              <ProgressBar percentage={calculateProgress(plan)}>
                <div className="progress"></div>
              </ProgressBar>

              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <strong>{calculateProgress(plan)}% Completed</strong>
              </div>

              <DetailsGrid>
                <DetailItem>
                  <div className="label">Total Amount</div>
                  <div className="value">
                    <FaRupeeSign />
                    {plan.totalAmount?.toLocaleString("en-IN")}
                  </div>
                </DetailItem>

                <DetailItem>
                  <div className="label">Paid</div>
                  <div className="value">
                    <FaRupeeSign />
                    {plan.totalPaid?.toLocaleString("en-IN")}
                  </div>
                </DetailItem>

                <DetailItem>
                  <div className="label">Remaining</div>
                  <div className="value">
                    <FaRupeeSign />
                    {plan.totalRemaining?.toLocaleString("en-IN")}
                  </div>
                </DetailItem>

                <DetailItem>
                  <div className="label">Next Due</div>
                  <div className="value">
                    {plan.nextDueDate
                      ? new Date(plan.nextDueDate).toLocaleDateString("en-IN")
                      : "N/A"}
                  </div>
                </DetailItem>
              </DetailsGrid>

              {plan.monthlyAmount > 0 && (() => {
                const firstEmi = plan.emis?.[0];
                const bd = firstEmi?.breakdown;
                const baseValue = bd?.baseValue || Math.round(plan.monthlyAmount / 1.20);
                const cgst = bd?.cgst || Math.round(baseValue * TAX_CONFIG.CGST_RATE);
                const sgst = bd?.sgst || Math.round(baseValue * TAX_CONFIG.SGST_RATE);
                const gstTotal = bd?.gstTotal || (cgst + sgst);
                const txnFee = bd?.transactionFee || Math.round(baseValue * TAX_CONFIG.TRANSACTION_FEE_RATE);
                const cgstPercent = Math.round(TAX_CONFIG.CGST_RATE * 100);
                const sgstPercent = Math.round(TAX_CONFIG.SGST_RATE * 100);
                const gstTotalPercent = Math.round(TAX_CONFIG.TOTAL_GST_RATE * 100);
                const feePercent = Math.round(TAX_CONFIG.TRANSACTION_FEE_RATE * 100);
                return (
                  <div style={{
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "16px",
                    border: "1px solid #e2e8f0",
                  }}>
                    <div style={{ fontWeight: "600", marginBottom: "12px", color: "#333", fontSize: "0.95rem" }}>
                      Monthly EMI Breakdown
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem", color: "#555" }}>
                      <span>Course Value</span>
                      <span>₹{baseValue.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem", color: "#555" }}>
                      <span>CGST ({cgstPercent}%)</span>
                      <span>₹{cgst.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem", color: "#555" }}>
                      <span>SGST ({sgstPercent}%)</span>
                      <span>₹{sgst.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem", fontWeight: "600", color: "#4f46e5" }}>
                      <span>Total GST ({gstTotalPercent}%)</span>
                      <span>₹{gstTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem", color: "#555" }}>
                      <span>Transaction Fee ({feePercent}%)</span>
                      <span>₹{txnFee.toLocaleString("en-IN")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "6px", borderTop: "1px solid #e2e8f0", fontWeight: "700", fontSize: "0.95rem" }}>
                      <span>Monthly EMI</span>
                      <span>₹{plan.monthlyAmount?.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <ActionButton
                  onClick={() =>
                    setSelectedCourse(
                      selectedCourse === plan.courseId ? null : plan.courseId
                    )
                  }
                  style={{ flex: 1 }}
                >
                  <FaCreditCard className="icon" />
                  {selectedCourse === plan.courseId
                    ? "Hide Payment"
                    : "Make Payment"}
                </ActionButton>

                <ActionButton
                  bgColor="linear-gradient(135deg, #4CAF50 0%, #45a049 100%)"
                  onClick={() => {
                    /* Navigate to course */
                  }}
                  style={{ flex: 1 }}
                >
                  <FaEye className="icon" />
                  View Course
                </ActionButton>
              </div>

              {selectedCourse === plan.courseId && (
                <PaymentSection>
                  <MonthlyEmiPayment
                    courseId={plan.courseId}
                    onPaymentSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </PaymentSection>
              )}
            </CourseContent>
          </CourseCard>
        ))}
      </CoursesGrid>

      {error && (
        <div
          style={{
            background: "#ff4757",
            color: "white",
            padding: "16px",
            borderRadius: "8px",
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          {error}
        </div>
      )}
    </DashboardContainer>
  );
};

export default EmiDashboard;
