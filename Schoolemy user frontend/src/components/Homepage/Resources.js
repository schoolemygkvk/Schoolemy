import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllStaff } from "../../service/userdashboardApi";

export default function Resources() {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10,
  });

  const fetchStaff = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllStaff({ page, limit: 10 });
      if (res.success) {
        setStaff(res.staff || []);
        setPagination(
          res.pagination || { page: 1, pages: 1, total: 0, limit: 10 },
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load staff",
      );
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    function onResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <button
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/")
          }
          style={styles.backButton}
          aria-label="Go back"
        >
          ← Back
        </button>
        <h2 style={styles.title}>Our People & Resources</h2>

        <div style={styles.sectionBlock}>
          <h3 style={styles.sectionTitle}>Staff</h3>
          {loading && <p style={styles.loading}>Loading staff...</p>}
          {error && <p style={styles.error}>{error}</p>}
          {!loading && !error && staff.length === 0 && (
            <p style={styles.empty}>No staff members to display.</p>
          )}
          {!loading && !error && staff.length > 0 && (
            <>
              <div
                style={{
                  ...styles.grid,
                  gridTemplateColumns:
                    windowWidth < 520
                      ? "repeat(1, 1fr)"
                      : "repeat(auto-fit, minmax(180px, 1fr))",
                }}
              >
                {staff.map((s) => (
                  <div
                    key={s._id}
                    style={{ ...styles.card, ...styles.staffCard }}
                  >
                    <img
                      loading="lazy"
                      src={s.profilePicture?.url}
                      alt={s.name}
                      style={styles.avatar}
                    />
                    <div style={styles.infoCenter}>
                      <strong style={{ fontSize: 18 }}>{s.name}</strong>
                      <div style={styles.muted}>{s.designation}</div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 14,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 4,
                        }}
                      >
                        <span>
                          <b>Gender:</b> {s.gender}
                        </span>
                        <span>
                          <b>Age:</b> {s.age}
                        </span>
                        <span>
                          <b>Aadhar:</b> {s.aadharNumber}
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <b>Address:</b>
                          <span style={{ marginLeft: 8 }}>
                            {s.address?.street}
                          </span>
                          <span style={{ marginLeft: 8 }}>
                            {s.address?.city}, {s.address?.state}
                          </span>
                          <span style={{ marginLeft: 8 }}>
                            {s.address?.country} - {s.address?.postalCode}
                          </span>
                        </span>
                        {/* <span>
                          <b>Joined:</b>{" "}
                          {s.date ? new Date(s.date).toLocaleDateString() : ""}
                        </span> */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {pagination.pages > 1 && (
                <div style={styles.pagination}>
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchStaff(pagination.page - 1)}
                    style={styles.pageBtn}
                  >
                    Previous
                  </button>
                  <span style={styles.pageInfo}>
                    Page {pagination.page} of {pagination.pages} (
                    {pagination.total} total)
                  </span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchStaff(pagination.page + 1)}
                    style={styles.pageBtn}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: 40,
    background: "#ffffff",
    color: "#1e293b",
    fontFamily:
      "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial",
  },
  container: { position: "relative", maxWidth: 1100, margin: "0 auto" },
  title: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 28,
    letterSpacing: "0.2px",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 20,
    background: "#fff",
    border: "1px solid #e2e8f0",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(11,22,40,0.04)",
  },
  card: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    background: "#fbfbfd",
    boxShadow: "0 6px 18px rgba(11,22,40,0.04)",
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    objectFit: "cover",
    borderRadius: "50%",
    flex: "0 0 auto",
  },
  infoCenter: { flex: 1, textAlign: "center" },
  muted: { color: "#64748b", fontSize: 14, marginTop: 6 },
  sectionBlock: { marginTop: 28 },
  sectionTitle: { marginBottom: 12, fontSize: 20, color: "#0f172a" },
  grid: { display: "grid", gap: 12 },
  staffCard: { flexDirection: "column", textAlign: "center", padding: 16 },
  loading: { color: "#64748b", padding: 20, textAlign: "center" },
  error: {
    color: "#dc2626",
    padding: 20,
    textAlign: "center",
    background: "#fef2f2",
    borderRadius: 8,
  },
  empty: { color: "#64748b", padding: 20, textAlign: "center" },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
    flexWrap: "wrap",
  },
  pageBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
  },
  pageInfo: { color: "#64748b", fontSize: 14 },
};
