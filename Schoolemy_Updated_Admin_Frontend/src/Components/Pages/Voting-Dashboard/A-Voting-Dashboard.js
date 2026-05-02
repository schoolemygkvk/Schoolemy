import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import votingDemoSystemImage from "../../../assets/images/voting-dashboard/voting-demo-system.svg";
import votingCreatorElectionImage from "../../../assets/images/voting-dashboard/voting-creator-election.svg";
import votingPollsQuicklyImage from "../../../assets/images/voting-dashboard/voting-polls-quickly.svg";
import votingElectionResultsImage from "../../../assets/images/voting-dashboard/voting-election-results.svg";
import votingOverallElectionImage from "../../../assets/images/voting-dashboard/voting-overall-election.svg";
import votingLiveResultsImage from "../../../assets/images/voting-dashboard/voting-live-results.svg";

const voteTools = [
  {
    name: "Demo Voting System",
    description: "How to create a voting system with live results Demo",
    image: votingDemoSystemImage,
    path: "/schoolemy/demo",
    color: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
  },
  {
    name: "Creator Election",
    description: "Set up formal elections with candidate management",
    image: votingCreatorElectionImage,
    path: "/schoolemy/create",
    color: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
  },
  {
    name: "Polls Quickly",
    description: "Create instant polls for quick decision making",
    image: votingPollsQuicklyImage,
    path: "/schoolemy/polling",
    color: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
  },
  {
    name: "Election Results",
    description: "Customize voting forms and ballot layouts",
    image: votingElectionResultsImage,
    path: "/schoolemy/results",
    color: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
  },
  {
    name: "Over All Election",
    description: "Manage eligible voters and participant lists",
    image: votingOverallElectionImage,
    path: "/schoolemy/total",
    color: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
  },
  {
    name: "Live Results",
    description: "Real-time vote counting and visualization",
    image: votingLiveResultsImage,
    path: "/schoolemy/live-results",
    color: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
  },
];

const VoteDashboard = () => {
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
              Voting Management System
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
              Comprehensive tools for secure elections, polls, and decision-making
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
              {voteTools.map((tool, index) => (
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
                        Voting Tool
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

export default VoteDashboard;