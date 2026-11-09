import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses } from "../store/catalogSlice.js";

export function Home() {
  const dispatch = useDispatch();
  const courses = useSelector((s) => s.catalog.items);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  return (
    <div className="hero">
      <p className="meta">ONLINE SCHOOL</p>
      <h1>Courses, live rooms, and credentials in one campus.</h1>
      <p className="lede">
        Lumina is a full learning system: instructors publish video lessons, a worker turns them into HLS, CloudFront-style
        edges deliver playback, and classrooms open over WebRTC with chat.
      </p>
      <div className="row">
        <Link className="btn gold" to="/catalog">
          Browse catalog
        </Link>
        <Link className="btn ghost" to="/register">
          Join as student or instructor
        </Link>
      </div>
      <div className="grid" style={{ marginTop: 48 }}>
        {courses.slice(0, 3).map((c) => (
          <Link className="card" key={c._id} to={`/courses/${c.slug}`}>
            <div className="meta">{c.category} · {c.level}</div>
            <h3>{c.title}</h3>
            <p className="meta">{c.subtitle}</p>
            <div className="price">{c.price ? `$${c.price}` : "Free"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
