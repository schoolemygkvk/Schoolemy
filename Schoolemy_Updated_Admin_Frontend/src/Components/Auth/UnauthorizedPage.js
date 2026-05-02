import React from "react";
import { useNavigate } from "react-router-dom";
import LockIcon from "@mui/icons-material/Lock";
import "./UnauthorizedPage.css";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/dashboard");
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <LockIcon className="unauthorized-icon" />
        <h1>Access Denied</h1>
        <p className="unauthorized-message">
          You do not have permission to access this page.
        </p>
        <p className="unauthorized-details">
          Your current role does not grant you access to this resource.
        </p>
        <div className="unauthorized-actions">
          <button onClick={handleGoBack} className="btn btn-secondary">
            Go Back
          </button>
          <button onClick={handleGoHome} className="btn btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
