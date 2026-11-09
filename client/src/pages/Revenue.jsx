import { useEffect, useState } from "react";
import { api } from "../api.js";

export function Revenue() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api("/api/payments/instructor").then(setStats);
  }, []);

  if (!stats) return <div className="page">Loading ledger…</div>;

  return (
    <div className="page">
      <h1>Instructor earnings</h1>
      <p className="lede">Stripe test-mode payouts. Platform keeps 15%.</p>
      <div className="stats">
        <div className="stat">
          <span>Gross</span>
          <b>${stats.gross.toFixed(2)}</b>
        </div>
        <div className="stat">
          <span>Fees</span>
          <b>${stats.fees.toFixed(2)}</b>
        </div>
        <div className="stat">
          <span>Your net</span>
          <b>${stats.net.toFixed(2)}</b>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Course</th>
            <th>Student</th>
            <th>Amount</th>
            <th>Payout</th>
          </tr>
        </thead>
        <tbody>
          {stats.payments.map((p) => (
            <tr key={p._id}>
              <td>{p.course?.title}</td>
              <td>{p.student?.name}</td>
              <td>${p.amount}</td>
              <td>${p.instructorPayout}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
