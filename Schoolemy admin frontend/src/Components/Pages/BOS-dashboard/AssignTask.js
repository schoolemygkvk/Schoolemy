import React, { useState } from "react";
import axios from "../../../Utils/api";
import { useNavigate } from "react-router-dom";

const AssignTaskForm = () => {
  const [formData, setFormData] = useState({
    meeting_id: "",
    assigned_to: "",
    description: "",
    due_date: "",
    status: "pending",
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

    try {
      await axios.post("/createtask", formData);
      setMessage("Task assigned successfully!");
      setFormData({
        meeting_id: "",
        assigned_to: "",
        description: "",
        due_date: "",
        status: "pending",
      });
      setTimeout(() => {
        navigate("/schoolemy/task-status");
      }, 2000);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Failed to assign task. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "overdue", label: "Overdue" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(59, 130, 246, 0.15)",
          width: "100%",
          maxWidth: "600px",
          overflow: "hidden",
          border: "1px solid #e0f2fe",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #ec4899 100%)",
            padding: "2rem",
            textAlign: "center",
            color: "white",
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              margin: "0 0 0.5rem 0",
            }}
          >
            Assign New Task
          </h1>
          <p
            style={{
              fontSize: "1rem",
              opacity: 0.9,
              margin: 0,
            }}
          >
            Create and assign tasks to BOS members
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "2rem" }}>
          {message && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                background: message.includes("successfully")
                  ? "#ecfdf5"
                  : "#fef2f2",
                color: message.includes("successfully") ? "#065f46" : "#991b1b",
                border: `1px solid ${
                  message.includes("successfully") ? "#10b981" : "#ef4444"
                }`,
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gap: "1.5rem",
              }}
            >
              {/* Meeting ID */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Meeting ID *
                </label>
                <input
                  type="text"
                  name="meeting_id"
                  value={formData.meeting_id}
                  onChange={handleChange}
                  required
                  placeholder="Enter meeting ID"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e1f5fe",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                    outline: "none",
                    ":focus": {
                      borderColor: "#3b82f6",
                    },
                  }}
                />
              </div>

              {/* Assigned To */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Assigned To *
                </label>
                <input
                  type="text"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  required
                  placeholder="Enter assignee name or email"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e1f5fe",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                    outline: "none",
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Task Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Describe the task in detail..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e1f5fe",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Due Date */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Due Date *
                </label>
                <input
                  type="datetime-local"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e1f5fe",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                    outline: "none",
                  }}
                />
              </div>

              {/* Status */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Initial Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e1f5fe",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                    outline: "none",
                    background: "white",
                  }}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/schoolemy/bos-dashboard")}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "2px solid #e1f5fe",
                  background: "white",
                  color: "#0891b2",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: isSubmitting
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #ec4899 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {isSubmitting ? (
                  <>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid #ffffff40",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Assigning...
                  </>
                ) : (
                  "Assign Task"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          input:focus, textarea:focus, select:focus {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.25);
          }
          
          button:first-of-type:hover {
            background: #f0f9ff !important;
            border-color: #0891b2 !important;
          }
        `}
      </style>
    </div>
  );
};

export default AssignTaskForm;
