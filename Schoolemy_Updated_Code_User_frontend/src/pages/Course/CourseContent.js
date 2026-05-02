/**
 * ISSUE #47 FIX 3.47.10: CourseContent Orchestrator Component
 * Coordinates all extracted hooks and components
 * Responsibilities: Component composition, navigation, EMI handling
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaArrowLeft,
  FaSun,
  FaMoon,
  FaLock,
  FaChevronRight,
  FaEdit,
  FaCheckCircle,
  FaHeadphones,
  FaBookOpen,
  FaMusic,
  FaDownload,
} from "react-icons/fa";
import { useMediaQueryStable } from "../../hooks/useMediaQueryStable";

// Import extracted hooks
import { useExamState } from "./hooks/useExamState";
import { useCourseContent } from "./hooks/useCourseContent";
import { useLessonLocking } from "./hooks/useLessonLocking";
import { useAudioHandlers } from "./hooks/useAudioHandlers";

// Import formatting utilities
import { truncateTitle } from "./utils/formattingUtils";
import { getLessonUnlockDate, formatUnlockDate } from "./utils/dateUtils";

// Import extracted components
import { LessonPlayer } from "./components/LessonPlayer/LessonPlayer";
import { LessonNav } from "./components/LessonNav/LessonNav";
import { ProgressTracker } from "./components/ProgressTracker/ProgressTracker";
import { ExamComponent } from "./components/ExamComponent/ExamComponent";
import { PDFViewer } from "./components/PDFViewer/PDFViewer";
import { LessonContent } from "./components/LessonContent.js";

// Import styles and services
import { createStyles } from "./courseContent.styles";
import EMIErrorHandler from "../../components/EMI/EMIErrorHandler";
import EMIService from "../../service/emiService";
import { toast } from "react-toastify";

// Theme configuration
const theme = {
  colors: {
    primary: "#007bff",
    primaryDark: "#0069d9",
    primaryLight: "#5faaff",
    secondary: "#2d2f31",
    accent: "#f7c948",
    light: "#f7f7f7",
    dark: "#1c1d1f",
    gray: "#6a6f73",
    lightGray: "#d1d7dc",
    white: "#ffffff",
    success: "#03a678",
    successDark: "#028062",
    warning: "#f7c948",
    danger: "#d93025",
    textDark: "#1c1d1f",
    textLight: "#ffffff",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  borderRadius: { sm: "4px", md: "6px", lg: "8px", circle: "50%" },
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.1)",
    md: "0 2px 4px rgba(0,0,0,0.15)",
    lg: "0 4px 8px rgba(0,0,0,0.2)",
  },
  breakpoints: {
    mobile: "576px",
    tablet: "768px",
    laptop: "992px",
    desktop: "1200px",
  },
  transitions: {
    fast: "all 0.2s ease",
    normal: "all 0.3s ease",
    slow: "all 0.5s ease",
  },
};

export default function CourseContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTutorCourse = location.pathname.includes("/tutor-course/");
  const isMobile = useMediaQueryStable(
    `(max-width: ${theme.breakpoints.tablet})`
  );

  // ===== HELPER: GET SAFE MEDIA URL (must be defined before hooks that use it) =====
  const getSafeLessonMediaUrl = useCallback((url, type = "audio") => {
    if (!url) {
      console.log("[getSafeLessonMediaUrl] No URL provided");
      return null;
    }
    try {
      const urlObj = new URL(url, window.location.origin);
      const checks = {
        isSameOrigin: urlObj.hostname === window.location.hostname,
        hasCloudinary: url.includes("cloudinary"),
        hasS3: urlObj.hostname.includes("s3") && urlObj.hostname.includes("amazonaws.com"),
        isAwsHostname: urlObj.hostname.endsWith("amazonaws.com"),
        isRelative: url.startsWith("/"),
      };
      console.log("[getSafeLessonMediaUrl] Validation checks:", {
        url,
        hostname: urlObj.hostname,
        currentHostname: window.location.hostname,
        checks,
      });
      // Allow same-origin and known CDNs
      if (checks.isSameOrigin || checks.hasCloudinary || checks.hasS3 || checks.isAwsHostname || checks.isRelative) {
        console.log("[getSafeLessonMediaUrl] URL PASSED validation, returning:", url);
        return url;
      }
      console.log("[getSafeLessonMediaUrl] URL FAILED all checks");
      return null;
    } catch (e) {
      console.error("[getSafeLessonMediaUrl] Exception:", e.message);
      return null;
    }
  }, []);

  // ===== EXTRACT ALL STATE FROM HOOKS =====
  const courseContent = useCourseContent();

  const onExamAttemptRecorded = useCallback(
    ({ chapterIndex, result }) => {
      courseContent.setUserProgress((prev) => ({
        ...prev,
        attemptedExams: {
          ...(prev.attemptedExams || {}),
          [chapterIndex]: {
            attempted: true,
            result: { ...result, chapterIndex },
          },
        },
      }));
    },
    [courseContent.setUserProgress]
  );

  const examState = useExamState({
    courseId: courseContent.courseId,
    selectedLesson: courseContent.selectedLesson,
    chapters: courseContent.chapters,
    onExamAttemptRecorded,
  });

  // Locking logic
  const locking = useLessonLocking({
    chapters: courseContent.chapters,
    userProgress: courseContent.userProgress,
    purchaseDate: courseContent.purchaseDate,
  });

  // Audio handlers (will be used instead of local handlers)
  const audio = useAudioHandlers({
    courseId: courseContent.courseId,
    storageUserId: courseContent.storageUserId,
    selectedLesson: courseContent.selectedLesson,
    selectedLessonRef: courseContent.selectedLessonRef,
    currentAudioFileIndex: courseContent.currentAudioFileIndex,
    currentAudioFileIndexRef: courseContent.currentAudioFileIndexRef,
    chaptersRef: courseContent.chaptersRef,
    chapters: courseContent.chapters,
    isPlaying: courseContent.isPlaying,
    duration: courseContent.duration,
    completedAudioFiles: courseContent.completedAudioFiles,
    audioRef: courseContent.audioRef,
    progressBarRef: courseContent.progressBarRef,
    volumeBarRef: courseContent.volumeBarRef,
    playOnLoadRef: courseContent.playOnLoadRef,
    audioRetryRef: courseContent.audioRetryRef,
    progressUpdaterRef: courseContent.progressUpdaterRef,
    pendingProgressUpdatesRef: courseContent.pendingProgressUpdatesRef,
    setIsPlaying: courseContent.setIsPlaying,
    setCurrentTime: courseContent.setCurrentTime,
    setDuration: courseContent.setDuration,
    setVolume: courseContent.setVolume,
    setPlaybackRate: courseContent.setPlaybackRate,
    setShowPlaybackOptions: courseContent.setShowPlaybackOptions,
    setAudioLoadError: courseContent.setAudioLoadError,
    setCurrentAudioFileIndex: courseContent.setCurrentAudioFileIndex,
    setCompletedAudioFiles: courseContent.setCompletedAudioFiles,
    setUserProgress: courseContent.setUserProgress,
    getSafeLessonMediaUrl: getSafeLessonMediaUrl,
    progressStorageKey: courseContent.progressStorageKey,
    id: courseContent.courseId,
  });

  // ===== LOCAL STATE =====
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem("courseTheme") || "light"
  );
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [lockedModalData, setLockedModalData] = useState({ date: "", message: "" });

  // ===== THEME COLORS =====
  const lightColors = {
    ...theme.colors,
    background: "#ffffff",
    surface: "#f8f9fa",
    surfaceElevated: "#ffffff",
    border: "#e9ecef",
    shadow: "rgba(0, 0, 0, 0.1)",
  };

  const darkColors = {
    ...theme.colors,
    primary: "#4c9eff",
    primaryDark: "#3d7bdb",
    primaryLight: "#4a4e54",
    light: "#1a1d23",
    dark: "#0f1114",
    gray: "#8b949e",
    lightGray: "#30363d",
    white: "#21262d",
    background: "#0d1117",
    surface: "#161b22",
    surfaceElevated: "#21262d",
    border: "#30363d",
    shadow: "rgba(0, 0, 0, 0.3)",
    textDark: "#f0f6fc",
    textLight: "#f0f6fc",
    overlay: "rgba(0, 0, 0, 0.8)",
  };

  const activeColors = themeMode === "light" ? lightColors : darkColors;
  const styles = createStyles({ theme, activeColors, isMobile, themeMode });

  // ===== THEME TOGGLE =====
  const toggleTheme = () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);
    localStorage.setItem("courseTheme", newMode);
  };

  // ===== HANDLERS: LESSON SELECTION WITH LOCK CHECKING =====
  const handleSelectContent = (chapterIndex, lessonIndex, type) => {
    const newSelection = { chapterIndex, lessonIndex, type };

    // Guard duplicate selection — except re-opening an already-submitted exam (modal was closed but row still selected)
    if (JSON.stringify(newSelection) === JSON.stringify(courseContent.selectedLesson)) {
      if (type === "exam" && locking.hasAttemptedExam(chapterIndex)) {
        const attempt = locking.getExamResult(chapterIndex);
        examState.showPriorExamResult(chapterIndex, attempt);
      }
      return;
    }

    // Check if lesson is locked
    if (type === "lesson") {
      const isLocked = locking.isLessonLocked(chapterIndex, lessonIndex);

      if (isLocked) {
        const unlockedBySchedule = locking.isLessonUnlockedBySchedule(
          chapterIndex,
          lessonIndex
        );

        // If locked by schedule, show the lock modal with unlock date
        if (!unlockedBySchedule) {
          let globalIndex = 0;
          for (let i = 0; i < chapterIndex; i++) {
            globalIndex += courseContent.chapters[i]?.lessons?.length || 0;
          }
          globalIndex += lessonIndex;

          const unlockDate = getLessonUnlockDate(globalIndex, courseContent.purchaseDate);
          if (unlockDate) {
            setLockedModalData({
              date: formatUnlockDate(unlockDate),
              message:
                "This lesson is locked and will unlock on the scheduled date. Check back then to access this content.",
            });
            setShowLockedModal(true);
          }
          return; // Don't select the locked lesson
        }
      }
    }

    // Select the content
    courseContent.setSelectedLesson(newSelection);
    courseContent.setSelectedChapterIndex(chapterIndex);

    // Reset audio/exam state based on type
    if (type === "lesson") {
      courseContent.setCurrentAudioFileIndex(0);
      courseContent.playOnLoadRef.current = false;
      courseContent.setActiveTab("playlist");
      examState.setExamTimerActive(false);
      if (examState.examTimerRef.current) {
        clearInterval(examState.examTimerRef.current);
        examState.examTimerRef.current = null;
      }
    } else if (type === "exam") {
      if (courseContent.audioRef.current) {
        courseContent.audioRef.current.pause();
      }
      courseContent.setActiveTab("playlist");

      if (locking.hasAttemptedExam(chapterIndex)) {
        const attempt = locking.getExamResult(chapterIndex);
        examState.showPriorExamResult(chapterIndex, attempt);
        return;
      }

      examState.setSubmissionStatus(null);
      examState.setExamCompleted(false);
      examState.setExamStarted(false);
      examState.setShowExamModal(true);
      examState.setExamAnswers({});
    }
  };

  const handleExamUiClose = () => {
    if (examState.examStarted && !examState.examCompleted) {
      return;
    }
    if (examState.examCompleted) {
      examState.closeExamModal();
    } else {
      examState.setShowExamModal(false);
    }
    const ch = courseContent.selectedLesson?.chapterIndex;
    const lessons = ch != null ? courseContent.chapters[ch]?.lessons : null;
    if (ch != null && lessons?.length) {
      handleSelectContent(ch, 0, "lesson");
    } else if (ch != null) {
      examState.setShowExamModal(false);
      toast.info("This chapter has no lessons to return to. Use the outline to continue.");
    }
  };

  // ===== HANDLERS: NEXT LESSON NAVIGATION =====
  const goToNextLesson = () => {
    let currentChapterIndex = courseContent.selectedLesson?.chapterIndex;
    let currentLessonIndex = courseContent.selectedLesson?.lessonIndex;
    let currentType = courseContent.selectedLesson?.type;

    while (currentChapterIndex !== undefined && currentType) {
      const nextLesson = locking.getNextLesson(
        currentChapterIndex,
        currentLessonIndex,
        currentType
      );

      if (!nextLesson) break;

      // Exams are not locked by schedule
      if (nextLesson.type === "exam") {
        handleSelectContent(
          nextLesson.chapterIndex,
          undefined,
          nextLesson.type
        );
        return;
      }

      // Check if next lesson is unlocked by schedule
      const isUnlockedBySchedule = locking.isLessonUnlockedBySchedule(
        nextLesson.chapterIndex,
        nextLesson.lessonIndex
      );

      if (isUnlockedBySchedule) {
        handleSelectContent(
          nextLesson.chapterIndex,
          nextLesson.lessonIndex,
          nextLesson.type
        );
        return;
      }

      // Continue searching
      currentChapterIndex = nextLesson.chapterIndex;
      currentLessonIndex = nextLesson.lessonIndex;
      currentType = nextLesson.type;
    }

    // No next unlocked lesson, show lock modal
    const nextLesson = locking.getNextLesson();
    if (nextLesson && nextLesson.type === "lesson") {
      const isUnlockedBySchedule = locking.isLessonUnlockedBySchedule(
        nextLesson.chapterIndex,
        nextLesson.lessonIndex
      );

      if (!isUnlockedBySchedule) {
        let globalIndex = 0;
        for (let i = 0; i < nextLesson.chapterIndex; i++) {
          globalIndex += courseContent.chapters[i]?.lessons?.length || 0;
        }
        globalIndex += nextLesson.lessonIndex;

        const unlockDate = getLessonUnlockDate(globalIndex, courseContent.purchaseDate);
        if (unlockDate) {
          setLockedModalData({
            date: formatUnlockDate(unlockDate),
            message:
              "The next lesson is locked and will unlock on the scheduled date.",
          });
          setShowLockedModal(true);
        }
      }
    }
  };

  // ===== EMI ERROR HANDLERS =====
  const getCoursePaymentPath = () =>
    isTutorCourse
      ? `/user/payment/tutor-course/${id}`
      : `/course/${id}/payment`;

  const handlePayOverdue = async (amount) => {
    navigate(getCoursePaymentPath());
  };

  const handleGoToPayment = () => {
    navigate(getCoursePaymentPath());
  };

  const handleRetry = () => {
    courseContent.setError(null);
    courseContent.setErrorCode(null);
    courseContent.setContentRefreshKey((k) => k + 1);
  };

  const handleLockedLessonClickFromNav = (unlockDate) => {
    if (!unlockDate) return;
    setLockedModalData({
      date: formatUnlockDate(unlockDate),
      message:
        "This lesson is locked and will unlock on the scheduled date. Check back then to access this content.",
    });
    setShowLockedModal(true);
  };

  // ===== RENDER LOADING STATE =====
  if (courseContent.loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading course content...</p>
      </div>
    );
  }

  // ===== RENDER ERROR STATE =====
  if (courseContent.error) {
    return (
      <EMIErrorHandler
        error={courseContent.error}
        errorCode={courseContent.errorCode}
        onRetry={handleRetry}
        onPayment={handleGoToPayment}
      />
    );
  }

  // ===== RENDER EMI LOCKED STATE =====
  if (courseContent.isCourseLocked && courseContent.emiPaymentRequired) {
    return (
      <EMIErrorHandler
        error="Course Access Restricted"
        errorCode="EMI_LOCKED"
        details={courseContent.overdueDetails}
        onPayment={handlePayOverdue}
        onRetry={handleRetry}
      />
    );
  }

  // ===== RENDER MAIN COURSE CONTENT =====
  const currentChapter =
    courseContent.chapters[courseContent.selectedLesson?.chapterIndex || 0];
  const currentLesson =
    courseContent.selectedLesson?.type === "lesson"
      ? currentChapter?.lessons?.[courseContent.selectedLesson?.lessonIndex || 0]
      : null;
  const currentExam =
    courseContent.selectedLesson?.type === "exam" ? currentChapter?.exam : null;

  return (
    <div style={styles.root} key={courseContent.contentRefreshKey}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button
            onClick={() =>
              navigate(
                isTutorCourse ? `/tutor-course/${id}` : `/course/${id}`
              )
            }
            style={styles.backButton}
            aria-label="Back to course overview"
          >
            <FaArrowLeft />
          </button>
          <h1 style={styles.headerTitle}>
            {truncateTitle(currentLesson?.title || currentExam?.title || "Course")}
          </h1>
          <button
            onClick={toggleTheme}
            style={styles.themeButton}
            aria-label="Toggle theme"
          >
            {themeMode === "light" ? <FaMoon /> : <FaSun />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={styles.mainContainer}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <LessonNav
            chapters={courseContent.chapters}
            selectedLesson={courseContent.selectedLesson}
            userProgress={courseContent.userProgress}
            onSelectLesson={handleSelectContent}
            isLessonLocked={locking.isLessonLocked}
            isLessonCompleted={locking.isLessonCompleted}
            getLessonUnlockDate={(globalIndex) =>
              getLessonUnlockDate(globalIndex, courseContent.purchaseDate)
            }
            isLessonUnlockedBySchedule={locking.isLessonUnlockedBySchedule}
            isExamAvailable={locking.isExamAvailable}
            hasAttemptedExam={locking.hasAttemptedExam}
            getExamResult={locking.getExamResult}
            isMobile={isMobile}
            onLockedLessonClick={handleLockedLessonClickFromNav}
            onLockedExamClick={() =>
              toast.info(
                "Complete all lessons in this chapter to unlock the exam.",
                { autoClose: 4000 }
              )
            }
            theme={theme}
            activeColors={activeColors}
          />
        </aside>

        {/* Main Content Area */}
        <main style={styles.contentArea}>
          {/* Show locked modal when applicable */}
          {showLockedModal && (
            <div style={styles.modalOverlay} onClick={() => setShowLockedModal(false)}>
              <div
                style={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={styles.modalTitle}>Lesson Locked</h2>
                <p style={styles.modalMessage}>{lockedModalData.message}</p>
                <p style={styles.modalDate}>
                  Unlocks on: <strong>{lockedModalData.date}</strong>
                </p>
                <button
                  onClick={() => setShowLockedModal(false)}
                  style={styles.modalButton}
                >
                  Got it
                </button>
              </div>
            </div>
          )}

          {/* Lesson Content — stacked column, centered max-width for readability */}
          {courseContent.selectedLesson?.type === "lesson" && currentLesson && (
            <div style={styles.lessonMainStack}>
              <LessonPlayer
                currentLesson={currentLesson}
                isPlaying={courseContent.isPlaying}
                currentTime={courseContent.currentTime}
                duration={courseContent.duration}
                volume={courseContent.volume}
                playbackRate={courseContent.playbackRate}
                currentAudioFileIndex={courseContent.currentAudioFileIndex}
                completedAudioFiles={courseContent.completedAudioFiles}
                audioLoadError={courseContent.audioLoadError}
                onPlayPause={audio.playPause}
                onSeek={audio.handleSeek}
                onVolumeChange={courseContent.setVolume}
                onPlaybackRateChange={audio.changePlaybackRate}
                onAudioItemClick={audio.handleAudioItemClick}
                onSkipNext={audio.skipToNextAudio}
                onSkipPrev={audio.skipToPrevAudio}
                courseId={courseContent.courseId}
                isMobile={isMobile}
                theme={theme}
                activeColors={activeColors}
                audioRef={courseContent.audioRef}
              />

              {/* FIX: Robust PDF display with fallback */}
              {currentLesson && (() => {
                // Get PDFs from lesson - handle various data structures
                const pdfFiles = currentLesson.pdfFile || currentLesson.pdfs || [];
                const hasPdfs = Array.isArray(pdfFiles) && pdfFiles.length > 0;

                // Debug logging
                if (currentLesson && !hasPdfs) {
                  console.warn('No PDFs found in lesson:', {
                    lessonTitle: currentLesson.title,
                    lessonKeys: Object.keys(currentLesson || {}),
                    pdfFile: currentLesson.pdfFile,
                    pdfs: currentLesson.pdfs,
                  });
                }

                return hasPdfs && (
                  <PDFViewer
                    lesson={{ ...currentLesson, pdfFile: pdfFiles }}
                    courseId={courseContent.courseId}
                    theme={theme}
                    activeColors={activeColors}
                  />
                );
              })()}

              <LessonContent
                currentLesson={currentLesson}
                selectedLesson={courseContent.selectedLesson}
                completedAudioFiles={courseContent.completedAudioFiles}
                currentAudioFileIndex={courseContent.currentAudioFileIndex}
                isPlaying={courseContent.isPlaying}
                isAudioUnlocked={audio.isAudioUnlocked}
                onAudioItemClick={audio.handleAudioItemClick}
                onNextLesson={goToNextLesson}
                onPreviousLesson={() => {}}
                getNextLesson={() =>
                  locking.getNextLesson(
                    courseContent.selectedLesson?.chapterIndex,
                    courseContent.selectedLesson?.lessonIndex,
                    courseContent.selectedLesson?.type
                  )
                }
                getPreviousLesson={() => null}
                isCurrentLessonAudioCompleted={audio.isCurrentLessonAudioCompleted}
                isMobile={isMobile}
                activeColors={activeColors}
                theme={theme}
              />
            </div>
          )}

          {/* Exam Content */}
          {courseContent.selectedLesson?.type === "exam" && currentExam && (
            <div style={styles.lessonMainStack}>
              <ExamComponent
                exam={currentExam}
                chapterIndex={courseContent.selectedLesson?.chapterIndex}
                chapters={courseContent.chapters}
                examAnswers={examState.examAnswers}
                examTimer={examState.examTimer}
                totalExamTime={examState.totalExamTime}
                examStarted={examState.examStarted}
                showExamModal={examState.showExamModal}
                examInProgress={examState.examInProgress}
                examCompleted={examState.examCompleted}
                submissionError={examState.submissionError}
                showValidationHighlight={examState.showValidationHighlight}
                submissionStatus={examState.submissionStatus}
                currentQuestionIndex={examState.currentQuestionIndex}
                onNextQuestion={examState.goToNextQuestion}
                onPrevQuestion={examState.goToPreviousQuestion}
                secondsPerQuestion={examState.secondsPerQuestion}
                onStartExam={examState.startExam}
                onAnswerSelect={examState.handleAnswerSelect}
                onSubmitExam={examState.submitExam}
                onCloseModal={handleExamUiClose}
                onTimerTick={examState.onTimerTick}
              />
            </div>
          )}

          {/* Progress Tracker */}
          <div style={{ ...styles.lessonMainStack, marginTop: "auto" }}>
          <ProgressTracker
            chapters={courseContent.chapters}
            completedLessons={courseContent.userProgress?.completedLessons || []}
            attemptedExams={courseContent.userProgress?.attemptedExams || {}}
          />
          </div>
        </main>
      </div>

      {/* Payment Success Toast */}
      {courseContent.showPaymentSuccess && (
        <div style={styles.toast}>
          <FaCheckCircle style={{ marginRight: "8px" }} />
          Payment successful! You can now access all content.
        </div>
      )}
    </div>
  );
}
