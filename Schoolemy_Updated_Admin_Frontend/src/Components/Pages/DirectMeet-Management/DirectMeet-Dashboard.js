import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DirectMeetDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .directmeet-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .directmeet-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.15);
      }
    `;
    document.head.appendChild(styleElement);
    return () => styleElement.remove();
  }, []);

  const dashboardCards = [
    {
      id: 1,
      title: "Create Course Meet",
      description: "Schedule a new meeting session for a specific course",
      icon: "📅",
      path: "/schoolemy/create-course-meet",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      stats: "Quick Setup",
    },
    {
      id: 2,
      title: "View Course Meets",
      description: "View all scheduled meetings and manage them",
      icon: "👁️",
      path: "/schoolemy/course-meets",
      color: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
      stats: "All Meetings",
    },
  ];

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>DirectMeet Management Dashboard</h1>
          <p style={styles.subtitle}>
            Manage course-based meetings, track attendance, and organize study materials
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div style={styles.grid}>
        {dashboardCards.map((card) => (
          <div
            key={card.id}
            className="directmeet-card"
            onClick={() => navigate(card.path)}
            style={styles.card}
          >
            {/* Gradient Header */}
            <div style={{ ...styles.cardGradient, background: card.color }} />

            {/* Icon Circle */}
            <div style={styles.iconCircle}>
              <div style={{ ...styles.iconInner, background: card.color }}>
                <span style={styles.iconEmoji}>{card.icon}</span>
              </div>
            </div>

            {/* Card Content */}
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>{card.title}</h3>
              <p style={styles.cardDescription}>{card.description}</p>
              
              {/* Stats Badge */}
              <div style={styles.statsBadge}>
                <span style={styles.statsText}>{card.stats}</span>
              </div>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #f8fafc, #e2e8f0)",
    padding: "2rem 1rem",
  },
  header: {
    maxWidth: "1400px",
    margin: "0 auto 3rem",
    textAlign: "center",
  },
  headerContent: {
    background: "white",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "1rem",
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: "1.125rem",
    color: "#64748b",
    maxWidth: "700px",
    margin: "0 auto",
    lineHeight: 1.6,
  },
  grid: {
    maxWidth: "1400px",
    margin: "0 auto 3rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "2rem",
    padding: "0 1rem",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
  },
  cardGradient: {
    height: "8px",
    width: "100%",
  },
  iconCircle: {
    padding: "2rem 2rem 0",
    display: "flex",
    justifyContent: "center",
  },
  iconInner: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
  },
  iconEmoji: {
    fontSize: "2.5rem",
    lineHeight: 1,
  },
  cardContent: {
    padding: "1.5rem 2rem",
    flexGrow: 1,
    textAlign: "center",
  },
  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "0.75rem",
    lineHeight: 1.3,
  },
  cardDescription: {
    fontSize: "1rem",
    color: "#64748b",
    lineHeight: 1.6,
    marginBottom: "1rem",
  },
  statsBadge: {
    display: "inline-block",
    padding: "0.5rem 1rem",
    background: "#f1f5f9",
    borderRadius: "20px",
    marginTop: "0.5rem",
  },
  statsText: {
    fontSize: "0.875rem",
    color: "#475569",
    fontWeight: 600,
  },
  cardFooter: {
    padding: "0 2rem 2rem",
  },
  actionButton: {
    width: "100%",
    padding: "0.875rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s",
  },
  statsSection: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 1rem",
  },
  statsTitle: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
  },
  statCard: {
    background: "white",
    padding: "2rem",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    transition: "transform 0.2s",
  },
  statValue: {
    fontSize: "3rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.5rem",
  },
  statLabel: {
    fontSize: "1rem",
    color: "#64748b",
    fontWeight: 500,
  },
};

export default DirectMeetDashboard;
