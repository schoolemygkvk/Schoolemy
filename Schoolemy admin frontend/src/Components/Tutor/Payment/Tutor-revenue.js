import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../Utils/api';
import { 
  FaArrowLeft, 
  FaDollarSign, 
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaUser,
  FaPercentage,
  FaUsers,
  FaList
} from 'react-icons/fa';
import { RiErrorWarningFill } from 'react-icons/ri';

const TutorRevenue = () => {
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPaymentData = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const headers = token ? { Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}` } : {};

      const response = await api.get('/tutor/calculate-admin-payments', {
        headers,
      });

      if (response.data?.success) {
        setPaymentData(response.data.data);
        // Store earnings in localStorage for dashboard display
        const totalCommission = response.data.data?.totals?.totalCommission || 0;
        localStorage.setItem('tutorEarnings', totalCommission.toString());
      } else {
        setError(response.data?.message || 'Failed to fetch payment data.');
        setPaymentData(null);
      }
    } catch (err) {
      console.error('Error fetching payment data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication failed. Please login again.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch payment data. Please try again.');
      }
      setPaymentData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const formatPeriod = (periodString) => {
    if (!periodString) return 'N/A';
    try {
      // Format: "2026-02-01_to_2026-02-15"
      const [from, to] = periodString.split('_to_');
      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        return `${fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      return periodString;
    } catch {
      return periodString;
    }
  };

  // Design System - Color Palette
  const colors = {
    primary: '#007bff',
    primaryDark: '#0056b3',
    primaryLight: '#66b3ff',
    secondary: '#6c757d',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    dark: '#333333',
    gray: '#666666',
    lightGray: '#e9ecef',
    bgLight: '#f5f5f5',
    bgWhite: '#ffffff',
    gradient1: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
  };

  const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0,0,0,0.1)',
    lg: '0 4px 6px rgba(0,0,0,0.1)',
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.bgLight,
      padding: '20px',
      fontFamily: "'Arial', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    },
    backgroundPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(0, 123, 255, 0.05) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(0, 86, 179, 0.05) 0px, transparent 50%)
      `,
      pointerEvents: 'none',
      zIndex: 0,
    },
    content: {
      position: 'relative',
      zIndex: 1,
      maxWidth: '1600px',
      margin: '0 auto',
    },
    mainLayout: {
      display: 'grid',
      gridTemplateColumns: '2fr 3fr',
      gap: '24px',
      alignItems: 'flex-start',
    },
    mainLayoutSingleColumn: {
      display: 'block',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '24px',
      backgroundColor: colors.bgWhite,
      padding: '24px',
      borderRadius: '12px',
      boxShadow: shadows.md,
      flexWrap: 'wrap',
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      background: colors.gradient1,
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: shadows.sm,
    },
    headerContent: {
      flex: 1,
      minWidth: '300px',
    },
    title: {
      margin: '0 0 8px 0',
      color: colors.dark,
      fontSize: '28px',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    },
    subtitle: {
      margin: 0,
      color: colors.gray,
      fontSize: '14px',
      fontWeight: '400',
    },
    errorMessage: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      borderRadius: '10px',
      padding: '16px 20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      boxShadow: shadows.sm,
    },
    errorContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1,
    },
    errorIcon: {
      fontSize: '24px',
      color: colors.danger,
    },
    errorText: {
      fontSize: '15px',
      fontWeight: '500',
    },
    retryBtn: {
      backgroundColor: colors.danger,
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
    },
    loadingContainer: {
      backgroundColor: colors.bgWhite,
      borderRadius: '12px',
      padding: '60px 40px',
      textAlign: 'center',
      boxShadow: shadows.md,
    },
    spinner: {
      width: '50px',
      height: '50px',
      border: `4px solid ${colors.lightGray}`,
      borderTop: `4px solid ${colors.primary}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 20px',
    },
    loadingText: {
      fontSize: '16px',
      fontWeight: '500',
      color: colors.dark,
      marginBottom: '8px',
    },
    loadingSubtext: {
      fontSize: '14px',
      color: colors.gray,
    },
    infoCard: {
      backgroundColor: 'transparent',
      padding: 0,
      marginBottom: '24px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '18px 16px',
      backgroundColor: colors.bgWhite,
      borderRadius: '14px',
      boxShadow: shadows.md,
      transition: 'all 0.3s ease',
      border: `1px solid ${colors.lightGray}`,
    },
    infoItemHover: {
      transform: 'translateY(-2px)',
      boxShadow: shadows.sm,
    },
    infoIcon: {
      fontSize: '32px',
      color: colors.primary,
      padding: '12px',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      borderRadius: '10px',
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: '12px',
      color: colors.gray,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '4px',
    },
    infoValue: {
      fontSize: '24px',
      fontWeight: '700',
      color: colors.dark,
      lineHeight: '1.2',
    },
    sectionCard: {
      backgroundColor: colors.bgWhite,
      borderRadius: '16px',
      boxShadow: shadows.md,
      padding: '22px 22px 18px',
      marginBottom: '24px',
      border: `1px solid ${colors.lightGray}`,
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
      gap: '12px',
      flexWrap: 'wrap',
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '18px',
      fontWeight: 700,
      color: colors.dark,
    },
    sectionSubtitle: {
      fontSize: '13px',
      color: colors.gray,
      marginTop: '4px',
    },
    sectionBadge: {
      padding: '6px 12px',
      borderRadius: '999px',
      backgroundColor: '#eff6ff',
      color: colors.primary,
      fontSize: '12px',
      fontWeight: 600,
    },
    tutorCard: {
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      padding: '18px',
      marginBottom: '12px',
      border: `1px solid ${colors.lightGray}`,
      transition: 'all 0.3s ease',
    },
    tutorCardHover: {
      transform: 'translateY(-2px)',
      boxShadow: shadows.md,
      borderColor: colors.primary,
    },
    tutorHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
      flexWrap: 'wrap',
      gap: '12px',
    },
    tutorInfo: {
      flex: 1,
    },
    tutorName: {
      fontSize: '20px',
      fontWeight: '700',
      color: colors.dark,
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    tutorDetails: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      fontSize: '14px',
      color: colors.gray,
    },
    tutorDetailItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    tutorStats: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
    },
    statBox: {
      textAlign: 'right',
      padding: '12px 16px',
      backgroundColor: colors.bgWhite,
      borderRadius: '8px',
      minWidth: '120px',
    },
    statLabel: {
      fontSize: '12px',
      color: colors.gray,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginBottom: '4px',
    },
    statValue: {
      fontSize: '18px',
      fontWeight: '700',
      color: colors.dark,
    },
    tableWrapper: {
      backgroundColor: colors.bgWhite,
      borderRadius: '12px',
      boxShadow: shadows.md,
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeader: {
      background: colors.gradient1,
      color: 'white',
    },
    tableHeaderCell: {
      padding: '16px 12px',
      textAlign: 'left',
      fontWeight: '600',
      fontSize: '14px',
    },
    tableRow: {
      borderBottom: `1px solid ${colors.lightGray}`,
      transition: 'background-color 0.2s ease',
    },
    tableRowHover: {
      backgroundColor: '#f8f9fa',
    },
    tableCell: {
      padding: '14px 12px',
      color: colors.dark,
      fontSize: '14px',
    },
    noData: {
      textAlign: 'center',
      padding: '60px 40px',
      color: colors.gray,
    },
    noDataIcon: {
      fontSize: '64px',
      color: colors.lightGray,
      marginBottom: '20px',
      opacity: 0.5,
    },
    noDataText: {
      fontSize: '18px',
      fontWeight: '600',
      color: colors.dark,
      marginBottom: '8px',
    },
    noDataSubtext: {
      fontSize: '14px',
      color: colors.gray,
    },
  };

  // Add CSS animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.backgroundPattern}></div>
      <div style={styles.content}>
        {/* Header - Tutor Revenue Dashboard */}
        <div style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => navigate(-1)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryDark;
              e.currentTarget.style.transform = 'translateX(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.gradient1;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <FaArrowLeft /> Back
          </button>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>
              <FaMoneyBillWave /> Revenue Dashboard
            </h1>
            <p style={styles.subtitle}>
              Track your course sales, earnings, and detailed payment history
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={styles.errorMessage}>
            <div style={styles.errorContent}>
              <RiErrorWarningFill style={styles.errorIcon} />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: colors.danger }}>
                  Error Loading Payment Data
                </div>
                <div style={styles.errorText}>{error}</div>
              </div>
            </div>
            <button
              style={styles.retryBtn}
              onClick={fetchPaymentData}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <div style={styles.loadingText}>Loading payment data...</div>
            <div style={styles.loadingSubtext}>Please wait while we fetch the data</div>
          </div>
        )}

        {/* Payment Data Display */}
        {!loading && !error && paymentData && (
          <>
            {/* KPI Row */}
            <div style={styles.infoCard}>
              <div
                style={styles.infoItem}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, styles.infoItemHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={styles.infoIcon}>
                  <FaFileInvoiceDollar />
                </div>
                <div style={styles.infoContent}>
                  <div style={styles.infoLabel}>Total Sales</div>
                  <div style={styles.infoValue}>{paymentData.totals?.totalPayments || 0}</div>
                </div>
              </div>
              <div
                style={styles.infoItem}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, styles.infoItemHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ ...styles.infoIcon, color: colors.success, backgroundColor: 'rgba(40, 167, 69, 0.1)' }}>
                  <FaMoneyBillWave />
                </div>
                <div style={styles.infoContent}>
                  <div style={styles.infoLabel}>Total Sales Volume</div>
                  <div style={{ ...styles.infoValue, color: colors.success }}>
                    {formatCurrency(paymentData.totals?.totalPurchaseAmount)}
                  </div>
                </div>
              </div>
              <div
                style={styles.infoItem}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, styles.infoItemHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ ...styles.infoIcon, color: colors.primary, backgroundColor: 'rgba(0, 123, 255, 0.1)' }}>
                  <FaDollarSign />
                </div>
                <div style={styles.infoContent}>
                  <div style={styles.infoLabel}>Your Earnings</div>
                  <div style={{ ...styles.infoValue, color: colors.primary }}>
                    {formatCurrency(paymentData.totals?.totalCommission)}
                  </div>
                </div>
              </div>
              <div
                style={styles.infoItem}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, styles.infoItemHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ ...styles.infoIcon, color: colors.warning, backgroundColor: 'rgba(255, 193, 7, 0.1)' }}>
                  <FaPercentage />
                </div>
                <div style={styles.infoContent}>
                  <div style={styles.infoLabel}>Commission Rate</div>
                  <div style={{ ...styles.infoValue, color: colors.warning }}>
                    {paymentData.commissionRate || 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Main Two-Column Layout */}
            <div
              style={
                window.innerWidth < 992
                  ? styles.mainLayoutSingleColumn
                  : styles.mainLayout
              }
            >
              {/* Left Column: Overview */}
              <div>
                <div style={styles.sectionCard}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <div style={styles.sectionTitle}>
                        <FaUsers /> Your Revenue Overview
                      </div>
                      <div style={styles.sectionSubtitle}>
                        Snapshot of your total earnings and sales performance
                      </div>
                    </div>
                    <span style={styles.sectionBadge}>
                      {paymentData.totals?.totalPayments || 0} payments
                    </span>
                  </div>

                  {paymentData.tutors && paymentData.tutors.length > 0 ? (
                    paymentData.tutors.map((tutor, index) => (
                      <div
                        key={tutor.tutorId || index}
                        style={styles.tutorCard}
                        onMouseEnter={(e) => {
                          Object.assign(e.currentTarget.style, styles.tutorCardHover);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.borderColor = colors.lightGray;
                        }}
                      >
                        <div style={styles.tutorHeader}>
                          <div style={styles.tutorInfo}>
                            <div style={styles.tutorName}>
                              <FaUser /> {tutor.tutorName || 'N/A'}
                            </div>
                            <div style={styles.tutorDetails}>
                              <div style={styles.tutorDetailItem}>
                                <FaEnvelope /> {tutor.tutorEmail || 'N/A'}
                              </div>
                              <div style={styles.tutorDetailItem}>
                                <FaPhone /> {tutor.tutorMobile || 'N/A'}
                              </div>
                              <div style={styles.tutorDetailItem}>
                                <FaIdCard /> {tutor.tutorIdNumber || 'N/A'}
                              </div>
                            </div>
                          </div>
                          <div style={styles.tutorStats}>
                            <div style={styles.statBox}>
                              <div style={styles.statLabel}>Payments</div>
                              <div style={styles.statValue}>{tutor.paymentCount || 0}</div>
                            </div>
                            <div style={styles.statBox}>
                              <div style={styles.statLabel}>Total Amount</div>
                              <div style={{ ...styles.statValue, color: colors.success }}>
                                {formatCurrency(tutor.totalPurchaseAmount)}
                              </div>
                            </div>
                            <div style={styles.statBox}>
                              <div style={styles.statLabel}>Your Commission</div>
                              <div style={{ ...styles.statValue, color: colors.primary }}>
                                {formatCurrency(tutor.totalCommission)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.noData}>
                      <FaUsers style={styles.noDataIcon} />
                      <div style={styles.noDataText}>No revenue data yet</div>
                      <div style={styles.noDataSubtext}>
                        Once students purchase your courses, your earnings will appear here.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Payment History */}
              <div>
                <div style={styles.sectionCard}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <div style={styles.sectionTitle}>
                        <FaList /> Recent Payment History
                      </div>
                      <div style={styles.sectionSubtitle}>
                        Detailed list of each student purchase and your commission
                      </div>
                    </div>
                    <span style={styles.sectionBadge}>
                      Latest {Math.min(paymentData.paymentDetails?.length || 0, 10)} records
                    </span>
                  </div>

                  <div style={styles.tableWrapper}>
                    {paymentData.paymentDetails && paymentData.paymentDetails.length > 0 ? (
                      <table style={styles.table}>
                        <thead style={styles.tableHeader}>
                          <tr>
                            <th style={styles.tableHeaderCell}>#</th>
                            <th style={styles.tableHeaderCell}>Student</th>
                            <th style={styles.tableHeaderCell}>Course</th>
                            <th style={styles.tableHeaderCell}>Sale</th>
                            <th style={styles.tableHeaderCell}>Your Commission</th>
                            <th style={styles.tableHeaderCell}>Method</th>
                            <th style={styles.tableHeaderCell}>Period</th>
                            <th style={styles.tableHeaderCell}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentData.paymentDetails
                            .slice(0, 10)
                            .map((payment, index) => (
                              <tr
                                key={payment.paymentId || index}
                                style={styles.tableRow}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <td style={styles.tableCell}>{index + 1}</td>
                                <td style={styles.tableCell}>
                                  <div style={{ fontWeight: '500' }}>{payment.username || 'N/A'}</div>
                                  <div style={{ fontSize: '12px', color: colors.gray }}>
                                    {payment.studentRegisterNumber || 'N/A'}
                                  </div>
                                  <div style={{ fontSize: '12px', color: colors.gray }}>
                                    {payment.email || 'N/A'}
                                  </div>
                                </td>
                                <td style={styles.tableCell}>
                                  <div style={{ fontWeight: '500' }}>{payment.courseName || 'N/A'}</div>
                                </td>
                                <td style={{ ...styles.tableCell, fontWeight: '600', color: colors.success }}>
                                  {formatCurrency(payment.purchaseAmount)}
                                </td>
                                <td style={{ ...styles.tableCell, fontWeight: '600', color: colors.primary }}>
                                  {formatCurrency(payment.commissionAmount)} ({payment.commissionRate}%)
                                </td>
                                <td style={styles.tableCell}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '4px 8px',
                                      borderRadius: '12px',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                      backgroundColor: '#e0f7fa',
                                      color: '#006064',
                                    }}
                                  >
                                    {payment.paymentMethod || 'N/A'}
                                  </span>
                                </td>
                                <td style={styles.tableCell}>{formatPeriod(payment.paymentPeriod)}</td>
                                <td style={styles.tableCell}>{formatDate(payment.paymentDate)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={styles.noData}>
                        <FaFileInvoiceDollar style={styles.noDataIcon} />
                        <div style={styles.noDataText}>No payment history yet</div>
                        <div style={styles.noDataSubtext}>
                          When students start purchasing your courses, payment history will be shown here.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TutorRevenue;
