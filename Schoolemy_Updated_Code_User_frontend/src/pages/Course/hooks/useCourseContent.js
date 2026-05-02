/**
 * ISSUE #47 FIX 3.47.9: useCourseContent Custom Hook
 * Manages all non-exam course state and data fetching
 * Responsibilities: Chapter data, audio player state, progress tracking, EMI status
 */

import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../../service/api";
import {
  getLessonProgress,
  getCourseProgress,
  updateLessonProgress,
  bulkUpdateProgress,
  createDebouncedProgressUpdater,
} from "../../../service/progressService";
import EMIService from "../../../service/emiService";
import { getTutorCourseContent } from "../../../service/courseApi";
import {
  getPlayerState,
  savePlayerState,
  requestCertificateEmail,
} from "../../../service/coursePlayerStateService";

// Helper to fix mojibake encoding issues
const decodePossibleMojibake = (str) => {
  if (typeof str !== "string") return str;
  if (!/[\u00C0-\u00FF]/.test(str)) return str;
  try {
    const bytes = new Uint8Array(Array.from(str).map((c) => c.charCodeAt(0)));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    if (decoded && decoded !== str) return decoded;
    return str;
  } catch (e) {
    return str;
  }
};

/** Tutor content API uses lessonName, audioFiles, pdfFiles; player UI expects lessonname, audioFile, pdfFile. */
const normalizeTutorLessonFields = (lesson) => {
  if (!lesson || typeof lesson !== "object") return lesson;
  const audioFile = lesson.audioFile || lesson.audioFiles || [];
  const pdfFile = lesson.pdfFile || lesson.pdfFiles || [];
  const name =
    lesson.lessonname ||
    lesson.lessonName ||
    lesson.title ||
    "Lesson";
  return {
    ...lesson,
    _id: lesson._id || lesson.lessonId,
    lessonname: name,
    title: lesson.title || lesson.lessonName || lesson.lessonname,
    audioFile: Array.isArray(audioFile) ? audioFile : [],
    pdfFile: Array.isArray(pdfFile) ? pdfFile : [],
  };
};

const normalizeTutorChapterFields = (chapter) => {
  if (!chapter || typeof chapter !== "object") return chapter;
  return {
    ...chapter,
    _id: chapter._id || chapter.chapterId,
    lessons: (chapter.lessons || []).map(normalizeTutorLessonFields),
  };
};

// Verify access with server (same contract as course detail + /:id/content middleware)
const verifyPaymentWithServer = async (courseId) => {
  try {
    const response = await api.get(`/api/v1/courses/${courseId}`);
    const body = response.data || {};
    const access = body.access || "limited";
    const canAccess =
      access === "full" ||
      access === "completed" ||
      access === "purchased" ||
      access === "enrolled";
    return {
      canAccess,
      reason: body.accessReason || (canAccess ? "granted" : "payment_required"),
      isPaid: body.accessReason === "full_payment",
      hasEmiOverdue: false,
    };
  } catch (error) {
    console.error("Failed to verify payment with server:", error);
    return {
      canAccess: false,
      reason: "verification_failed",
      isPaid: false,
      hasEmiOverdue: true,
    };
  }
};

export function useCourseContent() {
  const { id: courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const storageUserId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId") || "guest"
      : "guest";

  const isTutorCourse = location.pathname.includes("/tutor-course/");
  const progressStorageKey = `courseProgress_${storageUserId}_${courseId}`;

  // --- CHAPTER & COURSE DATA STATE ---
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  // --- SELECTED LESSON STATE ---
  const [selectedLesson, setSelectedLesson] = useState(() => {
    try {
      const saved = localStorage.getItem(
        `coursePlayerState_${storageUserId}_${courseId}`
      );
      return saved ? JSON.parse(saved).selectedLesson : null;
    } catch {
      return null;
    }
  });

  // --- AUDIO PLAYER STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showPlaybackOptions, setShowPlaybackOptions] = useState(false);
  const [audioLoadError, setAudioLoadError] = useState(null);
  const [currentAudioFileIndex, setCurrentAudioFileIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(
        `coursePlayerState_${storageUserId}_${courseId}`
      );
      return saved ? JSON.parse(saved).currentAudioFileIndex : 0;
    } catch {
      return 0;
    }
  });

  // --- AUDIO COMPLETION TRACKING ---
  const [completedAudioFiles, setCompletedAudioFiles] = useState(() => {
    try {
      const saved = localStorage.getItem(`audioCompletion_${courseId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // --- PROGRESS TRACKING STATE ---
  const [userProgress, setUserProgress] = useState({
    completedLessons: [],
    attemptedExams: {},
  });

  const [purchaseDate, setPurchaseDate] = useState(() => {
    try {
      const saved = localStorage.getItem(`coursePurchaseDate_${courseId}`);
      return saved ? new Date(saved) : new Date();
    } catch {
      return new Date();
    }
  });

  // --- EMI & PAYMENT STATE ---
  const [emiStatus, setEmiStatus] = useState(null);
  const [isCourseLocked, setIsCourseLocked] = useState(false);
  const [emiPaymentRequired, setEmiPaymentRequired] = useState(false);
  const [emiCheckLoading, setEmiCheckLoading] = useState(true);
  const [overdueDetails, setOverdueDetails] = useState(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState("playlist");
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(
    selectedLesson?.chapterIndex || 0
  );
  const [showExamQuestions, setShowExamQuestions] = useState(false);
  const [contentRefreshKey, setContentRefreshKey] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // --- REFS ---
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const playbackOptionsRef = useRef(null);
  const playOnLoadRef = useRef(false);
  const hasRestoredState = useRef(!!selectedLesson);

  const audioRetryRef = useRef({ count: 0, maxRetries: 3, currentUrl: null });
  const progressUpdaterRef = useRef(createDebouncedProgressUpdater());
  const pendingProgressUpdatesRef = useRef({});
  const certificateRequestedRef = useRef(false);

  // Refs to solve stale closure issues
  const selectedLessonRef = useRef(selectedLesson);
  const currentAudioFileIndexRef = useRef(currentAudioFileIndex);
  const chaptersRef = useRef(chapters);

  // Keep refs in sync with state changes
  useEffect(() => {
    selectedLessonRef.current = selectedLesson;
  }, [selectedLesson]);

  useEffect(() => {
    currentAudioFileIndexRef.current = currentAudioFileIndex;
  }, [currentAudioFileIndex]);

  useEffect(() => {
    chaptersRef.current = chapters;
  }, [chapters]);

  // --- HTML ELEMENT CLASS MANAGEMENT ---
  useEffect(() => {
    document.documentElement.classList.add("course-player-active");
    return () => {
      document.documentElement.classList.remove("course-player-active");
    };
  }, []);

  // --- AUDIO COMPLETION PERSISTENCE ---
  useEffect(() => {
    try {
      localStorage.setItem(
        `audioCompletion_${courseId}`,
        JSON.stringify(completedAudioFiles)
      );
    } catch (error) {
      console.error("Error saving audio completion state:", error);
    }
  }, [completedAudioFiles, courseId]);

  // --- ONLINE STATUS MONITORING ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // --- EMI STATUS CHECK ---
  useEffect(() => {
    console.log("\n" + "=".repeat(60));
    console.log(" CourseContent Component Initialize");
    console.log("=".repeat(60));
    console.log(" Course ID:", courseId);
    console.log(" Current pathname:", location.pathname);
    console.log(" isTutorCourse:", isTutorCourse);
    console.log("=".repeat(60) + "\n");

    if (isTutorCourse) {
      console.log(" Tutor course detected - skipping EMI check");
      setEmiCheckLoading(false);
      setIsCourseLocked(false);
      setEmiPaymentRequired(false);
      return;
    }

    console.log(" Starting EMI check for regular course...");

    const checkEMIStatus = async () => {
      console.log("\n" + "=".repeat(60));
      console.log(" SECURITY: Verifying payment with server...");
      console.log("=".repeat(60) + "\n");

      setEmiCheckLoading(true);

      try {
        const paymentVerification = await verifyPaymentWithServer(courseId);

        console.log(" Server Payment Verification Result:", paymentVerification);

        if (!paymentVerification.canAccess) {
          console.log(" ⚠️ SERVER DENIED ACCESS - Payment verification failed");
          setIsCourseLocked(true);
          setEmiPaymentRequired(true);
          setEmiCheckLoading(false);
          return;
        }

        console.log(" ✅ SERVER VERIFIED: Access allowed");
      } catch (error) {
        console.error(" SECURITY: Failed to verify payment with server:", error);
        setIsCourseLocked(true);
        setEmiPaymentRequired(true);
        setEmiCheckLoading(false);
        return;
      }

      const paymentJustCompleted =
        location.state?.paymentCompleted || location.state?.accessUnlocked;

      if (paymentJustCompleted) {
        console.log("\n" + "=".repeat(60));
        console.log(" PAYMENT COMPLETION DETECTED");
        console.log("=".repeat(60) + "\n");

        setShowPaymentSuccess(true);
        setTimeout(() => setShowPaymentSuccess(false), 5000);

        sessionStorage.removeItem("emi_notified");
        sessionStorage.removeItem("payment_return_course");
        sessionStorage.removeItem("payment_type");

        console.log("Waiting 2 seconds for webhook to process payment...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(" Delay complete - fetching EMI status now...");
      }

      try {
        console.log(" Checking EMI status for course:", courseId);

        let emiStatusResponse = null;
        let attempts = paymentJustCompleted ? 3 : 1;
        let currentAttempt = 0;

        while (currentAttempt < attempts) {
          currentAttempt++;

          if (currentAttempt > 1) {
            console.log(
              ` Retry attempt ${currentAttempt}/${attempts} - checking EMI status...`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }

          emiStatusResponse = await EMIService.getEMIStatus(courseId);
          console.log(
            ` EMI Status Response (Attempt ${currentAttempt}):`,
            emiStatusResponse
          );

          if (emiStatusResponse.success && emiStatusResponse.data) {
            const overdueCount =
              emiStatusResponse.data.overdueEmis ??
              emiStatusResponse.data.overdueCount ??
              0;
            const hasOverdue =
              emiStatusResponse.data.hasOverduePayments ?? overdueCount > 0;

            if (
              !hasOverdue ||
              emiStatusResponse.data.isAccessLocked === false
            ) {
              console.log(" EMI status updated - no overdue payments found!");
              break;
            } else if (currentAttempt < attempts) {
              console.log(
                ` Still showing overdue (${overdueCount}) - webhook may not have processed yet. Retrying...`
              );
            }
          } else {
            break;
          }
        }

        console.log(" Final EMI Status Response:", emiStatusResponse);

        if (emiStatusResponse.success) {
          let emiData = emiStatusResponse.data;

          // Normalize field names
          emiData = {
            ...emiData,
            planStatus: emiData.planStatus ?? emiData.status,
            dueEmis: emiData.dueEmis ?? 0,
            overdueEmis: emiData.overdueEmis ?? emiData.overdueCount ?? 0,
            totalDue: emiData.totalDue ?? 0,
            totalOverdue: emiData.totalOverdue ?? emiData.overdueAmount ?? 0,
            hasDuePayments:
              emiData.hasDuePayments ?? (emiData.dueEmis ?? 0) > 0,
            hasAnyDuePayments:
              emiData.hasAnyDuePayments ??
              ((emiData.dueEmis ?? 0) > 0 ||
                (emiData.overdueEmis ?? emiData.overdueCount ?? 0) > 0),
            emis: emiData.emis ?? [],
            isAccessLocked:
              emiData.isAccessLocked ?? emiData.accessStatus === "locked",
            hasOverduePayments:
              emiData.hasOverduePayments ??
              (emiData.overdueEmis ?? emiData.overdueCount ?? 0) > 0,
            paymentType: emiData.paymentType ?? "emi",
          };

          setEmiStatus(emiData);

          if (emiData.paymentType === "emi") {
            const overdueCount = emiData.overdueEmis ?? 0;
            const dueCount = emiData.dueEmis ?? 0;
            const overdueAmount = emiData.totalOverdue ?? 0;
            const dueAmount = emiData.totalDue ?? 0;

            const isLocked =
              emiData.hasAnyDuePayments === true ||
              emiData.isAccessLocked === true ||
              emiData.planStatus === "locked";

            const requiresPayment = isLocked;

            setIsCourseLocked(isLocked);
            setEmiPaymentRequired(requiresPayment);

            if (isLocked || requiresPayment) {
              setOverdueDetails({
                count: overdueCount + dueCount,
                expectedAmount: overdueAmount + dueAmount,
                nextDueDate: emiData.nextDueDate,
                duePaymentInfo: emiData.duePaymentInfo,
                gracePeriodInfo: emiData.gracePeriodInfo,
                overdueInfo: emiData.overdueInfo,
              });
            } else {
              setOverdueDetails(null);
            }
          } else if (emiData.paymentType === "full") {
            setIsCourseLocked(false);
            setEmiPaymentRequired(false);
          }
        } else {
          console.warn(" EMI Status Response failed or has no data");
          setIsCourseLocked(true);
          setEmiPaymentRequired(true);
        }
      } catch (error) {
        console.error("EMI status check error:", error);

        if (error.response?.status === 404) {
          console.log(" No EMI plan found - allowing access");
          setIsCourseLocked(false);
          setEmiPaymentRequired(false);
        } else {
          console.warn(" EMI check failed - defaulting to LOCKED for safety");
          setIsCourseLocked(true);
          setEmiPaymentRequired(true);
          setError(
            "Unable to verify EMI status. Please try again or contact support."
          );
        }
      } finally {
        console.log(" EMI CHECK COMPLETE");
        setEmiCheckLoading(false);

        if (
          location.state?.paymentCompleted ||
          location.state?.accessUnlocked
        ) {
          console.log(" Clearing navigation state after EMI check...");
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    };

    console.log(" Calling checkEMIStatus() function...");
    checkEMIStatus();
  }, [
    courseId,
    location.state?.paymentCompleted,
    location.state?.accessUnlocked,
    isTutorCourse,
    navigate,
    location.pathname,
  ]);

  // --- CONTENT LOADING EFFECT ---
  useEffect(() => {
    console.log("\n" + "=".repeat(60));
    console.log(" CONTENT LOADING CHECK");
    console.log(" emiCheckLoading:", emiCheckLoading);
    console.log(" isCourseLocked:", isCourseLocked);
    console.log("=".repeat(60) + "\n");

    if (isTutorCourse) {
      console.log(" Tutor course - skipping EMI check, loading content directly...");
    } else {
      if (emiCheckLoading) {
        console.log(
          "WAITING: emiCheckLoading is TRUE - EMI verification in progress"
        );
        setLoading(true);
        return;
      }

      if (isCourseLocked) {
        console.log("\n" + "=".repeat(60));
        console.log(" COURSE IS LOCKED - Content loading BLOCKED");
        console.log("=".repeat(60) + "\n");
        setLoading(false);
        return;
      }
    }

    console.log("\n COURSE UNLOCKED - LOADING CONTENT NOW \n");

    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      setErrorCode(null);

      try {
        let data;
        if (isTutorCourse) {
          console.log(" Fetching tutor course content for:", courseId);
          data = await getTutorCourseContent(courseId);
        } else {
          console.log(" Fetching regular course content for:", courseId);
          data = await EMIService.getCourseContent(courseId);
        }

        console.log("Course content fetch response:", {
          isTutorCourse,
          data,
          hasSuccess: data?.success,
          hasData: !!data?.data,
        });

        let fetchedChapters;

        if (data.success) {
          const responseData = data.data || data;

          if (isTutorCourse) {
            if (Array.isArray(responseData)) {
              fetchedChapters = responseData;
            } else if (Array.isArray(responseData.chapters)) {
              fetchedChapters = responseData.chapters;
            } else if (Array.isArray(responseData.lessons)) {
              fetchedChapters = responseData.lessons;
            } else if (Array.isArray(responseData.courseContent)) {
              fetchedChapters = responseData.courseContent;
            } else {
              const firstArrayValue = Object.values(responseData).find((v) =>
                Array.isArray(v)
              );
              fetchedChapters = firstArrayValue || [];
            }
          } else {
            fetchedChapters = Array.isArray(responseData)
              ? responseData
              : responseData?.data || [];
          }
        } else if (Array.isArray(data)) {
          fetchedChapters = data;
        } else if (data.data) {
          fetchedChapters = Array.isArray(data.data) ? data.data : [];
        } else {
          fetchedChapters = Array.isArray(data) ? data : [];
        }

        if (!Array.isArray(fetchedChapters)) {
          console.error("Invalid chapters format:", fetchedChapters);
          setError("Invalid course data format");
          setLoading(false);
          return;
        }

        // Decode any mojibake in chapter/lesson titles
        const decodedChapters = fetchedChapters.map((chapter) => ({
          ...chapter,
          title: decodePossibleMojibake(chapter.title),
          lessons: chapter.lessons?.map((lesson) => ({
            ...lesson,
            title: decodePossibleMojibake(
              lesson.title || lesson.lessonName || lesson.lessonname
            ),
            description: decodePossibleMojibake(lesson.description),
          })),
          exam: chapter.exam
            ? {
                ...chapter.exam,
                title: decodePossibleMojibake(chapter.exam.title),
              }
            : null,
        }));

        const chaptersForUi = isTutorCourse
          ? decodedChapters.map(normalizeTutorChapterFields)
          : decodedChapters;

        setChapters(chaptersForUi);

        // Fetch progress for non-tutor courses
        if (!isTutorCourse) {
          try {
            const progress = await getCourseProgress(courseId);
            console.log("Progress fetched:", progress);
            setUserProgress(progress || { completedLessons: [], attemptedExams: {} });
          } catch (progressError) {
            console.error("Error fetching progress:", progressError);
            setUserProgress({ completedLessons: [], attemptedExams: {} });
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching course content:", error);

        if (error.response?.status === 404) {
          setError("Course not found");
          setErrorCode(404);
        } else if (error.response?.status === 403) {
          setError("You do not have permission to access this course");
          setErrorCode(403);
        } else {
          setError("Failed to load course content. Please try again.");
          setErrorCode(error.response?.status || 500);
        }

        setLoading(false);
      }
    };

    fetchContent();
  }, [emiCheckLoading, isCourseLocked, isTutorCourse, courseId]);

  // --- FETCH EXAM ATTEMPTS & MERGE PROGRESS ---
  useEffect(() => {
    if (!chapters.length || isTutorCourse) return;

    const fetchExamAttempts = async () => {
      try {
        const response = await api.get(`/api/v1/exam-questions/user/exam/result?courseId=${courseId}`);

        if (response.data?.success) {
          const examResults = response.data.data || [];

          const serverProgress = await getPlayerState(courseId);

          setUserProgress((prev) => {
            const attemptedFromApi = {};
            examResults.forEach((result) => {
              let idx = result.chapterIndex;
              if (typeof idx !== "number" || idx < 0) {
                idx = chapters.findIndex(
                  (ch) =>
                    ch.exam &&
                    (String(ch.exam._id) === String(result.examId) ||
                      String(ch.exam.examId) === String(result.examId))
                );
              }
              if (typeof idx === "number" && idx >= 0) {
                attemptedFromApi[idx] = {
                  attempted: true,
                  result,
                };
              }
            });

            const mergedProgress = {
              completedLessons: [
                ...new Set([
                  ...(serverProgress?.completedLessons || []),
                  ...(prev.completedLessons || []),
                ]),
              ],
              attemptedExams: {
                ...(prev.attemptedExams || {}),
                ...attemptedFromApi,
              },
            };

            try {
              localStorage.setItem(
                progressStorageKey,
                JSON.stringify(mergedProgress)
              );
            } catch (e) {
              console.warn("Could not persist merged progress", e);
            }

            return mergedProgress;
          });
        }
      } catch (error) {
        console.error("Error fetching exam attempts:", error);
      }
    };

    fetchExamAttempts();
  }, [chapters, courseId, isTutorCourse, progressStorageKey]);

  // --- SAVE USER PROGRESS TO LOCALSTORAGE ---
  useEffect(() => {
    if (userProgress.completedLessons?.length > 0 || Object.keys(userProgress.attemptedExams || {}).length > 0) {
      try {
        localStorage.setItem(progressStorageKey, JSON.stringify(userProgress));
      } catch (error) {
        console.error("Error saving progress to localStorage:", error);
      }
    }
  }, [userProgress, progressStorageKey]);

  // --- DEBOUNCED SERVER PLAYER STATE SAVE ---
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (
        userProgress.completedLessons?.length > 0 ||
        Object.keys(userProgress.attemptedExams || {}).length > 0
      ) {
        try {
          savePlayerState(courseId, {
            completedLessons: userProgress.completedLessons,
            attemptedExams: userProgress.attemptedExams,
          });
        } catch (error) {
          console.error("Error saving progress to server:", error);
        }
      }
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [userProgress, courseId]);

  // --- REQUEST CERTIFICATE WHEN ALL LESSONS COMPLETE ---
  useEffect(() => {
    if (
      !chapters.length ||
      isTutorCourse ||
      certificateRequestedRef.current ||
      !userProgress.completedLessons
    ) {
      return;
    }

    // Check if all lessons are completed
    let totalLessons = 0;
    chapters.forEach((chapter) => {
      totalLessons += chapter.lessons?.length || 0;
    });

    if (totalLessons > 0 && userProgress.completedLessons.length === totalLessons) {
      certificateRequestedRef.current = true;

      try {
        requestCertificateEmail(courseId)
          .then(() => {
            console.log("Certificate request sent");
          })
          .catch((error) => {
            console.error("Error requesting certificate:", error);
            certificateRequestedRef.current = false;
          });
      } catch (error) {
        console.error("Error requesting certificate:", error);
        certificateRequestedRef.current = false;
      }
    }
  }, [chapters, userProgress.completedLessons, courseId, isTutorCourse]);

  // --- HANDLE ONLINE/OFFLINE & FLUSH ON UNLOAD ---
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(true);
      // Flush any pending updates when coming back online
      if (pendingProgressUpdatesRef.current && Object.keys(pendingProgressUpdatesRef.current).length > 0) {
        try {
          bulkUpdateProgress(pendingProgressUpdatesRef.current);
          pendingProgressUpdatesRef.current = {};
        } catch (error) {
          console.error("Error flushing pending updates:", error);
        }
      }
    };

    const handleOfflineStatus = () => {
      setIsOnline(false);
      console.warn("You are offline. Progress will be saved when connection is restored.");
    };

    const handleBeforeUnload = () => {
      // Flush pending updates before unload
      if (pendingProgressUpdatesRef.current && Object.keys(pendingProgressUpdatesRef.current).length > 0) {
        try {
          bulkUpdateProgress(pendingProgressUpdatesRef.current);
          pendingProgressUpdatesRef.current = {};
        } catch (error) {
          console.error("Error flushing pending updates on unload:", error);
        }
      }
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOfflineStatus);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOfflineStatus);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // --- AUDIO PLAYER HANDLERS ---
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (newTime) => {
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const changePlaybackRate = (newRate) => {
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
    setShowPlaybackOptions(false);
  };

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setCurrentAudioFileIndex(0);

    try {
      savePlayerState(courseId, {
        selectedLesson: lesson,
        currentAudioFileIndex: 0,
      });
    } catch (error) {
      console.error("Error saving player state:", error);
    }
  };

  const skipNext = () => {
    if (
      selectedLesson?.audioFile &&
      currentAudioFileIndex < selectedLesson.audioFile.length - 1
    ) {
      setCurrentAudioFileIndex(currentAudioFileIndex + 1);
      setCurrentTime(0);
    }
  };

  const skipPrev = () => {
    if (currentAudioFileIndex > 0) {
      setCurrentAudioFileIndex(currentAudioFileIndex - 1);
      setCurrentTime(0);
    }
  };

  const handleAudioItemClick = (index) => {
    setCurrentAudioFileIndex(index);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleDownload = (audioUrl, fileName) => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = fileName || "audio.mp3";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLessonComplete = async (lesson) => {
    try {
      const updated = await updateLessonProgress(courseId, lesson);
      console.log("Lesson marked as completed:", updated);

      setCompletedAudioFiles((prev) => ({
        ...prev,
        [lesson._id]: true,
      }));

      // Fetch updated progress
      const progress = await getCourseProgress(courseId);
      setUserProgress(progress || { completedLessons: [], attemptedExams: {} });
    } catch (error) {
      console.error("Error updating lesson progress:", error);
    }
  };

  return {
    // Chapter & Course Data
    chapters,
    loading,
    error,
    errorCode,
    setError,
    setErrorCode,

    // Selected Lesson
    selectedLesson,
    setSelectedLesson,

    // Audio Player State
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    setVolume,
    playbackRate,
    setPlaybackRate,
    showPlaybackOptions,
    setShowPlaybackOptions,
    audioLoadError,
    setAudioLoadError,
    currentAudioFileIndex,
    setCurrentAudioFileIndex,

    // Audio Completion Tracking
    completedAudioFiles,
    setCompletedAudioFiles,

    // Progress Tracking
    userProgress,
    setUserProgress,
    purchaseDate,
    setPurchaseDate,

    // EMI & Payment
    emiStatus,
    setEmiStatus,
    isCourseLocked,
    setIsCourseLocked,
    emiPaymentRequired,
    setEmiPaymentRequired,
    emiCheckLoading,
    setEmiCheckLoading,
    overdueDetails,
    setOverdueDetails,
    showPaymentSuccess,
    setShowPaymentSuccess,

    // UI State
    activeTab,
    setActiveTab,
    selectedChapterIndex,
    setSelectedChapterIndex,
    showExamQuestions,
    setShowExamQuestions,
    contentRefreshKey,
    setContentRefreshKey,
    isOnline,
    setIsOnline,

    // Handlers
    handlePlayPause,
    handleSeek,
    handleVolumeChange,
    changePlaybackRate,
    handleSelectLesson,
    skipNext,
    skipPrev,
    handleAudioItemClick,
    handleDownload,
    handleLessonComplete,

    // Refs
    audioRef,
    progressBarRef,
    volumeBarRef,
    playbackOptionsRef,
    playOnLoadRef,
    hasRestoredState,
    audioRetryRef,
    progressUpdaterRef,
    pendingProgressUpdatesRef,
    certificateRequestedRef,
    selectedLessonRef,
    currentAudioFileIndexRef,
    chaptersRef,

    // Constants
    courseId,
    storageUserId,
    isTutorCourse,
    progressStorageKey,
  };
}
