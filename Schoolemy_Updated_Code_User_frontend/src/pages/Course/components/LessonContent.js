import React, { useState } from "react";
import { FaCheckCircle, FaLock, FaPlay, FaPause, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { IoMdTime } from "react-icons/io";

/**
 * ISSUE #47 FIX 3.47.3: Extracted LessonContent Component
 * Handles lesson content display, audio list, and lesson navigation
 * Responsibilities: Display audio files, manage tab view, lesson navigation
 */

export function LessonContent({
  currentLesson,
  selectedLesson,
  completedAudioFiles,
  currentAudioFileIndex,
  isPlaying,
  isAudioUnlocked,
  onAudioItemClick,
  onNextLesson,
  onPreviousLesson,
  getNextLesson,
  getPreviousLesson,
  isCurrentLessonAudioCompleted,
  isMobile,
  activeColors,
  theme,
}) {
  const [activeTab, setActiveTab] = useState("playlist");
  const [expandedChapter, setExpandedChapter] = useState(null);

  if (!currentLesson) {
    return <div style={styles.container}>No lesson selected</div>;
  }

  const hasAudioFiles = currentLesson?.audioFile?.length > 0;

  return (
    <div style={styles.container}>
      {/* Audio Progress Header - Always Visible */}
      {hasAudioFiles && (
        <div style={{
          padding: "14px 16px",
          backgroundColor: "#f0f8ff",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "2px solid #007bff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontSize: "0.85rem", color: "#555", marginBottom: "8px", fontWeight: 500 }}>
            📚 LESSON AUDIO PROGRESS
          </div>
          <div style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#007bff",
            marginBottom: "8px"
          }}>
            Audio {currentAudioFileIndex + 1} of {currentLesson.audioFile.length}
          </div>
          <div style={{
            height: "6px",
            backgroundColor: "#e0e0e0",
            borderRadius: "3px",
            overflow: "hidden"
          }}>
            <div style={{
              height: "100%",
              backgroundColor: "#28a745",
              width: `${((currentAudioFileIndex + 1) / currentLesson.audioFile.length) * 100}%`,
              transition: "width 0.3s ease"
            }}></div>
          </div>
          <div style={{
            fontSize: "0.8rem",
            color: "#666",
            marginTop: "6px",
            textAlign: "right"
          }}>
            {currentAudioFileIndex + 1} / {currentLesson.audioFile.length} completed
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          style={
            activeTab === "playlist"
              ? { ...styles.tabButton, ...styles.activeTabButton }
              : styles.tabButton
          }
          onClick={() => setActiveTab("playlist")}
        >
          Lesson Content
        </button>
        <button
          style={
            activeTab === "courseContent"
              ? { ...styles.tabButton, ...styles.activeTabButton }
              : styles.tabButton
          }
          onClick={() => setActiveTab("courseContent")}
        >
          Course Outline
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContentContainer}>
        {activeTab === "playlist" && (
          <div>
            {/* Audio List */}
            {hasAudioFiles && (
              <div style={styles.audioList}>
                {currentLesson.audioFile.map((audio, i) => {
                  const audioKey = `${selectedLesson.chapterIndex}-${selectedLesson.lessonIndex}-${i}`;
                  const isCompleted = completedAudioFiles[audioKey];
                  const isActive = currentAudioFileIndex === i;
                  const isUnlocked = isAudioUnlocked(i);

                  return (
                    <div
                      key={audio.url || i}
                      style={{
                        ...styles.audioItem,
                        ...(isActive ? styles.activeAudioItem : {}),
                        ...(isCompleted && !isActive
                          ? {
                              backgroundColor: "#d4edda",
                              borderColor: "#28a745",
                              opacity: 0.8,
                            }
                          : {}),
                        ...(!isUnlocked
                          ? {
                              backgroundColor: "#f8f9fa",
                              borderColor: "#dee2e6",
                              opacity: 0.5,
                              cursor: "not-allowed",
                            }
                          : {}),
                      }}
                      onClick={() => isUnlocked && onAudioItemClick(i)}
                    >
                      <div style={styles.audioItemInfo}>
                        <div
                          style={{
                            ...styles.audioItemTitle,
                            color: isActive
                              ? activeColors.white
                              : !isUnlocked
                                ? "#6c757d"
                                : activeColors.textDark,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {isCompleted && (
                            <FaCheckCircle
                              style={{
                                color: "#28a745",
                                fontSize: "0.9rem",
                              }}
                            />
                          )}
                          {!isUnlocked && (
                            <FaLock
                              style={{
                                color: "#6c757d",
                                fontSize: "0.8rem",
                              }}
                            />
                          )}
                          {audio.name}
                        </div>
                        <div
                          style={{
                            ...styles.audioItemMeta,
                            color: isActive
                              ? activeColors.lightGray
                              : !isUnlocked
                                ? "#6c757d"
                                : activeColors.gray,
                          }}
                        >
                          <IoMdTime /> {formatTime(audio.duration || 0)}
                          {isCompleted && (
                            <span
                              style={{
                                marginLeft: "8px",
                                color: "#28a745",
                                fontWeight: 600,
                              }}
                            >
                              Completed
                            </span>
                          )}
                          {!isUnlocked && (
                            <span
                              style={{
                                marginLeft: "8px",
                                color: "#6c757d",
                                fontWeight: 600,
                              }}
                            >
                              Locked
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          color: isActive
                            ? activeColors.white
                            : !isUnlocked
                              ? "#6c757d"
                              : activeColors.primary,
                        }}
                      >
                        {!isUnlocked ? (
                          <FaLock />
                        ) : isActive && isPlaying ? (
                          <FaPause />
                        ) : (
                          <FaPlay />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "courseContent" && (
          <div style={styles.courseOutline}>
            <p style={{ color: activeColors.gray }}>Course outline view</p>
          </div>
        )}
      </div>

      {/* Lesson Navigation Buttons */}
      {currentLesson && (
        <div style={styles.lessonActions}>
          {getPreviousLesson() && (
            <button
              style={styles.navigationButton}
              onClick={onPreviousLesson}
              title="Go to previous lesson"
            >
              ← Previous Lesson
            </button>
          )}
          {getNextLesson() && (
            <button
              style={{
                ...styles.navigationButton,
                ...(isCurrentLessonAudioCompleted()
                  ? styles.secondaryButton
                  : styles.primaryButton),
              }}
              onClick={onNextLesson}
              title="Go to next lesson"
            >
              Next Lesson →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function
function formatTime(seconds) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const styles = {
  container: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  },
  tabsContainer: {
    display: "flex",
    borderBottom: "1px solid #eee",
    marginBottom: "16px",
  },
  tabButton: {
    flex: 1,
    padding: "12px 16px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    fontWeight: 500,
    color: "#666",
    transition: "all 0.2s ease",
  },
  activeTabButton: {
    color: "#007bff",
    borderBottomColor: "#007bff",
  },
  tabContentContainer: {
    marginBottom: "20px",
  },
  audioList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  audioItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  activeAudioItem: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  audioItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  audioItemTitle: {
    fontWeight: 500,
    fontSize: "0.95rem",
    marginBottom: "4px",
  },
  audioItemMeta: {
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  courseOutline: {
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "6px",
  },
  lessonActions: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    padding: "16px",
    backgroundColor: "#f9f9f9",
    borderRadius: "6px",
  },
  navigationButton: {
    flex: 1,
    padding: "10px 16px",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s ease",
  },
  primaryButton: {
    backgroundColor: "#007bff",
    color: "#fff",
    borderColor: "#007bff",
  },
  secondaryButton: {
    backgroundColor: "#28a745",
    color: "#fff",
    borderColor: "#28a745",
  },
};
