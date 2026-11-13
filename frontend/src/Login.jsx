import { useState } from "react";
import api from "./api";

export default function Login({ onBack, onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const body = mode === "register" ? { name, email, password } : { email, password, role: "student" };
      const { data } = await api.post(endpoint, body);
      localStorage.setItem("campushub_token", data.token);
      localStorage.setItem("campushub_user", JSON.stringify(data.user));
      onLogin(data.user.name);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to connect to server");
    } finally { setBusy(false); }
  }

  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}>
    <button type="button" className="back-link" onClick={onBack}>← Back</button>
    <h1>Campus<span>Hub</span></h1><h2>{mode === "login" ? "Student Login" : "Create Student Account"}</h2>
    {mode === "register" && <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />}
    <input type="email" placeholder="College email" value={email} onChange={e => setEmail(e.target.value)} required />
    <input type="password" placeholder="Password (minimum 6 characters)" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
    {error && <p className="form-error">{error}</p>}
    <button className="primary-btn full" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Login" : "Register"}</button>
    <p className="switch-auth">{mode === "login" ? "New student?" : "Already registered?"} <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Create account" : "Login"}</button></p>
  </form></div>;
}
