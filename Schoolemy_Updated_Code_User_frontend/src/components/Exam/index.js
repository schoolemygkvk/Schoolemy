/**
 * Exam UI — completion / reattempt surfaces.
 * Core player + submission logic lives in `pages/Course/CourseContent.js`;
 * prefer extracting new hooks under `src/hooks/` or `src/features/exam/` over growing that file.
 */
export { default as ExamCompletionModal } from "./ExamCompletionModal";
export { default as ReattemptStatusCard } from "./ReattemptStatusCard";
