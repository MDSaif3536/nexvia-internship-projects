import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, downloadCert } from "../api.js";
import { HlsPlayer } from "../components/HlsPlayer.jsx";

export function Learn() {
  const { slug } = useParams();
  const [pack, setPack] = useState(null);
  const [lessonId, setLessonId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [enroll, setEnroll] = useState(null);

  useEffect(() => {
    api(`/api/courses/${slug}`).then((d) => {
      setPack(d);
      setLessonId(d.lessons[0]?.id);
    });
    api("/api/enrollments/me")
      .then((d) => {
        const match = d.enrollments.find((e) => e.course?.slug === slug);
        setEnroll(match);
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!lessonId) return;
    setResult(null);
    api(`/api/lessons/${lessonId}`).then(setDetail);
  }, [lessonId]);

  async function complete() {
    const data = await api(`/api/enrollments/${pack.course._id}/lessons/${lessonId}/complete`, { method: "POST" });
    setEnroll(data.enrollment);
  }

  async function submitQuiz(e) {
    e.preventDefault();
    const payload = (detail.quiz.questions || []).map((q) => ({
      questionId: q._id,
      selectedIndex: Number(answers[q._id])
    }));
    const data = await api(`/api/quizzes/${detail.quiz._id}/attempt`, { method: "POST", body: { answers: payload } });
    setResult(data.result);
    if (data.result.passed) await complete();
  }

  if (!pack) return <div className="page">Loading campus…</div>;

  return (
    <div className="page">
      <h1>{pack.course.title}</h1>
      <div className="progress">
        <span style={{ width: `${enroll?.progressPercent || 0}%` }} />
      </div>
      <p className="meta">{enroll?.progressPercent || 0}% complete</p>
      {enroll?.certificateId && (
        <button className="btn gold" onClick={() => downloadCert(enroll.certificateId._id || enroll.certificateId)}>
          Download certificate
        </button>
      )}
      <div className="layout" style={{ marginTop: 20 }}>
        <div>
          {detail?.lesson?.type === "video" && detail.lesson.playbackUrl && <HlsPlayer src={detail.lesson.playbackUrl} />}
          {detail?.lesson?.type === "video" && !detail.lesson.playbackUrl && (
            <div className="card">Video is {detail.lesson.video?.status || "not uploaded"}.</div>
          )}
          {detail?.lesson?.type === "article" && (
            <div className="card">
              <h2>{detail.lesson.title}</h2>
              <p>{detail.lesson.article}</p>
            </div>
          )}
          {detail?.quiz && (
            <form className="card form wide" onSubmit={submitQuiz}>
              <h2>{detail.quiz.title}</h2>
              {detail.quiz.questions.map((q) => (
                <label key={q._id}>
                  {q.prompt}
                  <select value={answers[q._id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q._id]: e.target.value }))}>
                    <option value="">Choose</option>
                    {q.options.map((opt, i) => (
                      <option key={opt} value={i}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <button className="btn">Submit quiz</button>
              {result && (
                <div className="alert">
                  Score {result.score}% · {result.passed ? "Passed" : "Try again"}
                </div>
              )}
            </form>
          )}
          <div className="row">
            <button className="btn" onClick={complete}>
              Mark complete
            </button>
          </div>
        </div>
        <div className="lesson-list">
          {pack.lessons.map((l) => (
            <button key={l.id} onClick={() => setLessonId(l.id)}>
              {l.title}
              <div className="meta">{l.type}</div>
            </button>
          ))}
          {pack.liveSessions.map((s) => (
            <a key={s._id} href={`/live/${s._id}`}>
              Live: {s.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
