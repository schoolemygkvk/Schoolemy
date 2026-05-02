import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";
import { useToken } from "../../../Hooks/useToken";

const formatAvgSession = (seconds) => {
  if (seconds == null || seconds < 1) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

function KpiPill({ label, value, accent }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "0.75rem 0.5rem",
        borderRadius: "12px",
        background: "#f8fafc",
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

const tutorTools = [
  {
    name: "Create Tutor",
    description:
      "Create and manage administrator accounts with full system privileges.",
    icon: "👨‍💼",
    path: "/schoolemy/create-tutors",
    color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    name: "View Tutors",
    description: "View and manage existing tutor profiles and permissions.",
    icon: "👥",
    path: "/schoolemy/tutor-details",
    color: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
  },
  {
    name: "Tutor Analytics",
    description:
      "Monitor and analyze system performance metrics and logs for tutor.",
    icon: "📊",
    path: "/schoolemy/tutor-analytics",
    color: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
  },
  {
    name: "Tutor's list of Courses",
    description:
      "Browse and manage courses taught by tutors — edit course details, schedules, materials, and enrollment settings.",
    icon: "📊",
    path: "/schoolemy/tutor-list",
    color: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  },
  {
    name: "Course Review",
    description:
      "Review and approve tutor-uploaded courses. Approve, request changes, or reject courses pending review.",
    icon: "📝",
    path: "/schoolemy/tutor-course-review",
    color: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
  },
  {
    name: "Tutors Payment Details",
    description:
      "View and manage tutor payments: payouts, invoices, transaction history and payment status.",
    icon: "🗂️",
    path: "/schoolemy/tutor-payment-details",
    color: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  {
    name: "Tutors Payment History",
    description:
      "View and manage tutor payment history: payouts, invoices, transaction history and payment status.",
    icon: "🗂️",
    path: "/schoolemy/tutor-payment-history",
    color: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  {
    name: "Tutor Commission Due",
    description:
      "All tutors 15-day commission list. View paid/pending status, mark as paid, hierarchy by period.",
    icon: "💰",
    path: "/schoolemy/tutor-commission-due",
    color: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
  },
];

const InstitutionalDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useToken();

  const [tutorKpis, setTutorKpis] = React.useState(null);
  const [kpiLoading, setKpiLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setTutorKpis(null);
      return undefined;
    }
    let cancelled = false;
    setKpiLoading(true);
    axios
      .get("/tutor-analytics-light", { params: { summaryOnly: "1" } })
      .then((res) => {
        if (!cancelled) setTutorKpis(res.data?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setTutorKpis(null);
      })
      .finally(() => {
        if (!cancelled) setKpiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .tool-card {
        transition: all 0.3s ease;
      }

      .tool-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        border-color: #cbd5e1;
      }

      .tool-card-button {
        transition: all 0.2s;
      }

      .tool-card-button:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
      }
    `;
    document.head.appendChild(styleElement);
    return () => styleElement.remove();
  }, []);

  return (
    <div>
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          padding: "2rem 1rem",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1440px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <header
            style={{
              marginBottom: "3rem",
              textAlign: "center",
              padding: "0 1rem",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(2rem, 6vw, 3rem)",
                fontWeight: 800,
                color: "#1e293b",
                marginBottom: "1.5rem",
                marginTop: "1rem",
                lineHeight: 1.2,
              }}
            >
              Tutor Dashboard
            </h1>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#64748b",
                maxWidth: "700px",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Manage tutor profiles, credentials, course assignments, payments, and performance tracking in one unified dashboard.
            </p>
          </header>


          <section
            style={{
              maxWidth: "1100px",
              margin: "0 auto 2.5rem",
              padding: "0 1rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "1rem",
                background: "white",
                borderRadius: "16px",
                padding: "1.25rem 1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                border: "1px solid #e2e8f0",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  gridColumn: "1 / -1",
                  marginBottom: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#64748b",
                  }}
                >
                  Performance snapshot
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/schoolemy/tutor-analytics")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4f46e5",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Open full analytics →
                </button>
              </div>
              {kpiLoading ? (
                <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                  Loading metrics…
                </span>
              ) : tutorKpis ? (
                <>
                  <KpiPill label="Total tutors" value={tutorKpis.totalTutors} accent="#2563eb" />
                  <KpiPill label="Active now" value={tutorKpis.activeTutors} accent="#059669" />
                  <KpiPill
                    label="Avg. session"
                    value={formatAvgSession(tutorKpis.avgSessionSeconds)}
                    accent="#d97706"
                  />
                  <KpiPill label="Logins today" value={tutorKpis.loginsToday} accent="#7c3aed" />
                </>
              ) : (
                <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                  Metrics unavailable (check connection or permissions).
                </span>
              )}
            </div>
          </section>

          {/* Main Content */}
          <main>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2rem",
                padding: "0 1rem",
              }}
            >
              {tutorTools.map((tool, index) => (
                <div
                  key={index}
                  className="tool-card"
                  onClick={() => navigate(tool.path)}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {/* Color accent */}
                  <div
                    style={{
                      height: "8px",
                      background: tool.color,
                      width: "100%",
                    }}
                  />

                  {/* Content */}
                  <div
                    style={{
                      padding: "1.75rem",
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                        marginBottom: "1.5rem",
                        boxShadow:
                          "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                      }}
                    >
                      {tool.icon}
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <h2
                        style={{
                          color: "#1e293b",
                          fontSize: "1.25rem",
                          fontWeight: 700,
                          margin: "0 0 0.75rem 0",
                          lineHeight: 1.3,
                        }}
                      >
                        {tool.name}
                      </h2>
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "0.95rem",
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        {tool.description}
                      </p>
                    </div>

                    <div
                      style={{
                        marginTop: "auto",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          fontWeight: 500,
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ marginRight: "6px" }}
                        >
                          <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
                          <path d="M12 8l.01 0"></path>
                          <path d="M11 12l1 0l4 0"></path>
                        </svg>
                        Admin Tool
                      </span>
                      <button
                        className="tool-card-button"
                        style={{
                          background: "transparent",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        Open
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ marginLeft: "6px" }}
                        >
                          <path d="M5 12h14"></path>
                          <path d="M13 18l6 -6"></path>
                          <path d="M13 6l6 6"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalDashboard;
