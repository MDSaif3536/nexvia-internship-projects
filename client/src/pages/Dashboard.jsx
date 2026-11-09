import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, downloadCert } from "../api.js";
import { useSelector } from "react-redux";

export function Dashboard() {
  const user = useSelector((s) => s.auth.user);
  const [enrollments, setEnrollments] = useState([]);
  const [certs, setCerts] = useState([]);

  useEffect(() => {
    api("/api/enrollments/me").then((d) => setEnrollments(d.enrollments));
    api("/api/certificates/me").then((d) => setCerts(d.certificates));
  }, []);

  if (!user) return <div className="page">Sign in to open your campus.</div>;

  return (
    <div className="page">
      <h1>{user.name}</h1>
      <p className="lede">
        Role: {user.role}. Own the work — finish lessons, sit the live room, and export a certificate.
      </p>
      <div className="grid">
        {enrollments.map((e) => (
          <div className="card" key={e._id}>
            <h3>{e.course?.title}</h3>
            <div className="progress">
              <span style={{ width: `${e.progressPercent}%` }} />
            </div>
            <p className="meta">{e.progressPercent}% · {e.status}</p>
            <Link to={`/learn/${e.course?.slug}`}>Open course</Link>
          </div>
        ))}
      </div>
      <h2>Certificates</h2>
      {certs.map((c) => (
        <button key={c._id} className="btn ghost" onClick={() => downloadCert(c._id)}>
          {c.course?.title} · {c.serial}
        </button>
      ))}
    </div>
  );
}
