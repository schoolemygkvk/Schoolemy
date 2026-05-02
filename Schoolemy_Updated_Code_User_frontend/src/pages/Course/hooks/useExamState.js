/**
 * ISSUE #47 FIX 3.47.8: useExamState Custom Hook
 * Per-question timer (default 2 min each), manual submit only — no global auto-submit.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../../service/api";

/** Time allowed per question (seconds) — 2 minutes */
export const SECONDS_PER_QUESTION = 120;

const getExamStateKey = (courseId, chapterIndex, examId) => {
  const ch =
    chapterIndex === null || chapterIndex === undefined ? "default" : chapterIndex;
  const baseKey = `examState_v2_${courseId}_${ch}`;
  return examId ? `${baseKey}_${examId}` : baseKey;
};

export function useExamState({ courseId, selectedLesson, chapters, onExamAttemptRecorded }) {
  const [examAnswers, setExamAnswers] = useState({});
  const [examTimer, setExamTimer] = useState(null);
  const [examTimerActive, setExamTimerActive] = useState(false);
  const [totalExamTime, setTotalExamTime] = useState(SECONDS_PER_QUESTION);
  const [examStarted, setExamStarted] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [hasAnsweredQuestions, setHasAnsweredQuestions] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [showValidationHighlight, setShowValidationHighlight] = useState(false);
  const [examInProgress, setExamInProgress] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const examTimerRef = useRef(null);
  const examStartedAtRef = useRef(null);
  const currentQuestionIndexRef = useRef(0);
  const selectedLessonRef = useRef(selectedLesson);
  const chaptersRef = useRef(chapters);
  const examAnswersRef = useRef(examAnswers);
  const hasAnsweredQuestionsRef = useRef(hasAnsweredQuestions);

  useEffect(() => {
    examAnswersRef.current = examAnswers;
  }, [examAnswers]);

  useEffect(() => {
    hasAnsweredQuestionsRef.current = hasAnsweredQuestions;
  }, [hasAnsweredQuestions]);

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    selectedLessonRef.current = selectedLesson;
  }, [selectedLesson]);

  useEffect(() => {
    chaptersRef.current = chapters;
  }, [chapters]);

  const saveExamState = (examData) => {
    try {
      const key = getExamStateKey(courseId, selectedLesson?.chapterIndex, examData?.examId);
      localStorage.setItem(key, JSON.stringify(examData));
    } catch (error) {
      console.error("Error saving exam state:", error);
    }
  };

  const loadExamState = () => {
    try {
      const chapter =
        selectedLesson?.chapterIndex === null ||
        selectedLesson?.chapterIndex === undefined
          ? "default"
          : selectedLesson.chapterIndex;
      const key = getExamStateKey(courseId, chapter);
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);

      const oldKey = `examState_${courseId}_${chapter}`;
      const oldSaved = localStorage.getItem(oldKey);
      if (oldSaved) {
        const data = JSON.parse(oldSaved);
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.removeItem(oldKey);
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error loading exam state:", error);
      return null;
    }
  };

  const clearExamState = (chapterIndexOverride) => {
    try {
      const ch = chapterIndexOverride ?? selectedLesson?.chapterIndex;
      const key = getExamStateKey(courseId, ch);
      localStorage.removeItem(key);
      const oldKey = `examState_${courseId}_${ch ?? "default"}`;
      localStorage.removeItem(oldKey);
    } catch (error) {
      console.error("Error clearing exam state:", error);
    }
  };

  const showPriorExamResult = useCallback((chapterIndex, attemptRecord) => {
    if (attemptRecord == null || chapterIndex == null) return;
    clearExamState(chapterIndex);
    examStartedAtRef.current = null;
    setExamAnswers({});
    examAnswersRef.current = {};
    setExamTimer(null);
    setExamTimerActive(false);
    setExamStarted(false);
    setExamInProgress(false);
    setExamCompleted(true);
    setShowExamModal(true);
    setSubmissionStatus({
      status: "success",
      alreadyCompleted: true,
      message: "Exam already completed",
      result: {
        obtainedMarks: attemptRecord.obtainedMarks,
        totalMarks: attemptRecord.totalMarks,
        passed: attemptRecord.passed,
        attemptNumber: attemptRecord.attemptNumber,
        submittedAt: attemptRecord.submittedAt,
      },
    });
  }, [courseId]);

  const handleAnswerSelect = (questionKey, answer) => {
    setExamAnswers((prev) => {
      const newAnswers = { ...prev, [questionKey]: answer };
      setHasAnsweredQuestions(true);
      saveExamState({
        examStarted: true,
        examStartedAt: examStartedAtRef.current,
        examTimerActive,
        showExamModal: true,
        examInProgress: true,
        examCompleted: false,
        examTimer,
        examAnswers: newAnswers,
        currentQuestionIndex: currentQuestionIndexRef.current,
        hasAnsweredQuestions: true,
        timestamp: Date.now(),
      });
      return newAnswers;
    });
  };

  const startExam = () => {
    examStartedAtRef.current = new Date().toISOString();
    setExamStarted(true);
    setExamAnswers({});
    examAnswersRef.current = {};
    setHasAnsweredQuestions(false);
    hasAnsweredQuestionsRef.current = false;
    setCurrentQuestionIndex(0);
    currentQuestionIndexRef.current = 0;
    setExamTimer(SECONDS_PER_QUESTION);
    setExamTimerActive(true);
    setShowExamModal(true);
    setExamInProgress(true);
    setExamCompleted(false);
    setSubmissionError("");
    setShowValidationHighlight(false);

    saveExamState({
      examStarted: true,
      examStartedAt: examStartedAtRef.current,
      examTimerActive: true,
      showExamModal: true,
      examInProgress: true,
      examCompleted: false,
      examTimer: SECONDS_PER_QUESTION,
      examAnswers: {},
      currentQuestionIndex: 0,
      hasAnsweredQuestions: false,
      timestamp: Date.now(),
    });
  };

  const closeExamModal = () => {
    if (examCompleted) {
      setShowExamModal(false);
      setExamInProgress(false);
      setExamCompleted(false);
      setExamStarted(false);
      setCurrentQuestionIndex(0);
      clearExamState();
    }
  };

  const goToNextQuestion = useCallback(() => {
    const sl = selectedLessonRef.current;
    if (!sl || sl.type !== "exam") return;
    const exam = chaptersRef.current[sl.chapterIndex]?.exam;
    const totalQ = exam?.examQuestions?.length || 0;
    const idx = currentQuestionIndexRef.current;
    if (idx >= totalQ - 1) return;
    const next = idx + 1;
    setCurrentQuestionIndex(next);
    currentQuestionIndexRef.current = next;
    setExamTimer(SECONDS_PER_QUESTION);
    setExamTimerActive(true);
  }, []);

  const goToPreviousQuestion = useCallback(() => {
    const idx = currentQuestionIndexRef.current;
    if (idx <= 0) return;
    const next = idx - 1;
    setCurrentQuestionIndex(next);
    currentQuestionIndexRef.current = next;
    setExamTimer(SECONDS_PER_QUESTION);
    setExamTimerActive(true);
  }, []);

  const submitExam = async () => {
    if (!selectedLesson || selectedLesson.type !== "exam") return;

    const chapterIndex = selectedLesson.chapterIndex;
    const chapter = chapters[chapterIndex];
    const exam = chapter.exam;

    setShowValidationHighlight(false);
    setSubmissionError("");

    setExamTimerActive(false);
    setShowExamModal(false);
    if (examTimerRef.current) {
      clearInterval(examTimerRef.current);
      examTimerRef.current = null;
    }

    const payload = exam.examQuestions.map((q, i) => ({
      questionId: q._id,
      question: q.question,
      selectedAnswer: examAnswers[`${chapterIndex}-${i}`] ?? null,
    }));

    try {
      setSubmissionStatus({ status: "submitting" });
      const submitTime = new Date().toISOString();
      // Backend requires startTime + submitTime; ref is null after refresh unless restored from localStorage
      const startTimeIso =
        examStartedAtRef.current ||
        (() => {
          try {
            const raw = loadExamState();
            return raw?.examStartedAt || null;
          } catch {
            return null;
          }
        })() ||
        submitTime;
      if (!examStartedAtRef.current && startTimeIso) {
        examStartedAtRef.current = startTimeIso;
      }
      const chapterTitleForApi = exam.chapterTitle || chapter.title;
      const response = await api.post("/api/v1/exam-questions/user/exam/answer-submit", {
        examId: exam.examId || exam._id,
        courseId,
        chapterTitle: chapterTitleForApi,
        lessonName: chapterTitleForApi,
        answers: payload,
        startTime: startTimeIso,
        submitTime,
        endTime: submitTime,
      });

      if (response.data?.success) {
        clearExamState(chapterIndex);
        setExamCompleted(true);
        const data = response.data?.data;
        const passingPct = exam.passingScore;
        const computedPassed =
          data != null && passingPct != null && data.totalMarks > 0
            ? data.obtainedMarks >= (passingPct * data.totalMarks) / 100
            : undefined;
        const resultPayload =
          data != null
            ? {
                obtainedMarks: data.obtainedMarks,
                totalMarks: data.totalMarks,
                passed: computedPassed,
                submittedAt: new Date().toISOString(),
              }
            : response.data?.result;
        setSubmissionStatus({
          status: "success",
          message: "Exam submitted successfully!",
          result: resultPayload,
        });
        onExamAttemptRecorded?.({
          chapterIndex,
          result: resultPayload,
        });
      }
    } catch (error) {
      setSubmissionStatus({
        status: "error",
        message: error.response?.data?.message || "Submission failed",
      });
      setExamTimer(SECONDS_PER_QUESTION);
      setExamTimerActive(true);
      setShowExamModal(true);
    }
  };

  const onTimerTick = () => {};

  useEffect(() => {
    if (!selectedLesson || selectedLesson.type !== "exam") {
      setCurrentQuestionIndex(0);
      currentQuestionIndexRef.current = 0;
      return;
    }
    const exam = chapters[selectedLesson.chapterIndex]?.exam;
    const n = exam?.examQuestions?.length ?? 0;
    if (n <= 0) return;
    setCurrentQuestionIndex((i) => {
      const c = Math.min(Math.max(0, i), n - 1);
      currentQuestionIndexRef.current = c;
      return c;
    });
  }, [selectedLesson, chapters]);

  useEffect(() => {
    if (!selectedLesson || selectedLesson.type !== "exam" || !chapters.length) {
      return;
    }
    const chapter = chapters[selectedLesson.chapterIndex];
    if (!chapter?.exam) return;
    if (!examStarted) {
      setTotalExamTime(SECONDS_PER_QUESTION);
    }
  }, [selectedLesson, chapters, examStarted]);

  useEffect(() => {
    if (!selectedLesson || selectedLesson.type !== "exam" || !chapters.length) {
      return;
    }

    const savedState = loadExamState();
    if (savedState && (savedState.examStarted || savedState.examTimer != null)) {
      setExamAnswers(savedState.examAnswers || {});
      setExamStarted(savedState.examStarted || false);
      setExamInProgress(savedState.examInProgress || false);
      setExamCompleted(savedState.examCompleted || false);
      setShowExamModal(savedState.showExamModal || false);
      setExamTimerActive(savedState.examTimerActive || false);
      setHasAnsweredQuestions(savedState.hasAnsweredQuestions || false);
      const idx = savedState.currentQuestionIndex ?? 0;
      setCurrentQuestionIndex(idx);
      currentQuestionIndexRef.current = idx;

      if (savedState.examStartedAt) {
        examStartedAtRef.current = savedState.examStartedAt;
      }

      if (savedState.timestamp != null && savedState.examTimer != null) {
        const elapsed = Math.floor((Date.now() - savedState.timestamp) / 1000);
        const remaining = Math.max(0, savedState.examTimer - elapsed);
        setExamTimer(remaining);
      }
    }
  }, [courseId, selectedLesson, chapters]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (examInProgress && !examCompleted) {
        e.preventDefault();
        e.returnValue = "You have an exam in progress. Are you sure you want to leave?";
        return "You have an exam in progress. Are you sure you want to leave?";
      }
    };

    if (examInProgress && !examCompleted) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [examInProgress, examCompleted]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!examStarted || showExamModal === false || examCompleted) {
        if (e.key === "Escape") {
          if (examCompleted) setShowExamModal(false);
        }
        return;
      }

      if (e.key === "F5") {
        e.preventDefault();
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "r") {
        e.preventDefault();
        return false;
      }
      if (e.key === "Escape" && !examCompleted) {
        e.preventDefault();
        return false;
      }
    };

    if (examStarted && showExamModal) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [examStarted, showExamModal, examCompleted]);

  useEffect(() => {
    const handlePopState = () => {
      if (examInProgress && !examCompleted) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    if (examInProgress && !examCompleted) {
      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [examInProgress, examCompleted]);

  useEffect(() => {
    if (showExamModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showExamModal]);

  useEffect(() => {
    if (!examTimerActive || examCompleted || !examStarted) {
      if (examTimerRef.current) {
        clearInterval(examTimerRef.current);
        examTimerRef.current = null;
      }
      return;
    }

    examTimerRef.current = setInterval(() => {
      setExamTimer((prevTime) => {
        const t = prevTime ?? SECONDS_PER_QUESTION;
        if (t <= 1) {
          const sl = selectedLessonRef.current;
          const chs = chaptersRef.current;
          if (!sl || sl.type !== "exam") {
            return 0;
          }
          const chapterIndex = sl.chapterIndex;
          const exam = chs[chapterIndex]?.exam;
          const totalQ = exam?.examQuestions?.length || 0;
          const idx = currentQuestionIndexRef.current;

          if (totalQ === 0) {
            setExamTimerActive(false);
            return 0;
          }

          if (idx < totalQ - 1) {
            const next = idx + 1;
            setCurrentQuestionIndex(next);
            currentQuestionIndexRef.current = next;
            saveExamState({
              examStarted: true,
              examStartedAt: examStartedAtRef.current,
              examTimerActive: true,
              showExamModal: true,
              examInProgress: true,
              examCompleted: false,
              examTimer: SECONDS_PER_QUESTION,
              examAnswers: examAnswersRef.current,
              currentQuestionIndex: next,
              hasAnsweredQuestions: hasAnsweredQuestionsRef.current,
              timestamp: Date.now(),
            });
            return SECONDS_PER_QUESTION;
          }

          setExamTimerActive(false);
          saveExamState({
            examStarted: true,
            examStartedAt: examStartedAtRef.current,
            examTimerActive: false,
            showExamModal: true,
            examInProgress: true,
            examCompleted: false,
            examTimer: 0,
            examAnswers: examAnswersRef.current,
            currentQuestionIndex: idx,
            hasAnsweredQuestions: hasAnsweredQuestionsRef.current,
            timestamp: Date.now(),
          });
          return 0;
        }

        const newTime = t - 1;
        if (newTime % 5 === 0) {
          saveExamState({
            examStarted: true,
            examStartedAt: examStartedAtRef.current,
            examTimerActive: true,
            showExamModal: true,
            examInProgress: true,
            examCompleted: false,
            examTimer: newTime,
            examAnswers: examAnswersRef.current,
            currentQuestionIndex: currentQuestionIndexRef.current,
            hasAnsweredQuestions: hasAnsweredQuestionsRef.current,
            timestamp: Date.now(),
          });
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (examTimerRef.current) {
        clearInterval(examTimerRef.current);
        examTimerRef.current = null;
      }
    };
  }, [examTimerActive, examStarted, examCompleted]);

  return {
    examAnswers,
    examTimer,
    examTimerActive,
    totalExamTime,
    examStarted,
    showExamModal,
    hasAnsweredQuestions,
    submissionError,
    showValidationHighlight,
    examInProgress,
    examCompleted,
    submissionStatus,
    currentQuestionIndex,
    secondsPerQuestion: SECONDS_PER_QUESTION,

    setExamAnswers,
    setExamTimer,
    setExamTimerActive,
    setTotalExamTime,
    setExamStarted,
    setShowExamModal,
    setHasAnsweredQuestions,
    setSubmissionError,
    setShowValidationHighlight,
    setExamInProgress,
    setExamCompleted,
    setSubmissionStatus,
    setCurrentQuestionIndex,

    handleAnswerSelect,
    startExam,
    closeExamModal,
    showPriorExamResult,
    submitExam,
    goToNextQuestion,
    goToPreviousQuestion,
    onTimerTick,
    saveExamState,
    loadExamState,
    clearExamState,

    examTimerRef,
    examStartedAtRef,
  };
}
