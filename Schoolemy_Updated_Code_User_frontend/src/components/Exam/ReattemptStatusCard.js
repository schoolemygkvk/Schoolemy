import React, { useEffect, useState } from "react";
import api from "../../service/api";

/**
 * FIX 2.14: Reattempt Status Card Component
 *
 * Displays:
 * - Attempt counter (e.g., "Attempt 2 of 3")
 * - Reattempt eligibility status
 * - Cooldown timer if on cooldown
 * - Reason if blocked (attempts exhausted, low score, etc.)
 * - Disabled state for the reattempt button
 */

const theme = {
  colors: {
    primary: "#0862F7",
    secondary: "#1E3A8A",
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
    text: "#1E293B",
    textSecondary: "#475569",
    background: "#F8FAFC",
    cardBackground: "#FFFFFF",
    lightBlueBg: "#F0F6FF",
    lightGreen: "#DCFCE7",
    lightRed: "#FEE2E2",
    lightYellow: "#FEF3C7",
    border: "#E2E8F0",
  },
  spacing: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  borderRadius: "8px",
};

const ReattemptStatusCard = ({
  examId,
  attemptNumber = 1,
  maxAttempts = 3,
  onStatusChange = () => {},
  compact = false,
}) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cooldownTimer, setCooldownTimer] = useState(null);

  // Fetch reattempt status from backend
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/v1/exam/reattempt-status", {
          params: { examId },
        });

        if (response.data.success) {
          setStatus(response.data.data);
          onStatusChange(response.data.data);

          // If on cooldown, start countdown timer
          if (!response.data.data.canReattempt && response.data.data.details?.availableAt) {
            startCooldownTimer(new Date(response.data.data.details.availableAt));
          }
        }
      } catch (err) {
        console.error("Error fetching reattempt status:", err);
        setError(err.response?.data?.message || "Failed to fetch reattempt status");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchStatus();
    }
  }, [examId, onStatusChange]);

  // Cooldown timer countdown logic
  const startCooldownTimer = (availableAt) => {
    const updateTimer = () => {
      const now = new Date();
      const remaining = availableAt.getTime() - now.getTime();

      if (remaining <= 0) {
        setCooldownTimer(null);
        return; // Cooldown expired
      }

      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

      setCooldownTimer({ hours, minutes, seconds });
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    if (status?.details?.availableAt && !status?.canReattempt) {
      return startCooldownTimer(new Date(status.details.availableAt));
    }
  }, [status]);

  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.skeleton}>Loading status...</div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusColor = () => {
    if (status.canReattempt) return theme.colors.success;
    if (status.reason === "EXAM_ON_COOLDOWN") return theme.colors.warning;
    return theme.colors.error;
  };

  const getStatusBgColor = () => {
    if (status.canReattempt) return theme.colors.lightGreen;
    if (status.reason === "EXAM_ON_COOLDOWN") return theme.colors.lightYellow;
    return theme.colors.lightRed;
  };

  const styles = {
    card: {
      background: theme.colors.cardBackground,
      borderRadius: theme.borderRadius,
      border: `2px solid ${getStatusColor()}`,
      padding: compact ? theme.spacing.md : theme.spacing.lg,
      marginBottom: theme.spacing.md,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: compact ? theme.spacing.sm : theme.spacing.md,
    },
    attemptCounter: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    badge: {
      background: getStatusBgColor(),
      color: getStatusColor(),
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: 600,
    },
    statusBadge: {
      background: getStatusBgColor(),
      color: getStatusColor(),
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: 600,
      textTransform: "uppercase",
    },
    message: {
      color: theme.colors.text,
      fontSize: "14px",
      fontWeight: 500,
      marginTop: compact ? 0 : theme.spacing.sm,
    },
    reasonText: {
      color: theme.colors.textSecondary,
      fontSize: "13px",
      marginTop: theme.spacing.sm,
      lineHeight: 1.5,
    },
    timer: {
      background: theme.colors.lightYellow,
      color: theme.colors.text,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      borderRadius: "6px",
      marginTop: theme.spacing.md,
      textAlign: "center",
      fontSize: "14px",
      fontWeight: 600,
    },
    detailsContainer: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTop: `1px solid ${theme.colors.border}`,
    },
    detailRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: theme.spacing.xs,
      fontSize: "13px",
    },
    label: {
      color: theme.colors.textSecondary,
      fontWeight: 500,
    },
    value: {
      color: theme.colors.text,
      fontWeight: 600,
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.attemptCounter}>
          <span style={styles.message}>
            Attempt <strong>{attemptNumber}</strong> of <strong>{maxAttempts}</strong>
          </span>
          <span style={styles.statusBadge}>
            {status.canReattempt ? "Eligible" : status.reason}
          </span>
        </div>
      </div>

      <div style={styles.reasonText}>{status.message}</div>

      {/* Cooldown Timer */}
      {status.reason === "EXAM_ON_COOLDOWN" && cooldownTimer && (
        <div style={styles.timer}>
          Available in {cooldownTimer.hours}h {cooldownTimer.minutes}m {cooldownTimer.seconds}s
        </div>
      )}

      {/* Details Section */}
      {!compact && status.details && (
        <div style={styles.detailsContainer}>
          {status.details.currentAttempt !== undefined && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Current Attempt:</span>
              <span style={styles.value}>{status.details.currentAttempt}</span>
            </div>
          )}

          {status.details.maxAttempts !== undefined && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Maximum Attempts:</span>
              <span style={styles.value}>{status.details.maxAttempts}</span>
            </div>
          )}

          {status.details.attemptsRemaining !== undefined && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Attempts Remaining:</span>
              <span style={styles.value}>{status.details.attemptsRemaining}</span>
            </div>
          )}

          {status.details.cooldownPeriodHours !== undefined && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Cooldown Period:</span>
              <span style={styles.value}>{status.details.cooldownPeriodHours}h</span>
            </div>
          )}

          {status.details.lastScore !== undefined && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Last Score:</span>
              <span style={styles.value}>{status.details.lastScore.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReattemptStatusCard;
