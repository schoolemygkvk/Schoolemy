/**
 * Documents expected client→server answer shape: prefer questionId, fallback question text.
 * Run: node --test src/__tests__/examAnswerResolution.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";

function resolveQuestion(examQuestions, userAnswer) {
  const qid = userAnswer.questionId != null ? String(userAnswer.questionId) : null;
  let original = null;
  if (qid) {
    original = examQuestions.find(
      (q) => q._id && String(q._id) === qid,
    );
  }
  if (!original && userAnswer.question) {
    original = examQuestions.find((q) => q.question === userAnswer.question);
  }
  return original;
}

test("matches by questionId when text differs slightly", () => {
  const examQuestions = [
    { _id: "507f1f77bcf86cd799439011", question: "Q1?", correctAnswer: "A" },
  ];
  const ua = {
    questionId: "507f1f77bcf86cd799439011",
    question: "wrong text",
    selectedAnswer: "A",
  };
  const q = resolveQuestion(examQuestions, ua);
  assert.ok(q);
  assert.equal(q.correctAnswer, "A");
});

test("falls back to question text", () => {
  const examQuestions = [
    { _id: "507f1f77bcf86cd799439011", question: "Q1?", correctAnswer: "B" },
  ];
  const ua = { question: "Q1?", selectedAnswer: "B" };
  const q = resolveQuestion(examQuestions, ua);
  assert.ok(q);
});
