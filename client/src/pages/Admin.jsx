import { useEffect, useState } from "react";
import { api } from "../api.js";

export function Admin() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api("/api/admin/overview").then(setOverview);
    api("/api/admin/users").then((d) => setUsers(d.users));
  }, []);

  if (!overview) return <div className="page">Admin only.</div>;

  return (
    <div className="page">
      <h1>School admin</h1>
      <div className="stats">
        <div className="stat">
          <span>Users</span>
          <b>{overview.users}</b>
        </div>
        <div className="stat">
          <span>Courses</span>
          <b>{overview.courses}</b>
        </div>
        <div className="stat">
          <span>Enrollments</span>
          <b>{overview.enrollments}</b>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
