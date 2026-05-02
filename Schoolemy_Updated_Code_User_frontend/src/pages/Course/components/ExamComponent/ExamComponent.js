import React from "react";
import { FaTimes, FaCheck, FaClipboardList, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { styles } from "./ExamComponent.styles";
import { ExamTimer } from "./ExamTimer";

/**
 * ISSUE #47 FIX 3.47.7: Extracted ExamComponent (Full Refactoring)
 * Per-question timer and navigation; manual submit only (no auto-submit).
 * Timer countdown is driven by useExamState (parent); no duplicate interval here.
 */

export function ExamComponent({
  exam,
  isOpen,
  showExamModal,
  chapterIndex,
  chapters,
  examAnswers,
  examTimer,
  totalExamTime,
  examStarted,
  examCompleted,
  submissionStatus,
  submissionError,
  showValidationHighlight,
  currentQuestionIndex = 0,
  onNextQuestion,
  onPrevQuestion,
  secondsPerQuestion = 120,
  onClose,
  onCloseModal,
  onStartExam,
  onAnswerChange,
  onAnswerSelect,
  onSubmitExam,
  onTimerTick,
}) {
  const handleClose = onClose || onCloseModal;
  const handleAnswer = onAnswerChange || onAnswerSelect;
  const effectiveOpen =
    isOpen !== false &&
    (showExamModal !== false || examStarted || examCompleted);

  if (!exam) {
    return null;
  }

  if (!effectiveOpen) {
    return null;
  }

  const chapter = chapters?.[chapterIndex];
  const totalQuestions = exam.examQuestions?.length || 0;
  const answeredQuestions = Object.values(examAnswers || {}).filter((a) => a).length;

  const qIdx =
    totalQuestions === 0
      ? 0
      : Math.min(Math.max(0, currentQuestionIndex || 0), totalQuestions - 1);
  const question = exam.examQuestions?.[qIdx];
  const answerKey = `${chapterIndex}-${qIdx}`;
  const atFirst = qIdx <= 0;
  const atLast = totalQuestions === 0 ? true : qIdx >= totalQuestions - 1;

  // Completed / prior result must win over "not started" so revisiting the exam shows the summary, not Start again
  if (examCompleted) {
    return (
      <ExamCompletedModal
        submissionStatus={submissionStatus}
        onClose={handleClose}
      />
    );
  }

  if (!examStarted) {
    return (
      <ExamStartModal
        exam={exam}
        chapter={chapter}
        secondsPerQuestion={secondsPerQuestion}
        onStart={onStartExam}
        onClose={handleClose}
      />
    );
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.examModal}>
        {/* Header */}
        <div style={styles.examHeader}>
          <div style={styles.examTitle}>
            <h2 style={{ margin: 0 }}>
              {exam.examinationName || exam.title || chapter?.title || "Exam"}
            </h2>
            <p style={styles.examMeta}>
              Question {totalQuestions ? qIdx + 1 : 0} of {totalQuestions} · Answered{" "}
              {answeredQuestions} of {totalQuestions} · {secondsPerQuestion / 60} min per question
            </p>
          </div>

          <ExamTimer
            examTimer={examTimer ?? 0}
            examStarted={examStarted}
            examCompleted={examCompleted}
            onTimerTick={onTimerTick}
            timeLimitSeconds={totalExamTime ?? secondsPerQuestion}
          />

          <button onClick={handleClose} style={styles.closeButton} title="Close">
            <FaTimes />
          </button>
        </div>

        {/* Progress: position in exam */}
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${
                totalQuestions > 0 ? ((qIdx + 1) / totalQuestions) * 100 : 0
              }%`,
            }}
          />
        </div>

        {/* Single question */}
        <div style={styles.questionsContainer}>
          {question && (
            <div
              id={`question-${qIdx}`}
              style={{
                ...styles.questionCard,
                ...(showValidationHighlight &&
                  !examAnswers[answerKey] &&
                  styles.questionCardError),
              }}
            >
              <div style={styles.questionHeader}>
                <span style={styles.questionNumber}>Q{qIdx + 1}</span>
                <span style={styles.questionText}>
                  {question.question || question.questionText || "Question"}
                </span>
              </div>

              <div style={styles.optionsContainer}>
                {question.options?.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    style={{
                      ...styles.optionLabel,
                      ...(examAnswers[answerKey] === option && styles.optionLabelSelected),
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${chapterIndex}-${qIdx}`}
                      value={option}
                      checked={examAnswers[answerKey] === option}
                      onChange={() => handleAnswer(answerKey, option)}
                      style={styles.radioInput}
                    />
                    <span style={styles.optionText}>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {showValidationHighlight && submissionError && (
          <div style={styles.validationError}>Warning: {submissionError}</div>
        )}

        {/* Status Message */}
        {submissionStatus?.status === "submitting" && (
          <div style={styles.submittingMessage}>Submitting exam...</div>
        )}
        {submissionStatus?.status === "error" && (
          <div style={styles.errorMessage}>{submissionStatus.message}</div>
        )}

        {/* Footer */}
        <div style={styles.examFooter}>
          <div style={styles.footerInfo}>
            Use Previous / Next to move between questions (timer resets per question). Submit when
            finished — unanswered questions are sent as blank.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={styles.examFooterNav}>
              <button
                type="button"
                onClick={onPrevQuestion}
                disabled={atFirst}
                style={{
                  ...styles.navButton,
                  ...(atFirst ? styles.navButtonDisabled : {}),
                }}
              >
                <FaChevronLeft /> Previous
              </button>
              <button
                type="button"
                onClick={onNextQuestion}
                disabled={atLast}
                style={{
                  ...styles.navButton,
                  ...(atLast ? styles.navButtonDisabled : {}),
                }}
              >
                Next <FaChevronRight />
              </button>
            </div>
            <button
              type="button"
              onClick={onSubmitExam}
              disabled={submissionStatus?.status === "submitting"}
              style={{
                ...styles.submitButton,
                ...(submissionStatus?.status === "submitting" &&
                  styles.submitButtonDisabled),
              }}
            >
              <FaCheck style={{ marginRight: "6px" }} />
              Submit exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamStartModal({ exam, chapter, secondsPerQuestion, onStart, onClose }) {
  const examTitle =
    exam.examinationName || exam.title || chapter?.title || "Chapter exam";
  const n = exam.examQuestions?.length || 0;
  const perMin = secondsPerQuestion / 60;
  const maxTotalMin = Math.ceil((n * secondsPerQuestion) / 60);

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.startModal}>
        <div style={styles.startModalIconWrap}>
          <FaClipboardList style={styles.startModalIcon} />
        </div>
        <h2 style={styles.startModalTitle}>Ready for the assessment?</h2>
        <p style={styles.startModalSubtitle}>{examTitle}</p>
        <div style={styles.examInfo}>
          <div style={styles.examInfoRow}>
            <span style={styles.examInfoLabel}>Chapter</span>
            <span style={styles.examInfoValue}>{chapter?.title || "—"}</span>
          </div>
          <div style={styles.examInfoRow}>
            <span style={styles.examInfoLabel}>Time per question</span>
            <span style={styles.examInfoValue}>
              {perMin} minute{perMin !== 1 ? "s" : ""} each
            </span>
          </div>
          <div style={styles.examInfoRow}>
            <span style={styles.examInfoLabel}>Questions</span>
            <span style={styles.examInfoValue}>{n}</span>
          </div>
          <div style={{ ...styles.examInfoRow, borderBottom: "none" }}>
            <span style={styles.examInfoLabel}>Total marks</span>
            <span style={styles.examInfoValue}>
              {exam.totalMarks || n || 0}
            </span>
          </div>
        </div>
        <p style={styles.warningText}>
          There is no automatic submit when timers run out. Each question has its own{" "}
          {perMin}-minute timer; when it hits zero you move to the next question (or stay on the
          last one and submit manually). You may leave questions blank and submit when ready — up to
          about {maxTotalMin} minutes if every question uses the full time.
        </p>
        <div style={styles.startModalFooter}>
          <button type="button" onClick={onClose} style={styles.cancelButton}>
            Go back
          </button>
          <button type="button" onClick={onStart} style={styles.startButton}>
            Start exam
          </button>
        </div>
      </div>
    </div>
  );
}

function ExamCompletedModal({ submissionStatus, onClose }) {
  const result = submissionStatus?.data || submissionStatus?.result;
  const prior = submissionStatus?.alreadyCompleted;
  const passLabel =
    result?.passed === true ? "PASSED" : result?.passed === false ? "FAILED" : "—";
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.completedModal}>
        <div style={styles.completedIcon}>{"\u2713"}</div>
        <h2>{prior ? "Exam already completed" : "Exam submitted successfully!"}</h2>
        {prior && (
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "8px" }}>
            You have already submitted this assessment. Details below are from your last attempt.
          </p>
        )}
        {result && (
          <div style={styles.resultsInfo}>
            <p>
              <strong>Score:</strong> {result.obtainedMarks} / {result.totalMarks}
            </p>
            <p>
              <strong>Result:</strong> {passLabel}
            </p>
            {result.attemptNumber != null && (
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Attempt #{result.attemptNumber}
                {result.submittedAt
                  ? ` · Submitted ${new Date(result.submittedAt).toLocaleString()}`
                  : ""}
              </p>
            )}
          </div>
        )}
        <button type="button" onClick={onClose} style={styles.continueButton}>
          Continue
        </button>
      </div>
    </div>
  );
}
