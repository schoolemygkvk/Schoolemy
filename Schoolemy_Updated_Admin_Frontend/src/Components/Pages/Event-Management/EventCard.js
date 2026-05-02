import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEventCoverImageSrc } from "../../../Utils/eventApi";

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const imgSrc = getEventCoverImageSrc(event.coverImages?.[0]);

  // Define statusStyle based on event.status
  let statusStyle = { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
  if (event.status === "active") {
    statusStyle = { bg: "#d1fae5", color: "#047857", border: "#10b981" };
  } else if (event.status === "inactive") {
    statusStyle = { bg: "#fee2e2", color: "#b91c1c", border: "#f87171" };
  } else if (event.status === "upcoming") {
    statusStyle = { bg: "#fef9c3", color: "#b45309", border: "#fde68a" };
  }

  return (
    <div
      className="event-card"
      style={{
        ...styles.card,
        ...(isHovered ? styles.cardHover : {}),
      }}
      onClick={() => navigate(`${event.eventId || event._id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.imageWrapper}>
        {imgSrc ? (
          <img src={imgSrc} alt={event.eventName} style={styles.image} />
        ) : (
          <div style={styles.noImage}>
            <span style={styles.noImageIcon}>📅</span>
            <span>No image</span>
          </div>
        )}
        <div
          style={{
            ...styles.statusBadge,
            background: statusStyle.bg,
            color: statusStyle.color,
            borderColor: statusStyle.border,
          }}
        >
          {event.status}
        </div>
      </div>
      <div style={styles.content}>
        <h3 style={styles.title}>{event.eventName}</h3>
        <div style={styles.meta}>
          <span style={styles.metaItem}>📅 {event.date}</span>
          <span style={styles.metaItem}>🕐 {event.time}</span>
          <span style={styles.metaItem}>📍 {event.venue?.type}</span>
        </div>
        <p style={styles.description}>
          {(event.description || "").slice(0, 100)}
          {event.description && event.description.length > 100 ? "…" : ""}
        </p>
      </div>
    </div>
  );
};

const styles = {
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    overflow: "hidden",
    cursor: "pointer",
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  cardHover: {
    transform: "translateY(-6px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: "160px",
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  noImage: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontSize: "14px",
    gap: "6px",
  },
  noImageIcon: {
    fontSize: "28px",
    opacity: 0.6,
  },
  statusBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
    border: "1px solid",
  },
  content: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: "1.35",
    letterSpacing: "-0.02em",
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    fontSize: "13px",
    color: "#64748b",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
  },
  description: {
    margin: 0,
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.5",
    flex: 1,
  },
};

export default EventCard;
