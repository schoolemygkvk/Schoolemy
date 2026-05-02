/**
 * ISSUE #47 FIX 3.47.6: ProgressTracker Styles
 * Extracted styles for the progress tracker component
 */

export const styles = {
  container: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #ddd",
    padding: "16px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    marginBottom: "16px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "16px",
  },
  headerIcon: {
    fontSize: "20px",
    color: "#28a745",
    marginRight: "8px",
  },
  title: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#666",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  progressBarContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  progressBar: {
    flex: 1,
    height: "8px",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#28a745",
    transition: "width 0.3s ease",
  },
  progressLabel: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#333",
    minWidth: "32px",
    textAlign: "right",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  statCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: "6px",
    padding: "12px",
    textAlign: "center",
    border: "1px solid #eee",
  },
  statValue: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "12px",
    color: "#333",
    fontWeight: "500",
  },
  statMeta: {
    fontSize: "11px",
    color: "#999",
    marginTop: "2px",
  },
  completionMessage: {
    backgroundColor: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb",
    borderRadius: "6px",
    padding: "12px",
    textAlign: "center",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "500",
  },
  completionIcon: {
    fontSize: "18px",
  },
  completionSubtext: {
    fontSize: "12px",
    marginTop: "4px",
    display: "block",
  },
  motivationalMessage: {
    backgroundColor: "#fff3cd",
    color: "#856404",
    border: "1px solid #ffeaa7",
    borderRadius: "6px",
    padding: "10px 12px",
    textAlign: "center",
    marginBottom: "16px",
    fontSize: "13px",
  },
  statusBreakdown: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#333",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
};
