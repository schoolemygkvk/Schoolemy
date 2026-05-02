import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./FinancialStyles.css";
import {
  createDonation,
  updateDonation,
  getDonation,
} from "../../../Utils/donationApi";

const DonationForm = () => {
  const { donationId } = useParams();
  const editMode = Boolean(donationId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    donorName: "",
    donorEmail: "",
    donorPhone: "",
    panNumber: "",
    amount: "",
    donationType: "Cash",
    category: "General",
    transactionId: "",
    upiId: "",
    chequeNumber: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    purpose: "",
    isAnonymous: false,
    status: "Completed",
  });

  const fetchDonation = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDonation(donationId);
      if (response?.data?.data) {
        const donation = response.data.data;
        setForm({
          donorName: donation.donorName || "",
          donorEmail: donation.donorEmail || "",
          donorPhone: donation.donorPhone || "",
          panNumber: donation.panNumber || "",
          amount: donation.amount || "",
          donationType: donation.donationType || "Cash",
          category: donation.category || "General",
          transactionId: donation.transactionId || "",
          upiId: donation.upiId || "",
          chequeNumber: donation.chequeNumber || "",
          date: donation.date
            ? new Date(donation.date).toISOString().split("T")[0]
            : "",
          description: donation.description || "",
          purpose: donation.purpose || "",
          isAnonymous: donation.isAnonymous || false,
          status: donation.status || "Completed",
        });
      }
    } catch (error) {
      console.error("Error fetching donation:", error);
      alert("Failed to fetch donation details");
    } finally {
      setLoading(false);
    }
  }, [donationId]);

  useEffect(() => {
    if (editMode) {
      fetchDonation();
    }
  }, [editMode, fetchDonation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Client-side validation: PAN required for non-anonymous donations
    if (!form.isAnonymous && !form.panNumber) {
      alert("PAN number is required for non-anonymous donations");
      setLoading(false);
      return;
    }

    try {
      if (editMode) {
        await updateDonation(donationId, form);
        alert("Donation updated successfully");
      } else {
        await createDonation(form);
        alert("Donation created successfully");
      }
      navigate("/schoolemy/financial-auditing");
    } catch (error) {
      console.error("Error saving donation:", error);
      alert("Failed to save donation");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <h2 style={styles.title}>
          {editMode ? "Edit Donation" : "Add New Donation"}
        </h2>

        {loading && <div style={styles.loading}>Loading...</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Donor Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="donorName"
                value={form.donorName}
                onChange={handleChange}
                required={!form.isAnonymous}
                disabled={form.isAnonymous}
                style={styles.input}
                placeholder="Enter donor name"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Donor Email</label>
              <input
                type="email"
                name="donorEmail"
                value={form.donorEmail}
                onChange={handleChange}
                disabled={form.isAnonymous}
                style={styles.input}
                placeholder="Enter email address"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Donor Phone</label>
              <input
                type="tel"
                name="donorPhone"
                value={form.donorPhone}
                onChange={handleChange}
                disabled={form.isAnonymous}
                style={styles.input}
                placeholder="Enter phone number"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={form.isAnonymous}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                Anonymous Donation
              </label>
            </div>

            {!form.isAnonymous && (
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  PAN Number <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={form.panNumber}
                  onChange={handleChange}
                  required={!form.isAnonymous}
                  style={styles.input}
                  placeholder="Enter PAN number"
                />
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Amount (₹) <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={styles.input}
                placeholder="Enter amount"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Donation Type <span style={styles.required}>*</span>
              </label>
              <select
                name="donationType"
                value={form.donationType}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="DD">DD</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>

              {(form.donationType === 'Online' || form.donationType === 'UPI') && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>UPI ID</label>
                  <input
                    type="text"
                    name="upiId"
                    value={form.upiId}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Enter UPI ID"
                  />
                </div>
              )}

              {(form.donationType === 'Cheque' || form.donationType === 'DD') && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Cheque / DD Number</label>
                  <input
                    type="text"
                    name="chequeNumber"
                    value={form.chequeNumber}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Enter cheque or DD number"
                  />
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Category <span style={styles.required}>*</span>
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="General">General</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Scholarship">Scholarship</option>
                <option value="Event">Event</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Transaction ID</label>
              <input
                type="text"
                name="transactionId"
                value={form.transactionId}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter transaction ID"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Date <span style={styles.required}>*</span>
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Purpose</label>
            <input
              type="text"
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter purpose of donation"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              style={styles.textarea}
              placeholder="Enter additional details"
            />
          </div>

          <div style={styles.buttonRow}>
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(14, 165, 233, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)';
              }}
            >
              {editMode ? "Update Donation" : "Create Donation"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={styles.cancelButton}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(108, 117, 125, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(108, 117, 125, 0.3)';
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
    padding: "40px 20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  wrapper: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  title: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: "36px",
    letterSpacing: "-1px",
    textAlign: "center",
  },
  loading: {
    textAlign: "center",
    padding: "24px",
    fontSize: "16px",
    color: "#666",
    backgroundColor: "#fff",
    borderRadius: "12px",
    marginBottom: "24px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
    fontWeight: "600",
  },
  form: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e5e7eb",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "28px",
    marginBottom: "28px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151",
    marginBottom: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  required: {
    color: "#ef4444",
    marginLeft: "4px",
  },
  input: {
    padding: "14px 18px",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.3s ease",
    fontWeight: "500",
    backgroundColor: "#f9fafb",
  },
  select: {
    padding: "14px 18px",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
    cursor: "pointer",
    fontWeight: "500",
    backgroundColor: "#f9fafb",
    transition: "all 0.3s ease",
  },
  textarea: {
    padding: "14px 18px",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    fontWeight: "500",
    backgroundColor: "#f9fafb",
    transition: "all 0.3s ease",
    minHeight: "120px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "600",
    color: "#374151",
    cursor: "pointer",
    padding: "14px 18px",
    backgroundColor: "#f9fafb",
    borderRadius: "10px",
    border: "2px solid #e5e7eb",
    transition: "all 0.3s ease",
  },
  checkbox: {
    marginRight: "12px",
    width: "20px",
    height: "20px",
    cursor: "pointer",
    accentColor: "#0ea5e9",
  },
  buttonRow: {
    display: "flex",
    gap: "16px",
    marginTop: "36px",
    justifyContent: "center",
  },
  submitButton: {
    padding: "16px 40px",
    background: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 6px 20px rgba(14, 165, 233, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    minWidth: "200px",
  },
  cancelButton: {
    padding: "16px 40px",
    background: "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 20px rgba(108, 117, 125, 0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    minWidth: "160px",
  },
};

export default DonationForm;
