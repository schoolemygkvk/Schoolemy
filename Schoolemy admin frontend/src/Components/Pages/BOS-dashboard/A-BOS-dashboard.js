import React from "react";
import { useNavigate } from "react-router-dom";

const bosTools = [
  {
    name: "BOS Members Management",
    description: "Manage board members, their roles, and contact information.",
    icon: "👥",
    path: "/schoolemy/bos-members",
    color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    name: "Meeting Management",
    description: "Schedule, organize and document board meeting proceedings.",
    icon: "📅",
    path: "/schoolemy/create-meeting",
    color: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
  },
  {
    name: "Course Proposal",
    description: "Submit new course proposals for BOS approval.",
    icon: "📝",
    path: "/schoolemy/submit-course-proposal",
    color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  {
    name: "Pending Proposals",
    description: "View and take action on pending course proposals.",
    icon: "⏳",
    path: "/schoolemy/pending-proposals",
    color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    name: "Update Recent Decisions",
    description: "Archive of all recent board decisions and resolutions.",
    icon: "📋",
    path: "/schoolemy/create-decision",
    color: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
  },
  {
    name: "Recent Decisions Status",
    description: "Archive of all recent board decisions and resolutions.",
    icon: "📜",
    path: "/schoolemy/recent-decision",
    color: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
  },
  {
    name: "Minutes of Meeting (MoM)",
    description: "Create, review and approve official meeting minutes.",
    icon: "📝",
    path: "/schoolemy/create-bos-meeting",
    color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  {
    name: "Assign Task",
    description: "Assign action items and responsibilities to members.",
    icon: "➕",
    path: "/schoolemy/assign-task",
    color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    name: "Task Status",
    description: "Monitor progress and completion of assigned tasks.",
    icon: "✅",
    path: "/schoolemy/task-status",
    color: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
  },
  // {
  //   name: "Document Archive",
  //   description: "Central repository for all board documents and files.",
  //   icon: "🗄️",
  //   path: "/schoolemy/document-archive",
  //   color: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  // },
  // {
  //   name: "Action Item Tracker",
  //   description: "Track progress on action items from meetings.",
  //   icon: "📑",
  //   path: "/schoolemy/action-tracker",
  //   color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  // },
  {
    name: "View (MoM)",
    description: "Create, review and approve official meeting minutes.",
    icon: "✉️",
    path: "/schoolemy/view-bos-meeting",
    color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  // {
  //   name: "Feedback System",
  //   description: "Collect and review feedback from faculty and stakeholders.",
  //   icon: "💬",
  //   path: "/schoolemy/feedback",
  //   color: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  // },
];

const BosDashboard = () => {
  const navigate = useNavigate();

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
              Board of Studies Dashboard
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
              Comprehensive tools for academic governance and decision making
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
              {bosTools.map((tool, index) => (
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
                        BOS Feature
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

export default BosDashboard;
