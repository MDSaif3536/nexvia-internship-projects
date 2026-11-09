import test from "node:test";
import assert from "node:assert/strict";
import { gradeQuiz, progressPercent } from "../src/utils/grade.js";

test("auto-grades a passing attempt", () => {
  const quiz = {
    passingScore: 70,
    questions: [
      { _id: "a", correctIndex: 1 },
      { _id: "b", correctIndex: 2 },
      { _id: "c", correctIndex: 0 }
    ]
  };
  const result = gradeQuiz(quiz, [
    { questionId: "a", selectedIndex: 1 },
    { questionId: "b", selectedIndex: 2 },
    { questionId: "c", selectedIndex: 1 }
  ]);
  assert.equal(result.score, 67);
  assert.equal(result.passed, false);
  assert.equal(result.correct, 2);
});

test("progress is a percent of completed lessons", () => {
  assert.equal(progressPercent(2, 4), 50);
  assert.equal(progressPercent(0, 0), 0);
  assert.equal(progressPercent(5, 4), 100);
});
