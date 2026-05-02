import React, { useEffect, useState } from "react";
import api from "../../service/api";

/**
 * FIX 2.14: Exam Completion Modal Component
 *
 * Displays after exam submission with:
 * - Score and result
 * - Pass/Fail status
 * - Reattempt eligibility
 * - Countdown timer if on cooldown
 * - Clear messaging about why reattempt is blocked
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
};

const ExamCompletionModal = ({
  isOpen,
  examResult,
  examId,
  courseId,
  onClose,
  onReattempt,
}) => {
  const [reattemptStatus, setReattemptStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(null);

  // Fetch reattempt status when modal opens
  useEffect(() => {
    if (isOpen && examId) {
      fetchReattemptStatus();
    }
  }, [isOpen, examId]);

  const fetchReattemptStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/exam/reattempt-status", {
        params: { examId },
      });

      if (response.data.success) {
        setReattemptStatus(response.data.data);

        // Start cooldown timer if applicable
        if (
          !response.data.data.canReattempt &&
          response.data.data.details?.availableAt
        ) {
          startCooldownTimer(new Date(response.data.data.details.availableAt));
        }
      }
    } catch (error) {
      console.error("Error fetching reattempt status:", error);
    } finally {
      setLoading(false);
    }
  };

  const startCooldownTimer = (availableAt) => {
    const updateTimer = () => {
      const now = new Date();
      const remaining = availableAt.getTime() - now.getTime();

      if (remaining <= 0) {
        setCooldownTimer(null);
        return;
      }

      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

      setCooldownTimer({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  };

  if (!isOpen) return null;

  const scorePercentage =
    examResult && examResult.totalMarks
      ? ((examResult.obtainedMarks / examResult.totalMarks) * 100).toFixed(1)
      : 0;

  const isPassed = scorePercentage >= (examResult?.passingScore || 50);

  const styles = {
    backdrop: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    },
    modal: {
      background: theme.colors.cardBackground,
      borderRadius: "16px",
      maxWidth: "600px",
      width: "90%",
      maxHeight: "90vh",
      overflow: "auto",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      animation: "slideIn 0.3s ease-out",
    },
    header: {
      padding: theme.spacing.xl,
      borderBottom: `1px solid ${theme.colors.border}`,
      textAlign: "center",
    },
    title: {
      fontSize: "24px",
      fontWeight: 700,
      color: theme.colors.secondary,
      marginBottom: theme.spacing.md,
    },
    resultContainer: {
      padding: theme.spacing.xl,
      background: theme.colors.background,
      textAlign: "center",
    },
    scoreDisplay: {
      fontSize: "48px",
      fontWeight: 700,
      color: isPassed ? theme.colors.success : theme.colors.error,
      marginBottom: theme.spacing.sm,
    },
    scoreLabel: {
      fontSize: "14px",
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xl,
    },
    statsRow: {
      display: "flex",
      justifyContent: "space-around",
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    statBox: {
      flex: 1,
      padding: theme.spacing.md,
      background: theme.colors.cardBackground,
      borderRadius: "8px",
      border: `1px solid ${theme.colors.border}`,
    },
    statLabel: {
      fontSize: "12px",
      color: theme.colors.textSecondary,
      fontWeight: 500,
      marginBottom: theme.spacing.xs,
    },
    statValue: {
      fontSize: "20px",
      fontWeight: 700,
      color: theme.colors.text,
    },
    reattemptSection: {
      padding: theme.spacing.xl,
      borderTop: `1px solid ${theme.colors.border}`,
    },
    reattemptTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    eligibleMessage: {
      background: theme.colors.lightGreen,
      color: theme.colors.success,
      padding: theme.spacing.md,
      borderRadius: "8px",
      marginBottom: theme.spacing.md,
      fontSize: "14px",
    },
    blockedMessage: {
      background: theme.colors.lightRed,
      color: theme.colors.error,
      padding: theme.spacing.md,
      borderRadius: "8px",
      marginBottom: theme.spacing.md,
      fontSize: "14px",
      lineHeight: 1.5,
    },
    warningMessage: {
      background: theme.colors.lightYellow,
      color: theme.colors.warning,
      padding: theme.spacing.md,
      borderRadius: "8px",
      marginBottom: theme.spacing.md,
      fontSize: "14px",
      lineHeight: 1.5,
    },
    cooldownTimer: {
      background: theme.colors.lightYellow,
      color: theme.colors.text,
      padding: theme.spacing.md,
      borderRadius: "8px",
      textAlign: "center",
      fontWeight: 600,
      marginBottom: theme.spacing.md,
    },
    actionButtons: {
      display: "flex",
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    button: {
      flex: 1,
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      borderRadius: "8px",
      border: "none",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    primaryButton: {
      background: theme.colors.primary,
      color: theme.colors.cardBackground,
    },
    secondaryButton: {
      background: theme.colors.border,
      color: theme.colors.text,
    },
    disabledButton: {
      background: theme.colors.border,
      color: theme.colors.textSecondary,
      cursor: "not-allowed",
      opacity: 0.6,
    },
  };

  const canReattempt = reattemptStatus?.canReattempt ?? false;
  const reattemptReason = reattemptStatus?.reason;

  return (
    <div style={styles.backdrop}>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            {isPassed ? "Exam Passed" : "Exam Completed"}
          </div>
        </div>

        {/* Result */}
        <div style={styles.resultContainer}>
          <div style={styles.scoreDisplay}>{scorePercentage}%</div>
          <div style={styles.scoreLabel}>
            {examResult?.obtainedMarks} / {examResult?.totalMarks} marks
          </div>

          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Correct</div>
              <div style={styles.statValue}>{examResult?.correctCount || 0}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Wrong</div>
              <div style={styles.statValue}>{examResult?.wrongCount || 0}</div>
            </div>
          </div>
        </div>

        {/* Reattempt Information */}
        <div style={styles.reattemptSection}>
          <div style={styles.reattemptTitle}>Reattempt Policy</div>

          {loading ? (
            <div style={styles.warningMessage}>Loading reattempt information...</div>
          ) : canReattempt ? (
            <>
              <div style={styles.eligibleMessage}>
                You are eligible to reattempt this exam. You have{" "}
                <strong>
                  {reattemptStatus?.details?.attemptsRemaining} attempt(s) remaining
                </strong>
                .
              </div>

              <div style={styles.actionButtons}>
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={() => onReattempt?.()}
                >
                  Reattempt Exam
                </button>
                <button
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onClick={onClose}
                >
                  Continue
                </button>
              </div>
            </>
          ) : reattemptReason === "EXAM_ON_COOLDOWN" ? (
            <>
              <div style={styles.warningMessage}>
                You must wait before retaking this exam. A cooldown period is in effect
                to ensure fair assessment.
              </div>

              {cooldownTimer && (
                <div style={styles.cooldownTimer}>
                  Available in {cooldownTimer.hours}h {cooldownTimer.minutes}m{" "}
                  {cooldownTimer.seconds}s
                </div>
              )}

              <div style={styles.actionButtons}>
                <button
                  style={{ ...styles.button, ...styles.disabledButton }}
                  disabled
                >
                  Reattempt (Cooldown Active)
                </button>
                <button
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={styles.blockedMessage}>
                {reattemptStatus?.message ||
                  "You are not eligible to reattempt this exam."}
              </div>

              {reattemptStatus?.details && (
                <div style={{ fontSize: "13px", color: theme.colors.textSecondary }}>
                  {reattemptStatus.reason === "EXAM_ATTEMPTS_EXHAUSTED" && (
                    <p>You have used all {reattemptStatus.details.maxAttempts} attempts.</p>
                  )}
                  {reattemptStatus.reason === "EXAM_SCORE_TOO_LOW" && (
                    <p>
                      Your score must be at least{" "}
                      {reattemptStatus.details.minScoreRequired}% to reattempt.
                    </p>
                  )}
                  {reattemptStatus.reason === "EXAM_ALREADY_PASSED" && (
                    <p>You have already passed this exam.</p>
                  )}
                </div>
              )}

              <div style={styles.actionButtons}>
                <button
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamCompletionModal;
