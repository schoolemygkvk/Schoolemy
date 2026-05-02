import React, { useState, useEffect } from "react";
import { FaHourglass } from "react-icons/fa";
import { styles } from "./ExamComponent.styles";

/**
 * ISSUE #47 FIX 3.47.7: ExamTimer Sub-component
 * Handles timer display and countdown
 * Responsibilities: Display remaining time, update color based on time left
 */

export function ExamTimer({
  examTimer,
  examStarted,
  examCompleted,
  onTimerTick,
  /** Total seconds for the current question (for color thresholds) */
  timeLimitSeconds = 120,
}) {
  const [timerColor, setTimerColor] = useState("#28a745");

  // Format timer display
  const formatTimerDisplay = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Get timer color based on fraction of per-question time remaining
  const getTimerColor = (timeRemaining, limit) => {
    const lim = Math.max(1, limit || 120);
    const r = timeRemaining / lim;
    if (r > 0.5) return "#28a745";
    if (r > 0.25) return "#ffc107";
    return "#dc3545";
  };

  // Update timer color
  useEffect(() => {
    setTimerColor(getTimerColor(examTimer, timeLimitSeconds));
  }, [examTimer, timeLimitSeconds]);

  return (
    <div style={styles.timerSection} title="Time left for this question">
      <FaHourglass style={{ ...styles.timerIcon, color: timerColor }} />
      <div style={{ ...styles.timer, color: timerColor }}>
        {formatTimerDisplay(examTimer)}
      </div>
    </div>
  );
}
