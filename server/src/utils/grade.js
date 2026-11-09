export function gradeQuiz(quiz, answers) {
  const byId = new Map((answers || []).map((a) => [String(a.questionId), a.selectedIndex]));
  let correct = 0;
  const breakdown = quiz.questions.map((q) => {
    const selected = byId.get(String(q._id));
    const ok = selected === q.correctIndex;
    if (ok) correct += 1;
    return { questionId: q._id, selectedIndex: selected, correctIndex: q.correctIndex, correct: ok };
  });
  const total = quiz.questions.length || 1;
  const score = Math.round((correct / total) * 100);
  return { score, passed: score >= quiz.passingScore, breakdown, correct, total };
}

export function progressPercent(completedCount, totalLessons) {
  if (!totalLessons) return 0;
  return Math.min(100, Math.round((completedCount / totalLessons) * 100));
}
