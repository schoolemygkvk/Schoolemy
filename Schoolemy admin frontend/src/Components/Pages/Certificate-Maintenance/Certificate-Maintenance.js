import React from "react";
import { useNavigate } from "react-router-dom";

const certificateTools = [
  {
    name: "Certificate Generator",
    description: "Create and customize digital certificates with templates",
    icon: "🖨️",
    path: "/certificates/generator",
    color: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
  },
  {
    name: "Certificate Verification",
    description: "Validate authenticity of issued certificates",
    icon: "🔍",
    path: "/certificates/verification",
    color: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
  },
  // {
  //   name: "Bulk Certificate Issuance",
  //   description: "Generate multiple certificates at scale",
  //   icon: "📜",
  //   path: "/certificates/bulk-issuance",
  //   color: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
  // },
  // {
  //   name: "Certificate Revocation",
  //   description: "Manage revoked or invalidated certificates",
  //   icon: "❌",
  //   path: "/certificates/revocation",
  //   color: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
  // },
  // {
  //   name: "Certificate Templates",
  //   description: "Manage and customize certificate designs",
  //   icon: "🎨",
  //   path: "/certificates/templates",
  //   color: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
  // },
  // {
  //   name: "Certificate Analytics",
  //   description: "Track certificate issuance and usage metrics",
  //   icon: "📊",
  //   path: "/certificates/analytics",
  //   color: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
  // },
  // {
  //   name: "Expiry Management",
  //   description: "Monitor and renew expiring certificates",
  //   icon: "⏳",
  //   path: "/certificates/expiry",
  //   color: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
  // },
  // {
  //   name: "Digital Signatures",
  //   description: "Apply and verify digital signatures",
  //   icon: "🖋️",
  //   path: "/certificates/signatures",
  //   color: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
  // },
  // {
  //   name: "Certificate Archive",
  //   description: "Historical record of all issued certificates",
  //   icon: "🗄️",
  //   path: "/certificates/archive",
  //   color: "linear-gradient(135deg, #64748b 0%, #475569 100%)"
  // },
  // {
  //   name: "API Integration",
  //   description: "Connect certificate services to other systems",
  //   icon: "🔌",
  //   path: "/certificates/api",
  //   color: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
  // }
];

const CertificateDashboard = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          padding: "2rem 1rem",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
          {/* Header */}
          <header
            style={{
              marginBottom: "3rem",
              textAlign: "center",
              padding: "0 1rem"
            }}
          >
            <h1
              style={{
                fontSize: "clamp(2rem, 6vw, 3rem)",
                fontWeight: 800,
                color: "#1e293b",
                marginBottom: "1.5rem",
                marginTop: "1rem",
                lineHeight: 1.2
              }}
            >
              Certificate Management System
            </h1>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#64748b",
                maxWidth: "700px",
                margin: "0 auto",
                lineHeight: 1.6
              }}
            >
              Comprehensive tools for creating, managing, and verifying certificates
            </p>
          </header>

          {/* Main Content */}
          <main>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2rem",
                padding: "0 1rem"
              }}
            >
              {certificateTools.map((tool, index) => (
                <div
                  key={index}
                  onClick={() => navigate(tool.path)}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    border: "1px solid #e2e8f0",
                    ":hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      borderColor: "#cbd5e1"
                    }
                  }}
                >
                  {/* Color accent */}
                  <div
                    style={{
                      height: "8px",
                      background: tool.color,
                      width: "100%"
                    }}
                  />

                  {/* Content */}
                  <div
                    style={{
                      padding: "1.75rem",
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column"
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
                          "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)"
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
                          lineHeight: 1.3
                        }}
                      >
                        {tool.name}
                      </h2>
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "0.95rem",
                          lineHeight: 1.6,
                          margin: 0
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
                        alignItems: "center"
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          fontWeight: 500
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
                        Certificate Tool
                      </span>
                      <button
                        style={{
                          background: "transparent",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          ":hover": {
                            background: "#f1f5f9",
                            borderColor: "#94a3b8"
                          }
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

export default CertificateDashboard;