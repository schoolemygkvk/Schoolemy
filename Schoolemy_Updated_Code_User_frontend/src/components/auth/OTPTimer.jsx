import React from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import { useOTPTimer } from "../../hooks/useOTPTimer";

/**
 * OTP Timer Component
 * Displays countdown timer and handles OTP expiry
 * Props:
 *  - initialSeconds: Initial OTP validity duration (default 300s = 5 min)
 *  - onExpire: Callback when OTP expires
 *  - onTimeChange: Callback when time changes (for validation)
 */
const OTPTimer = ({ initialSeconds = 300, onExpire, onTimeChange }) => {
  const {
    seconds,
    isExpired,
    formattedTime,
    timePercentage,
  } = useOTPTimer(initialSeconds);

  // Call onExpire callback when OTP expires
  React.useEffect(() => {
    if (isExpired && onExpire) {
      onExpire();
    }
  }, [isExpired, onExpire]);

  // Call onTimeChange callback on each tick
  React.useEffect(() => {
    if (onTimeChange) {
      onTimeChange(seconds);
    }
  }, [seconds, onTimeChange]);

  // Color changes based on time remaining
  let statusColor = "success";
  if (seconds <= 60) {
    statusColor = "warning"; // Orange: Less than 1 minute
  }
  if (seconds <= 30) {
    statusColor = "error"; // Red: Less than 30 seconds
  }
  if (isExpired) {
    statusColor = "error";
  }

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        borderRadius: 2,
        backgroundColor: isExpired ? "rgba(244, 67, 54, 0.08)" : "rgba(76, 175, 80, 0.08)",
        border: `1px solid ${isExpired ? "rgba(244, 67, 54, 0.3)" : "rgba(76, 175, 80, 0.3)"}`,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: "text.secondary",
            fontSize: "0.875rem",
          }}
        >
          {isExpired ? "OTP Expired" : "OTP Expires In"}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: statusColor === "error" ? "#f44336" : statusColor === "warning" ? "#ff9800" : "#4caf50",
            fontSize: "1.5rem",
            fontFamily: "monospace",
            letterSpacing: "2px",
          }}
        >
          {isExpired ? "00:00" : formattedTime}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={isExpired ? 0 : timePercentage}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(0, 0, 0, 0.08)",
          "& .MuiLinearProgress-bar": {
            borderRadius: 3,
            backgroundColor:
              statusColor === "error"
                ? "#f44336"
                : statusColor === "warning"
                ? "#ff9800"
                : "#4caf50",
            transition: "background-color 0.3s ease",
          },
        }}
      />

      {isExpired && (
        <Typography
          variant="caption"
          sx={{
            color: "#f44336",
            fontWeight: 600,
            textAlign: "center",
            mt: 1,
          }}
        >
          Request a new OTP to continue
        </Typography>
      )}

      {!isExpired && seconds <= 60 && (
        <Typography
          variant="caption"
          sx={{
            color: "#ff9800",
            fontWeight: 500,
            textAlign: "center",
            mt: 0.5,
          }}
        >
          {seconds <= 30 ? "OTP expiring soon" : "OTP expiring"}
        </Typography>
      )}
    </Box>
  );
};

export default OTPTimer;
