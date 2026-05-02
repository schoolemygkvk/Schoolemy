import React from "react";
import { styles } from "./ProgressTracker.styles";

/**
 * ISSUE #47 FIX 3.47.6: ProgressBar Sub-component
 * Extracted visual progress bar component
 * Responsibilities: Display progress bar with percentage label
 */

export function ProgressBar({ title, percentage }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      <div style={styles.progressBarContainer}>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${percentage}%`,
            }}
          />
        </div>
        <div style={styles.progressLabel}>{percentage}%</div>
      </div>
    </div>
  );
}
