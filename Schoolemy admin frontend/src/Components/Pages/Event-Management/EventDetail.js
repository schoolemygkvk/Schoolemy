import React, { useEffect, useState } from "react";
import { getEvent, deleteEvent, getEventCoverImageSrc } from "../../../Utils/eventApi";
import { useParams, useNavigate } from "react-router-dom";

const EventDetail = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getEvent(eventId);
        if (res?.data) setEvent(res.data.data || res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await deleteEvent(eventId);
      navigate("..");
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    }
  };

  if (loading) return <div style={styles.loading}>Loading…</div>;
  if (!event) return <div style={styles.error}>Event not found</div>;

  const imgSrc = getEventCoverImageSrc(event.coverImages?.[0]);

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h2 style={styles.title}>{event.eventName}</h2>
          <div style={styles.actions}>
            <button
              onClick={() => navigate(`../edit/${event.eventId || event._id}`, { relative: "path" })}
              style={styles.editButton}
            >
              Edit Event
            </button>
            <button onClick={handleDelete} style={styles.deleteButton}>
              Delete
            </button>
          </div>
        </div>

        <div style={styles.coverWrapper}>
          {imgSrc ? (
            <img src={imgSrc} alt={event.eventName} style={styles.coverImage} />
          ) : (
            <div style={styles.noImage}>
              <span style={styles.noImageIcon}>📅</span>
              <span>No cover image</span>
            </div>
          )}
        </div>

        <div style={styles.details}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Event Details</h3>
            <div style={styles.detailGrid}>
              <div style={styles.detailItem}>
                <span style={styles.label}>Date & Time</span>
                <span style={styles.value}>
                  {event.date} • {event.time}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.label}>Venue</span>
                <span style={styles.value}>
                  {event.venue?.type} {event.venue?.location && `• ${event.venue.location}`}
                </span>
              </div>
              {event.organizer && (
                <div style={styles.detailItem}>
                  <span style={styles.label}>Organizer</span>
                  <span style={styles.value}>{event.organizer}</span>
                </div>
              )}
              {event.contactEmail && (
                <div style={styles.detailItem}>
                  <span style={styles.label}>Contact</span>
                  <span style={styles.value}>{event.contactEmail}</span>
                </div>
              )}
              {event.goal && (
                <div style={styles.detailItem}>
                  <span style={styles.label}>Goal</span>
                  <span style={styles.value}>{event.goal}</span>
                </div>
              )}
            </div>
          </div>

          {event.description && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Description</h3>
              <p style={styles.description}>{event.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    padding: "32px 24px",
  },
  wrapper: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    marginRight: "8px",
    backgroundColor: "#e5e7eb",
    color: "#374151",
    border: "1px solid #9ca3af",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
  },
  backIcon: {
    width: "18px",
    height: "18px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
  },
  statusBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
  editButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(13, 148, 136, 0.35)",
    transition: "all 0.2s ease",
  },
  deleteButton: {
    padding: "10px 20px",
    background: "#fff",
    color: "#dc2626",
    border: "2px solid #fecaca",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  coverWrapper: {
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
    marginBottom: "28px",
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    minHeight: "200px",
  },
  coverImage: {
    width: "100%",
    display: "block",
    maxHeight: "400px",
    objectFit: "cover",
  },
  noImage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
    color: "#94a3b8",
    fontSize: "16px",
    gap: "8px",
  },
  noImageIcon: {
    fontSize: "40px",
    opacity: 0.6,
  },
  details: {
    background: "#fff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  detailGrid: {
    display: "grid",
    gap: "16px",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  value: {
    fontSize: "16px",
    color: "#0f172a",
    fontWeight: "500",
  },
  description: {
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.7,
    color: "#334155",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "80px",
    fontSize: "16px",
    color: "#64748b",
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#0d9488",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  error: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "80px",
    fontSize: "18px",
    color: "#dc2626",
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #fecaca",
  },
  errorIcon: {
    fontSize: "32px",
  },
};

export default EventDetail;
