import React, { useState } from "react";
import axios from "../../../Utils/api";
import { useNavigate } from "react-router-dom";

const CreateMoMForm = () => {
  const [formData, setFormData] = useState({
    meeting_id: "",
    decisions: "",
    notes: "",
    action_items: "",
    uploaded_by: "",
  });

  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      action_items: formData.action_items
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      await axios.post("/create", payload);
      setMessage("Minutes of Meeting submitted successfully!");
      setFormData({
        meeting_id: "",
        decisions: "",
        notes: "",
        action_items: "",
        uploaded_by: "",
      });
      navigate("/schoolemy/view-bos-meeting");
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Failed to submit minutes of meeting"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.heading}>Create Minutes of Meeting</h2>
          <p style={styles.subHeading}>
            Document key decisions and action items
          </p>
        </div>

        {message && (
          <div
            style={{
              ...styles.message,
              ...(message.includes("success")
                ? styles.successMessage
                : styles.errorMessage),
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Meeting ID</label>
            <input
              type="text"
              name="meeting_id"
              value={formData.meeting_id}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Enter meeting ID"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Decisions Made</label>
            <textarea
              name="decisions"
              value={formData.decisions}
              onChange={handleChange}
              style={styles.textarea}
              required
              placeholder="List the key decisions from the meeting"
              rows="4"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Meeting Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Additional notes from the meeting"
              rows="4"
            />
            <p style={styles.hint}>
              Optional: Include any important discussion points
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Action Items</label>
            <input
              type="text"
              name="action_items"
              value={formData.action_items}
              onChange={handleChange}
              style={styles.input}
              placeholder="item 1, item 2, item 3"
            />
            <p style={styles.hint}>Separate multiple items with commas</p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Uploaded By</label>
            <input
              type="text"
              name="uploaded_by"
              value={formData.uploaded_by}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Your name or ID"
            />
          </div>

          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.button} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span style={styles.spinner}></span> Submitting...
                </>
              ) : (
                "Submit MoM"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modern, professional internal CSS
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "700px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  cardHeader: {
    padding: "28px 32px",
    background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #ec4899 100%)",
    color: "#ffffff",
  },
  heading: {
    margin: "0",
    fontSize: "24px",
    fontWeight: "600",
    letterSpacing: "0.5px",
  },
  subHeading: {
    margin: "8px 0 0",
    fontSize: "14px",
    opacity: "0.9",
    fontWeight: "400",
  },
  form: {
    padding: "32px",
  },
  formGroup: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
    transition: "border-color 0.3s, box-shadow 0.3s",
    boxSizing: "border-box",
  },
  inputFocus: {
    borderColor: "#4f46e5",
    boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
    transition: "border-color 0.3s, box-shadow 0.3s",
    resize: "vertical",
    minHeight: "100px",
    boxSizing: "border-box",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  hint: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#6b7280",
    fontStyle: "italic",
  },
  buttonGroup: {
    marginTop: "16px",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #ec4899 100%)",    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.2s",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonHover: {
    backgroundColor: "#4338ca",
    transform: "translateY(-1px)",
  },
  buttonDisabled: {
    backgroundColor: "#a5b4fc",
    cursor: "not-allowed",
  },
  message: {
    padding: "16px",
    margin: "0 32px 24px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    textAlign: "center",
  },
  successMessage: {
    backgroundColor: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
  },
  errorMessage: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    borderTopColor: "#ffffff",
    animation: "spin 1s ease-in-out infinite",
    marginRight: "8px",
  },
};

export default CreateMoMForm;
