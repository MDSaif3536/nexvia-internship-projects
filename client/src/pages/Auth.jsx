import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, register } from "../store/authSlice.js";

export function Auth({ mode }) {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { error, status } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    const action = mode === "login" ? login : register;
    const result = await dispatch(action(form));
    if (result.meta.requestStatus === "fulfilled") nav("/dashboard");
  }

  return (
    <div className="page">
      <h1>{mode === "login" ? "Welcome back" : "Create your seat"}</h1>
      <form className="form" onSubmit={submit}>
        {mode === "register" && (
          <>
            <label>
              Name
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </label>
          </>
        )}
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required />
        </label>
        {error && <div className="alert">{error}</div>}
        <button className="btn" disabled={status === "loading"}>
          {mode === "login" ? "Sign in" : "Register"}
        </button>
        <p className="meta">
          Demo: student@lumina.test, instructor@lumina.test, admin@lumina.test — Password123!
        </p>
        {mode === "login" ? <Link to="/register">Need an account?</Link> : <Link to="/login">Already enrolled?</Link>}
      </form>
    </div>
  );
}
