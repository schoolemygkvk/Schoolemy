import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  getUserMeetById, 
  joinMeet, 
  validateJoinAccess 
} from "../../service/userCourseMeetApi";
import { createMeetPaymentOrder, verifyMeetPayment } from "../../service/meetPaymentApi";
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiClock, 
  FiVideo, 
  FiMapPin,
  FiUser,
  FiFileText,
  FiCheckCircle,
  FiExternalLink,
  FiAlertCircle,
  FiDownload,
  FiList
} from "react-icons/fi";

const UserMeetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [meet, setMeet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [validation, setValidation] = useState(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [attendedDays, setAttendedDays] = useState([]);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchMeetDetails();
    checkJoinValidation();
    
    // Show success message if redirected from payment
    if (location.state?.paymentCompleted) {
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 5000);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [id]);

  useEffect(() => {
    // Fetch materials if user has joined the meet
    if (meet && (meet.participation_status === 'joined' || meet.participation_status === 'completed')) {
      fetchMeetMaterials();
    }
  }, [meet]);

  const fetchMeetMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const { getMeetMaterials } = await import('../../service/userCourseMeetApi');
      const result = await getMeetMaterials(id, userId);
      if (result.success) {
        setMaterials(result.materials || []);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const fetchMeetDetails = async () => {
    try {
      setLoading(true);
      const result = await getUserMeetById(userId, id);
      if (result.success) {
        setMeet(result.meet);
        // Extract attendance dates if available
        if (result.meet.attendance_dates && Array.isArray(result.meet.attendance_dates)) {
          setAttendedDays(result.meet.attendance_dates);
        }
        console.log("📋 Meet Details:", {
          title: result.meet.title,
          scheduled_date: result.meet.scheduled_date,
          meet_date: result.meet.meet_date,
          duration: result.meet.duration,
          price: result.meet.price,
          is_paid_meet: result.meet.is_paid_meet,
          payment_status: result.meet.payment_status,
          attendance_days: result.meet.attendance_dates?.length || 0
        });
        console.log("💰 Full Meet Object:", result.meet);
      }
    } catch (error) {
      console.error("Error fetching meet details:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkJoinValidation = async () => {
    try {
      const result = await validateJoinAccess(id, userId);
      setValidation(result);
    } catch (error) {
      console.error("Error validating access:", error);
    }
  };

  const handleJoinMeet = async () => {
    try {
      // Check if payment is required
      if (meet.is_paid_meet && meet.payment_status !== 'completed') {
        // Calculate GST + transaction fee on meet price for display
        const baseAmount = Math.round(meet.price);
        const cgst = Math.round(baseAmount * 0.09);
        const sgst = Math.round(baseAmount * 0.09);
        const gstTotal = cgst + sgst;
        const transactionFee = Math.round((baseAmount + gstTotal) * 0.02);
        const finalAmount = baseAmount + gstTotal + transactionFee;

        const confirmPayment = window.confirm(
          `Payment of ₹${finalAmount.toLocaleString(
            "en-IN",
          )} (including 18% GST and 2% transaction fee) is required to join this meet. Do you want to proceed with payment?`,
        );
        
        if (!confirmPayment) return;
        
        setJoining(true);
        
        try {
          console.log('\ud83d\udcb3 Initiating payment for meet:', id);
          
          // Create Cashfree payment order
          const paymentResult = await createMeetPaymentOrder(id, userId, {
            customer_name: localStorage.getItem('userName') || 'Guest',
            customer_email: localStorage.getItem('userEmail') || null,
            customer_phone: localStorage.getItem('userPhone') || null
          });

          console.log('\ud83c\udf89 Payment order created:', paymentResult);

          if (paymentResult.success) {            // Store order_id in localStorage for callback verification
            localStorage.setItem('pending_payment_order', paymentResult.order.order_id);
            localStorage.setItem('pending_payment_meet', id);
            
            console.log('💾 Stored order_id for callback:', paymentResult.order.order_id);
                        // Load Cashfree SDK
            const script = document.createElement('script');
            script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
            script.async = true;
            document.body.appendChild(script);

            script.onload = () => {
              const cashfree = window.Cashfree({
                mode: paymentResult.order.cashfree_env === 'PRODUCTION' ? 'production' : 'sandbox'
              });

              const checkoutOptions = {
                paymentSessionId: paymentResult.order.payment_session_id,
                returnUrl: `${window.location.origin}/user/meets/${id}/payment-callback`,
                redirectTarget: '_self'
              };

              cashfree.checkout(checkoutOptions).then(() => {
                console.log('Payment initiated');
              });
            };
          }
        } catch (paymentError) {
          console.error('\u274c Payment error:', paymentError);
          console.error('\u274c Error response:', paymentError.response?.data);
          console.error('\u274c Error status:', paymentError.response?.status);
          
          const errorMsg = paymentError.response?.data?.message || 'Failed to initiate payment';
          alert(`Payment Error: ${errorMsg}\n\nPlease check console for details.`);
        } finally {
          setJoining(false);
        }
      } else {
        // Free meet - join directly
        setJoining(true);
        const result = await joinMeet(id, userId);
        
        if (result.success) {
          alert('Successfully joined the meet!');
          if (meet.meet_type === 'online' && result.meet_link) {
            window.open(result.meet_link, '_blank');
          }
          fetchMeetDetails();
          checkJoinValidation();
        }
        setJoining(false);
      }
    } catch (error) {
      console.error("Error joining meet:", error);
      const errorData = error.response?.data;
      
      if (errorData?.payment_required) {
        alert(`Payment of ₹${errorData.payment_amount} is required to join this meet.`);
      } else if (errorData?.days_since_join !== undefined && errorData?.attendance_days_limit) {
        alert(`Attendance period expired. You can only attend within ${errorData.attendance_days_limit} days from first join.`);
      } else {
        alert(errorData?.message || "Failed to join meet");
      }
    } finally {
      setJoining(false);
    }
  };

  const getJoinButtonState = () => {
    if (!validation) return { disabled: true, text: "Validating...", reason: "" };
    
    if (!validation.canJoin) {
      const reasons = {
        "meet_not_found": "Meet not found",
        "meet_completed": "This meet has ended",
        "meet_cancelled": "This meet was cancelled",
        "too_early": validation.message || "Join window not open yet",
        "meet_ended": "This meet has ended",
        "course_not_purchased": "Purchase the course to join",
        "capacity_full": "Meet is at full capacity",
        "user_not_found": "User not found"
      };
      
      return {
        disabled: true,
        text: "Cannot Join",
        reason: reasons[validation.reason] || validation.message
      };
    }

    if (validation.already_joined) {
      return {
        disabled: false,
        text: meet.meet_type === 'online' ? "Open Meet Link" : "View Location",
        reason: ""
      };
    }

    return { disabled: false, text: "Join Meet", reason: "" };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMeetTime = (meet) => {
    // If meet_time is directly available, use it
    if (meet.meet_time) {
      // If there's also an end_time, show range
      if (meet.end_time) {
        return `${meet.meet_time} - ${meet.end_time}`;
      }
      // If only meet_time and duration, calculate end time
      if (meet.duration || meet.duration_minutes) {
        const [hours, minutes] = meet.meet_time.split(':').map(Number);
        const duration = meet.duration || meet.duration_minutes || 0;
        const totalMinutes = hours * 60 + minutes + duration;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
        return `${meet.meet_time} - ${endTime}`;
      }
      // Just return meet_time if no duration
      return meet.meet_time;
    }
    
    // Fallback to calculating from scheduled_date
    const startDate = new Date(meet.scheduled_date || meet.meet_date);
    const duration = meet.duration || meet.duration_minutes || 0;
    const endDate = new Date(startDate.getTime() + duration * 60000);
    
    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${startTime} - ${endTime}`;
  };

  const handleDownload = async (material) => {
    try {
      // Fetch the file as a blob
      const response = await fetch(material.download_url);
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = material.file_name || 'download';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(material.download_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading meet details...</p>
      </div>
    );
  }

  if (!meet) {
    return <div style={styles.error}>Meet not found</div>;
  }

  return (
    <div style={styles.container}>
      {showPaymentSuccess && (
        <div style={styles.successBanner}>
          <FiCheckCircle style={{ marginRight: '10px' }} />
          Payment successful! You can now join the meet.
        </div>
      )}
      {/* Back Button */}
      <button onClick={() => navigate('/user/meets')} style={styles.backButton}>
        <FiArrowLeft /> Back to Meets
      </button>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Header Card */}
        <div style={styles.headerCard}>
          <div style={styles.headerTop}>
            <div>
              <span style={styles.courseCategory}>
                {meet.course_id?.category}
              </span>
              <h1 style={styles.title}>{meet.title}</h1>
              <p style={styles.courseName}>{meet.course_id?.coursename}</p>
            </div>
            <div style={styles.statusContainer}>
              <span style={{
                ...styles.statusBadge,
                background: meet.participation_status === 'completed' ? '#10b981' :
                           meet.participation_status === 'joined' ? '#3b82f6' : '#94a3b8'
              }}>
                {meet.participation_status === 'not_joined' ? 'Not Joined' :
                 meet.participation_status === 'joined' ? 'In Progress' : 'Completed'}
              </span>
            </div>
          </div>

          {/* Info Grid */}
          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <FiCalendar style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Date</div>
                <div style={styles.infoValue}>
                  {(meet.scheduled_date || meet.meet_date) 
                    ? formatDate(meet.scheduled_date || meet.meet_date) 
                    : 'Not scheduled'}
                </div>
              </div>
            </div>

            <div style={styles.infoCard}>
              <FiClock style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Time</div>
                <div style={styles.infoValue}>
                  {(meet.scheduled_date || meet.meet_date) 
                    ? formatMeetTime(meet) 
                    : 'Not scheduled'}
                </div>
              </div>
            </div>

            <div style={styles.infoCard}>
              <FiClock style={styles.infoIcon} />
              <div>
                <div style={styles.infoLabel}>Duration</div>
                <div style={styles.infoValue}>
                  {(meet.duration || meet.duration_minutes) 
                    ? `${meet.duration || meet.duration_minutes} mins` 
                    : 'Not set'}
                </div>
              </div>
            </div>

            <div style={styles.infoCard}>
              {meet.meet_type === 'online' ? (
                <>
                  <FiVideo style={styles.infoIcon} />
                  <div>
                    <div style={styles.infoLabel}>Type</div>
                    <div style={styles.infoValue}>Online</div>
                  </div>
                </>
              ) : (
                <>
                  <FiMapPin style={styles.infoIcon} />
                  <div>
                    <div style={styles.infoLabel}>Location</div>
                    <div style={styles.infoValue}>{meet.location}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {meet.description && (
            <div style={styles.descriptionSection}>
              <h3 style={styles.sectionTitle}>
                <FiFileText /> Description
              </h3>
              <p style={styles.description}>{meet.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.actions}>
            {meet.participation_status === 'not_joined' && meet.payment_status !== 'completed' && (
              <>
                {validation && !validation.canJoin && validation.reason && (
                  <div style={styles.warningBox}>
                    <FiAlertCircle style={styles.warningIcon} />
                    <div>
                      <div style={styles.warningTitle}>Cannot Join Yet</div>
                      <div style={styles.warningMessage}>{getJoinButtonState().reason}</div>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleJoinMeet}
                  disabled={joining || getJoinButtonState().disabled}
                  style={{
                    ...styles.joinButton,
                    ...(joining && styles.joiningButton),
                    ...((getJoinButtonState().disabled || joining) && styles.disabledButton)
                  }}
                >
                  {joining ? (
                    <>
                      <div style={styles.smallSpinner} />
                      Joining...
                    </>
                  ) : (
                    <>
                      {meet.meet_type === 'online' ? <FiExternalLink /> : <FiMapPin />}
                      {getJoinButtonState().text}
                    </>
                  )}
                </button>
              </>
            )}

            {meet.participation_status === 'not_joined' && meet.payment_status === 'completed' && (
              <>
                <div style={styles.successBox}>
                  <FiCheckCircle style={styles.successIcon} />
                  <div>
                    <div style={styles.successTitle}>Payment Completed</div>
                    <div style={styles.successMessage}>Click the button below to join the meet</div>
                  </div>
                </div>
                <button
                  onClick={handleJoinMeet}
                  disabled={joining || getJoinButtonState().disabled}
                  style={{
                    ...styles.joinButton,
                    ...(joining && styles.joiningButton),
                    ...((getJoinButtonState().disabled || joining) && styles.disabledButton)
                  }}
                >
                  {joining ? (
                    <>
                      <div style={styles.smallSpinner} />
                      Joining...
                    </>
                  ) : (
                    <>
                      {meet.meet_type === 'online' ? <FiExternalLink /> : <FiMapPin />}
                      Join Meet Now
                    </>
                  )}
                </button>
              </>
            )}

            {meet.participation_status === 'joined' && (
              <>
                {meet.meet_type === 'online' && validation?.meet_link && (
                  <button
                    onClick={() => window.open(validation.meet_link, '_blank')}
                    style={styles.openLinkButton}
                  >
                    <FiExternalLink /> Open Meet Link
                  </button>
                )}
                {meet.meet_type === 'offline' && validation?.location && (
                  <div style={styles.locationBox}>
                    <FiMapPin style={styles.locationIcon} />
                    <div>
                      <div style={styles.locationLabel}>Meeting Location</div>
                      <div style={styles.locationText}>{validation.location}</div>
                    </div>
                  </div>
                )}
                <div style={styles.infoMessage}>
                  <FiCheckCircle style={styles.infoIcon} />
                  <span>Meet will be auto-completed based on your attendance</span>
                </div>
              </>
            )}

            {meet.participation_status === 'completed' && (
              <div style={styles.completedBox}>
                <FiCheckCircle style={styles.completedIcon} />
                <div>
                  <div style={styles.completedTitle}>Meet Completed</div>
                  <div style={styles.completedMessage}>
                    You completed this meet on {formatDate(meet.completed_at)}
                  </div>
                  {meet.recording_url && (
                    <button
                      onClick={() => window.open(meet.recording_url, '_blank')}
                      style={styles.recordingButton}
                    >
                      <FiVideo /> View Recording
                    </button>
                  )}
                </div>
              </div>
            )}

            {meet.participation_status === 'completed' && (
              <div style={styles.completedMessage}>
                <FiCheckCircle style={styles.completedIcon} />
                <span>You have completed this meet</span>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Days Section */}
        {(meet.participation_status === 'joined' || meet.participation_status === 'completed') && attendedDays.length > 0 && (
          <div style={styles.attendanceCard}>
            <h3 style={styles.sectionTitle}>
              <FiList /> My Attendance
            </h3>
            <div style={styles.attendanceStats}>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{attendedDays.length}</div>
                <div style={styles.statLabel}>Days Attended</div>
              </div>
              {meet.attendance_days_limit && (
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{meet.attendance_days_limit}</div>
                  <div style={styles.statLabel}>Total Days</div>
                </div>
              )}
            </div>
            <div style={styles.attendanceList}>
              {attendedDays.map((attendance, index) => (
                <div key={index} style={styles.attendanceItem}>
                  <div style={styles.attendanceIcon}>
                    <FiCalendar />
                  </div>
                  <div style={styles.attendanceInfo}>
                    <div style={styles.attendanceDate}>
                      {formatDate(attendance.date)}
                    </div>
                    {attendance.check_in_time && (
                      <div style={styles.attendanceTime}>
                        Check-in: {formatTime(attendance.check_in_time)}
                        {attendance.check_out_time && (
                          <> • Check-out: {formatTime(attendance.check_out_time)}</>
                        )}
                      </div>
                    )}
                    {attendance.duration_minutes && (
                      <div style={styles.attendanceDuration}>
                        Duration: {attendance.duration_minutes} minutes
                      </div>
                    )}
                  </div>
                  <div style={{
                    ...styles.attendanceStatus,
                    ...(attendance.status === 'present' && styles.statusPresent),
                    ...(attendance.status === 'late' && styles.statusLate),
                    ...(attendance.status === 'absent' && styles.statusAbsent)
                  }}>
                    {attendance.status || 'present'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Materials Section */}
        {(meet.participation_status === 'joined' || meet.participation_status === 'completed') && (
          <div style={styles.materialsCard}>
            <h3 style={styles.sectionTitle}>
              <FiFileText /> Study Materials
            </h3>
            
            {loadingMaterials ? (
              <p style={styles.materialsText}>Loading materials...</p>
            ) : materials.length > 0 ? (
              <div style={styles.materialsList}>
                {materials.map((material) => (
                  <div key={material.id} style={styles.materialItem}>
                    <div style={styles.materialInfo}>
                      <FiFileText style={styles.materialIcon} />
                      <div>
                        <h4 style={styles.materialTitle}>{material.title}</h4>
                        {material.description && (
                          <p style={styles.materialDesc}>{material.description}</p>
                        )}
                        <div style={styles.materialMeta}>
                          <span>{material.file_name}</span>
                          {material.file_size && (
                            <>
                              <span> • </span>
                              <span>{(material.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {material.download_url && (
                      <div style={styles.materialActions}>
                        <a
                          href={material.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.viewButton}
                          title="View Material"
                        >
                          <FiFileText /> View
                        </a>
                        <button
                          onClick={() => handleDownload(material)}
                          style={styles.downloadButton}
                          title="Download"
                        >
                          <FiDownload /> Download
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.materialsText}>
                No materials uploaded yet for this meet.
              </p>
            )}
            
            {meet.attendance_days_limit && (
              <p style={styles.materialsHint}>
                Materials accessible for {meet.attendance_days_limit} days from first attendance.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "2rem 1rem",
    position: "relative"
  },
  successBanner: {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    backgroundColor: "#10b981",
    color: "white",
    padding: "1rem 2rem",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    fontSize: "1rem",
    fontWeight: 600,
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "pointer",
    marginBottom: "2rem",
    fontWeight: 600,
  },
  content: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  headerCard: {
    background: "white",
    borderRadius: "12px",
    padding: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "1.5rem",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
  },
  courseCategory: {
    fontSize: "0.875rem",
    color: "#667eea",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  title: {
    fontSize: "2rem",
    color: "#1e293b",
    margin: "0.5rem 0",
    fontWeight: 700,
  },
  courseName: {
    color: "#64748b",
    fontSize: "1.125rem",
  },
  statusContainer: {
    marginLeft: "1rem",
  },
  statusBadge: {
    padding: "0.5rem 1rem",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.875rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  infoCard: {
    display: "flex",
    gap: "1rem",
    padding: "1rem",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  infoIcon: {
    fontSize: "1.5rem",
    color: "#667eea",
    marginTop: "0.25rem",
  },
  infoLabel: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "0.25rem",
  },
  infoValue: {
    fontSize: "1rem",
    color: "#1e293b",
    fontWeight: 600,
  },
  descriptionSection: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "1.25rem",
    color: "#1e293b",
    marginBottom: "1rem",
    fontWeight: 600,
  },
  description: {
    color: "#64748b",
    lineHeight: "1.6",
  },
  instructorSection: {
    display: "flex",
    gap: "1rem",
    padding: "1rem",
    background: "#f8fafc",
    borderRadius: "8px",
    marginBottom: "2rem",
  },
  sectionIcon: {
    fontSize: "1.5rem",
    color: "#667eea",
    marginTop: "0.25rem",
  },
  instructorLabel: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "0.25rem",
  },
  instructorName: {
    fontSize: "1rem",
    color: "#1e293b",
    fontWeight: 600,
  },
  instructorEmail: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  actions: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  joinButton: {
    flex: "1",
    minWidth: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "1rem 2rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
  },
  joiningButton: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  openLinkButton: {
    flex: "1",
    minWidth: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "1rem 2rem",
    background: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  infoMessage: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "1rem 2rem",
    background: "#eff6ff",
    borderRadius: "8px",
    color: "#1e40af",
    fontWeight: 500,
    border: "1px solid #3b82f6",
  },
  infoIcon: {
    fontSize: "1.25rem",
    color: "#3b82f6",
  },
  completedMessage: {
    flex: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "1rem 2rem",
    background: "#dcfce7",
    borderRadius: "8px",
    color: "#16a34a",
    fontWeight: 600,
  },
  completedIcon: {
    fontSize: "1.5rem",
  },
  smallSpinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  warningBox: {
    width: "100%",
    display: "flex",
    gap: "1rem",
    padding: "1rem",
    background: "#fef3c7",
    borderRadius: "8px",
    border: "1px solid #fbbf24",
  },
  warningIcon: {
    fontSize: "1.5rem",
    color: "#f59e0b",
    flexShrink: 0,
  },
  warningTitle: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#92400e",
    marginBottom: "0.25rem",
  },
  warningMessage: {
    fontSize: "0.875rem",
    color: "#78350f",
  },
  successBox: {
    width: "100%",
    display: "flex",
    gap: "1rem",
    padding: "1rem",
    background: "#dcfce7",
    borderRadius: "8px",
    border: "1px solid #10b981",
  },
  successIcon: {
    fontSize: "1.5rem",
    color: "#10b981",
    flexShrink: 0,
  },
  successTitle: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#166534",
    marginBottom: "0.25rem",
  },
  successMessage: {
    fontSize: "0.875rem",
    color: "#15803d",
  },
  locationBox: {
    width: "100%",
    display: "flex",
    gap: "1rem",
    padding: "1rem",
    background: "#eff6ff",
    borderRadius: "8px",
    border: "1px solid #3b82f6",
  },
  locationIcon: {
    fontSize: "1.5rem",
    color: "#3b82f6",
    flexShrink: 0,
  },
  locationLabel: {
    fontSize: "0.75rem",
    color: "#1e40af",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "0.25rem",
  },
  locationText: {
    fontSize: "1rem",
    color: "#1e40af",
    fontWeight: "600",
  },
  completedBox: {
    width: "100%",
    display: "flex",
    gap: "1rem",
    padding: "1.5rem",
    background: "#dcfce7",
    borderRadius: "8px",
    border: "1px solid #10b981",
  },
  completedIcon: {
    fontSize: "2rem",
    color: "#10b981",
    flexShrink: 0,
  },
  completedTitle: {
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#166534",
    marginBottom: "0.5rem",
  },
  completedMessage: {
    fontSize: "0.875rem",
    color: "#15803d",
    marginBottom: "1rem",
  },
  recordingButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "#10b981",
    border: "none",
    borderRadius: "6px",
    color: "white",
    fontWeight: "600",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  materialsCard: {
    background: "white",
    borderRadius: "12px",
    padding: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginTop: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  materialsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginTop: "1rem",
  },
  materialItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s ease",
  },
  materialInfo: {
    display: "flex",
    gap: "1rem",
    flex: 1,
  },
  materialIcon: {
    fontSize: "1.5rem",
    color: "#667eea",
    flexShrink: 0,
  },
  materialContent: {
    flex: 1,
  },
  materialTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "0.25rem",
  },
  materialDesc: {
    fontSize: "0.875rem",
    color: "#64748b",
    marginBottom: "0.5rem",
  },
  materialMeta: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  materialActions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    minWidth: "120px",
  },
  viewButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "0.875rem",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.2s ease",
  },
  downloadButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "0.875rem",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.2s ease",
  },
  materialsHint: {
    marginTop: "1rem",
    padding: "0.75rem",
    background: "#fef3c7",
    borderRadius: "6px",
    fontSize: "0.875rem",
    color: "#92400e",
    fontStyle: "italic",
  },
  materialsText: {
    color: "#64748b",
    marginBottom: "1rem",
  },
  materialsButton: {
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  attendanceCard: {
    background: "white",
    borderRadius: "12px",
    padding: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginTop: "1.5rem",
  },
  attendanceStats: {
    display: "flex",
    gap: "2rem",
    marginBottom: "1.5rem",
    padding: "1rem",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  statItem: {
    textAlign: "center",
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#667eea",
    marginBottom: "0.25rem",
  },
  statLabel: {
    fontSize: "0.875rem",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  attendanceList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  attendanceItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  attendanceIcon: {
    fontSize: "1.5rem",
    color: "#667eea",
    flexShrink: 0,
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceDate: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "0.25rem",
  },
  attendanceTime: {
    fontSize: "0.875rem",
    color: "#64748b",
    marginBottom: "0.25rem",
  },
  attendanceDuration: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  attendanceStatus: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statusPresent: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusLate: {
    background: "#fef3c7",
    color: "#92400e",
  },
  statusAbsent: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },
  error: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ef4444",
    fontSize: "1.5rem",
  },
};

export default UserMeetDetails;