import React, { useState } from "react";
import axios from "../../../Utils/api";

const CreateDecisionForm = () => {
  const [formData, setFormData] = useState({
    decisionTitle: "",
    decisionDetails: "",
    createdBy: "",
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post("/decision-post", formData);
      setMessage({ text: response.data.message, type: "success" });
      setFormData({
        decisionTitle: "",
        decisionDetails: "",
        createdBy: "",
      });
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Error submitting decision",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <style>{`
        .form-container {
          max-width: 800px;
          margin: 40px auto;
          padding: 40px;
          background: linear-gradient(145deg, #ffffff, #f8f9fa);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          font-family: 'Segoe UI', sans-serif;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .form-header {
          text-align: center;
          margin-bottom: 2.5rem;
          position: relative;
          padding-bottom: 1rem;
        }

        .form-title {
          color: #2c3e50;
          font-size: 28px;
          font-weight: 600;
          margin: 0;
        }

        .form-title-underline {
          height: 4px;
          width: 80px;
          background: linear-gradient(90deg, #3498db, #f1c40f, #e91e63);
          margin: 10px auto 0;
          border-radius: 2px;
        }

        .form-message {
          padding: 15px;
          margin-bottom: 25px;
          border-radius: 10px;
          text-align: left;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-message.success {
          background-color: #e8f5e9;
          color: #2e7d32;
          border-left: 4px solid #4caf50;
        }

        .form-message.error {
          background-color: #ffebee;
          color: #c62828;
          border-left: 4px solid #e91e63;
        }

        .decision-form {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 500;
          color: #2c3e50;
          font-size: 14px;
        }

        .form-group input,
        .form-group textarea {
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #dfe6e9;
          font-size: 15px;
          transition: all 0.3s ease;
          background-color: #fff;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 120px;
          line-height: 1.5;
        }

        .submit-btn {
          margin-top: 10px;
          padding: 14px;
          background: linear-gradient(135deg, #3b82f6 0%, #ec4899 100%);
          border: none;
          color: white;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          background: #a0aec0;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `}</style>

      <div className="form-header">
        <h2 className="form-title">Create New Decision</h2>
        <div className="form-title-underline"></div>
      </div>

      {message.text && (
        <div className={`form-message ${message.type}`}>
          {message.type === "success" ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="decision-form">
        <div className="form-group">
          <label>Decision Title</label>
          <input
            type="text"
            name="decisionTitle"
            value={formData.decisionTitle}
            onChange={handleChange}
            required
            placeholder="Enter the title of the decision"
          />
        </div>

        <div className="form-group">
          <label>Decision Details</label>
          <textarea
            name="decisionDetails"
            value={formData.decisionDetails}
            onChange={handleChange}
            required
            placeholder="Enter the detailed description of the decision"
            rows="6"
          />
        </div>

        <div className="form-group">
          <label>Created By</label>
          <input
            type="text"
            name="createdBy"
            value={formData.createdBy}
            onChange={handleChange}
            required
            placeholder="Enter your name or designation"
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={isLoading}
        >
          {isLoading ? 'Creating Decision...' : 'Create Decision'}
        </button>
      </form>
    </div>
  );
};

export default CreateDecisionForm;
