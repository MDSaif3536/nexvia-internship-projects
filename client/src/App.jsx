import { useEffect } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { bootstrap, logout } from "./store/authSlice.js";
import { Home } from "./pages/Home.jsx";
import { Auth } from "./pages/Auth.jsx";
import { Catalog } from "./pages/Catalog.jsx";
import { Course } from "./pages/Course.jsx";
import { Learn } from "./pages/Learn.jsx";
import { Studio } from "./pages/Studio.jsx";
import { LiveRoom } from "./pages/LiveRoom.jsx";
import { Revenue } from "./pages/Revenue.jsx";
import { Admin } from "./pages/Admin.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";

export function App() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(bootstrap());
  }, [dispatch]);

  return (
    <div className="shell">
      <nav className="nav">
        <NavLink className="brand" to="/">
          <span className="mark" /> Lumina
        </NavLink>
        <div className="nav-links">
          <NavLink to="/catalog">Catalog</NavLink>
          {user && <NavLink to="/dashboard">My school</NavLink>}
          {user?.role !== "student" && user && <NavLink to="/studio">Studio</NavLink>}
          {user?.role === "instructor" && <NavLink to="/revenue">Revenue</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          {!user ? (
            <button className="btn" onClick={() => nav("/login")}>
              Sign in
            </button>
          ) : (
            <button
              className="btn ghost"
              onClick={() => {
                dispatch(logout());
                nav("/");
              }}
            >
              {user.name.split(" ")[0]} · out
            </button>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/courses/:slug" element={<Course />} />
        <Route path="/learn/:slug" element={<Learn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/live/:id" element={<LiveRoom />} />
        <Route path="/revenue" element={<Revenue />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <footer className="footer">Lumina School · internship project FS-03 · MERN · WebRTC · FFmpeg · BullMQ · CloudFront</footer>
    </div>
  );
}
