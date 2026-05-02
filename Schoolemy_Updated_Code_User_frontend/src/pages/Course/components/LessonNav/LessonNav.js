import React, { useState } from "react";
import {
  FaChevronRight,
  FaCheckCircle,
  FaLock,
  FaBookOpen,
  FaHeadphones,
  FaFilePdf,
  FaEdit,
} from "react-icons/fa";

/**
 * ISSUE #47 FIX 3.47.2: Enhanced LessonNav Component
 * Handles chapter/lesson navigation with course outline view
 * Responsibilities: Display chapters, lessons, exams, lock status, completion status, unlock dates
 */

export function LessonNav({
  chapters,
  selectedLesson,
  userProgress,
  onSelectLesson,
  isLessonLocked,
  isLessonCompleted,
  getLessonUnlockDate,
  isLessonUnlockedBySchedule,
  isExamAvailable,
  hasAttemptedExam,
  getExamResult,
  isMobile,
  onLockedLessonClick,
  onLockedExamClick,
  theme,
  activeColors,
}) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);

  if (!chapters || chapters.length === 0) {
    return (
      <div style={styles.container}>
        <p style={styles.emptyMessage}>No chapters available</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Course Outline - Chapter List */}
      <div style={styles.chapterList}>
        {chapters.map((chapter, cIdx) => (
          <div
            key={chapter._id || cIdx}
            style={{
              marginBottom: theme?.spacing?.sm || "8px",
              borderRadius: theme?.borderRadius?.md || "6px",
              overflow: "hidden",
              boxShadow: theme?.shadows?.sm || "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            {/* Chapter Header */}
            <div
              style={{
                ...styles.chapterItem,
                backgroundColor: activeColors?.secondary || "#2d2f31",
                color: activeColors?.textLight || "#fff",
              }}
              onClick={() =>
                setSelectedChapterIndex(
                  cIdx === selectedChapterIndex ? -1 : cIdx
                )
              }
            >
              <div
                style={{
                  ...styles.chapterTitle,
                  color: activeColors?.textLight || "#fff",
                }}
              >
                Chapter {cIdx + 1}: {chapter.title}
              </div>
              <FaChevronRight
                style={{
                  transform:
                    selectedChapterIndex === cIdx ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </div>

            {/* Lessons & Exam (Expanded) */}
            {selectedChapterIndex === cIdx && (
              <div>
                {/* Lessons */}
                {chapter.lessons?.map((lesson, lIdx) => {
                  const locked = isLessonLocked(cIdx, lIdx);
                  const completed = isLessonCompleted(cIdx, lIdx);
                  const isActive =
                    selectedLesson?.type === "lesson" &&
                    selectedLesson.chapterIndex === cIdx &&
                    selectedLesson.lessonIndex === lIdx;

                  // Calculate global lesson index for unlock date
                  let globalIndex = 0;
                  for (let i = 0; i < cIdx; i++) {
                    globalIndex += chapters[i].lessons?.length || 0;
                  }
                  globalIndex += lIdx;

                  const unlockDate = getLessonUnlockDate(globalIndex);
                  const unlockedBySchedule = isLessonUnlockedBySchedule(
                    cIdx,
                    lIdx
                  );

                  let icon = locked ? (
                    <FaLock />
                  ) : completed ? (
                    <FaCheckCircle />
                  ) : lesson.audioFile?.length ? (
                    <FaHeadphones />
                  ) : (
                    <FaBookOpen />
                  );

                  return (
                    <div
                      key={lesson._id || lIdx}
                      style={{
                        ...styles.lessonItem,
                        ...(isActive ? styles.activeLesson : {}),
                        ...(locked ? styles.lockedLesson : {}),
                      }}
                      onClick={() => {
                        if (
                          locked &&
                          !unlockedBySchedule &&
                          unlockDate
                        ) {
                          onLockedLessonClick?.(unlockDate);
                        } else if (!locked) {
                          onSelectLesson(cIdx, lIdx, "lesson");
                        }
                      }}
                    >
                      <div
                        style={{
                          ...styles.lessonIcon,
                          color: isActive
                            ? activeColors?.white || "#fff"
                            : completed
                              ? activeColors?.success || "#28a745"
                              : locked
                                ? activeColors?.danger || "#dc3545"
                                : activeColors?.gray || "#6c757d",
                        }}
                      >
                        {icon}
                      </div>
                      <div style={styles.lessonDetails}>
                        <div
                          style={{
                            ...styles.lessonName,
                            color: isActive
                              ? activeColors?.white || "#fff"
                              : activeColors?.textDark || "#333",
                          }}
                        >
                          {lesson.lessonname}
                        </div>
                        <div
                          style={{
                            ...styles.lessonMeta,
                            color: isActive
                              ? activeColors?.white || "#fff"
                              : activeColors?.gray || "#999",
                          }}
                        >
                          {lesson.audioFile?.length > 0 && (
                            <span>
                              <FaHeadphones size="0.8em" /> {lesson.audioFile.length} Audio
                            </span>
                          )}
                          {lesson.pdfFile?.length > 0 && (
                            <span>
                              <FaFilePdf size="0.8em" /> {lesson.pdfFile.length} PDF
                            </span>
                          )}
                          {locked &&
                            !unlockedBySchedule &&
                            unlockDate && (
                              <span
                                style={{
                                  color: activeColors?.danger || "#dc3545",
                                  fontWeight: 600,
                                  display: "block",
                                  marginTop: "4px",
                                }}
                              >
                                Unlocks:{" "}
                                {unlockDate.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Exam Button */}
                {chapter.exam && (
                  <div
                    style={{
                      ...styles.lessonItem,
                      ...(selectedLesson?.type === "exam" &&
                      selectedLesson.chapterIndex === cIdx
                        ? styles.activeLesson
                        : {}),
                      ...(!isExamAvailable(cIdx) && !hasAttemptedExam(cIdx)
                        ? styles.lockedLesson
                        : {}),
                    }}
                    onClick={() => {
                      if (isExamAvailable(cIdx) || hasAttemptedExam(cIdx)) {
                        onSelectLesson(cIdx, undefined, "exam");
                      } else {
                        onLockedExamClick?.();
                      }
                    }}
                  >
                    <div
                      style={{
                        ...styles.lessonIcon,
                        color: hasAttemptedExam(cIdx)
                          ? activeColors?.success || "#28a745"
                          : !isExamAvailable(cIdx)
                            ? activeColors?.danger || "#dc3545"
                            : activeColors?.warning || "#ffc107",
                      }}
                    >
                      <FaEdit />
                    </div>
                    <div style={styles.lessonDetails}>
                      <div
                        style={{
                          ...styles.lessonName,
                          color:
                            selectedLesson?.type === "exam" &&
                            selectedLesson.chapterIndex === cIdx
                              ? activeColors?.white || "#fff"
                              : activeColors?.textDark || "#333",
                        }}
                      >
                        {chapter.exam.examinationName ||
                          chapter.exam.title ||
                          "Chapter exam"}
                      </div>
                      <div
                        style={{
                          ...styles.lessonMeta,
                          color:
                            selectedLesson?.type === "exam" &&
                            selectedLesson.chapterIndex === cIdx
                              ? activeColors?.white || "#fff"
                              : activeColors?.gray || "#999",
                        }}
                      >
                        {chapter.exam.examQuestions?.length || 0} questions
                        {hasAttemptedExam(cIdx) && getExamResult?.(cIdx) && (
                          <>
                            {" · "}
                            Score: {getExamResult(cIdx).obtainedMarks ?? "—"}/
                            {getExamResult(cIdx).totalMarks ?? "—"}
                            {getExamResult(cIdx).passed === true
                              ? " (Passed)"
                              : getExamResult(cIdx).passed === false
                                ? " (Not passed)"
                                : ""}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  emptyMessage: {
    textAlign: "center",
    color: "#999",
    padding: "20px",
  },
  chapterList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  chapterItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  chapterTitle: {
    fontWeight: 600,
    fontSize: "0.95rem",
  },
  lessonItem: {
    display: "flex",
    alignItems: "flex-start",
    padding: "12px 16px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #eee",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  activeLesson: {
    backgroundColor: "#007bff",
    color: "#fff",
  },
  lockedLesson: {
    opacity: 0.6,
    backgroundColor: "#f5f5f5",
  },
  lessonIcon: {
    minWidth: "24px",
    marginRight: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },
  lessonDetails: {
    flex: 1,
    minWidth: 0,
  },
  lessonName: {
    fontWeight: 500,
    fontSize: "0.9rem",
    marginBottom: "2px",
  },
  lessonMeta: {
    fontSize: "0.8rem",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
};
