import React, { useEffect, useState } from "react";
import { listEvents } from "../../../Utils/eventApi";
import EventCard from "./EventCard";
import EventFilters from "./EventFilters";
import { useNavigate } from "react-router-dom";

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();

  const fetch = async (page = 1, limit = 10, filtersArg = filters) => {
    setLoading(true);
    try {
      const params = { page, limit, ...filtersArg };
      const res = await listEvents(params);
      if (res?.data) {
        const data = res.data.data || res.data.events || [];
        setEvents(data);
        const pag = res.data.pagination || {
          page,
          limit,
          total: res.data.count || data.length,
        };
        setPagination({
          page: pag.page || page,
          limit: pag.limit || limit,
          total: pag.total || data.length,
        });
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("fetch events", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(1, pagination.limit, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const totalPages = Math.max(
    1,
    Math.ceil((pagination.total || 0) / (pagination.limit || 1))
  );

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.pageHeader}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>Events</h1>
            <p style={styles.subtitle}>
              Manage and organize your school events
            </p>
          </div>
          <button
            onClick={() => navigate("create")}
            style={styles.createButton}
          >
            + Create Event
          </button>
        </div>

        <EventFilters filters={filters} setFilters={setFilters} />

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <span>Loading events…</span>
          </div>
        ) : (
          <>
            <div style={styles.eventsGrid}>
              {events.length === 0 ? (
                <div style={styles.noEvents}>
                  <span style={styles.noEventsIcon}>📋</span>
                  <h3 style={styles.noEventsTitle}>No events found</h3>
                  <p style={styles.noEventsText}>
                    {Object.keys(filters).length
                      ? "Try adjusting your filters or create a new event."
                      : "Create your first event to get started."}
                  </p>
                </div>
              ) : (
                events.map((ev) => (
                  <EventCard key={ev.eventId || ev._id} event={ev} />
                ))
              )}
            </div>

            {events.length > 0 && (
              <div style={styles.pagination}>
                <button
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    fetch(Math.max(1, pagination.page - 1), pagination.limit)
                  }
                  style={{
                    ...styles.pageButton,
                    ...(pagination.page <= 1 ? styles.pageButtonDisabled : {}),
                  }}
                >
                  ← Previous
                </button>
                <div style={styles.pageInfo}>
                  Page {pagination.page} of {totalPages}
                </div>
                <button
                  disabled={pagination.page >= totalPages}
                  onClick={() => fetch(pagination.page + 1, pagination.limit)}
                  style={{
                    ...styles.pageButton,
                    ...(pagination.page >= totalPages
                      ? styles.pageButtonDisabled
                      : {}),
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
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
    maxWidth: "1200px",
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
    gap: "24px",
    flexWrap: "wrap",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    margin: "0 0 4px 0",
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },
  subtitle: {
    margin: 0,
    fontSize: "15px",
    color: "#64748b",
  },
  createButton: {
    padding: "14px 24px",
    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(13, 148, 136, 0.35)",
    transition: "all 0.2s ease",
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
  eventsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "40px",
  },
  noEvents: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px",
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
  },
  noEventsIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    opacity: 0.6,
  },
  noEventsTitle: {
    margin: "0 0 8px 0",
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
  },
  noEventsText: {
    margin: 0,
    fontSize: "15px",
    color: "#64748b",
  },
  pagination: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
  },
  pageButton: {
    padding: "12px 20px",
    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(13, 148, 136, 0.3)",
    transition: "all 0.2s ease",
  },
  pageButtonDisabled: {
    background: "#e2e8f0",
    color: "#94a3b8",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  pageInfo: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600",
  },
};

export default EventList;
