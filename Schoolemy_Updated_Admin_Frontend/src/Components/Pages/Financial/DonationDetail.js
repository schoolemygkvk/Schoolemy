import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDonation } from "../../../Utils/donationApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import logo from "../../../assets/Irai-niyathi-arakattalai-logo.jpeg";

const DonationDetail = () => {
  const { donationId } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchDonation = useCallback(async () => {
    try {
      const response = await getDonation(donationId);
      setDonation(response.data.data);
      setError('');
    } catch (error) {
      console.error("Error fetching donation:", error);
      setError("Failed to fetch donation details");
    } finally {
      setLoading(false);
    }
  }, [donationId]);

  useEffect(() => {
    fetchDonation();
  }, [fetchDonation]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSimpleDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const downloadBill = async () => {
    setDownloading(true);
    setError('');
    try {
      const voucherElement = document.getElementById('voucher-template');
      if (!voucherElement) {
        setError('Voucher template not found. Please try again.');
        setDownloading(false);
        return;
      }

      // Wait a moment for rendering
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(voucherElement, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: voucherElement.scrollWidth,
        height: voucherElement.scrollHeight,
        windowWidth: voucherElement.scrollWidth,
        windowHeight: voucherElement.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate proper dimensions to fit the voucher
      const margin = 10;
      const availableWidth = pdfWidth - (2 * margin);
      const availableHeight = pdfHeight - (2 * margin);
      
      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Center vertically if there's extra space
      const yPosition = imgHeight < availableHeight ? (pdfHeight - imgHeight) / 2 : margin;

      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      pdf.save(`Donation_Voucher_${donation.receiptNumber || donationId}.pdf`);

      setSuccessMessage('Voucher downloaded successfully!');
      setError('');
      setShowPreview(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMsg = `Failed to download voucher: ${error.message}. Please try again.`;
      setError(errorMsg);
      setSuccessMessage('');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!donation) {
    return <div style={styles.error}>Donation not found</div>;
  }

  return (
    <>
      {/* Preview Modal */}
      {showPreview && (
        <div style={styles.previewModal}>
          <div style={styles.previewContent}>
            <div style={styles.previewHeader}>
              <h2 style={styles.previewTitle}>Voucher Preview</h2>
              <button onClick={() => setShowPreview(false)} style={styles.closeButton}>×</button>
            </div>
            
            <div style={styles.previewBody}>
              {/* Voucher Template */}
              <div id="voucher-template" style={styles.voucherTemplate}>
                {/* Header Section */}
                <div style={styles.voucherHeader}>
                  <div style={styles.voucherLogo}>
                    <img src={logo} alt="Logo" style={styles.logoImage} />
                  </div>
                  <div style={styles.voucherTitle}>
                    <div style={styles.voucherReference}>பதிவு எண் : R/Signallur/Book-4/246/2021</div>
                    <div style={styles.voucherReference}>DOCUMENT UNIQUE ID : TN/2023/0362924</div>
                    <div style={styles.voucherOrgName}>இறை நியதி அறக்கட்டளை</div>
                    <div style={styles.voucherOrgNameEn}>IRAI NIYATHI ARAKATTALAI</div>
                    <div style={styles.voucherAddress}>No.07, First Floor, Sivarathiinam Complex, Near Register Office,</div>
                    <div style={styles.voucherAddress}>Vellalore, COIMBATORE - 641111.</div>
                    <div style={styles.voucherContact}>📞 97894 85258     ✉ irainiyathiarakattalai@gmail.com</div>
                  </div>
                  <div style={styles.voucherRight}>
                    <div style={styles.voucherBadge}>VOUCHER</div>
                    <div style={styles.voucherNo}>No. : {donation.receiptNumber}</div>
                    <div style={styles.voucherDate}>Date : {formatSimpleDate(donation.date)}</div>
                  </div>
                </div>

                {/* Body Section */}
                <div style={styles.voucherBody}>
                  <div style={styles.voucherField}>
                    <span style={styles.voucherLabel}>Receiver</span>
                    <div style={styles.voucherValue}>{donation.isAnonymous ? 'Anonymous Donor' : donation.donorName}</div>
                  </div>
                  
                  <div style={styles.voucherField}>
                    <span style={styles.voucherLabel}>Amount</span>
                    <div style={styles.voucherValue}>{formatCurrency(donation.amount)}</div>
                  </div>
                  
                  <div style={styles.voucherField}>
                    <span style={styles.voucherLabel}>Details</span>
                    <div style={styles.voucherValue}>
                      {donation.description || `Donation - ${donation.category} (${donation.donationType})${donation.purpose ? ` - ${donation.purpose}` : ''}`}
                    </div>
                  </div>

                  {donation.transactionId && (
                    <div style={styles.voucherField}>
                      <span style={styles.voucherLabel}>Transaction ID</span>
                      <div style={styles.voucherValue}>{donation.transactionId}</div>
                    </div>
                  )}

                  <div style={styles.voucherDotLine}></div>
                  
                  <div style={styles.voucherField}>
                    <span style={styles.voucherLabel}>Cheque / DD / Cash / UPI ID</span>
                    <div style={styles.voucherValue}>{donation.paymentMethod || 'Cash'}</div>
                  </div>

                  {/* Footer Section */}
                  <div style={styles.voucherFooter}>
                    <div style={styles.voucherAmount}>
                      <div style={styles.rsBox}>Rs. {donation.amount}</div>
                      <div style={styles.voucherNote}>*Cheque Subject to realisation</div>
                    </div>
                    <div style={styles.voucherSignature}>
                      <div style={styles.signatureLabel}>Passed by</div>
                    </div>
                    <div style={styles.voucherSignature}>
                      <div style={styles.signatureBox}></div>
                      <div style={styles.signatureLabel}>Receiver's Signature</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={styles.previewActions}>
              <button onClick={() => setShowPreview(false)} style={styles.cancelButton} disabled={downloading}>Cancel</button>
              <button onClick={downloadBill} style={styles.downloadButtonModal} disabled={downloading}>
                {downloading ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 style={styles.title}>Donation Details</h1>
        <div style={styles.buttonGroup}>
          <button
            style={styles.downloadButton}
            onClick={handlePreview}
          >
            📄 Preview & Download
          </button>
          <button
            style={styles.editButton}
            onClick={() => navigate(`/schoolemy/donation/edit/${donationId}`)}
          >
            Edit
          </button>
        </div>
      </div>

      {successMessage && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: '#d1fae5',
          border: '1px solid #10b981',
          color: '#065f46',
          borderRadius: '8px',
          fontSize: '0.95rem'
        }}>
          {successMessage}
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#7f1d1d',
          borderRadius: '8px',
          fontSize: '0.95rem'
        }}>
          {error}
        </div>
      )}

      <div id="donation-bill" style={styles.card}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Receipt Number:</span>
              <span style={styles.fieldValue}>{donation.receiptNumber}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Amount:</span>
              <span style={{ ...styles.fieldValue, ...styles.amountValue }}>
                {formatCurrency(donation.amount)}
              </span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Status:</span>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(donation.status),
                }}
              >
                {donation.status}
              </span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Date:</span>
              <span style={styles.fieldValue}>
                {formatDate(donation.date)}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Donor Information</h2>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Name:</span>
              <span style={styles.fieldValue}>
                {donation.isAnonymous ? "Anonymous" : donation.donorName}
              </span>
            </div>
            {!donation.isAnonymous && (
              <>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Email:</span>
                  <span style={styles.fieldValue}>
                    {donation.donorEmail || "N/A"}
                  </span>
                </div>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Phone:</span>
                  <span style={styles.fieldValue}>
                    {donation.donorPhone || "N/A"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Transaction Details</h2>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Donation Type:</span>
              <span style={styles.fieldValue}>{donation.donationType}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Category:</span>
              <span style={styles.fieldValue}>{donation.category}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Transaction ID:</span>
              <span style={styles.fieldValue}>
                {donation.transactionId || "N/A"}
              </span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>Purpose:</span>
              <span style={styles.fieldValue}>
                {donation.purpose || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {donation.description && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Description</h2>
            <p style={styles.description}>{donation.description}</p>
          </div>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Audit Trail</h2>
          <div style={styles.auditList}>
            {donation.auditLog?.map((log, index) => (
              <div key={index} style={styles.auditItem}>
                <div style={styles.auditAction}>{log.action}</div>
                <div style={styles.auditDetails}>
                  <span style={styles.auditUser}>
                    By: {log.performedBy?.name || "System"}
                  </span>
                  <span style={styles.auditTime}>
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {donation.createdBy && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Created By</h2>
            <div style={styles.grid}>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Name:</span>
                <span style={styles.fieldValue}>
                  {donation.createdBy.name}
                </span>
              </div>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Email:</span>
                <span style={styles.fieldValue}>
                  {donation.createdBy.email}
                </span>
              </div>
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Role:</span>
                <span style={styles.fieldValue}>
                  {donation.createdBy.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

const getStatusColor = (status) => {
  const colors = {
    Completed: "#10b981",
    Verified: "#3b82f6",
    Pending: "#f59e0b",
    Cancelled: "#ef4444",
  };
  return colors[status] || "#6b7280";
};

const styles = {
  container: {
    padding: "24px",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  backButton: {
    padding: "10px 20px",
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a1a1a",
  },
  editButton: {
    padding: "10px 20px",
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
  },
  downloadButton: {
    padding: "10px 20px",
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 2px 20px rgba(0, 0, 0, 0.08)",
  },
  section: {
    marginBottom: "32px",
    paddingBottom: "32px",
    borderBottom: "1px solid #e1e5e9",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  fieldLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: "16px",
    color: "#1a1a1a",
  },
  amountValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#10b981",
  },
  statusBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    width: "fit-content",
  },
  description: {
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: "1.6",
  },
  auditList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  auditItem: {
    padding: "16px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    borderLeft: "4px solid #667eea",
  },
  auditAction: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "8px",
  },
  auditDetails: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#6b7280",
  },
  auditUser: {
    fontWeight: "500",
  },
  auditTime: {
    fontStyle: "italic",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px",
    color: "#6b7280",
  },
  error: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px",
    color: "#ef4444",
  },
  // Preview Modal Styles
  previewModal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  },
  previewContent: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    maxWidth: "900px",
    width: "100%",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e1e5e9",
  },
  previewTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: 0,
  },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: "32px",
    color: "#6b7280",
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  },
  previewBody: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  previewActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "20px 24px",
    borderTop: "1px solid #e1e5e9",
  },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#fff",
    color: "#495057",
    border: "1px solid #dee2e6",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  downloadButtonModal: {
    padding: "10px 20px",
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    opacity: 1,
    transition: "opacity 0.3s",
  },
  // Voucher Template Styles
  voucherTemplate: {
    width: "750px",
    maxWidth: "750px",
    backgroundColor: "#fff",
    border: "2px solid #343A61",
    fontFamily: "Arial, sans-serif",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  voucherHeader: {
    display: "flex",
    alignItems: "center",
    borderBottom: "2px solid #343A61",
    padding: "15px",
    gap: "15px",
  },
  voucherLogo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "150px",
    maxWidth: "150px",
  },
  logoImage: {
    width: "140px",
    height: "140px",
    objectFit: "contain",
    backgroundColor: "transparent",
    border: "2px solid #343A61",
    borderRadius: "8px",
    padding: "5px",
  },
  voucherTitle: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingLeft: "10px",
  },
  voucherReference: {
    fontSize: "10px",
    color: "#666",
  },
  voucherOrgName: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#343A61",
    marginTop: "5px",
  },
  voucherOrgNameEn: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#343A61",
    letterSpacing: "1px",
  },
  voucherAddress: {
    fontSize: "11px",
    color: "#343A61",
  },
  voucherContact: {
    fontSize: "11px",
    color: "#343A61",
    marginTop: "3px",
  },
  voucherRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: "120px",
    gap: "6px",
  },
  voucherBadge: {
    backgroundColor: "#343A61",
    color: "#fff",
    padding: "5px 12px",
    fontSize: "13px",
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
  },
  voucherNo: {
    backgroundColor: "#e2e8f0",
    padding: "5px 8px",
    fontSize: "11px",
    fontWeight: "bold",
    width: "100%",
    textAlign: "center",
  },
  voucherDate: {
    backgroundColor: "#e2e8f0",
    padding: "5px 8px",
    fontSize: "11px",
    fontWeight: "bold",
    width: "100%",
    textAlign: "center",
  },
  voucherBody: {
    padding: "25px 30px",
  },
  voucherField: {
    marginBottom: "18px",
  },
  voucherLabel: {
    fontSize: "14px",
    fontStyle: "italic",
    color: "#4a5568",
    fontWeight: "600",
    display: "block",
    marginBottom: "8px",
  },
  voucherValue: {
    fontSize: "16px",
    color: "#000",
    borderBottom: "1px dotted #343A61",
    paddingBottom: "10px",
    minHeight: "26px",
    fontWeight: "500",
    display: "block",
  },
  voucherDotLine: {
    borderTop: "1px dotted #343A61",
    margin: "20px 0",
  },
  voucherFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "40px",
    paddingTop: "20px",
    gap: "20px",
  },
  voucherAmount: {
    flex: 1,
  },
  rsBox: {
    backgroundColor: "#343A61",
    color: "#fff",
    padding: "15px 20px",
    fontSize: "20px",
    fontWeight: "bold",
    display: "inline-block",
    marginBottom: "10px",
  },
  voucherNote: {
    fontSize: "10px",
    color: "#666",
    fontStyle: "italic",
  },
  voucherSignature: {
    textAlign: "center",
    minWidth: "150px",
  },
  signatureBox: {
    width: "120px",
    height: "60px",
    border: "2px solid #343A61",
    marginBottom: "5px",
  },
  signatureLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#343A61",
  },
};

export default DonationDetail;
