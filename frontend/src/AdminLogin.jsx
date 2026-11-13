import { useState } from "react";
import api from "./api";

export default function AdminLogin({ onBack, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const { data } = await api.post("/auth/login", { email, password, role: "admin" });
      localStorage.setItem("campushub_token", data.token);
      localStorage.setItem("campushub_user", JSON.stringify(data.user));
      onLogin(data.user.name);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to connect to server");
    } finally { setBusy(false); }
  }

  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}>
    <button type="button" className="back-link" onClick={onBack}>← Back</button>
    <h1>Campus<span>Hub</span></h1><h2>Administrator Login</h2>
    <p className="muted">Sign in with your administrator account.</p>
    <input type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} required />
    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
    {error && <p className="form-error">{error}</p>}
    <button className="primary-btn full" disabled={busy}>{busy ? "Signing in..." : "Admin Login"}</button>
  </form></div>;
}
