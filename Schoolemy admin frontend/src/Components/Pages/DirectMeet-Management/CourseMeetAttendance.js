import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getMeetById, 
  getMeetAttendance, 
  getUsersForCourse, 
  assignUsersToMeet 
} from "../../../Utils/courseMeetApi";
import { FiArrowLeft, FiUserPlus, FiDownload, FiFilter, FiCalendar } from "react-icons/fi";

const CourseMeetAttendance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meet, setMeet] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meetResult, attendanceResult] = await Promise.all([
        getMeetById(id),
        getMeetAttendance(id, { status: statusFilter }),
      ]);

      if (meetResult.success) {
        setMeet(meetResult.meet);
        console.log('Meet data loaded:', {
          id: meetResult.meet._id,
          title: meetResult.meet.title,
          attendance_days_limit: meetResult.meet.attendance_days_limit
        });
      }
      if (attendanceResult.success) {
        console.log('Attendance data loaded:', {
          participantCount: attendanceResult.participants.length,
          sampleParticipant: attendanceResult.participants[0]
        });
        setParticipants(attendanceResult.participants);
        setStats(attendanceResult.stats);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = async () => {
    try {
      // Ensure course_id is a string, not an object
      let courseId = meet.course_id;
      if (typeof courseId === 'object' && courseId !== null) {
        courseId = courseId._id || courseId.id || courseId.$oid;
      }
      
      if (!courseId || courseId === '[object Object]') {
        console.error("Invalid course_id:", meet.course_id);
        alert("Invalid course ID. Please refresh and try again.");
        return;
      }
      
      console.log("🔍 Fetching users for course:", courseId);
      const result = await getUsersForCourse(courseId);
      if (result.success) {
        setAvailableUsers(result.users);
        setShowAssignModal(true);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAssignUsers = async () => {
    try {
      const result = await assignUsersToMeet(id, selectedUsers);
      if (result.success) {
        alert(`Successfully assigned ${result.assigned_count} users`);
        setShowAssignModal(false);
        setSelectedUsers([]);
        fetchData();
      }
    } catch (error) {
      console.error("Error assigning users:", error);
      alert("Failed to assign users");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "not_joined": return "#94a3b8";
      case "joined": return "#3b82f6";
      case "completed": return "#10b981";
      case "absent": return "#ef4444";
      default: return "#64748b";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "not_joined": return "Not Joined";
      case "joined": return "Joined";
      case "completed": return "Completed";
      case "absent": return "Absent";
      default: return status;
    }
  };

  const exportToCSV = () => {
    const headers = ["Username", "Email", "Mobile", "Student ID", "Attendance Progress", "Status", "Payment Status", "Joined At"];
    const rows = participants.map(p => {
      const attendedDays = parseInt(p.total_attendance_days) || 0;
      const requiredDays = parseInt(meet?.attendance_days_limit) || 7;
      return [
        p.user_id && typeof p.user_id === 'object' && (p.user_id.username || p.user_id.studentRegisterNumber) ? (p.user_id.username || p.user_id.studentRegisterNumber) : "Name not available",
        p.user_id && typeof p.user_id === 'object' && p.user_id.email ? p.user_id.email : "Email not available",
        p.user_id && typeof p.user_id === 'object' && p.user_id.mobile ? p.user_id.mobile : "Mobile not available",
        p.user_id && typeof p.user_id === 'object' && p.user_id.studentRegisterNumber ? p.user_id.studentRegisterNumber : "ID not available",
        `${attendedDays}/${requiredDays}`,
        getStatusLabel(p.attendance_status),
        p.payment_status,
        p.joined_at ? new Date(p.joined_at).toLocaleString() : "Not joined",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${meet?.meet_id}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading attendance...</p>
      </div>
    );
  }

  if (!meet) {
    return <div style={styles.error}>Meet not found</div>;
  }

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <div style={styles.backButtonContainer}>
        <button onClick={() => navigate("/schoolemy/course-meets")} style={styles.backButton}>
          <FiArrowLeft /> Back to Course Meets
        </button>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <h1 style={styles.title}>{meet.title}</h1>
          <p style={styles.subtitle}>{meet.course_name} - Attendance</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={openAssignModal} style={styles.assignButton}>
            <FiUserPlus /> Assign Users
          </button>
          <button onClick={exportToCSV} style={styles.exportButton}>
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.total || 0}</div>
          <div style={styles.statLabel}>Total Assigned</div>
        </div>
        <div style={{...styles.statCard, ...styles.statCardJoined}}>
          <div style={styles.statValue}>{stats.joined || 0}</div>
          <div style={styles.statLabel}>Joined</div>
        </div>
        <div style={{...styles.statCard, ...styles.statCardCompleted}}>
          <div style={styles.statValue}>{stats.completed || 0}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>
        <div style={{...styles.statCard, ...styles.statCardAbsent}}>
          <div style={styles.statValue}>{stats.absent || 0}</div>
          <div style={styles.statLabel}>Absent</div>
        </div>
      </div>

      {/* Filter */}
      <div style={styles.filterBar}>
        <FiFilter style={styles.filterIcon} />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="not_joined">Not Joined</option>
          <option value="joined">Joined</option>
          <option value="completed">Completed</option>
          <option value="absent">Absent</option>
        </select>
      </div>

      {/* Participants Table */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Mobile</th>
              <th style={styles.th}>Attendance Progress</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.emptyRow}>
                  No participants found
                </td>
              </tr>
            ) : (
              participants.map((participant) => {
                const attendedDays = parseInt(participant.total_attendance_days) || 0;
                const requiredDays = parseInt(meet?.attendance_days_limit) || parseInt(participant.meet_id?.attendance_days_limit) || 7;
                const isComplete = attendedDays >= requiredDays || participant.attendance_status === 'completed';
                
                return (
                <tr key={participant._id} style={styles.tr}>
                  <td style={styles.td}>
                    {participant.user_id && typeof participant.user_id === 'object' && (participant.user_id.username || participant.user_id.studentRegisterNumber)
                      ? (participant.user_id.username || participant.user_id.studentRegisterNumber)
                      : participant.user_id && typeof participant.user_id === 'string'
                          ? `User: ${participant.user_id.slice(-8)}`
                          : "Name not available"}
                  </td>
                  <td style={styles.td}>
                    {participant.user_id && typeof participant.user_id === 'object' && participant.user_id.email
                      ? participant.user_id.email
                      : "Email not available"}
                  </td>
                  <td style={styles.td}>
                    {participant.user_id && typeof participant.user_id === 'object' && participant.user_id.mobile
                      ? participant.user_id.mobile
                      : "Mobile not available"}
                  </td>
                  <td style={styles.td}>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                      <span style={{fontSize: '0.875rem', fontWeight: 600, color: isComplete ? '#16a34a' : '#667eea'}}>
                        {attendedDays} / {requiredDays}
                      </span>
                      <div style={{width: '60px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden'}}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (attendedDays / requiredDays) * 100)}%`,
                          background: isComplete ? '#16a34a' : '#667eea',
                          borderRadius: '2px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: getStatusColor(participant.attendance_status),
                      }}
                    >
                      {getStatusLabel(participant.attendance_status)}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.paymentBadge,
                        background: participant.payment_status === "completed" ? "#10b981" : "#f59e0b",
                      }}
                    >
                      {participant.payment_status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {isComplete ? (
                      <span style={{
                        display: "inline-block",
                        padding: "0.5rem 1rem",
                        background: "#dcfce7",
                        color: "#166534",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        borderRadius: "6px"
                      }}>
                        Attendance Complete
                      </span>
                    ) : participant.user_id && typeof participant.user_id === 'object' && participant.user_id._id ? (
                      <button
                        onClick={() => {
                          // Navigate to detailed attendance page
                          navigate(`/schoolemy/course-meets/${id}/attendance`);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.5rem 1rem",
                          background: "#667eea",
                          border: "none",
                          borderRadius: "6px",
                          color: "white",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Mark Attendance
                      </button>
                    ) : (
                      <span style={{
                        display: "inline-block",
                        padding: "0.5rem 1rem",
                        background: "#f1f5f9",
                        color: "#64748b",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        borderRadius: "6px"
                      }}>
                        User data not available
                      </span>
                    )}
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Users Modal */}
      {showAssignModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Assign Users to Meet</h3>
            <p style={styles.modalText}>
              Select users who have purchased this course
            </p>
            
            <div style={styles.userList}>
              {availableUsers.map((user) => (
                <label key={user._id} style={styles.userItem}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user._id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                      }
                    }}
                    style={styles.checkbox}
                  />
                  <div>
                    <div style={styles.userName}>{user.username || user.studentRegisterNumber || user.name || "Unknown User"}</div>
                    <div style={styles.userEmail}>{user.email}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUsers([]);
                }}
                style={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignUsers}
                style={styles.modalAssignButton}
                disabled={selectedUsers.length === 0}
              >
                Assign {selectedUsers.length} User(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "2rem 1rem",
  },
  backButtonContainer: {
    maxWidth: "1400px",
    margin: "0 auto 1rem",
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
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  header: {
    maxWidth: "1400px",
    margin: "0 auto 2rem",
  },
  headerInfo: {
    marginBottom: "1rem",
  },
  title: {
    fontSize: "2rem",
    color: "#1e293b",
    marginBottom: "0.25rem",
  },
  subtitle: {
    color: "#64748b",
  },
  headerActions: {
    display: "flex",
    gap: "1rem",
  },
  assignButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  exportButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    fontWeight: 600,
    cursor: "pointer",
  },
  statsGrid: {
    maxWidth: "1400px",
    margin: "0 auto 2rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  statCard: {
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  statCardJoined: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
  },
  statCardCompleted: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
  },
  statCardAbsent: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "white",
  },
  statValue: {
    fontSize: "2.5rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  statLabel: {
    fontSize: "0.875rem",
    opacity: 0.9,
  },
  filterBar: {
    maxWidth: "1400px",
    margin: "0 auto 1rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  filterIcon: {
    fontSize: "1.25rem",
    color: "#64748b",
  },
  filterSelect: {
    padding: "0.75rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
  },
  tableCard: {
    maxWidth: "1400px",
    margin: "0 auto",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "1rem",
    textAlign: "left",
    borderBottom: "2px solid #e2e8f0",
    color: "#1e293b",
    fontWeight: 600,
    fontSize: "0.875rem",
    textTransform: "uppercase",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "1rem",
    color: "#64748b",
  },
  emptyRow: {
    padding: "3rem",
    textAlign: "center",
    color: "#94a3b8",
  },
  statusBadge: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  paymentBadge: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize",
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
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    maxWidth: "600px",
    width: "90%",
    maxHeight: "80vh",
    overflow: "auto",
  },
  modalTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  modalText: {
    color: "#64748b",
    marginBottom: "1.5rem",
  },
  userList: {
    maxHeight: "400px",
    overflow: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "0.5rem",
    marginBottom: "1.5rem",
  },
  userItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    cursor: "pointer",
    borderRadius: "6px",
    transition: "background 0.2s",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  userName: {
    fontWeight: 600,
    color: "#1e293b",
  },
  userEmail: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  modalActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  },
  modalCancelButton: {
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "pointer",
  },
  modalAssignButton: {
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default CourseMeetAttendance;
