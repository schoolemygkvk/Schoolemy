import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../Utils/api";
import { hasStoredSession } from "../../../../Utils/security";
import {
  FaArrowLeft,
  FaDollarSign,
  FaUsers,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaFilter,
  FaSync,
  FaList,
  FaTimes,
} from "react-icons/fa";
import { RiErrorWarningFill } from "react-icons/ri";

const TutorCommissionDue = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!hasStoredSession()) {
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const params = {};
      if (periodFilter) params.periodId = periodFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get("/tutor-commission-due", { params });

      if (response.data?.success) {
        setData(response.data.data);
      } else {
        setError(response.data?.message || "Failed to fetch data.");
        setData(null);
      }
    } catch (err) {
      console.error("Error fetching tutor commission due:", err);
      setError(err.response?.data?.message || "Failed to fetch data. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [periodFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkPaid = async (tutorId, periodId, commissionAmount) => {
    if (!hasStoredSession()) return;
    const key = `${tutorId}-${periodId}`;
    setUpdating(key);
    try {
      await api.post("/tutor-commission/mark-paid", { tutorId, periodId, commissionAmount });
      await fetchData();
    } catch (err) {
      console.error("Error marking paid:", err);
      setError(err.response?.data?.message || "Failed to mark as paid.");
    } finally {
      setUpdating(null);
    }
  };

  const handleViewDetails = async (row) => {
    setDetailsModal({ tutorName: row.tutorName, tutorId: row.tutorId, periodId: row.periodId });
    setDetailsLoading(true);
    try {
      const response = await api.get("/tutor-commission-due-details", {
        params: { tutorId: row.tutorId, periodId: row.periodId },
      });
      if (response.data?.success) {
        setDetailsModal((prev) => ({ ...prev, data: response.data.data }));
      } else {
        setDetailsModal((prev) => ({ ...prev, error: "Failed to load details" }));
      }
    } catch (err) {
      setDetailsModal((prev) => ({ ...prev, error: err.response?.data?.message || "Failed to load details" }));
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleMarkPending = async (tutorId, periodId) => {
    if (!hasStoredSession()) return;
    const key = `${tutorId}-${periodId}`;
    setUpdating(key);
    try {
      await api.post("/tutor-commission/mark-pending", { tutorId, periodId });
      await fetchData();
    } catch (err) {
      console.error("Error marking pending:", err);
      setError(err.response?.data?.message || "Failed to revert.");
    } finally {
      setUpdating(null);
    }
  };

  const formatCurrency = (amount) => {
    if (amount == null || amount === undefined) return "₹0.00";
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const formatPeriod = (periodString) => {
    if (!periodString) return "N/A";
    try {
      const [from, to] = periodString.split("_to_");
      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        return `${fromDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${toDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      }
      return periodString;
    } catch {
      return periodString;
    }
  };

  const colors = {
    primary: "#007bff",
    primaryDark: "#0056b3",
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545",
    dark: "#333333",
    gray: "#666666",
    lightGray: "#e9ecef",
    bgLight: "#f5f5f5",
    bgWhite: "#ffffff",
  };

  const tutors = data?.tutors || [];
  const periods = data?.periods || [];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bgLight, padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px", backgroundColor: colors.bgWhite, padding: "24px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "16px",
          }}
        >
          <FaArrowLeft /> Back
        </button>
        <h1 style={{ margin: "0 0 8px 0", color: colors.dark, fontSize: "28px", fontWeight: "700", display: "flex", alignItems: "center", gap: "12px" }}>
          <FaDollarSign /> Tutor Commission Due
        </h1>
        <p style={{ margin: 0, color: colors.gray, fontSize: "14px" }}>
          15-day commission list • All tutors • Paid / Unpaid status
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: "16px 20px", borderRadius: "10px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <RiErrorWarningFill style={{ fontSize: "24px" }} />
            <span>{error}</span>
          </div>
          <button onClick={fetchData} style={{ backgroundColor: colors.danger, color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "24px", backgroundColor: colors.bgWhite, padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: colors.gray }}><FaCalendarAlt /> 15-Day Period</label>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            style={{ padding: "10px 14px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", minWidth: "220px" }}
          >
            <option value="">All periods</option>
            {periods.map((p) => (
              <option key={p} value={p}>{formatPeriod(p)}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: colors.gray }}><FaFilter /> Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px 14px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", minWidth: "140px" }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: colors.primary,
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ backgroundColor: colors.bgWhite, borderRadius: "12px", padding: "60px", textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ width: "50px", height: "50px", border: `4px solid ${colors.lightGray}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: "16px", fontWeight: "500", color: colors.dark }}>Loading commission data...</div>
        </div>
      )}

      {/* Grid - One unified table */}
      {!loading && data && (
        <div style={{ backgroundColor: colors.bgWhite, borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ padding: "20px", borderBottom: `2px solid ${colors.lightGray}` }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: colors.dark, display: "flex", alignItems: "center", gap: "8px" }}>
              <FaUsers /> All Tutors Commission ({tutors.length} records)
            </h2>
            <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: colors.gray }}>Hierarchy: 15-day period based</p>
          </div>
          {tutors.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center", color: colors.gray }}>
              <FaUsers style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }} />
              <div style={{ fontSize: "18px", fontWeight: "600", color: colors.dark, marginBottom: "8px" }}>No commission records</div>
              <div>No tutor commission data for the selected filters.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)", color: "white" }}>
                    <th style={{ padding: "14px 12px", textAlign: "left", fontWeight: "600", fontSize: "13px" }}>#</th>
                    <th style={{ padding: "14px 12px", textAlign: "left", fontWeight: "600", fontSize: "13px" }}>Tutor (click for details)</th>
                    <th style={{ padding: "14px 12px", textAlign: "left", fontWeight: "600", fontSize: "13px" }}>Email</th>
                    <th style={{ padding: "14px 12px", textAlign: "left", fontWeight: "600", fontSize: "13px" }}>15-Day Period</th>
                    <th style={{ padding: "14px 12px", textAlign: "right", fontWeight: "600", fontSize: "13px" }}>Commission</th>
                    <th style={{ padding: "14px 12px", textAlign: "center", fontWeight: "600", fontSize: "13px" }}>Status</th>
                    <th style={{ padding: "14px 12px", textAlign: "center", fontWeight: "600", fontSize: "13px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tutors.map((row, index) => (
                    <tr
                      key={`${row.tutorId}-${row.periodId}-${index}`}
                      style={{ borderBottom: `1px solid ${colors.lightGray}`, transition: "background 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8f9fa"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <td style={{ padding: "14px 12px", fontSize: "14px", color: colors.dark }}>{index + 1}</td>
                      <td style={{ padding: "14px 12px", fontSize: "14px" }}>
                        <button
                          onClick={() => handleViewDetails(row)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            textAlign: "left",
                            display: "block",
                            width: "100%",
                            color: colors.primary,
                            fontWeight: "600",
                            textDecoration: "underline",
                          }}
                          title="Click to view purchase details"
                        >
                          <div>{row.tutorName || "N/A"}</div>
                          <div style={{ fontSize: "12px", color: colors.gray, textDecoration: "none" }}>{row.tutorIdNumber || "—"} • View details</div>
                        </button>
                      </td>
                      <td style={{ padding: "14px 12px", fontSize: "14px", color: colors.dark }}>{row.tutorEmail || "N/A"}</td>
                      <td style={{ padding: "14px 12px", fontSize: "13px", color: colors.dark }}>{formatPeriod(row.periodId)}</td>
                      <td style={{ padding: "14px 12px", fontSize: "14px", fontWeight: "600", color: colors.primary, textAlign: "right" }}>
                        {formatCurrency(row.commissionAmount)}
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: row.status === "paid" ? "#d4edda" : "#fff3cd",
                            color: row.status === "paid" ? "#155724" : "#856404",
                          }}
                        >
                          {row.status === "paid" ? <FaCheckCircle /> : <FaClock />}
                          {row.status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "center" }}>
                        {updating === `${row.tutorId}-${row.periodId}` ? (
                          <span style={{ fontSize: "12px", color: colors.gray }}>Updating...</span>
                        ) : row.status === "paid" ? (
                          <button
                            onClick={() => handleMarkPending(row.tutorId, row.periodId)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              backgroundColor: colors.warning,
                              color: "#212529",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "600",
                            }}
                          >
                            Revert to Pending
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkPaid(row.tutorId, row.periodId, row.commissionAmount)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              backgroundColor: colors.success,
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "600",
                            }}
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {detailsModal && (
        <div
          onClick={() => setDetailsModal(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.bgWhite,
              borderRadius: "12px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: `2px solid ${colors.lightGray}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: colors.dark, display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaList /> Payment Details - {detailsModal.tutorName}
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: colors.gray }}>{formatPeriod(detailsModal.periodId)} • User purchases</p>
              </div>
              <button onClick={() => setDetailsModal(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: colors.gray }}><FaTimes /></button>
            </div>
            <div style={{ padding: "24px", overflowY: "auto", maxHeight: "calc(90vh - 120px)" }}>
              {detailsLoading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.lightGray}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
                  <div>Loading purchase details...</div>
                </div>
              ) : detailsModal.error ? (
                <div style={{ color: colors.danger, textAlign: "center", padding: "20px" }}>{detailsModal.error}</div>
              ) : detailsModal.data ? (
                <>
                  {detailsModal.data.totals && (
                    <div style={{ display: "flex", gap: "20px", marginBottom: "24px", flexWrap: "wrap" }}>
                      <div style={{ padding: "16px 20px", backgroundColor: "#e8f4fd", borderRadius: "8px", minWidth: "140px" }}>
                        <div style={{ fontSize: "12px", color: colors.gray, fontWeight: "600" }}>Total Purchases</div>
                        <div style={{ fontSize: "18px", fontWeight: "700", color: colors.primary }}>{formatCurrency(detailsModal.data.totals.totalPurchaseAmount)}</div>
                      </div>
                      <div style={{ padding: "16px 20px", backgroundColor: "#d4edda", borderRadius: "8px", minWidth: "140px" }}>
                        <div style={{ fontSize: "12px", color: colors.gray, fontWeight: "600" }}>Total Commission</div>
                        <div style={{ fontSize: "18px", fontWeight: "700", color: colors.success }}>{formatCurrency(detailsModal.data.totals.totalCommission)}</div>
                      </div>
                      <div style={{ padding: "16px 20px", backgroundColor: "#f8f9fa", borderRadius: "8px", minWidth: "100px" }}>
                        <div style={{ fontSize: "12px", color: colors.gray, fontWeight: "600" }}>Transactions</div>
                        <div style={{ fontSize: "18px", fontWeight: "700", color: colors.dark }}>{detailsModal.data.totals.paymentCount}</div>
                      </div>
                    </div>
                  )}
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa", borderBottom: `2px solid ${colors.lightGray}` }}>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "12px" }}>#</th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "12px" }}>User</th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "12px" }}>Course</th>
                        <th style={{ padding: "12px", textAlign: "right", fontWeight: "600", fontSize: "12px" }}>Purchase</th>
                        <th style={{ padding: "12px", textAlign: "right", fontWeight: "600", fontSize: "12px" }}>Commission</th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "12px" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailsModal.data.details || []).map((d, i) => (
                        <tr key={d.paymentId || i} style={{ borderBottom: `1px solid ${colors.lightGray}` }}>
                          <td style={{ padding: "12px", fontSize: "13px" }}>{i + 1}</td>
                          <td style={{ padding: "12px", fontSize: "13px" }}>
                            <div style={{ fontWeight: "600" }}>{d.username || "N/A"}</div>
                            <div style={{ fontSize: "11px", color: colors.gray }}>{d.email || d.studentRegisterNumber || "—"}</div>
                          </td>
                          <td style={{ padding: "12px", fontSize: "13px" }}>{d.courseName || "N/A"}</td>
                          <td style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: colors.primary, textAlign: "right" }}>{formatCurrency(d.purchaseAmount)}</td>
                          <td style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: colors.success, textAlign: "right" }}>{formatCurrency(d.commissionAmount)}</td>
                          <td style={{ padding: "12px", fontSize: "12px", color: colors.gray }}>{formatDate(d.paymentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!detailsModal.data.details || detailsModal.data.details.length === 0) && (
                    <div style={{ textAlign: "center", padding: "40px", color: colors.gray }}>No purchase records found.</div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default TutorCommissionDue;
