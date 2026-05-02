
export const DASHBOARD_STYLES = {
  container: {},
  contentWrapper: {},
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.02)",
    background: "white",
  },
  cardHeader: {
    borderBottom: "1px solid #e2e8f0",
    background: "linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)",
    borderRadius: "12px 12px 0 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: "white",
    margin: 0,
    fontWeight: 600,
  },
  cardBody: {},
  statCard: {
    display: "flex",
    alignItems: "center",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    height: "100%",
    transition: "all 0.3s ease",
    ":hover": {
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
      transform: "translateY(-2px)",
    },
  },
  clickableStatCard: {
    display: "flex",
    alignItems: "center",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    height: "100%",
    transition: "all 0.3s ease",
    cursor: "pointer",
    ":hover": {
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
      transform: "translateY(-2px)",
      borderColor: "#3b82f6",
    },
  },
  avatar: {
    backgroundColor: "#eff6ff",
    color: "#1e40af",
    flexShrink: 0,
  },
  statText: {
    color: "#1e293b",
    fontWeight: 500,
  },
  statValue: {
    color: "#1e40af",
    fontWeight: 600,
    marginTop: "4px",
  },
  chartTitle: {
    color: "#1e293b",
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "16px",
  },
  instructorCard: {
    textAlign: "center",
    border: "1px solid #e2e8f0",
    background: "white",
    borderRadius: "8px",
    height: "100%",
    transition: "all 0.3s ease",
    ":hover": {
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
    },
  },
  courseCard: {
    border: "1px solid #e2e8f0",
    background: "white",
    borderRadius: "8px",
    height: "100%",
    transition: "all 0.3s ease",
    ":hover": {
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
    },
  },
  testimonialCard: {
    height: "100%",
    border: "1px solid #e2e8f0",
    background: "white",
    borderRadius: "8px",
    padding: "16px",
  },
  testimonialQuote: {
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "8px",
    marginBottom: "16px",
    borderLeft: "4px solid #3b82f6",
  },
  sectionTitle: {
    color: "#1e40af",
    marginBottom: "24px",
    fontWeight: 600,
  },
  blueText: {
    color: "#1e40af",
  },
  lightBlueBg: {
    background: "#eff6ff",
  },
};

export const headerLogoBoxStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "white",
  borderRadius: "8px",
  padding: "4px 8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
};

export const headerLogoImgStyle = {
  height: "30px",
  width: "auto",
  maxWidth: "100px",
  objectFit: "contain",
};
