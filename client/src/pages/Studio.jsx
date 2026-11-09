import { useEffect, useState } from "react";
import { api } from "../api.js";

export function Studio() {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [form, setForm] = useState({ title: "", subtitle: "", description: "", price: 0, category: "Engineering", level: "beginner" });
  const [lessonTitle, setLessonTitle] = useState("");
  const [quiz, setQuiz] = useState({ lessonId: "", prompt: "", options: "A,B,C,D", correctIndex: 0 });
  const [live, setLive] = useState({ title: "Live class", scheduledAt: "" });

  async function load() {
    const d = await api("/api/courses/mine");
    setCourses(d.courses);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function createCourse(e) {
    e.preventDefault();
    await api("/api/courses", { method: "POST", body: form });
    load();
  }

  async function openCourse(c) {
    setSelected(c);
    const d = await api(`/api/courses/${c.slug}`);
    setLessons(d.lessons);
  }

  async function addLesson(e) {
    e.preventDefault();
    await api(`/api/courses/${selected._id}/lessons`, { method: "POST", body: { title: lessonTitle, type: "video" } });
    openCourse(selected);
  }

  async function upload(lessonId, file) {
    const fd = new FormData();
    fd.append("video", file);
    await api(`/api/lessons/${lessonId}/video`, { method: "POST", file: fd });
    alert("Upload queued. FFmpeg/BullMQ will produce HLS (or fallback if Redis/FFmpeg missing).");
  }

  async function publish() {
    await api(`/api/courses/${selected._id}`, { method: "PATCH", body: { published: true } });
    load();
  }

  async function saveQuiz(e) {
    e.preventDefault();
    await api("/api/quizzes", {
      method: "POST",
      body: {
        lessonId: quiz.lessonId,
        title: "Lesson quiz",
        passingScore: 70,
        questions: [
          {
            prompt: quiz.prompt,
            options: quiz.options.split(",").map((s) => s.trim()),
            correctIndex: Number(quiz.correctIndex)
          }
        ]
      }
    });
    openCourse(selected);
  }

  async function scheduleLive(e) {
    e.preventDefault();
    await api("/api/live", {
      method: "POST",
      body: { courseId: selected._id, title: live.title, scheduledAt: live.scheduledAt || new Date().toISOString() }
    });
    alert("Live class scheduled");
  }

  return (
    <div className="page">
      <h1>Instructor studio</h1>
      <div className="layout">
        <form className="card form" onSubmit={createCourse}>
          <h2>New course</h2>
          <label>
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label>
            Subtitle
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </label>
          <label>
            Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label>
            Price (USD)
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </label>
          <button className="btn">Create</button>
        </form>
        <div>
          {courses.map((c) => (
            <button key={c._id} className="card" style={{ width: "100%", marginBottom: 10 }} onClick={() => openCourse(c)}>
              {c.title} · {c.published ? "Published" : "Draft"}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="card" style={{ marginTop: 24 }}>
          <h2>{selected.title}</h2>
          <button className="btn gold" onClick={publish}>
            Publish
          </button>
          <form className="row" onSubmit={addLesson}>
            <input placeholder="Lesson title" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} />
            <button className="btn">Add lesson</button>
          </form>
          {lessons.map((l) => (
            <div key={l.id} className="row">
              <span>
                {l.title} ({l.type}) {l.videoStatus}
              </span>
              <input type="file" accept="video/*" onChange={(e) => e.target.files[0] && upload(l.id, e.target.files[0])} />
            </div>
          ))}
          <form className="form wide" onSubmit={saveQuiz}>
            <h3>Quiz</h3>
            <select value={quiz.lessonId} onChange={(e) => setQuiz({ ...quiz, lessonId: e.target.value })}>
              <option value="">Lesson</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            <input placeholder="Question" value={quiz.prompt} onChange={(e) => setQuiz({ ...quiz, prompt: e.target.value })} />
            <input placeholder="Options comma-separated" value={quiz.options} onChange={(e) => setQuiz({ ...quiz, options: e.target.value })} />
            <input type="number" value={quiz.correctIndex} onChange={(e) => setQuiz({ ...quiz, correctIndex: e.target.value })} />
            <button className="btn">Save quiz</button>
          </form>
          <form className="form" onSubmit={scheduleLive}>
            <h3>Live class</h3>
            <input value={live.title} onChange={(e) => setLive({ ...live, title: e.target.value })} />
            <input type="datetime-local" value={live.scheduledAt} onChange={(e) => setLive({ ...live, scheduledAt: e.target.value })} />
            <button className="btn">Schedule WebRTC room</button>
          </form>
        </div>
      )}
    </div>
  );
}
