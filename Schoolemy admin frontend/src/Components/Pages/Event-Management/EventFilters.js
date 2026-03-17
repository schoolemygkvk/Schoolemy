import React from "react";

const EventFilters = ({ filters, setFilters }) => {
  return (
    <div style={styles.container}>
      <div style={styles.searchGroup}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          placeholder="Search events by name…"
          value={filters.search || ""}
          onChange={(e) =>
            setFilters({ ...filters, search: e.target.value || undefined })
          }
          style={styles.searchInput}
        />
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Status</label>
        <select
          value={filters.status || ""}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value || undefined })
          }
          style={styles.select}
        >
          <option value="">All status</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Category</label>
        <input
          placeholder="Filter by category"
          value={filters.category || ""}
          onChange={(e) =>
            setFilters({ ...filters, category: e.target.value || undefined })
          }
          style={styles.input}
        />
      </div>

      <button
        onClick={() => setFilters({})}
        style={styles.resetButton}
        title="Clear all filters"
      >
        Reset
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-end",
    marginBottom: "28px",
    flexWrap: "wrap",
    padding: "20px 24px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
  },
  searchGroup: {
    flex: "1 1 280px",
    minWidth: "200px",
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    opacity: 0.5,
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px 12px 44px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    background: "#f8fafc",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  select: {
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    background: "#fff",
    cursor: "pointer",
    outline: "none",
    minWidth: "140px",
  },
  input: {
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    background: "#fff",
    outline: "none",
    minWidth: "140px",
  },
  resetButton: {
    padding: "12px 20px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

export default EventFilters;
