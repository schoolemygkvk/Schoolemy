import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { css } from "styled-components";
import api from "../../service/api"; // Use centralized API instance
import DetailedEmiPlan from "../../components/EMI/DetailedEmiPlan";
import NotificationService from "../../service/notificationService";

const PaymentPages = () => {
  const [payments, setPayments] = useState([]);
  const [emiPlans, setEmiPlans] = useState([]);
  const [summary, setSummary] = useState({});
  const [emiSummary, setEmiSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [emiLoading, setEmiLoading] = useState(true);
  const [error, setError] = useState("");
  const [emiError, setEmiError] = useState("");
  const [selectedEmiPlan, setSelectedEmiPlan] = useState(null); // Track selected EMI plan for detailed view
  const [activeTab, setActiveTab] = useState("all"); // all, payments, emi
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const limit = 5;

  const fetchEmiPlans = async () => {
    try {
      // Fetch comprehensive EMI summary for the user
      const emiSummaryRes = await api.get(`/api/v1/payments/user/emi/summary`);

      if (emiSummaryRes.status === 200) {
        const emiData = emiSummaryRes.data;
        console.log("EMI summary response:", emiData);

        if (emiData.success && emiData.data) {
          const summaryData = emiData.data;

          // Transform the data to match the expected format
          const transformedEmiPlans = summaryData.activePlans
            .filter((plan) => plan && plan.totalAmount > 0) // Filter out invalid plans
            .map((plan) => {
              try {
                // Calculate EMI counts more accurately
                const monthlyAmount =
                  plan.nextDueAmount || Math.ceil(plan.totalAmount / 12);
                const totalEmis = Math.ceil(plan.totalAmount / monthlyAmount);
                const paidEmis = Math.floor(plan.totalPaid / monthlyAmount);
                const remainingAmount = plan.totalRemaining;
                const upcomingEmis = Math.ceil(remainingAmount / monthlyAmount);

                return {
                  courseId: plan.courseId?._id || plan.courseId || plan.planId,
                  courseName: plan.courseName || "Unknown Course",
                  courseThumbnail: plan.courseId?.thumbnail || "",
                  courseCategory: plan.courseId?.category || "",
                  planId: plan.planId,
                  planStatus: plan.planStatus || "active",
                  totalAmount: plan.totalAmount || 0,
                  totalPaid: plan.totalPaid || 0,
                  totalRemaining: plan.totalRemaining || 0,
                  monthlyAmount: monthlyAmount,
                  paidEmis: Math.max(0, paidEmis),
                  upcomingEmis: Math.max(
                    0,
                    upcomingEmis - (plan.overdueCount || 0),
                  ),
                  overdueEmis: plan.overdueCount || 0,
                  totalEmis: Math.max(1, totalEmis),
                  nextDueDate: plan.nextDueDate,
                  hasAccess: plan.hasAccess !== false,
                  // Add additional fields for better display
                  courseAmount: plan.totalAmount || 0,
                  processingFee: 0, // Not available in summary, set to 0
                  emis: plan.emis, // Include the detailed EMI installments
                };
              } catch (error) {
                console.error("Error transforming EMI plan:", error, plan);
                return null;
              }
            })
            .filter((plan) => plan !== null); // Remove any failed transformations

          console.log("Transformed EMI plans:", transformedEmiPlans);
          setEmiPlans(transformedEmiPlans);

          // Calculate summary more accurately
          const totalEmiPlans = summaryData.totalActivePlans;
          const totalEmis = transformedEmiPlans.reduce(
            (sum, plan) => sum + plan.totalEmis,
            0,
          );
          const completedEmis = transformedEmiPlans.reduce(
            (sum, plan) => sum + plan.paidEmis,
            0,
          );
          const pendingEmis = summaryData.upcomingPayments?.length || 0;
          const overdueEmis = summaryData.overduePayments?.length || 0;

          setEmiSummary({
            totalPlans: totalEmiPlans,
            totalEmis,
            completedEmis,
            pendingEmis,
            overdueEmis,
          });
        } else {
          console.log("No EMI plans found or invalid response format");
          setEmiPlans([]);
          setEmiSummary({
            totalPlans: 0,
            totalEmis: 0,
            completedEmis: 0,
            pendingEmis: 0,
            overdueEmis: 0,
          });
        }
      } else {
        console.error(
          "Failed to fetch EMI summary:",
          emiSummaryRes.status,
          emiSummaryRes.statusText,
        );
        setEmiError("Failed to load EMI plans. Please try again later.");
      }
    } catch (err) {
      console.error("Failed to fetch EMI plans:", err);
      setEmiError(
        "Server error occurred. Please try again later or contact support.",
      );
    } finally {
      setEmiLoading(false);
    }
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get(`/api/v1/payments/user/payment`, {
          params: { page, limit },
        });
        const data = res.data;
        if (data.success) {
          setPayments(data.data.payments);
          setSummary(data.data.summary);
          setPagination(data.data.pagination);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("Failed to fetch payment history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
    fetchEmiPlans();
  }, [page]);

  // Check for overdue EMIs and show notifications
  useEffect(() => {
    if (emiPlans.length > 0) {
      // Check for overdue payments
      NotificationService.checkAndNotifyOverdue(emiPlans);

      // Send notification for each overdue plan (once per session)
      const sessionNotified = sessionStorage.getItem("emi_notified");
      if (!sessionNotified) {
        emiPlans.forEach((plan) => {
          if (plan.overdueEmis > 0) {
            NotificationService.sendEMIOverdueNotification(plan.courseId, {
              courseId: plan.courseId,
              courseName: plan.courseName,
              overdueAmount: plan.overdueEmis * plan.monthlyAmount,
              overdueCount: plan.overdueEmis,
              dueDate: plan.nextDueDate,
            }).catch((err) =>
              console.error("Failed to send overdue notification:", err),
            );
          }
        });
        sessionStorage.setItem("emi_notified", "true");
      }
    }
  }, [emiPlans]);

  // Format currency with proper symbols
  const formatCurrency = (amount, currency) => {
    if (currency === "USD") return `$${amount.toFixed(2)}`;
    return `₹${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <Container>
      <Header>
        <HeaderTop>
          <BackButton onClick={() => navigate(-1)}>
            <BackCircle>
              <BackArrow viewBox="0 0 24 24">
                <path d="M15 18L9 12L15 6" />
              </BackArrow>
            </BackCircle>
            <BackText>Back</BackText>
          </BackButton>
        </HeaderTop>
        <h1>Payment History</h1>
        <p>View all your transaction details and payment history</p>
      </Header>

      {loading ? (
        <LoadingContainer>
          <Spinner />
          <p>Loading your payment history...</p>
        </LoadingContainer>
      ) : error ? (
        <ErrorContainer>
          <ErrorIcon>!</ErrorIcon>
          <p>{error}</p>
        </ErrorContainer>
      ) : (
        <>
          {/* Tab Navigation */}
          <TabNavigation>
            <TabButton
              active={activeTab === "all"}
              onClick={() => {
                setActiveTab("all");
                setSelectedEmiPlan(null);
              }}
            >
              All Transactions
            </TabButton>

            <TabButton
              active={activeTab === "emi"}
              onClick={() => {
                setActiveTab("emi");
                setSelectedEmiPlan(null);
              }}
            >
              EMI Plans ({emiPlans.length})
            </TabButton>
          </TabNavigation>

          {/* Summary Cards - Updated based on active tab */}
          <SummaryGrid>
            {activeTab === "all" && (
              <>
                <SummaryCard>
                  <SummaryTitle>Total Payments</SummaryTitle>
                  <SummaryValue>{summary.totalPayments || 0}</SummaryValue>
                  <SummaryTrend positive>
                    <span>Transactions</span>
                  </SummaryTrend>
                </SummaryCard>

                <SummaryCard accent="primary">
                  <SummaryTitle>Total Spent</SummaryTitle>
                  <SummaryValue>
                    {summary.totalSpent && summary.totalSpent[0]?.total
                      ? formatCurrency(summary.totalSpent[0].total, "INR")
                      : formatCurrency(0, "INR")}
                  </SummaryValue>
                  <SummaryTrend positive>
                    <span>Total amount paid</span>
                  </SummaryTrend>
                </SummaryCard>

                <SummaryCard accent="success">
                  <SummaryTitle>Completed</SummaryTitle>
                  <SummaryValue>{summary.completed || 0}</SummaryValue>
                  <SummaryTrend positive>
                    <span>Successful payments</span>
                  </SummaryTrend>
                </SummaryCard>

                <SummaryCard accent="warning">
                  <SummaryTitle>Pending</SummaryTitle>
                  <SummaryValue>{summary.pending || 0}</SummaryValue>
                  <SummaryTrend>
                    <span>Awaiting confirmation</span>
                  </SummaryTrend>
                </SummaryCard>
              </>
            )}

            {(activeTab === "all" || activeTab === "emi") && (
              <>
                <SummaryCard accent="info">
                  <SummaryTitle>EMI Plans</SummaryTitle>
                  <SummaryValue>{emiSummary.totalPlans || 0}</SummaryValue>
                  <SummaryTrend positive>
                    <span>Active EMI plans</span>
                  </SummaryTrend>
                </SummaryCard>

                <SummaryCard accent="success">
                  <SummaryTitle>Completed EMIs</SummaryTitle>
                  <SummaryValue>{emiSummary.completedEmis || 0}</SummaryValue>
                  <SummaryTrend positive>
                    <span>Paid installments</span>
                  </SummaryTrend>
                </SummaryCard>

                <SummaryCard accent="warning">
                  <SummaryTitle>Pending EMIs</SummaryTitle>
                  <SummaryValue>{emiSummary.pendingEmis || 0}</SummaryValue>
                  <SummaryTrend>
                    <span>Upcoming payments</span>
                  </SummaryTrend>
                </SummaryCard>

                {/* <SummaryCard accent="danger">
                  <SummaryTitle>Overdue EMIs</SummaryTitle>
                  <SummaryValue>{emiSummary.overdueEmis || 0}</SummaryValue>
                  <SummaryTrend negative>
                    <span>Requires attention</span>
                  </SummaryTrend>
                </SummaryCard> */}
              </>
            )}
          </SummaryGrid>

          {/* EMI Plans Section */}
          {(activeTab === "all" || activeTab === "emi") && (
            <EMISection>
              <SectionTitle>
                <h2>EMI Payment Plans</h2>
                <p>Track your installment payments and progress</p>
              </SectionTitle>

              {emiLoading ? (
                <LoadingContainer>
                  <Spinner />
                  <p>Loading EMI plans...</p>
                </LoadingContainer>
              ) : emiError ? (
                <ErrorContainer>
                  <ErrorIcon>!</ErrorIcon>
                  <p>{emiError}</p>
                  <RetryButton
                    onClick={async () => {
                      setEmiError("");
                      setEmiLoading(true);
                      try {
                        await fetchEmiPlans();
                      } catch (error) {
                        console.error("Error retrying EMI plans:", error);
                        setEmiError("Failed to retry. Please try again later.");
                      }
                    }}
                  >
                    Retry
                  </RetryButton>
                </ErrorContainer>
              ) : emiPlans.length > 0 ? (
                <EMIPlansGrid>
                  {emiPlans.map((plan) => {
                    // Check if EMI is overdue based on due date
                    const isOverdue = plan.overdueEmis > 0;
                    const today = new Date();
                    const isDueSoon =
                      plan.nextDueDate &&
                      (new Date(plan.nextDueDate) - today) /
                        (1000 * 60 * 60 * 24) <=
                        3; // Due within 3 days

                    return (
                      <EMIPlanCard key={plan.courseId} isOverdue={isOverdue}>
                        {/* OVERDUE ALERT BANNER */}
                        {isOverdue && (
                          <OverdueAlertBanner>
                            <OverdueAlertIcon></OverdueAlertIcon>
                            <OverdueAlertText>
                              <strong>PAYMENT OVERDUE!</strong> Your course
                              access is locked. Pay ₹
                              {(
                                plan.overdueEmis * plan.monthlyAmount
                              ).toLocaleString("en-IN")}{" "}
                              immediately to restore access.
                            </OverdueAlertText>
                          </OverdueAlertBanner>
                        )}

                        {/* DUE SOON ALERT BANNER */}
                        {!isOverdue && isDueSoon && (
                          <DueSoonAlertBanner>
                            <DueSoonAlertIcon></DueSoonAlertIcon>
                            <DueSoonAlertText>
                              <strong>Payment Due Soon!</strong> Pay before{" "}
                              {formatDate(plan.nextDueDate)} to avoid course
                              lock.
                            </DueSoonAlertText>
                          </DueSoonAlertBanner>
                        )}

                        <EMIPlanHeader>
                          <EMICourseInfo>
                            <EMICourseName>{plan.courseName}</EMICourseName>
                            {plan.courseCategory && (
                              <EMICourseCategory>
                                {plan.courseCategory}
                              </EMICourseCategory>
                            )}
                          </EMICourseInfo>
                          <EMIStatus
                            status={isOverdue ? "overdue" : plan.planStatus}
                          >
                            {isOverdue ? "OVERDUE" : plan.planStatus}
                          </EMIStatus>
                        </EMIPlanHeader>

                        <EMIProgress>
                          <EMIProgressBar>
                            <EMIProgressFill
                              progress={(plan.paidEmis / plan.totalEmis) * 100}
                            />
                          </EMIProgressBar>
                          <EMIProgressText>
                            {plan.paidEmis} of {plan.totalEmis} EMIs completed
                          </EMIProgressText>
                        </EMIProgress>

                        <EMIDetails>
                          <EMIDetailItem>
                            <EMIDetailLabel>Monthly Amount</EMIDetailLabel>
                            <EMIDetailValue positive>
                              ₹
                              {plan.monthlyAmount?.toLocaleString("en-IN") ||
                                "N/A"}
                            </EMIDetailValue>
                          </EMIDetailItem>

                          <EMIDetailItem>
                            <EMIDetailLabel>Total Amount</EMIDetailLabel>
                            <EMIDetailValue>
                              ₹
                              {plan.totalAmount?.toLocaleString("en-IN") ||
                                "N/A"}
                            </EMIDetailValue>
                          </EMIDetailItem>

                          <EMIDetailItem>
                            <EMIDetailLabel>Completed</EMIDetailLabel>
                            <EMIDetailValue positive>
                              {plan.paidEmis}
                            </EMIDetailValue>
                          </EMIDetailItem>

                          <EMIDetailItem>
                            <EMIDetailLabel>Upcoming</EMIDetailLabel>
                            <EMIDetailValue>{plan.upcomingEmis}</EMIDetailValue>
                          </EMIDetailItem>

                          {plan.overdueEmis > 0 && (
                            <EMIDetailItem>
                              <EMIDetailLabel>Overdue</EMIDetailLabel>
                              <EMIDetailValue negative>
                                {plan.overdueEmis}
                              </EMIDetailValue>
                            </EMIDetailItem>
                          )}
                        </EMIDetails>

                        <EMIPaymentBreakdown>
                          <EMIBreakdownTitle>
                            Monthly EMI Breakdown
                          </EMIBreakdownTitle>
                          {(() => {
                            const monthlyAmt = plan.monthlyAmount || 0;
                            const baseValue = Math.round(monthlyAmt / 1.2);
                            const cgst = Math.round(baseValue * 0.09);
                            const sgst = Math.round(baseValue * 0.09);
                            const gstTotal = cgst + sgst;
                            const txnFee = Math.round(baseValue * 0.02);
                            return (
                              <div style={{ marginBottom: "12px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "4px",
                                    fontSize: "0.85rem",
                                    color: "#555",
                                  }}
                                >
                                  <span>Course Value</span>
                                  <span>
                                    ₹{baseValue.toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "4px",
                                    fontSize: "0.85rem",
                                    color: "#555",
                                  }}
                                >
                                  <span>CGST (9%)</span>
                                  <span>₹{cgst.toLocaleString("en-IN")}</span>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "4px",
                                    fontSize: "0.85rem",
                                    color: "#555",
                                  }}
                                >
                                  <span>SGST (9%)</span>
                                  <span>₹{sgst.toLocaleString("en-IN")}</span>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "4px",
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    color: "#4f46e5",
                                  }}
                                >
                                  <span>Total GST (18%)</span>
                                  <span>
                                    ₹{gstTotal.toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "4px",
                                    fontSize: "0.85rem",
                                    color: "#555",
                                  }}
                                >
                                  <span>Transaction Fee (2%)</span>
                                  <span>₹{txnFee.toLocaleString("en-IN")}</span>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    paddingTop: "6px",
                                    borderTop: "1px solid #e2e8f0",
                                    fontWeight: "700",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <span>Monthly EMI</span>
                                  <span>
                                    ₹{monthlyAmt.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                          <EMIBreakdownGrid>
                            <EMIBreakdownItem>
                              <EMIBreakdownLabel>
                                Total Amount
                              </EMIBreakdownLabel>
                              <EMIBreakdownValue>
                                ₹
                                {plan.totalAmount?.toLocaleString("en-IN") ||
                                  "N/A"}
                              </EMIBreakdownValue>
                            </EMIBreakdownItem>
                            <EMIBreakdownItem>
                              <EMIBreakdownLabel>Paid Amount</EMIBreakdownLabel>
                              <EMIBreakdownValue positive>
                                ₹
                                {(
                                  (plan.paidEmis || 0) *
                                  (plan.monthlyAmount || 0)
                                ).toLocaleString("en-IN")}
                              </EMIBreakdownValue>
                            </EMIBreakdownItem>
                            <EMIBreakdownItem>
                              <EMIBreakdownLabel>Remaining</EMIBreakdownLabel>
                              <EMIBreakdownValue>
                                ₹
                                {plan.totalRemaining?.toLocaleString("en-IN") ||
                                  "0"}
                              </EMIBreakdownValue>
                            </EMIBreakdownItem>
                            <EMIBreakdownItem>
                              <EMIBreakdownLabel>EMIs Left</EMIBreakdownLabel>
                              <EMIBreakdownValue>
                                {plan.upcomingEmis || 0}
                              </EMIBreakdownValue>
                            </EMIBreakdownItem>
                          </EMIBreakdownGrid>
                        </EMIPaymentBreakdown>

                        {plan.gracePeriodInfo && (
                          <EMIGracePeriod>
                            <EMIGraceIcon></EMIGraceIcon>
                            <div>
                              <EMIGraceTitle>Grace Period Active</EMIGraceTitle>
                              <EMIGraceText>
                                Pay ₹
                                {plan.gracePeriodInfo.amount?.toLocaleString(
                                  "en-IN",
                                )}{" "}
                                before{" "}
                                {formatDate(
                                  plan.gracePeriodInfo.gracePeriodEnd,
                                )}
                              </EMIGraceText>
                            </div>
                          </EMIGracePeriod>
                        )}

                        {plan.nextDueDate &&
                          plan.overdueEmis === 0 &&
                          !plan.gracePeriodInfo && (
                            <EMINextPayment>
                              <EMINextIcon></EMINextIcon>
                              <div>
                                <EMINextTitle>Next Payment Due</EMINextTitle>
                                <EMINextText>
                                  ₹{plan.monthlyAmount?.toLocaleString("en-IN")}{" "}
                                  due on {formatDate(plan.nextDueDate)}
                                </EMINextText>
                              </div>
                            </EMINextPayment>
                          )}

                        {/* URGENT PAY NOW BUTTON FOR OVERDUE */}
                        {isOverdue && (
                          <OverduePayButton
                            onClick={() =>
                              navigate(`/user/emi-payment/${plan.courseId}`)
                            }
                          >
                             PAY NOW - UNLOCK COURSE
                          </OverduePayButton>
                        )}

                        <EMIPlanActions>
                          <EMIViewDetailsButton
                            onClick={() => {
                              setSelectedEmiPlan(plan);
                            }}
                          >
                            View Detailed EMI Plan
                          </EMIViewDetailsButton>
                        </EMIPlanActions>
                      </EMIPlanCard>
                    );
                  })}
                </EMIPlansGrid>
              ) : (
                <EmptyState>
                  <EmptyIcon></EmptyIcon>
                  <h3>No EMI Plans Found</h3>
                  <p>
                    You don't have any active EMI payment plans. EMI plans will
                    appear here once you enroll in a course with EMI option.
                  </p>
                </EmptyState>
              )}
            </EMISection>
          )}

          {/* Payment History */}
          {activeTab === "all" && (
            <>
              {payments.length === 0 ? (
                <EmptyState>
                  <EmptyIcon></EmptyIcon>
                  <h3>No payment history found</h3>
                  <p>
                    Your payment records will appear here once you make a
                    transaction
                  </p>
                </EmptyState>
              ) : (
                <PaymentHistorySection>
                  <SectionTitle>
                    <h2>Payment History</h2>
                    <p>Your payment transactions</p>
                  </SectionTitle>

                  <PaymentList>
                    {payments.map((payment) => (
                      <PaymentCard key={payment._id}>
                        <PaymentHeader>
                          <div>
                            <CourseTitle>
                              {payment.courseId?.coursename ||
                                payment.courseName}
                            </CourseTitle>
                            <PaymentDate>
                              {formatDate(payment.createdAt)}
                            </PaymentDate>
                          </div>
                          <PaymentAmount>
                            {formatCurrency(payment.amount, payment.currency)}
                          </PaymentAmount>
                        </PaymentHeader>

                        <PaymentDetails>
                          <DetailItem>
                            <DetailLabel>Status</DetailLabel>
                            <Badge status={payment.paymentStatus}>
                              {payment.paymentStatus}
                            </Badge>
                          </DetailItem>

                          <DetailItem>
                            <DetailLabel>Payment Method</DetailLabel>
                            <DetailValue>
                              {payment.paymentMethod.replace(/_/g, " ")}
                            </DetailValue>
                          </DetailItem>

                          <DetailItem>
                            <DetailLabel>Transaction ID</DetailLabel>
                            <DetailValue>{payment.transactionId}</DetailValue>
                          </DetailItem>
                        </PaymentDetails>
                      </PaymentCard>
                    ))}
                  </PaymentList>
                </PaymentHistorySection>
              )}
            </>
          )}

          {/* Show Detailed EMI Plans when EMI tab is active */}
          {activeTab === "emi" && emiPlans.length > 0 && (
            <div>
              {selectedEmiPlan && (
                <div
                  style={{
                    marginBottom: "2rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, color: "#1a202c" }}>
                      EMI Plan Details
                    </h2>
                    <p style={{ margin: "0.25rem 0 0 0", color: "#718096" }}>
                      Detailed payment schedule for {selectedEmiPlan.courseName}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEmiPlan(null)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    View All Plans
                  </button>
                </div>
              )}
              {selectedEmiPlan ? (
                // Show only the selected EMI plan
                <DetailedEmiPlan
                  key={selectedEmiPlan.courseId}
                  courseId={selectedEmiPlan.courseId}
                  courseName={selectedEmiPlan.courseName}
                  planData={{
                    paymentType: "emi",
                    planStatus: selectedEmiPlan.planStatus,
                    totalEmis: selectedEmiPlan.totalEmis,
                    paidEmis: selectedEmiPlan.paidEmis,
                    pendingEmis: selectedEmiPlan.upcomingEmis,
                    overdueEmis: selectedEmiPlan.overdueEmis,
                    totalAmount: selectedEmiPlan.totalAmount,
                    totalPaid: selectedEmiPlan.totalPaid,
                    totalRemaining: selectedEmiPlan.totalRemaining,
                    monthlyAmount: selectedEmiPlan.monthlyAmount,
                    nextDueDate: selectedEmiPlan.nextDueDate,
                    hasAccess: selectedEmiPlan.hasAccess,
                    emis: selectedEmiPlan.emis, // Include the detailed EMI installments
                  }}
                />
              ) : (
                // Show all EMI plans when no specific plan is selected
                emiPlans.map((plan) => (
                  <DetailedEmiPlan
                    key={plan.courseId}
                    courseId={plan.courseId}
                    courseName={plan.courseName}
                    planData={{
                      paymentType: "emi",
                      planStatus: plan.planStatus,
                      totalEmis: plan.totalEmis,
                      paidEmis: plan.paidEmis,
                      pendingEmis: plan.upcomingEmis,
                      overdueEmis: plan.overdueEmis,
                      totalAmount: plan.totalAmount,
                      totalPaid: plan.totalPaid,
                      totalRemaining: plan.totalRemaining,
                      monthlyAmount: plan.monthlyAmount,
                      nextDueDate: plan.nextDueDate,
                      hasAccess: plan.hasAccess,
                      emis: plan.emis, // Include the detailed EMI installments
                    }}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "emi" && emiPlans.length === 0 && !emiLoading && (
            <EmptyState>
              <EmptyIcon></EmptyIcon>
              <h3>No EMI Plans Found</h3>
              <p>
                You don't have any active EMI payment plans. EMI plans will
                appear here once you enroll in a course with EMI option.
              </p>
            </EmptyState>
          )}

          {/* Pagination - Only show for payment history */}
          {activeTab === "all" && pagination.totalPages > 1 && (
            <Pagination>
              <PaginationButton
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </PaginationButton>

              <PageIndicator>
                Page {page} of {pagination.totalPages}
              </PageIndicator>

              <PaginationButton
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
              >
                Next
              </PaginationButton>
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 2rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
  color: #2d3748;
  /* background removed to match requested style */
  background: transparent;

  @media (min-width: 768px) {
    padding: 3rem 2rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem 0.75rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2.5rem;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 1rem;
    color: #718096;
  }

  @media (min-width: 768px) {
    h1 {
      font-size: 2.5rem;
    }
  }
`;

const HeaderTop = styled.div`
  width: 100%;
  margin-bottom: 1rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fefefe;
  border: none;
  border-radius: 10px;
  padding: 0.625rem 1rem;
  cursor: pointer;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  &:hover {
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.12),
      0 2px 4px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.08),
      0 1px 2px rgba(0, 0, 0, 0.06);
  }
`;

const BackCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  transition: all 0.2s ease;
  flex-shrink: 0;
`;

const BackArrow = styled.svg`
  width: 16px;
  height: 16px;
  color: #1a1a1a;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all 0.2s ease;
`;

const BackText = styled.span`
  font-weight: 500;
  font-size: 0.9375rem;
  color: #4a4a4a;
  transition: all 0.2s ease;
  letter-spacing: -0.01em;
`;
const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const SummaryCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-left: 4px solid
    ${(props) => {
      if (props.accent === "primary") return "#4f46e5";
      if (props.accent === "success") return "#10b981";
      if (props.accent === "warning") return "#f59e0b";
      if (props.accent === "danger") return "#ef4444";
      if (props.accent === "info") return "#06b6d4";
      return "#6b7280";
    }};
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 639px) {
    text-align: center;
    padding: 1rem;
  }
`;

const SummaryTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #718096;
  margin-bottom: 0.5rem;
`;

const SummaryValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.5rem;
`;

const SummaryTrend = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: ${(props) => {
    if (props.positive) return "#10b981";
    if (props.negative) return "#ef4444";
    return "#718096";
  }};

  span {
    color: #718096;
  }
`;

// Tab Navigation Styles
const TabNavigation = styled.div`
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  gap: 0.5rem;
  overflow-x: auto;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.25rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 0.25rem;
  }
`;

const TabButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: fit-content;

  ${(props) =>
    props.active
      ? css`
          background: #4f46e5;
          color: white;
        `
      : css`
          background: transparent;
          color: #64748b;

          &:hover {
            background: #f1f5f9;
            color: #334155;
          }
        `}

  @media (max-width: 768px) {
    width: 100%;
  }
`;

// EMI Section Styles
const EMISection = styled.div`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.div`
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 0.25rem;
  }

  p {
    font-size: 0.875rem;
    color: #718096;
  }
`;

const EMIPlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  align-items: stretch;
  width: 100%;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.9rem;
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

const EMIPlanCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: ${(props) =>
    props.isOverdue ? "2px solid #ef4444" : "1px solid #e2e8f0"};
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  animation: ${(props) =>
    props.isOverdue ? "pulse-border 2s ease-in-out infinite" : "none"};
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: auto;

  @keyframes pulse-border {
    0%,
    100% {
      border-color: #ef4444;
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
    }
    50% {
      border-color: #dc2626;
      box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
    }
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  @media (max-width: 1024px) {
    padding: 0.9rem;
  }

  @media (max-width: 768px) {
    padding: 0.85rem;
  }

  @media (max-width: 640px) {
    padding: 0.75rem;
  }
`;

const EMIPlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 0.5rem;

  @media (max-width: 639px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
`;

const EMICourseName = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
  line-height: 1.3;
`;

const EMIStatus = styled.div`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
  color: white;
  background-color: ${(props) => {
    switch (props.status) {
      case "active":
        return "#10b981";
      case "overdue":
        return "#ef4444";
      case "locked":
        return "#ef4444";
      case "completed":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  }};
`;

const EMIProgress = styled.div`
  margin-bottom: 0.8rem;
`;

const EMIProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.3rem;
`;

const EMIProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #06d6a0 100%);
  border-radius: 4px;
  width: ${(props) => props.progress}%;
  transition: width 0.3s ease;
`;

const EMIProgressText = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;

  @media (max-width: 639px) {
    text-align: left;
  }
`;

const EMIDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 0.6rem;
  margin-bottom: 0.8rem;

  @media (max-width: 639px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    text-align: left;
  }
`;

const EMIDetailItem = styled.div`
  text-align: center;

  @media (max-width: 639px) {
    text-align: left;
  }
`;

const EMIDetailLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  color: #718096;
  margin-bottom: 0.15rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const EMIDetailValue = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: ${(props) => {
    if (props.positive) return "#10b981";
    if (props.negative) return "#ef4444";
    return "#1a202c";
  }};
`;

const EMIGracePeriod = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef3c7;
  padding: 0.7rem;
  border-radius: 6px;
  border-left: 3px solid #f59e0b;
  margin-top: 0.7rem;
`;

const EMIGraceIcon = styled.div`
  font-size: 1rem;
`;

const EMIGraceTitle = styled.div`
  font-weight: 600;
  color: #92400e;
  font-size: 0.75rem;
`;

const EMIGraceText = styled.div`
  font-size: 0.65rem;
  color: #b45309;
`;

const EMINextPayment = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #eff6ff;
  padding: 0.7rem;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
  margin-top: 0.7rem;
`;

const EMINextIcon = styled.div`
  font-size: 1rem;
`;

const EMINextTitle = styled.div`
  font-weight: 600;
  color: #1e40af;
  font-size: 0.75rem;
`;

const EMINextText = styled.div`
  font-size: 0.65rem;
  color: #2563eb;
`;

const EMICourseInfo = styled.div`
  flex: 1;
`;

const EMICourseCategory = styled.div`
  font-size: 0.75rem;
  color: #718096;
  margin-top: 0.25rem;
`;

const EMIPaymentBreakdown = styled.div`
  background: #f8fafc;
  border-radius: 6px;
  padding: 0.75rem;
  margin: 0.7rem 0;
  border: 1px solid #e2e8f0;
`;

const EMIBreakdownTitle = styled.h4`
  font-size: 0.75rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
`;

const EMIBreakdownGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const EMIBreakdownItem = styled.div`
  text-align: center;
`;

const EMIBreakdownLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  color: #718096;
  margin-bottom: 0.15rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const EMIBreakdownValue = styled.div`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${(props) => {
    if (props.positive) return "#10b981";
    return "#1a202c";
  }};
`;

const EMIPlanActions = styled.div`
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
`;

// NEW: Overdue Alert Banner Styles
const OverdueAlertBanner = styled.div`
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 2px solid #ef4444;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: shake 0.5s ease-in-out;

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    75% {
      transform: translateX(5px);
    }
  }
`;

const OverdueAlertIcon = styled.div`
  font-size: 1.5rem;
  animation: blink 1s ease-in-out infinite;

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
`;

const OverdueAlertText = styled.div`
  font-size: 0.875rem;
  color: #991b1b;
  line-height: 1.5;

  strong {
    font-weight: 700;
    color: #7f1d1d;
  }
`;

// NEW: Due Soon Alert Banner Styles
const DueSoonAlertBanner = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const DueSoonAlertIcon = styled.div`
  font-size: 1.5rem;
`;

const DueSoonAlertText = styled.div`
  font-size: 0.875rem;
  color: #92400e;
  line-height: 1.5;

  strong {
    font-weight: 700;
    color: #78350f;
  }
`;

// NEW: Overdue Pay Button
const OverduePayButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
  animation: pulse-glow 2s ease-in-out infinite;

  @keyframes pulse-glow {
    0%,
    100% {
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
    }
    50% {
      box-shadow: 0 6px 25px rgba(239, 68, 68, 0.6);
    }
  }

  &:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
  }

  &:active {
    transform: translateY(0);
  }
`;

const EMIViewDetailsButton = styled.button`
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
  }
`;

const PaymentHistorySection = styled.div`
  margin-bottom: 3rem;
`;

const PaymentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 639px) {
    gap: 1rem;
  }
`;

const PaymentCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  border: 1px solid #e2e8f0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
`;

const PaymentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 639px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const CourseTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
`;

const PaymentDate = styled.div`
  font-size: 0.875rem;
  color: #718096;
`;

const PaymentAmount = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  white-space: nowrap;

  @media (max-width: 639px) {
    margin-top: 0.5rem;
    white-space: normal;
    text-align: left;
  }

  @media (min-width: 640px) {
    margin-left: 1rem;
    text-align: right;
  }
`;

const PaymentDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const DetailItem = styled.div`
  margin-bottom: 0;
`;

const DetailLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #718096;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DetailValue = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: #2d3748;
`;

const Badge = styled.div`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  color: white;
  background-color: ${(props) => {
    switch (props.status) {
      case "completed":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "failed":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  }};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 3rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  background-color: #4f46e5;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: background-color 0.2s;
  min-width: 100px;

  &:hover {
    background-color: #4338ca;
  }

  &:disabled {
    background-color: #e2e8f0;
    color: #a0aec0;
    cursor: not-allowed;
  }

  @media (max-width: 639px) {
    min-width: auto;
    padding: 0.5rem 0.75rem;
  }
`;

const PageIndicator = styled.span`
  font-size: 0.875rem;
  color: #4a5568;
  margin: 0 0.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  gap: 1rem;
  color: #4a5568;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4f46e5;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fee2e2;
  padding: 1.5rem;
  border-radius: 8px;
  color: #b91c1c;
  margin: 2rem 0;
`;

const ErrorIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #b91c1c;
  color: white;
  font-weight: bold;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #718096;

  h3 {
    font-size: 1.25rem;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.875rem;
  }
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const RetryButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: #4338ca;
  }
`;

export default PaymentPages;
