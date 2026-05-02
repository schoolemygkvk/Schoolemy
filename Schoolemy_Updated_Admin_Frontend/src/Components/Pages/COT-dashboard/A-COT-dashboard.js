import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import addAdminImage from "../../../assets/images/cot-dashboard/add-admin.svg";
import viewAdministratorsImage from "../../../assets/images/cot-dashboard/view-administrators.svg";
import adminAnalyticsImage from "../../../assets/images/cot-dashboard/admin-analytics.svg";
import courseProposalImage from "../../../assets/images/cot-dashboard/course-proposal.svg";
import decisionUpdateImage from "../../../assets/images/cot-dashboard/decision-update.svg";

const adminTools = [
  {
    name: "Add Admin",
    description:
      "Create and manage administrator accounts with full system privileges.",
    image: addAdminImage,
    path: "/schoolemy/create-admin",
    color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    name: "View administrators",
    description:
      "View and manage existing administrator profiles and permissions.",
    image: viewAdministratorsImage,
    path: "/schoolemy/admin-details",
    color: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
  },
  {
    name: "Admin Analytics",
    description: "Monitor and analyze system performance metrics and logs.",
    image: adminAnalyticsImage,
    path: "/schoolemy/admin-analytics",
    color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  {
    name: "Course Proposal",
    description: "View and approve or reject course proposals submitted for review.",
    image: courseProposalImage,
    path: "/schoolemy/cot-course-proposals",
    color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    name: "Decision Update",
    description: "View and approve or reject recent decisions submitted for review.",
    image: decisionUpdateImage,
    path: "/schoolemy/cot-decision-list",
    color: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
  },
];

const Admindashboard = () => {
  const navigate = useNavigate();

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
              Committee of Trustees
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
              Powerful tools to manage your system efficiently
            </p>
          </header>

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
              {adminTools.map((tool, index) => (
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
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "1.5rem",
                        boxShadow:
                          "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      {tool.image ? (
                        <img
                          src={tool.image}
                          alt=""
                          width={56}
                          height={56}
                          decoding="async"
                          style={{
                            display: "block",
                            objectFit: "contain",
                          }}
                          aria-hidden={true}
                        />
                      ) : null}
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
                        Admin Feature
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

export default Admindashboard;