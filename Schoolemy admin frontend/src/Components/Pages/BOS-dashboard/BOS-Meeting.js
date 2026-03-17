import React, { useState, useEffect } from "react";
import axios from "../../../Utils/api";

const CreateMeetingForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    participants: [],
    location: "",
    agenda: "",
    quorum: "",
    plateform_link: "",
  });

  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("/get-admins", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAdmins(response.data);
      } catch (err) {
        setMessage({ text: "Error fetching admin data", type: "error" });
      }
    };
    fetchAdmins();
  }, []);

  const handleCheckboxChange = (email) => {
    setFormData((prev) => {
      const isSelected = prev.participants.includes(email);
      const updatedParticipants = isSelected
        ? prev.participants.filter((e) => e !== email)
        : [...prev.participants, email];
      return { ...prev, participants: updatedParticipants };
    });
  };

  const handleSelectAll = () => {
    setFormData((prev) => ({
      ...prev,
      participants: admins.map((admin) => admin.email),
    }));
  };

  const handleClearAll = () => {
    setFormData((prev) => ({ ...prev, participants: [] }));
  };

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
      const response = await axios.post("/create-meetings", formData);
      setMessage({ text: response.data.message, type: "success" });
      setFormData({
        title: "",
        date: "",
        time: "",
        participants: [],
        location: "",
        agenda: "",
        quorum: "",
        plateform_link: "",
      });
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Error submitting form",
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

        .back-button {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          padding: 8px 12px;
          background: #95a5a6;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 6px 18px rgba(0,0,0,0.06);
        }

        .back-button:hover{
          background: #7f8c8d;
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

        .meeting-form {
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

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
        }

        .button-row {
          display: flex;
          gap: 12px;
          margin-bottom: 15px;
        }

        .button-row button {
          padding: 8px 16px;
          border: none;
          background: #3498db;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .button-row button:hover {
          background: #2980b9;
          transform: translateY(-1px);
        }

        .participants-list {
          max-height: 250px;
          overflow-y: auto;
          border: 1px solid #dfe6e9;
          padding: 16px;
          border-radius: 8px;
          background-color: #fff;
          scrollbar-width: thin;
          scrollbar-color: #bdc3c7 #f1f1f1;
        }

        .participants-list::-webkit-scrollbar {
          width: 6px;
        }

        .participants-list::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .participants-list::-webkit-scrollbar-thumb {
          background: #bdc3c7;
          border-radius: 10px;
        }

        .participant-item {
          display: flex;
          align-items: center;
          padding: 8px;
          gap: 12px;
          font-size: 14px;
          color: #2c3e50;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .participant-item:hover {
          background-color: #f8f9fa;
        }

        .participant-item input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .participant-item span {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .participant-role {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;
          background-color: #e3f2fd;
          color: #1976d2;
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
        <button
          type="button"
          className="back-button"
          onClick={() => window.history.back()}
        >
          &#8592; Back
        </button>
        <h2 className="form-title">Schedule a New Meeting</h2>
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

      <form onSubmit={handleSubmit} className="meeting-form">
        <div className="form-group">
          <label>Meeting Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Participants</label>
          <div className="button-row">
            <button type="button" onClick={handleSelectAll}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Select All
            </button>
            <button type="button" onClick={handleClearAll}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
              Clear All
            </button>
          </div>
          <div className="participants-list">
            {admins.length === 0 ? (
              <p>No admin data available</p>
            ) : (
              admins.map((admin, idx) => (
                <label key={idx} className="participant-item">
                  <input
                    type="checkbox"
                    checked={formData.participants.includes(admin.email)}
                    onChange={() => handleCheckboxChange(admin.email)}
                  />
                  <span>
                    {admin.email}
                    <span className="participant-role">{admin.role}</span>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Agenda</label>
          <textarea
            name="agenda"
            value={formData.agenda}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Quorum Requirement</label>
            <input
              type="text"
              name="quorum"
              value={formData.quorum}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Platform Link</label>
            <input
              type="text"
              name="plateform_link"
              value={formData.plateform_link}
              onChange={handleChange}
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={isLoading}
        >
          {isLoading ? 'Creating Meeting...' : 'Create Meeting'}
        </button>
      </form>
    </div>
  );
};

export default CreateMeetingForm;
