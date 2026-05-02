import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../Utils/api';
import { hasStoredSession } from '../../../../Utils/security';
import { 
  FaArrowLeft, 
  FaBook, 
  FaList, 
  FaGraduationCap, 
  FaChalkboardTeacher,
  FaMoneyBillWave
} from 'react-icons/fa';
import { RiFileList3Line, RiErrorWarningFill } from 'react-icons/ri';

const TutorPaymentCourses = () => {
  const { tutorname } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tutorInfo, setTutorInfo] = useState(null);

  const fetchCourses = useCallback(async () => {
    if (!tutorname) {
      setError('Tutor name is required');
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

      // Fetch courses from /courses-tutors/tutor/:tutorname endpoint
      const decodedTutorName = decodeURIComponent(tutorname);
      const response = await api.get(`/courses-tutors/tutor/${encodeURIComponent(decodedTutorName)}`);

      // Handle response format
      if (response.data?.success) {
        const coursesData = response.data.data || [];
        setCourses(coursesData);
        setError(''); // Clear any previous errors
        // Extract tutor info from first course if available
        if (coursesData.length > 0 && coursesData[0].tutor) {
          setTutorInfo(coursesData[0].tutor);
        } else if (coursesData.length === 0) {
          // No courses found - this is not an error, just empty state
          setError('');
        }
      } else {
        // If response is not successful but it's just "no courses", don't treat as error
        const message = response.data?.message || '';
        if (message.toLowerCase().includes('no courses') || message.toLowerCase().includes('not found')) {
          setCourses([]);
          setError(''); // Don't show error for "no courses"
        } else {
          setCourses([]);
          setError(message || 'Failed to fetch courses.');
        }
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      // Only show error for actual errors, not for "no courses" scenarios
      if (err.response?.status === 404) {
        // 404 could mean tutor not found OR no courses - treat as "no courses" scenario
        const errorMsg = err.response?.data?.error || err.response?.data?.message || '';
        if (errorMsg.toLowerCase().includes('no courses') || errorMsg.toLowerCase().includes('not found')) {
          setCourses([]);
          setError(''); // Don't show error, just show "no courses" message
        } else {
          setCourses([]);
          setError(errorMsg || 'Tutor not found.');
        }
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        // Authentication/authorization errors are real errors
        setError(err.response?.data?.error || err.response?.data?.message || 'Authentication failed. Please login again.');
        setCourses([]);
      } else {
        // Other errors (network, server errors) are real errors
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch courses. Please try again.');
        setCourses([]);
      }
    } finally {
      setLoading(false);
    }
  }, [tutorname]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Design System - Color Palette (Matching Tutorslist.js)
  const colors = {
    primary: '#007bff',
    primaryDark: '#0056b3',
    primaryLight: '#66b3ff',
    secondary: '#6c757d',
    accent: '#ffc107',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    dark: '#333333',
    darkGray: '#555555',
    gray: '#666666',
    lightGray: '#e9ecef',
    bgLight: '#f5f5f5',
    bgWhite: '#ffffff',
    gradient1: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
    gradient2: 'linear-gradient(135deg, #007bff 0%, #66b3ff 100%)',
    gradient3: 'linear-gradient(135deg, #0056b3 0%, #007bff 100%)',
    gradient4: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
  };

  const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0,0,0,0.1)',
    lg: '0 4px 6px rgba(0,0,0,0.1)',
    xl: '0 10px 15px rgba(0,0,0,0.1)',
    glow: '0 0 20px rgba(0, 123, 255, 0.3)',
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
      maxWidth: '1400px',
      margin: '0 auto',
    },
    header: {
      backgroundColor: colors.bgWhite,
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: shadows.md,
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap',
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 24px',
      background: colors.gradient1,
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: shadows.md,
      position: 'relative',
      overflow: 'hidden',
    },
    backButtonHover: {
      transform: 'translateX(-4px)',
      boxShadow: shadows.glow,
    },
    headerContent: {
      flex: 1,
      minWidth: '300px',
    },
    title: {
      margin: '0 0 5px 0',
      fontSize: '28px',
      fontWeight: '700',
      color: colors.dark,
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
      lineHeight: '1.6',
    },
    statsCard: {
      background: colors.gradient1,
      borderRadius: '16px',
      padding: '20px 24px',
      color: 'white',
      minWidth: '160px',
      boxShadow: shadows.lg,
      position: 'relative',
      overflow: 'hidden',
    },
    statsCardBg: {
      position: 'absolute',
      top: '-50%',
      right: '-20%',
      width: '120px',
      height: '120px',
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '50%',
    },
    statsContent: {
      position: 'relative',
      zIndex: 1,
    },
    statsIcon: {
      fontSize: '28px',
      marginBottom: '12px',
      opacity: 0.9,
    },
    statsValue: {
      fontSize: '32px',
      fontWeight: '800',
      marginBottom: '4px',
      lineHeight: '1',
    },
    statsLabel: {
      fontSize: '13px',
      opacity: 0.9,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    tutorInfoCard: {
      backgroundColor: colors.bgWhite,
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: shadows.md,
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    tutorAvatar: {
      width: '64px',
      height: '64px',
      borderRadius: '16px',
      background: colors.gradient1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '28px',
      boxShadow: shadows.md,
    },
    tutorDetails: {
      flex: 1,
    },
    tutorName: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '700',
      color: colors.dark,
      marginBottom: '6px',
    },
    tutorEmail: {
      margin: 0,
      fontSize: '14px',
      color: colors.gray,
      fontWeight: '400',
    },
    errorMessage: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      borderRadius: '5px',
      padding: '12px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
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
      color: colors.danger,
      fontSize: '15px',
      fontWeight: '500',
    },
    retryBtn: {
      backgroundColor: colors.danger,
      color: 'white',
      border: 'none',
      padding: '5px 10px',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'all 0.3s ease',
    },
    loadingContainer: {
      backgroundColor: colors.bgWhite,
      borderRadius: '10px',
      padding: '40px',
      textAlign: 'center',
      boxShadow: shadows.md,
    },
    spinner: {
      width: '60px',
      height: '60px',
      border: `4px solid ${colors.lightGray}`,
      borderTop: `4px solid ${colors.primary}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 24px',
    },
    loadingText: {
      fontSize: '18px',
      fontWeight: '600',
      color: colors.dark,
      marginBottom: '8px',
    },
    loadingSubtext: {
      fontSize: '14px',
      color: colors.gray,
    },
    coursesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
      gap: '24px',
    },
    courseCard: {
      backgroundColor: colors.bgWhite,
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: shadows.md,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    },
    courseCardHover: {
      transform: 'translateY(-8px)',
      boxShadow: shadows.xl,
    },
    courseHeader: {
      padding: '20px',
      background: colors.gradient1,
      position: 'relative',
      overflow: 'hidden',
    },
    courseHeaderPattern: {
      position: 'absolute',
      top: '-50%',
      right: '-20%',
      width: '200px',
      height: '200px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '50%',
    },
    courseHeaderContent: {
      position: 'relative',
      zIndex: 1,
    },
    courseName: {
      margin: 0,
      fontSize: '22px',
      fontWeight: '700',
      color: 'white',
      marginBottom: '10px',
      lineHeight: '1.3',
    },
    courseId: {
      margin: 0,
      fontSize: '13px',
      color: 'rgba(255, 255, 255, 0.85)',
      fontFamily: "'SF Mono', 'Monaco', 'Cascadia Code', monospace",
      fontWeight: '500',
    },
    courseBody: {
      padding: '20px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    courseMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      paddingBottom: '16px',
      borderBottom: `1px solid ${colors.lightGray}`,
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: colors.gray,
      fontWeight: '500',
    },
    viewButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      padding: '12px',
      background: 'transparent',
      border: `2px solid ${colors.primary}`,
      borderRadius: '5px',
      color: colors.primary,
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: 'auto',
    },
    viewButtonHover: {
      background: colors.gradient1,
      color: 'white',
      borderColor: 'transparent',
      transform: 'scale(1.02)',
    },
    noCourses: {
      gridColumn: '1 / -1',
      backgroundColor: colors.bgWhite,
      borderRadius: '10px',
      padding: '40px',
      textAlign: 'center',
      boxShadow: shadows.md,
    },
    noCoursesIcon: {
      fontSize: '80px',
      color: colors.lightGray,
      marginBottom: '24px',
      opacity: 0.5,
    },
    noCoursesText: {
      fontSize: '20px',
      fontWeight: '600',
      color: colors.dark,
      marginBottom: '12px',
    },
    noCoursesSubtext: {
      fontSize: '15px',
      color: colors.gray,
      maxWidth: '500px',
      margin: '0 auto',
      lineHeight: '1.6',
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
        {/* Header Section */}
        <div style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => navigate('/schoolemy/tutor-payment-details')}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, styles.backButtonHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = shadows.md;
            }}
          >
            <FaArrowLeft /> Back to Tutors
          </button>
          
          <div style={styles.headerContent}>
            <h1 style={styles.title}>
              Course Payment Details
              {tutorname && (
                <span style={{ fontSize: '20px', fontWeight: '600', color: colors.gray }}>
                  • {decodeURIComponent(tutorname)}
                </span>
              )}
            </h1>
            <p style={styles.subtitle}>
              Select a course to view detailed payment information and calculations
            </p>
          </div>

          <div style={styles.statsCard}>
            <div style={styles.statsCardBg}></div>
            <div style={styles.statsContent}>
              <FaList style={styles.statsIcon} />
              <div style={styles.statsValue}>{courses.length}</div>
              <div style={styles.statsLabel}>Total Courses</div>
            </div>
          </div>
        </div>

        {/* Tutor Info Card */}
        {tutorInfo && (
          <div style={styles.tutorInfoCard}>
            <div style={styles.tutorAvatar}>
              <FaChalkboardTeacher />
            </div>
            <div style={styles.tutorDetails}>
              <h2 style={styles.tutorName}>{decodeURIComponent(tutorname)}</h2>
              <p style={styles.tutorEmail}>{tutorInfo.email || 'No email provided'}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={styles.errorMessage}>
            <div style={styles.errorContent}>
              <RiErrorWarningFill style={styles.errorIcon} />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: colors.danger }}>
                  Error Loading Courses
                </div>
                <div style={styles.errorText}>{error}</div>
              </div>
            </div>
            <button
              style={styles.retryBtn}
              onClick={fetchCourses}
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

        {/* Loading State */}
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <div style={styles.loadingText}>Loading courses...</div>
            <div style={styles.loadingSubtext}>Please wait while we fetch the data</div>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !error && (
          <div style={styles.coursesGrid}>
            {courses.length === 0 ? (
              <div style={styles.noCourses}>
                <FaBook style={styles.noCoursesIcon} />
                <div style={styles.noCoursesText}>No courses available for this tutor</div>
                <div style={styles.noCoursesSubtext}>
                  This tutor hasn't been assigned to any courses yet. Courses will appear here once they are assigned.
                </div>
              </div>
            ) : (
              courses.map((course, index) => {
                const courseId = course._id || course.courseId;
                return (
                  <div
                    key={courseId || index}
                    style={styles.courseCard}
                    onClick={() => navigate(`/schoolemy/tutor-course-payments?tutorCourseId=${courseId}`)}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, styles.courseCardHover);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = shadows.md;
                    }}
                  >
                    <div style={styles.courseHeader}>
                      <div style={styles.courseHeaderPattern}></div>
                      <div style={styles.courseHeaderContent}>
                        <h3 style={styles.courseName}>
                          {course.coursename || 'Unnamed Course'}
                        </h3>
                        <p style={styles.courseId}>
                          ID: {course.courseId || course._id || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div style={styles.courseBody}>
                      <div style={styles.courseMeta}>
                        <div style={styles.metaItem}>
                          <FaGraduationCap style={{ color: colors.primary }} />
                          <span>Course Details</span>
                        </div>
                        <div style={styles.metaItem}>
                          <FaMoneyBillWave style={{ color: colors.success }} />
                          <span>Payment Ready</span>
                        </div>
                      </div>

                      <button
                        style={styles.viewButton}
                        onMouseEnter={(e) => {
                          Object.assign(e.currentTarget.style, styles.viewButtonHover);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = colors.primary;
                          e.currentTarget.style.borderColor = colors.primary;
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/schoolemy/tutor-course-payments?tutorCourseId=${courseId}`);
                        }}
                      >
                        <RiFileList3Line /> View Payment Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorPaymentCourses;
