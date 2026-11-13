import { useState } from "react";
import "./App.css";
import Login from "./Login";
import StudentDashboard from "./StudentDashboard";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

function App() {
  const [page, setPage] = useState("home");
  const [studentName, setStudentName] = useState("");
  const [adminName, setAdminName] = useState("");

  if (page === "login") {
    return <Login onBack={() => setPage("home")} onLogin={(name) => {
      setStudentName(name);
      setPage("student");
    }} />;
  }

  if (page === "admin-login") {
    return <AdminLogin onBack={() => setPage("home")} onLogin={(name) => {
      setAdminName(name);
      setPage("admin");
    }} />;
  }

  if (page === "student") {
    return <StudentDashboard studentName={studentName} onLogout={() => {
      localStorage.removeItem("campushub_token");
      localStorage.removeItem("campushub_user");
      setPage("home");
    }} />;
  }

  if (page === "admin") {
    return <AdminDashboard adminName={adminName} onLogout={() => {
      localStorage.removeItem("campushub_token");
      localStorage.removeItem("campushub_user");
      setPage("home");
    }} />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h2>Campus<span>Hub</span></h2>
        <div className="nav-links">
          <a href="#home">Home</a><a href="#services">Services</a>
          <a href="#notices">Notices</a><a href="#about">About</a>
        </div>
        <div className="nav-actions">
          <button className="login-btn" onClick={() => setPage("login")}>Student Login</button>
          <button className="admin-entry-btn" onClick={() => setPage("admin-login")}>Admin Login</button>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="tagline">YOUR CAMPUS, ONE PLATFORM</p>
          <h1>Everything Your Campus Needs, In One Place.</h1>
          <p>Manage campus services, submit complaints, stay updated with notices and connect with your college administration.</p>
          <button className="primary-btn" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>Explore Services →</button>
        </div>
      </section>

      <section className="services" id="services">
        <h2>Campus Services</h2>
        <p className="section-subtitle">Access all your campus facilities in one place.</p>
        <div className="service-grid">
          <div className="service-card"><div className="service-icon">📢</div><h3>Campus Notices</h3><p>Stay updated with important college announcements.</p></div>
          <div className="service-card"><div className="service-icon">📝</div><h3>Complaints</h3><p>Submit complaints and track their resolution.</p></div>
          <div className="service-card"><div className="service-icon">🛠️</div><h3>Service Requests</h3><p>Request assistance for campus facilities.</p></div>
          <div className="service-card"><div className="service-icon">💬</div><h3>Feedback</h3><p>Share your suggestions to improve campus life.</p></div>
        </div>
      </section>
      <section className="about" id="about"><h2>One Hub. Better Campus Experience.</h2><p>CampusHub connects students and administration through a simple and organized digital platform.</p></section>
      <footer><h3>CampusHub</h3><p>Making campus services simpler and smarter.</p><p>© 2026 Campus Service Hub</p></footer>
    </div>
  );
}
export default App;
