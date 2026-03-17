import React, { useEffect, useState } from "react";
import axios from "../../../Utils/api";
import { Button, Spin, message, Tag, Modal, Input } from "antd";
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { TextArea } = Input;

const ViewCourseProposals = ({ showApproveReject = false }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState({
    visible: false,
    proposalId: null,
    proposalTitle: "",
    status: null,
    comments: "",
    loading: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await axios.get("/getproposal");
      setProposals(response.data);
    } catch (err) {
      message.error("Failed to fetch proposals.");
    } finally {
      setLoading(false);
    }
  };

  const openBase64PDF = (base64Data) => {
    if (!base64Data) {
      message.warning("No PDF data available");
      return;
    }

    try {
      const base64 = base64Data.replace(/^data:application\/pdf;base64,/, "");
      const byteCharacters = atob(base64);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (error) {
      message.error("Failed to open PDF file");
      console.error("PDF opening error:", error);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "#1890ff";
    
    switch (status.toLowerCase()) {
      case "approved":
        return "#52c41a";
      case "rejected":
        return "#f5222d";
      case "pending":
        return "#faad14";
      default:
        return "#1890ff";
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const openStatusModal = (proposal, status) => {
    setStatusModal({
      visible: true,
      proposalId: proposal.Proposal_id || proposal._id,
      proposalTitle: proposal.title || `Proposal #${proposal.Proposal_id}`,
      status,
      comments: "",
      loading: false,
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      visible: false,
      proposalId: null,
      proposalTitle: "",
      status: null,
      comments: "",
      loading: false,
    });
  };

  const handleStatusUpdate = async () => {
    const { proposalId, status, comments } = statusModal;
    setStatusModal((prev) => ({ ...prev, loading: true }));
    try {
      await axios.patch(`/updateproposal/${proposalId}/status`, {
        status,
        comments: comments || undefined,
      });
      message.success(`Proposal ${status} successfully`);
      closeStatusModal();
      fetchProposals();
    } catch (err) {
      message.error(err.response?.data?.error || `Failed to ${status} proposal`);
    } finally {
      setStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const isPending = (status) =>
    !status || status?.toLowerCase() === "pending";

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Spin size="large" tip="Loading proposals..." />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Section with Back Button */}
      <div style={styles.headerSection}>
        <Button 
          type="default" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={styles.backButton}
          size="large"
        >
          Back
        </Button>
        <div style={styles.headerContent}>
          <h1 style={styles.header}>Course Proposals</h1>
          <p style={styles.subHeader}>Review and manage all course proposals</p>
        </div>
      </div>

      {/* Proposals Grid */}
      {proposals.length === 0 ? (
        <div style={styles.emptyState}>
          <img
            src="https://img.icons8.com/fluent/96/000000/document.png"
            alt="No proposals"
            style={styles.emptyImage}
          />
          <p style={styles.emptyText}>No course proposals found</p>
          <Button 
            type="primary" 
            onClick={fetchProposals}
            style={styles.retryButton}
          >
            Refresh
          </Button>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={styles.statsContainer}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{proposals.length}</span>
              <span style={styles.statLabel}>Total Proposals</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>
                {proposals.filter(p => p.status?.toLowerCase() === 'pending').length}
              </span>
              <span style={styles.statLabel}>Pending</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>
                {proposals.filter(p => p.status?.toLowerCase() === 'approved').length}
              </span>
              <span style={styles.statLabel}>Approved</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>
                {proposals.filter(p => p.status?.toLowerCase() === 'rejected').length}
              </span>
              <span style={styles.statLabel}>Rejected</span>
            </div>
          </div>

          {/* Proposals Grid */}
          <div style={styles.grid}>
            {proposals.map((proposal) => (
              <div key={proposal.Proposal_id} style={styles.cardContainer}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleSection}>
                    <h3 style={styles.cardTitle}>
                      {proposal.title || `Proposal #${proposal.Proposal_id}`}
                    </h3>
                    <span style={styles.proposalId}>ID: {proposal.Proposal_id}</span>
                  </div>
                  <Tag color={getStatusColor(proposal.status)} style={styles.tag}>
                    {proposal.status || "Unknown"}
                  </Tag>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.detailItem}>
                    <span style={styles.label}>Description:</span>
                    <span style={styles.value}>
                      {proposal.description || "No description provided"}
                    </span>
                  </div>

                  <div style={styles.detailRow}>
                    <div style={styles.detailItem}>
                      <span style={styles.label}>Department:</span>
                      <span style={styles.value}>{proposal.department || "N/A"}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.label}>Submitted By:</span>
                      <span style={styles.value}>{proposal.Proposal_by || "Unknown"}</span>
                    </div>
                  </div>

                  {proposal.document_link && (
                    <div style={styles.detailItem}>
                      <span style={styles.label}>Document Link:</span>
                      <span style={styles.value}>
                        {proposal.document_link.length > 50 
                          ? `${proposal.document_link.substring(0, 50)}...` 
                          : proposal.document_link}
                      </span>
                    </div>
                  )}

                  <div style={styles.buttonGroup}>
                    {proposal.document_link && (
                      <Button
                        type="primary"
                        shape="round"
                        style={styles.blueButton}
                        onClick={() => window.open(proposal.document_link, "_blank")}
                        icon={<i className="fas fa-external-link-alt" style={{ marginRight: 5 }} />}
                      >
                        Open Link
                      </Button>
                    )}

                    {proposal.pdf_file && (
                      <Button
                        type="primary"
                        shape="round"
                        style={styles.pinkButton}
                        onClick={() => openBase64PDF(proposal.pdf_file)}
                        icon={<i className="fas fa-file-pdf" style={{ marginRight: 5 }} />}
                      >
                        View PDF
                      </Button>
                    )}

                    {!proposal.document_link && !proposal.pdf_file && (
                      <span style={styles.noFilesText}>No files attached</span>
                    )}
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <span style={styles.dateText}>
                      Submitted: {formatDate(proposal.submited_on)}
                    </span>
                    {showApproveReject && isPending(proposal.status) && (
                      <div style={styles.actionGroup}>
                        <Button
                          type="primary"
                          icon={<CheckOutlined />}
                          onClick={() => openStatusModal(proposal, "approved")}
                          style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                        >
                          Approve
                        </Button>
                        <Button
                          danger
                          icon={<CloseOutlined />}
                          onClick={() => openStatusModal(proposal, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal
        title={`${statusModal.status === "approved" ? "Approve" : "Reject"} Proposal`}
        open={statusModal.visible}
        onOk={handleStatusUpdate}
        onCancel={closeStatusModal}
        confirmLoading={statusModal.loading}
        okText={statusModal.status === "approved" ? "Approve" : "Reject"}
        okButtonProps={
          statusModal.status === "rejected"
            ? { danger: true }
            : { style: { backgroundColor: "#52c41a", borderColor: "#52c41a" } }
        }
      >
        <p>
          <strong>Proposal:</strong> {statusModal.proposalTitle}
        </p>
        <p style={{ marginBottom: "12px" }}>Comments (optional):</p>
        <TextArea
          rows={3}
          value={statusModal.comments}
          onChange={(e) =>
            setStatusModal((prev) => ({ ...prev, comments: e.target.value }))
          }
          placeholder="Add any comments for this decision..."
        />
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
  },
  headerSection: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "2rem",
    gap: "20px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600",
    padding: "8px 16px",
    height: "auto",
    borderRadius: "8px",
    border: "1px solid #d9d9d9",
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  headerContent: {
    flex: 1,
  },
  header: {
    color: "#2c3e50",
    fontSize: "2.2rem",
    fontWeight: "700",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #1890ff 0%, #52c41a 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subHeader: {
    color: "#6c757d",
    fontSize: "1.1rem",
    margin: "0",
    fontWeight: "400",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f5f7fa",
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "2rem",
  },
  statItem: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    border: "1px solid #e8e8e8",
  },
  statNumber: {
    display: "block",
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#1890ff",
    marginBottom: "8px",
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "#6c757d",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 40px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
    marginTop: "2rem",
  },
  emptyImage: {
    marginBottom: "24px",
    opacity: "0.6",
    width: "96px",
    height: "96px",
  },
  emptyText: {
    fontSize: "1.3rem",
    color: "#6c757d",
    marginBottom: "24px",
    fontWeight: "500",
  },
  retryButton: {
    padding: "10px 24px",
    height: "auto",
    borderRadius: "8px",
    fontWeight: "600",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
    gap: "25px",
  },
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    overflow: "hidden",
    transition: "all 0.3s ease",
    border: "1px solid #f0f0f0",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  cardHeader: {
    padding: "24px",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#fafdff",
  },
  cardTitleSection: {
    flex: 1,
    marginRight: "15px",
  },
  cardTitle: {
    margin: "0 0 8px 0",
    fontSize: "1.3rem",
    fontWeight: "600",
    color: "#2c3e50",
    lineHeight: "1.4",
  },
  proposalId: {
    fontSize: "0.85rem",
    color: "#6c757d",
    fontWeight: "500",
  },
  tag: {
    fontWeight: "600",
    fontSize: "0.8rem",
    padding: "6px 12px",
    borderRadius: "20px",
    minWidth: "80px",
    textAlign: "center",
    textTransform: "capitalize",
  },
  cardBody: {
    padding: "24px",
    flex: "1",
  },
  detailItem: {
    marginBottom: "16px",
  },
  detailRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  label: {
    fontWeight: "600",
    color: "#1890ff",
    display: "block",
    marginBottom: "4px",
    fontSize: "0.9rem",
  },
  value: {
    color: "#555",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  blueButton: {
    backgroundColor: "#1890ff",
    border: "none",
    fontWeight: "600",
    padding: "8px 16px",
    height: "auto",
    display: "flex",
    alignItems: "center",
  },
  pinkButton: {
    backgroundColor: "#ff69b4",
    border: "none",
    fontWeight: "600",
    padding: "8px 16px",
    height: "auto",
    display: "flex",
    alignItems: "center",
  },
  noFilesText: {
    color: "#6c757d",
    fontSize: "0.9rem",
    fontStyle: "italic",
  },
  cardFooter: {
    padding: "16px 24px",
    backgroundColor: "#f9f9f9",
    borderTop: "1px solid #f0f0f0",
  },
  actionGroup: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  dateText: {
    fontSize: "0.85rem",
    color: "#888",
    fontWeight: "500",
  },
};

// Add hover effects
const cardHoverStyles = `
  .ant-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.15);
  }
`;

// Inject hover styles
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(cardHoverStyles, styleSheet.cssRules.length);

export default ViewCourseProposals;