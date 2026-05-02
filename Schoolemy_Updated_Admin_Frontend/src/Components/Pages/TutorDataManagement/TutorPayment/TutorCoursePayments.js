import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../../Utils/api';
import { hasStoredSession } from '../../../../Utils/security';
import { 
  FaArrowLeft, 
  FaDollarSign, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock,
  FaMoneyBillWave,
  FaGraduationCap,
  FaFileInvoiceDollar,
  FaEnvelope,
  FaPhone,
  FaCreditCard,
  FaHashtag,
  FaCalendarAlt,
  FaIdCard
} from 'react-icons/fa';
import { RiErrorWarningFill } from 'react-icons/ri';

const TutorCoursePayments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseInfo, setCourseInfo] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPayments: 0,
    limit: 10,
  });

  // Get tutorCourseId from query parameters
  const getTutorCourseId = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tutorCourseId');
  };

  const tutorCourseId = getTutorCourseId();

  const fetchPayments = useCallback(async () => {
    if (!tutorCourseId) {
      setError('Course ID is required');
      setLoading(false);
      return;
    }

    if (!hasStoredSession()) {
      setError('Your session has expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Fetch payment records for the specific course
      const response = await api.get('/tutor-course-payments', {
        params: {
          tutorCourseId: tutorCourseId,
          page: pagination.currentPage,
          limit: pagination.limit,
        },
      });

      // Handle different response formats
      if (response.data?.success) {
        setPayments(response.data.data?.payments || response.data.data || []);
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.data?.pagination?.totalPages || response.data.pagination?.totalPages || 1,
          totalPayments: response.data.data?.pagination?.totalPayments || response.data.pagination?.total || response.data.data?.total || 0,
        }));
        if (response.data.data?.courseInfo) {
          setCourseInfo(response.data.data.courseInfo);
        }
      } else if (Array.isArray(response.data)) {
        setPayments(response.data);
      } else if (response.data?.data) {
        setPayments(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setPayments([]);
        setError(response.data?.message || 'No payment records found for this course.');
      }
    } catch (err) {
      console.error('Error fetching payment records:', err);
      if (err.response?.status === 404) {
        setError(err.response?.data?.error || 'Course not found or has no payment records.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch payment records. Please try again.');
      }
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [tutorCourseId, pagination.currentPage, pagination.limit]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage,
    }));
  };

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

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'completed':
      case 'success':
      case 'paid':
        return { color: '#28a745', bgColor: '#d4edda', icon: FaCheckCircle };
      case 'pending':
      case 'processing':
        return { color: '#ffc107', bgColor: '#fff3cd', icon: FaClock };
      case 'failed':
      case 'cancelled':
      case 'rejected':
        return { color: '#dc3545', bgColor: '#f8d7da', icon: FaTimesCircle };
      default:
        return { color: '#6c757d', bgColor: '#e9ecef', icon: FaClock };
    }
  };

  // Design System - Color Palette (Matching other pages)
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
    courseInfoBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 16px',
      backgroundColor: colors.primary,
      color: 'white',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '500',
      marginLeft: '12px',
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
      backgroundColor: colors.bgWhite,
      padding: '24px',
      borderRadius: '12px',
      boxShadow: shadows.md,
      marginBottom: '24px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '24px',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      transition: 'all 0.3s ease',
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
    cardsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
      gap: '24px',
      marginBottom: '24px',
    },
    paymentCard: {
      backgroundColor: colors.bgWhite,
      borderRadius: '12px',
      boxShadow: shadows.md,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      border: `1px solid ${colors.lightGray}`,
      display: 'flex',
      flexDirection: 'column',
    },
    paymentCardHover: {
      transform: 'translateY(-4px)',
      boxShadow: shadows.lg,
      borderColor: colors.primary,
    },
    cardHeader: {
      padding: '20px',
      background: colors.gradient1,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
    },
    cardHeaderPattern: {
      position: 'absolute',
      top: '-50%',
      right: '-20%',
      width: '150px',
      height: '150px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '50%',
    },
    cardHeaderContent: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    cardStudentInfo: {
      flex: 1,
    },
    cardStudentName: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '6px',
      color: 'white',
    },
    cardIndex: {
      fontSize: '14px',
      opacity: 0.9,
      color: 'white',
      fontWeight: '500',
    },
    cardAmount: {
      fontSize: '24px',
      fontWeight: '800',
      color: 'white',
      textAlign: 'right',
    },
    cardBody: {
      padding: '20px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    cardDetailRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      transition: 'background-color 0.2s ease',
    },
    cardDetailIcon: {
      fontSize: '16px',
      color: colors.primary,
      minWidth: '20px',
    },
    cardDetailContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    },
    cardDetailLabel: {
      fontSize: '11px',
      color: colors.gray,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    cardDetailValue: {
      fontSize: '14px',
      color: colors.dark,
      fontWeight: '500',
      wordBreak: 'break-word',
    },
    cardFooter: {
      padding: '16px 20px',
      borderTop: `1px solid ${colors.lightGray}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
    },
    cardDate: {
      fontSize: '12px',
      color: colors.gray,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    tableWrapper: {
      backgroundColor: colors.bgWhite,
      borderRadius: '12px',
      boxShadow: shadows.md,
      overflow: 'hidden',
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
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderTop: `1px solid ${colors.lightGray}`,
      flexWrap: 'wrap',
    },
    paginationBtn: {
      padding: '10px 20px',
      border: `1px solid ${colors.lightGray}`,
      backgroundColor: colors.bgWhite,
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: colors.dark,
      transition: 'all 0.3s ease',
    },
    paginationBtnHover: {
      backgroundColor: colors.primary,
      color: 'white',
      borderColor: colors.primary,
      transform: 'translateY(-2px)',
      boxShadow: shadows.sm,
    },
    paginationBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      backgroundColor: colors.bgWhite,
      color: colors.gray,
    },
    paginationInfo: {
      margin: '0 16px',
      color: colors.dark,
      fontSize: '14px',
      fontWeight: '500',
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

  // Calculate totals
  const totalAmount = payments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
  const completedPayments = payments.filter(p => {
    const status = p.paymentStatus?.toLowerCase() || p.status?.toLowerCase() || '';
    return status === 'completed' || status === 'success' || status === 'paid';
  }).length;

  return (
    <div style={styles.container}>
      <div style={styles.backgroundPattern}></div>
      <div style={styles.content}>
        {/* Header */}
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
              Payment Records
              {courseInfo && (
                <span style={styles.courseInfoBadge}>
                  <FaGraduationCap /> {courseInfo.coursename || 'Course'}
                </span>
              )}
            </h1>
            <p style={styles.subtitle}>
              View all payment records and transaction details for this course
            </p>
          </div>
        </div>

        {/* Info Cards */}
        {payments.length > 0 && (
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
                <div style={styles.infoLabel}>Total Payments</div>
                <div style={styles.infoValue}>{pagination.totalPayments || payments.length}</div>
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
                <FaCheckCircle />
              </div>
              <div style={styles.infoContent}>
                <div style={styles.infoLabel}>Completed</div>
                <div style={{ ...styles.infoValue, color: colors.success }}>{completedPayments}</div>
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
                <div style={styles.infoLabel}>Total Amount</div>
                <div style={{ ...styles.infoValue, color: colors.success }}>
                  {formatCurrency(totalAmount)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={styles.errorMessage}>
            <div style={styles.errorContent}>
              <RiErrorWarningFill style={styles.errorIcon} />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: colors.danger }}>
                  Error Loading Payment Records
                </div>
                <div style={styles.errorText}>{error}</div>
              </div>
            </div>
            <button
              style={styles.retryBtn}
              onClick={fetchPayments}
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
            <div style={styles.loadingText}>Loading payment records...</div>
            <div style={styles.loadingSubtext}>Please wait while we fetch the data</div>
          </div>
        )}

        {/* Payment Records Cards */}
        {!loading && !error && (
          <>
            {payments.length === 0 ? (
              <div style={styles.tableWrapper}>
                <div style={styles.noData}>
                  <FaDollarSign style={styles.noDataIcon} />
                  <div style={styles.noDataText}>No payment records found</div>
                  <div style={styles.noDataSubtext}>
                    This course doesn't have any payment records yet. Records will appear here once payments are made.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.cardsContainer}>
                  {payments.map((payment, index) => {
                    const statusBadge = getStatusBadge(payment.paymentStatus || payment.status);
                    const StatusIcon = statusBadge.icon;
                    const paymentNumber = (pagination.currentPage - 1) * pagination.limit + index + 1;
                    const studentName = payment.username || payment.studentName || payment.name || 'N/A';
                    const studentRegisterNumber = payment.studentRegisterNumber || payment.registerNumber || payment.regNumber || 'N/A';
                    const email = payment.email || 'N/A';
                    const mobile = payment.mobile || payment.mobilenumber || 'N/A';
                    const amount = formatCurrency(payment.amount);
                    const paymentMethod = payment.paymentMethod || payment.method || 'N/A';
                    const transactionId = payment.transactionId || payment.transactionID || 'N/A';
                    const date = formatDate(payment.createdAt || payment.paymentDate || payment.date);
                    const status = payment.paymentStatus || payment.status || 'Unknown';

                    return (
                      <div
                        key={payment._id || index}
                        style={styles.paymentCard}
                        onMouseEnter={(e) => {
                          Object.assign(e.currentTarget.style, styles.paymentCardHover);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = shadows.md;
                          e.currentTarget.style.borderColor = colors.lightGray;
                        }}
                      >
                        {/* Card Header */}
                        <div style={styles.cardHeader}>
                          <div style={styles.cardHeaderPattern}></div>
                          <div style={styles.cardHeaderContent}>
                            <div style={styles.cardStudentInfo}>
                              <div style={styles.cardStudentName}>{studentName}</div>
                              {studentRegisterNumber !== 'N/A' && (
                                <div style={{ ...styles.cardIndex, fontSize: '13px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FaIdCard style={{ fontSize: '12px' }} />
                                  Reg: {studentRegisterNumber}
                                </div>
                              )}
                              <div style={{ ...styles.cardIndex, marginTop: studentRegisterNumber !== 'N/A' ? '4px' : '0' }}>
                                Payment #{paymentNumber}
                              </div>
                            </div>
                            <div style={styles.cardAmount}>{amount}</div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div style={styles.cardBody}>
                          {studentRegisterNumber !== 'N/A' && (
                            <div style={styles.cardDetailRow}>
                              <FaIdCard style={styles.cardDetailIcon} />
                              <div style={styles.cardDetailContent}>
                                <div style={styles.cardDetailLabel}>Register Number</div>
                                <div style={{ ...styles.cardDetailValue, fontFamily: 'monospace', fontWeight: '600' }}>
                                  {studentRegisterNumber}
                                </div>
                              </div>
                            </div>
                          )}

                          <div style={styles.cardDetailRow}>
                            <FaEnvelope style={styles.cardDetailIcon} />
                            <div style={styles.cardDetailContent}>
                              <div style={styles.cardDetailLabel}>Email</div>
                              <div style={styles.cardDetailValue}>{email}</div>
                            </div>
                          </div>

                          <div style={styles.cardDetailRow}>
                            <FaPhone style={styles.cardDetailIcon} />
                            <div style={styles.cardDetailContent}>
                              <div style={styles.cardDetailLabel}>Mobile</div>
                              <div style={styles.cardDetailValue}>{mobile}</div>
                            </div>
                          </div>

                          <div style={styles.cardDetailRow}>
                            <FaCreditCard style={styles.cardDetailIcon} />
                            <div style={styles.cardDetailContent}>
                              <div style={styles.cardDetailLabel}>Payment Method</div>
                              <div style={styles.cardDetailValue}>{paymentMethod}</div>
                            </div>
                          </div>

                          <div style={styles.cardDetailRow}>
                            <FaHashtag style={styles.cardDetailIcon} />
                            <div style={styles.cardDetailContent}>
                              <div style={styles.cardDetailLabel}>Transaction ID</div>
                              <div style={{ ...styles.cardDetailValue, fontFamily: 'monospace', fontSize: '13px' }}>
                                {transactionId}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div style={styles.cardFooter}>
                          <div style={styles.cardDate}>
                            <FaCalendarAlt style={{ fontSize: '14px' }} />
                            {date}
                          </div>
                          <span
                            style={{
                              ...styles.statusBadge,
                              color: statusBadge.color,
                              backgroundColor: statusBadge.bgColor,
                            }}
                          >
                            <StatusIcon /> {status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div style={styles.pagination}>
                    <button
                      style={{
                        ...styles.paginationBtn,
                        ...(pagination.currentPage === 1 && styles.paginationBtnDisabled)
                      }}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      onMouseEnter={(e) => {
                        if (pagination.currentPage !== 1) {
                          Object.assign(e.currentTarget.style, styles.paginationBtnHover);
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pagination.currentPage !== 1) {
                          e.currentTarget.style.backgroundColor = colors.bgWhite;
                          e.currentTarget.style.color = colors.dark;
                          e.currentTarget.style.borderColor = colors.lightGray;
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      ← Previous
                    </button>

                    <div style={styles.paginationInfo}>
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>

                    <button
                      style={{
                        ...styles.paginationBtn,
                        ...(pagination.currentPage === pagination.totalPages && styles.paginationBtnDisabled)
                      }}
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      onMouseEnter={(e) => {
                        if (pagination.currentPage !== pagination.totalPages) {
                          Object.assign(e.currentTarget.style, styles.paginationBtnHover);
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pagination.currentPage !== pagination.totalPages) {
                          e.currentTarget.style.backgroundColor = colors.bgWhite;
                          e.currentTarget.style.color = colors.dark;
                          e.currentTarget.style.borderColor = colors.lightGray;
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TutorCoursePayments;
