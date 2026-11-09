import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../api.js";

export function Course() {
  const { slug } = useParams();
  const nav = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api(`/api/courses/${slug}`).then(setData).catch((e) => setMsg(e.message));
  }, [slug]);

  async function enroll() {
    if (!user) return nav("/login");
    const res = await api(`/api/enrollments/${data.course._id}`, { method: "POST" });
    if (res.checkout?.url) window.location.href = res.checkout.url;
    else nav(`/learn/${slug}`);
  }

  if (!data) return <div className="page">{msg || "Loading…"}</div>;
  const { course, lessons, liveSessions } = data;

  return (
    <div className="page">
      <p className="meta">
        {course.category} · {course.level} · {course.instructor?.name}
      </p>
      <h1>{course.title}</h1>
      <p className="lede">{course.description}</p>
      <div className="row">
        <button className="btn gold" onClick={enroll}>
          {course.price ? `Enroll · $${course.price} (test mode)` : "Enroll free"}
        </button>
        <Link className="btn ghost" to={`/learn/${slug}`}>
          Continue learning
        </Link>
      </div>
      <div className="layout" style={{ marginTop: 32 }}>
        <div className="card">
          <h2>Syllabus</h2>
          <div className="lesson-list">
            {lessons.map((l) => (
              <div key={l.id}>
                {l.order + 1}. {l.title} <span className="meta">({l.type})</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>You will learn</h2>
          {(course.learningOutcomes || []).map((o) => (
            <p key={o} className="meta">
              · {o}
            </p>
          ))}
          <h3>Live classes</h3>
          {liveSessions.map((s) => (
            <p key={s._id}>
              <Link to={`/live/${s._id}`}>{s.title}</Link>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
