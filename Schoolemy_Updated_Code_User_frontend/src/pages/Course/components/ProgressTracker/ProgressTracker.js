import React from "react";
import { BsCheck2All } from "react-icons/bs";
import { styles } from "./ProgressTracker.styles";
import { ProgressBar } from "./ProgressBar";

/**
 * ISSUE #47 FIX 3.47.6: Extracted ProgressTracker Component (Full Refactoring)
 * Handles progress display and statistics
 * Responsibilities: Show completion percentage, stats, progress bar
 */

export function ProgressTracker({ chapters, userProgress }) {
  if (!chapters || !userProgress) {
    return null;
  }

  // Calculate statistics
  const totalLessons = chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);
  const completedLessons = userProgress.completedLessons?.length || 0;
  const completionPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Count lessons with exams
  const chaptersWithExams = chapters.filter((ch) => ch.exam).length;
  const attemptedExams = Object.keys(userProgress.attemptedExams || {}).length;

  // Calculate course progress (lessons + exams)
  const totalCheckpoints = totalLessons + chaptersWithExams;
  const completedCheckpoints = completedLessons + attemptedExams;
  const overallProgress = totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <BsCheck2All style={styles.headerIcon} />
        <h3 style={styles.title}>Course Progress</h3>
      </div>

      {/* Main Progress Bar */}
      <ProgressBar title="Overall Progress" percentage={overallProgress} />

      {/* Statistics */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{completedLessons}</div>
          <div style={styles.statLabel}>Lessons Completed</div>
          <div style={styles.statMeta}>of {totalLessons}</div>
        </div>

        {chaptersWithExams > 0 && (
          <div style={styles.statCard}>
            <div style={styles.statValue}>{attemptedExams}</div>
            <div style={styles.statLabel}>Exams Attempted</div>
            <div style={styles.statMeta}>of {chaptersWithExams}</div>
          </div>
        )}

        <div style={styles.statCard}>
          <div style={styles.statValue}>{completionPercent}%</div>
          <div style={styles.statLabel}>Lessons Progress</div>
          <div style={styles.statMeta}>of lessons done</div>
        </div>
      </div>

      {/* Completion Message */}
      {overallProgress === 100 ? (
        <div style={styles.completionMessage}>
          <BsCheck2All style={styles.completionIcon} />
          <div>Course Completed!</div>
          <div style={styles.completionSubtext}>Congratulations on finishing this course!</div>
        </div>
      ) : overallProgress >= 75 ? (
        <div style={styles.motivationalMessage}>
          <span>You're {overallProgress}% done! Keep it up!</span>
        </div>
      ) : overallProgress >= 50 ? (
        <div style={styles.motivationalMessage}>
          <span>Halfway there! Continue your progress.</span>
        </div>
      ) : null}

      {/* Lessons Breakdown */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Lessons Status</div>
        <div style={styles.statusBreakdown}>
          <div style={styles.statusItem}>
            <div style={{ ...styles.statusDot, backgroundColor: "#28a745" }} />
            <span>Completed: {completedLessons}</span>
          </div>
          <div style={styles.statusItem}>
            <div style={{ ...styles.statusDot, backgroundColor: "#ffc107" }} />
            <span>In Progress: {Math.max(0, totalLessons - completedLessons)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
