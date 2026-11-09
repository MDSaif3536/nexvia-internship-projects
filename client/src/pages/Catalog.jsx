import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses } from "../store/catalogSlice.js";

export function Catalog() {
  const dispatch = useDispatch();
  const courses = useSelector((s) => s.catalog.items);
  const [q, setQ] = useState("");

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  return (
    <div className="page">
      <h1>Catalog</h1>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch(fetchCourses(q));
        }}
      >
        <input placeholder="Search courses" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn">Search</button>
      </form>
      <div className="grid" style={{ marginTop: 24 }}>
        {courses.map((c) => (
          <Link className="card" key={c._id} to={`/courses/${c.slug}`}>
            <div className="meta">
              {c.category} · {c.instructor?.name}
            </div>
            <h3>{c.title}</h3>
            <p className="meta">{c.subtitle}</p>
            <div className="price">{c.price ? `$${c.price}` : "Free"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
