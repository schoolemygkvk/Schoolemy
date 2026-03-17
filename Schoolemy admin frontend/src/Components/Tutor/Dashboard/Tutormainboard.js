import React from "react";
import { useNavigate } from "react-router-dom";

const adminTools = [
  {
    name: "Course Upload",
    description: "Upload and manage course materials and content.",
    icon: "�",
    path: "/schoolemy/tutor-upload-course",
    color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    // Show to everyone (admin, superadmin, and tutor)
  },
  {
    name: "View all Courses",
    description:
      "View and manage all your courses in one place.",
    icon: "🏛️",
    path: "/schoolemy/tutor-course-list",
    color: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  },
  {
    name: "Revenue Dashboard",
    description: "View and manage your revenue and payment history.",
    icon: "�",
    path: "/schoolemy/tutor-revenue",
    color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    // Show to everyone (admin, superadmin, and tutor)
  }
];

const Tutormainboard = () => {
  const navigate = useNavigate();

  // Get user role from localStorage
  const role = localStorage.getItem("role");
  const isAdminOrSuperAdmin = role === "admin" || role === "superadmin";
  const isTutorManagement = role === "tutormanagement";

  // Debug logging
  console.log("=== Tutormainboard Debug ===");
  console.log("User Role from localStorage:", role);
  console.log("Is Admin or SuperAdmin:", isAdminOrSuperAdmin);
  console.log("Is Tutor Management:", isTutorManagement);
  console.log("Total tools:", adminTools.length);

  // Filter tools based on role
  const availableTools = adminTools.filter((tool) => {
    // If tool is adminOnly, only show to admin/superadmin
    if (tool.adminOnly) {
      const shouldShow = isAdminOrSuperAdmin;
      console.log(`${tool.name} (adminOnly): ${shouldShow ? "SHOW" : "HIDE"}`);
      return shouldShow;
    }
    // Otherwise, show to everyone
    console.log(`${tool.name}: SHOW (available to all)`);
    return true;
  });

  console.log("Available tools count:", availableTools.length);
  console.log(
    "Available tools:",
    availableTools.map((t) => t.name)
  );

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
              {isAdminOrSuperAdmin ? "Admin Dashboard" : isTutorManagement ? "Tutor Management Dashboard" : "Tutor Dashboard"}
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
              {isAdminOrSuperAdmin
                ? "Powerful tools to manage your system efficiently"
                : isTutorManagement
                ? "Manage tutors, courses, and analytics for effective tutoring operations"
                : "Manage your courses and view your dashboard"}
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
              {availableTools.map((tool, index) => (
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
                      borderColor: "#cbd5e1",
                    },
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
                        {tool.adminOnly
                          ? "Admin Only"
                          : isAdminOrSuperAdmin
                          ? "Admin Feature"
                          : "Tutor Feature"}
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
                            borderColor: "#94a3b8",
                          },
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

export default Tutormainboard;
