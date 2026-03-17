import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../Utils/api';
import tutorCourseApi from '../../../../Utils/tutorCourseApi';
import { secureStorage } from '../../../../Utils/security';
import { FaArrowLeft, FaFolderOpen, FaCheck, FaTimes, FaEdit, FaTrash, FaEllipsisV } from 'react-icons/fa';

// Generate dynamic gradient header color using HSL
const getDynamicColor = (index) => {
  const hue = (index * 57) % 360;
  return `linear-gradient(to right, hsl(${hue}, 70%, 50%), hsl(${
    (hue + 30) % 360
  }, 70%, 60%))`;
};

const TutorCoursesView = () => {
  const { tutorname } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tutorInfo, setTutorInfo] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: null, course: null });
  const [reviewComment, setReviewComment] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchCourses = useCallback(async () => {
    if (!tutorname) {
      setError('Tutor name is required');
      setLoading(false);
      return;
    }

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

      const response = await api.get(`/courses-tutors/tutor/${encodeURIComponent(tutorname)}`, {
        headers,
      });

      if (response.data?.success) {
        setCourses(response.data.data || []);
        // Extract tutor info from first course if available
        if (response.data.data && response.data.data.length > 0 && response.data.data[0].tutor) {
          setTutorInfo(response.data.data[0].tutor);
        }
      } else {
        setCourses([]);
        setError(response.data?.message || 'No courses found for this tutor.');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      if (err.response?.status === 404) {
        setError(err.response?.data?.error || 'Tutor not found or has no courses.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch courses. Please try again.');
      }
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [tutorname]);

  useEffect(() => {
    fetchCourses();
    // Get user role from token
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          setUserRole(payload.role);
        }
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, [fetchCourses]);

  // Helper function to get status badge info
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending_review': { color: '#ffc107', bgColor: '#fff3cd', text: 'Under Review' },
      'approved': { color: '#28a745', bgColor: '#d4edda', text: 'Approved' },
      'changes_requested': { color: '#ff9800', bgColor: '#ffe0b2', text: 'Changes Needed' },
      'rejected': { color: '#dc3545', bgColor: '#f8d7da', text: 'Rejected' },
      'draft': { color: '#6c757d', bgColor: '#e9ecef', text: 'Draft' },
      'pending': { color: '#ffc107', bgColor: '#fff3cd', text: 'Pending' }, // Legacy support
    };
    return statusMap[status] || { color: '#6c757d', bgColor: '#e9ecef', text: status || 'Unknown' };
  };

  // Check if user is admin (support JWT, secureStorage, and localStorage)
  const isAdmin = () => {
    const role = userRole || secureStorage?.getItem?.('role') || (typeof localStorage !== 'undefined' && (localStorage.getItem('role') || localStorage.getItem('Role')));
    const r = (role || '').toLowerCase();
    return r === 'superadmin' || r === 'admin' || r === 'coursemanagement';
  };

  // Handle admin actions
  const handleOpenActionModal = (type, course, e) => {
    if (e) {
      e.stopPropagation();
    }
    setActionModal({ open: true, type, course });
    setReviewComment('');
    setMessage({ type: '', text: '' });
  };

  const handleCloseActionModal = () => {
    setActionModal({ open: false, type: null, course: null });
    setReviewComment('');
    setMessage({ type: '', text: '' });
  };

  const handleDeleteCourse = async (course, e) => {
    if (e) e.stopPropagation();
    if (!course || !window.confirm(`Are you sure you want to delete "${course.coursename}"? This action cannot be undone.`)) return;
    try {
      const res = await tutorCourseApi.deleteTutorCourse(course._id, true);
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Course deleted successfully' });
        fetchCourses();
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to delete course' });
    }
  };

  const handleAdminAction = async () => {
    const { type, course } = actionModal;
    if (!course) return;

    // Validate required comment for request-changes and reject
    if ((type === 'request-changes' || type === 'reject') && !reviewComment.trim()) {
      setMessage({ type: 'error', text: 'Review comment is required for this action.' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let response;
      switch (type) {
        case 'approve':
          response = await tutorCourseApi.approveTutorCourse(course._id, reviewComment);
          break;
        case 'request-changes':
          response = await tutorCourseApi.requestChanges(course._id, reviewComment);
          break;
        case 'reject':
          response = await tutorCourseApi.rejectTutorCourse(course._id, reviewComment);
          break;
        default:
          throw new Error('Invalid action type');
      }

      if (response.data?.success) {
        setMessage({ type: 'success', text: `Course ${type === 'approve' ? 'approved' : type === 'request-changes' ? 'changes requested' : 'rejected'} successfully!` });
        // Refresh courses list
        setTimeout(() => {
          fetchCourses();
          handleCloseActionModal();
        }, 1000);
      }
    } catch (err) {
      console.error(`Error ${type}ing course:`, err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || `Failed to ${type} course`;
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) : 'N/A';

  const styles = {
    container: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '30px',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    backButton: {
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 'bold',
    },
    title: {
      margin: 0,
      color: '#333',
      fontSize: '28px',
    },
    subtitle: {
      margin: '5px 0 0 0',
      color: '#666',
      fontSize: '14px',
    },
    errorMessage: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '12px',
      borderRadius: '5px',
      marginBottom: '20px',
    },
    loadingMessage: {
      textAlign: 'center',
      padding: '40px',
      color: '#666',
      fontSize: '16px',
    },
    coursesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px',
    },
    courseCard: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      overflow: 'visible',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '220px',
      cursor: 'pointer',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    courseHeader: {
      padding: '16px',
      color: '#fff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      minHeight: '60px',
    },
    courseName: {
      margin: 0,
      fontSize: '16px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '200px',
    },
    courseBody: {
      flex: 1,
      padding: '16px',
    },
    courseInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontSize: '14px',
      color: '#666',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    courseFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      padding: '10px 16px',
      gap: '10px',
      borderTop: '1px solid #eee',
    },
    iconButton: {
      cursor: 'pointer',
      color: '#7f8c8d',
      fontSize: '18px',
    },
    noCourses: {
      textAlign: 'center',
      padding: '40px',
      color: '#999',
      gridColumn: '1 / -1',
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    countBadge: {
      backgroundColor: '#007bff',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      marginLeft: '10px',
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => navigate('/schoolemy/tutor-list')}
        >
          <FaArrowLeft /> Back to Tutors
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={styles.title}>
            Courses by {decodeURIComponent(tutorname)}
            {courses.length > 0 && (
              <span style={styles.countBadge}>{courses.length} {courses.length === 1 ? 'Course' : 'Courses'}</span>
            )}
          </h1>
          {tutorInfo && (
            <p style={styles.subtitle}>
              {tutorInfo.email}
            </p>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={styles.errorMessage}>
          ⚠️ {error}
        </div>
      )}

      {/* Success/Error message for actions */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '8px',
          backgroundColor: message.type === 'error' ? '#f8d7da' : '#d4edda',
          color: message.type === 'error' ? '#721c24' : '#155724',
        }}>
          {message.text}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={styles.loadingMessage}>
          Loading courses...
        </div>
      )}

      {/* Courses Grid */}
      {!loading && !error && (
        <div style={styles.coursesGrid}>
          {courses.length === 0 ? (
            <div style={styles.noCourses}>
              No courses found for {decodeURIComponent(tutorname)}
            </div>
          ) : (
            courses.map((course, index) => (
              <div
                key={course._id}
                style={{ ...styles.courseCard, position: 'relative' }}
                onClick={() => navigate(`/schoolemy/tutor-course-detail/${encodeURIComponent(course.coursename)}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div
                  style={{
                    ...styles.courseHeader,
                    background: getDynamicColor(index),
                    position: 'relative',
                  }}
                >
                  <h3 style={styles.courseName}>
                    {course.coursename}
                  </h3>
                  {isAdmin() && (
                    <div ref={openMenuId === course._id ? menuRef : null} style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 5 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === course._id ? null : course._id);
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.5)',
                          borderRadius: '4px',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="More actions"
                      >
                        <FaEllipsisV size={18} />
                      </button>
                      {openMenuId === course._id && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 10,
                            minWidth: '120px',
                            overflow: 'hidden',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCourse(course, e);
                              setOpenMenuId(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              color: '#dc3545',
                              fontSize: '14px',
                            }}
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={styles.courseBody}>
                  <div style={styles.courseInfo}>
                    {course.category && (
                      <div style={styles.infoItem}>
                        <span>📁 Category:</span>
                        <strong>{course.category}</strong>
                      </div>
                    )}
                    {course.courseduration && (
                      <div style={styles.infoItem}>
                        <span>⏱️ Duration:</span>
                        <strong>{course.courseduration}</strong>
                      </div>
                    )}
                    {course.level && (
                      <div style={styles.infoItem}>
                        <span>📊 Level:</span>
                        <strong>{course.level}</strong>
                      </div>
                    )}
                    {course.language && (
                      <div style={styles.infoItem}>
                        <span>🌐 Language:</span>
                        <strong>{course.language}</strong>
                      </div>
                    )}
                    {course.certificates && (
                      <div style={styles.infoItem}>
                        <span>📜 Certificate:</span>
                        <strong>{course.certificates}</strong>
                      </div>
                    )}
                    {course.status && (() => {
                      const statusBadge = getStatusBadge(course.status);
                      return (
                        <div style={styles.infoItem}>
                          <span>✓ Status:</span>
                          <span style={{
                            color: statusBadge.color,
                            backgroundColor: statusBadge.bgColor,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginLeft: '4px'
                          }}>
                            {statusBadge.text}
                          </span>
                        </div>
                      );
                    })()}
                    {(course.status === 'changes_requested' || course.status === 'rejected') && course.reviewComment && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: course.status === 'rejected' ? '#fee' : '#fff3cd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: course.status === 'rejected' ? '#721c24' : '#856404',
                        border: `1px solid ${course.status === 'rejected' ? '#f5c6cb' : '#ffeaa7'}`,
                      }}>
                        <strong>Admin Feedback:</strong> {course.reviewComment}
                      </div>
                    )}
                    {course.reviewedAt && (
                      <div style={styles.infoItem}>
                        <span>📋 Reviewed:</span>
                        <strong>{formatDate(course.reviewedAt)}</strong>
                        {course.reviewedBy && (
                          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>
                            by {course.reviewedBy.name || course.reviewedBy.email || 'Admin'}
                          </span>
                        )}
                      </div>
                    )}
                    {course.createdAt && (
                      <div style={styles.infoItem}>
                        <span>📅 Created:</span>
                        <strong>{formatDate(course.createdAt)}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.courseFooter}>
                  {isAdmin() && course.status === 'pending_review' && (
                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                      <button
                        onClick={(e) => handleOpenActionModal('approve', course, e)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                        title="Approve Course"
                      >
                        <FaCheck /> Approve
                      </button>
                      <button
                        onClick={(e) => handleOpenActionModal('request-changes', course, e)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          backgroundColor: '#ff9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                        title="Request Changes"
                      >
                        <FaEdit /> Request Changes
                      </button>
                      <button
                        onClick={(e) => handleOpenActionModal('reject', course, e)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                        title="Reject Course"
                      >
                        <FaTimes /> Reject
                      </button>
                    </div>
                  )}
                  {isAdmin() && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course, e);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Delete Course"
                    >
                      <FaTrash /> Delete
                    </button>
                  )}
                  <FaFolderOpen style={styles.iconButton} title="View Details" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Admin Action Modal */}
      {actionModal.open && actionModal.course && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={handleCloseActionModal}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              {actionModal.type === 'approve' && 'Approve Course'}
              {actionModal.type === 'request-changes' && 'Request Changes'}
              {actionModal.type === 'reject' && 'Reject Course'}
            </h3>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              Course: <strong>{actionModal.course.coursename}</strong>
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Review Comment
                {(actionModal.type === 'request-changes' || actionModal.type === 'reject') && (
                  <span style={{ color: 'red' }}> *</span>
                )}
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={
                  actionModal.type === 'approve' 
                    ? 'Optional: Add a comment...' 
                    : 'Required: Please provide feedback...'
                }
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
                required={actionModal.type === 'request-changes' || actionModal.type === 'reject'}
              />
            </div>
            {message.text && (
              <div style={{
                padding: '12px',
                marginBottom: '16px',
                borderRadius: '4px',
                backgroundColor: message.type === 'error' ? '#f8d7da' : '#d4edda',
                color: message.type === 'error' ? '#721c24' : '#155724',
              }}>
                {message.text}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCloseActionModal}
                disabled={actionLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdminAction}
                disabled={actionLoading || ((actionModal.type === 'request-changes' || actionModal.type === 'reject') && !reviewComment.trim())}
                style={{
                  padding: '8px 16px',
                  backgroundColor: actionModal.type === 'approve' ? '#28a745' : actionModal.type === 'request-changes' ? '#ff9800' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (actionLoading || ((actionModal.type === 'request-changes' || actionModal.type === 'reject') && !reviewComment.trim())) ? 'not-allowed' : 'pointer',
                  opacity: (actionLoading || ((actionModal.type === 'request-changes' || actionModal.type === 'reject') && !reviewComment.trim())) ? 0.6 : 1,
                }}
              >
                {actionLoading ? 'Processing...' : (
                  <>
                    {actionModal.type === 'approve' && 'Approve'}
                    {actionModal.type === 'request-changes' && 'Request Changes'}
                    {actionModal.type === 'reject' && 'Reject'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorCoursesView;
