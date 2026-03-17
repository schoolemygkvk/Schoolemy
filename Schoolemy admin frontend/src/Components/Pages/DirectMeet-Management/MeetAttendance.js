import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";
import { markDailyAttendance as markDailyAttendanceApi } from "../../../Utils/courseMeetApi";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUsers,
  FiFilter,
  FiDownload,
  FiSearch,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiX,
} from "react-icons/fi";

const MeetAttendance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meet, setMeet] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [updating, setUpdating] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState("present");
  const [expandedParticipants, setExpandedParticipants] = useState(new Set());
  const itemsPerPage = 20;

  useEffect(() => {
    fetchAttendance();
  }, [id]);

  useEffect(() => {
    applyFilters();
  }, [participants, statusFilter, searchTerm]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch meet details
      const meetResponse = await axios.get(`/api/course-meets/meets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (meetResponse.data.success) {
        setMeet(meetResponse.data.meet);
      }

      // Fetch attendance
      const attendanceResponse = await axios.get(`/api/course-meets/attendance/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (attendanceResponse.data.success) {
        setParticipants(attendanceResponse.data.participants);
        setStats(attendanceResponse.data.stats);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      alert("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...participants];

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((p) => p.attendance_status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.user_id?.username?.toLowerCase().includes(search) ||
          p.user_id?.studentRegisterNumber?.toLowerCase().includes(search) ||
          p.user_id?.email?.toLowerCase().includes(search) ||
          p.user_id?.mobile?.toString().includes(search)
      );
    }

    setFilteredParticipants(filtered);
    setCurrentPage(1);
  };

  const openAttendanceModal = (participant) => {
    setSelectedParticipant(participant);
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setAttendanceStatus('present');
    setShowAttendanceModal(true);
  };

  const closeAttendanceModal = () => {
    setShowAttendanceModal(false);
    setSelectedParticipant(null);
    setAttendanceDate("");
    setAttendanceStatus("present");
  };

  const handleMarkDailyAttendance = async () => {
    if (!attendanceDate || !selectedParticipant) {
      alert("Please select a date");
      return;
    }

    try {
      setUpdating(true);
      const result = await markDailyAttendanceApi(
        id,
        selectedParticipant.user_id._id,
        attendanceDate,
        attendanceStatus
      );

      if (result.success) {
        alert("Attendance marked successfully");
        closeAttendanceModal();
        fetchAttendance();
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert(error.response?.data?.message || "Failed to mark attendance");
    } finally {
      setUpdating(false);
    }
  };

  const toggleParticipantExpand = (participantId) => {
    const newExpanded = new Set(expandedParticipants);
    if (newExpanded.has(participantId)) {
      newExpanded.delete(participantId);
    } else {
      newExpanded.add(participantId);
    }
    setExpandedParticipants(newExpanded);
  };

  const markAttendance = async (participantId, userId, status) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("token");

      // Call the markUserJoin endpoint to update attendance
      const response = await axios.post(
        "/api/course-meets/join",
        {
          meet_id: id,
          user_id: userId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Refresh attendance data
        await fetchAttendance();
        alert("Attendance marked successfully!");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert(error.response?.data?.message || "Failed to mark attendance");
    } finally {
      setUpdating(false);
    }
  };

  const exportAttendance = () => {
    // Create CSV content
    const csvContent = [
      ["Name", "Email", "Mobile", "Student ID", "Status", "Joined At", "Payment Status"].join(","),
      ...filteredParticipants.map((p) =>
        [
          p.user_id?.username || p.user_id?.studentRegisterNumber || "",
          p.user_id?.email || "",
          p.user_id?.mobile || "",
          p.user_id?.studentRegisterNumber || "",
          p.attendance_status,
          p.joined_at ? new Date(p.joined_at).toLocaleString() : "Not joined",
          p.payment_status,
        ].join(",")
      ),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${meet?.meet_id || "export"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "joined":
        return "#10b981";
      case "completed":
        return "#3b82f6";
      case "absent":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParticipants = filteredParticipants.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate("/schoolemy/course-meets")} style={styles.backButton}>
          <FiArrowLeft /> Back
        </button>
        <h1 style={styles.title}>Meet Attendance</h1>
      </div>

      {/* Meet Info Card */}
      {meet && (
        <div style={styles.meetCard}>
          <div>
            <h2 style={styles.meetTitle}>{meet.title}</h2>
            <p style={styles.meetInfo}>
              {meet.course_name} • {new Date(meet.meet_date).toLocaleDateString()} at {meet.meet_time}
            </p>
          </div>
          <span style={styles.meetId}>{meet.meet_id}</span>
        </div>
      )}

      {/* Filters and Actions */}
      <div style={styles.filtersCard}>
        <div style={styles.searchBox}>
          <FiSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by username, email, mobile, or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
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
        <button onClick={exportAttendance} style={styles.exportButton}>
          <FiDownload /> Export CSV
        </button>
      </div>

      {/* Attendance Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>
            Participants ({filteredParticipants.length})
          </h3>
        </div>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>#</th>
                <th style={styles.tableHeaderCell}>Name</th>
                <th style={styles.tableHeaderCell}>Email</th>
                <th style={styles.tableHeaderCell}>Attendance Days</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Payment</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentParticipants.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.emptyCell}>
                    No participants found
                  </td>
                </tr>
              ) : (
                currentParticipants.map((participant, index) => (
                  <React.Fragment key={participant._id}>
                    <tr style={styles.tableRow}>
                      <td style={styles.tableCell}>{startIndex + index + 1}</td>
                      <td style={styles.tableCell}>{participant.user_id?.username || participant.user_id?.studentRegisterNumber || "N/A"}</td>
                      <td style={styles.tableCell}>{participant.user_id?.email || "N/A"}</td>
                      <td style={styles.tableCell}>
                        <div style={styles.attendanceDaysCell}>
                          <span style={styles.daysCount}>
                            {participant.total_attendance_days || 0} / {meet?.attendance_days_limit || 7} days
                          </span>
                          {participant.attendance_dates && participant.attendance_dates.length > 0 && (
                            <button
                              onClick={() => toggleParticipantExpand(participant._id)}
                              style={styles.expandButton}
                            >
                              {expandedParticipants.has(participant._id) ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background: getStatusColor(participant.attendance_status),
                          }}
                        >
                          {participant.attendance_status}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <span
                          style={{
                            ...styles.paymentBadge,
                            background:
                              participant.payment_status === "completed"
                                ? "#10b981"
                                : participant.payment_status === "pending"
                                ? "#f59e0b"
                                : "#94a3b8",
                          }}
                        >
                          {participant.payment_status}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        {(() => {
                          // Check if attendance is complete
                          const attendedDays = parseInt(participant.total_attendance_days) || 0;
                          const requiredDays = parseInt(meet?.attendance_days_limit) || parseInt(participant.meet_id?.attendance_days_limit) || 7;
                          const isCompleted = attendedDays >= requiredDays || participant.attendance_status === 'completed';
                          
                          if (isCompleted) {
                            return (
                              <span style={{ 
                                color: '#10b981', 
                                fontSize: '0.875rem', 
                                fontWeight: '600',
                                background: '#dcfce7',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px'
                              }}>
                                Days Complete
                              </span>
                            );
                          }
                          
                          if (participant.user_id && participant.attendance_status !== 'not_joined') {
                            return (
                              <button
                                onClick={() => openAttendanceModal(participant)}
                                disabled={updating}
                                style={{
                                  ...styles.markButton,
                                  ...(updating && { opacity: 0.6, cursor: 'not-allowed' })
                                }}
                              >
                                <FiCalendar /> Mark Attendance
                              </button>
                            );
                          } else if (participant.attendance_status === 'not_joined') {
                            return (
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                User must join first
                              </span>
                            );
                          } else {
                            return (
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No user data</span>
                            );
                          }
                        })()}
                      </td>
                    </tr>
                    {expandedParticipants.has(participant._id) && participant.attendance_dates && (
                      <tr>
                        <td colSpan="7" style={styles.expandedCell}>
                          <div style={styles.attendanceHistory}>
                            <h4 style={styles.historyTitle}>Attendance History</h4>
                            <div style={styles.attendanceGrid}>
                              {participant.attendance_dates.map((attendance, idx) => (
                                <div key={idx} style={styles.attendanceCard}>
                                  <div style={styles.attendanceCardHeader}>
                                    <FiCalendar style={styles.calendarIcon} />
                                    <span style={styles.attendanceCardDate}>
                                      {new Date(attendance.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  {attendance.check_in_time && (
                                    <div style={styles.attendanceCardTime}>
                                      <FiClock style={styles.clockIcon} />
                                      Check-in: {new Date(attendance.check_in_time).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  )}
                                  {attendance.check_out_time && (
                                    <div style={styles.attendanceCardTime}>
                                      Check-out: {new Date(attendance.check_out_time).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  )}
                                  {attendance.duration_minutes && (
                                    <div style={styles.attendanceCardDuration}>
                                      Duration: {attendance.duration_minutes} min
                                    </div>
                                  )}
                                  <div style={{
                                    ...styles.attendanceCardStatus,
                                    ...(attendance.status === 'present' && styles.statusPresentCard),
                                    ...(attendance.status === 'late' && styles.statusLateCard),
                                    ...(attendance.status === 'absent' && styles.statusAbsentCard)
                                  }}>
                                    {attendance.status || 'present'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={styles.paginationButton}
            >
              Previous
            </button>
            <span style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={styles.paginationButton}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Mark Daily Attendance</h3>
              <button onClick={closeAttendanceModal} style={styles.closeButton}>
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Student</label>
                <input
                  type="text"
                  value={selectedParticipant?.user_id?.username || selectedParticipant?.user_id?.studentRegisterNumber || ""}
                  disabled
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Attendance Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value)}
                  style={styles.input}
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={closeAttendanceModal} style={styles.cancelButton}>
                Cancel
              </button>
              <button
                onClick={handleMarkDailyAttendance}
                disabled={updating}
                style={styles.submitButton}
              >
                {updating ? "Marking..." : "Mark Attendance"}
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
  header: {
    maxWidth: "1400px",
    margin: "0 auto 2rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  backButton: {
    display: "flex",
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
  },
  title: {
    fontSize: "2rem",
    color: "#1e293b",
  },
  meetCard: {
    maxWidth: "1400px",
    margin: "0 auto 2rem",
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  meetTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  meetInfo: {
    color: "#64748b",
    fontSize: "1rem",
  },
  meetId: {
    fontSize: "1.25rem",
    color: "#667eea",
    fontWeight: 700,
  },
  statsGrid: {
    maxWidth: "1400px",
    margin: "0 auto 2rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
  },
  statCard: {
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  statIcon: {
    fontSize: "2.5rem",
    color: "#667eea",
  },
  statValue: {
    fontSize: "2rem",
    color: "#1e293b",
    fontWeight: 700,
    marginBottom: "0.25rem",
  },
  statLabel: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  filtersCard: {
    maxWidth: "1400px",
    margin: "0 auto 2rem",
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  searchBox: {
    position: "relative",
    flex: 1,
    minWidth: "250px",
  },
  searchIcon: {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "1.25rem",
  },
  searchInput: {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 3rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
  },
  filterSelect: {
    padding: "0.75rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
    background: "white",
    cursor: "pointer",
    minWidth: "150px",
  },
  exportButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
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
  tableHeader: {
    padding: "1.5rem",
    borderBottom: "1px solid #e2e8f0",
  },
  tableTitle: {
    fontSize: "1.25rem",
    color: "#1e293b",
    fontWeight: 600,
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeaderRow: {
    background: "#f8fafc",
  },
  tableHeaderCell: {
    padding: "1rem",
    textAlign: "left",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0",
  },
  tableCell: {
    padding: "1rem",
    fontSize: "0.875rem",
    color: "#64748b",
    whiteSpace: "nowrap",
  },
  emptyCell: {
    padding: "3rem",
    textAlign: "center",
    color: "#94a3b8",
  },
  statusBadge: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    color: "white",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  paymentBadge: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    color: "white",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  markButton: {
    padding: "0.5rem 1rem",
    background: "#10b981",
    border: "none",
    borderRadius: "6px",
    color: "white",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  pagination: {
    padding: "1.5rem",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
  },
  paginationButton: {
    padding: "0.5rem 1rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    color: "#64748b",
    cursor: "pointer",
  },
  pageInfo: {
    color: "#64748b",
    fontSize: "0.875rem",
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
  attendanceDaysCell: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  daysCount: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#667eea",
  },
  expandButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.25rem",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#667eea",
    fontSize: "1.25rem",
  },
  expandedCell: {
    padding: "1rem",
    background: "#f8fafc",
  },
  attendanceHistory: {
    padding: "1rem",
  },
  historyTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: "1rem",
  },
  attendanceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1rem",
  },
  attendanceCard: {
    padding: "1rem",
    background: "white",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  attendanceCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.75rem",
  },
  calendarIcon: {
    color: "#667eea",
    fontSize: "1.25rem",
  },
  attendanceCardDate: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#1e293b",
  },
  attendanceCardTime: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.75rem",
    color: "#64748b",
    marginBottom: "0.25rem",
  },
  clockIcon: {
    fontSize: "0.875rem",
  },
  attendanceCardDuration: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    marginBottom: "0.5rem",
  },
  attendanceCardStatus: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statusPresentCard: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusLateCard: {
    background: "#fef3c7",
    color: "#92400e",
  },
  statusAbsentCard: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#1e293b",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: "2rem",
    cursor: "pointer",
    color: "#64748b",
    lineHeight: 1,
  },
  modalBody: {
    padding: "1.5rem",
  },
  formGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#1e293b",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    padding: "1.5rem",
    borderTop: "1px solid #e2e8f0",
  },
  cancelButton: {
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    fontWeight: 600,
    cursor: "pointer",
  },
  submitButton: {
    padding: "0.75rem 1.5rem",
    background: "#667eea",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default MeetAttendance;
