import { useEffect, useState } from "react";
import api from "./api";

const sections = ["Overview", "Notices", "My Complaints", "Service Requests", "Feedback"];
export default function StudentDashboard({ studentName, onLogout }) {
  const [section, setSection] = useState("Overview");
  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [requests, setRequests] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ subject:"", category:"General", description:"" });
  const [requestForm, setRequestForm] = useState({ service:"Maintenance", description:"" });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  async function load() {
    try {
      const [n,c,r,f] = await Promise.all([api.get("/notices"),api.get("/complaints"),api.get("/requests"),api.get("/feedback")]);
      setNotices(n.data); setComplaints(c.data); setRequests(r.data); setFeedback(f.data); setError("");
    } catch (e) { setError(e.response?.data?.message || "Could not load dashboard data"); }
  }
  useEffect(() => { load(); }, []);

  async function sendComplaint(e) {
    e.preventDefault();
    try { await api.post("/complaints", form); setForm({subject:"",category:"General",description:""}); await load(); }
    catch(e) { setError(e.response?.data?.message || "Complaint could not be submitted"); }
  }
  async function sendRequest(e) {
    e.preventDefault();
    try { await api.post("/requests", requestForm); setRequestForm({service:"Maintenance",description:""}); await load(); }
    catch(e) { setError(e.response?.data?.message || "Request could not be submitted"); }
  }
  async function sendFeedback(e) {
    e.preventDefault();
    try { await api.post("/feedback", {rating,comment}); setComment(""); await load(); }
    catch(e) { setError(e.response?.data?.message || "Feedback could not be submitted"); }
  }

  return <div className="dashboard-shell">
    <aside className="sidebar"><h2>Campus<span>Hub</span></h2><nav>{sections.map(s=><button key={s} className={section===s?"active":""} onClick={()=>setSection(s)}>{s}</button>)}</nav><button className="logout" onClick={onLogout}>Logout</button></aside>
    <main className="dashboard-main"><header className="dash-header"><div><h1>{section}</h1><p>Welcome to your campus service portal.</p></div><span className="user-chip">👤 {studentName}</span></header>
      {error && <p className="form-error">{error}</p>}
      {section==="Overview" && <div className="stat-grid">{[["Notices",notices.length],["Complaints",complaints.length],["Service Requests",requests.length],["Feedback",feedback.length]].map(([a,b])=><div className="stat-card" key={a}><p>{a}</p><strong>{b}</strong></div>)}</div>}
      {section==="Notices" && <Cards items={notices} type="notice"/>}
      {section==="My Complaints" && <><form className="panel-form" onSubmit={sendComplaint}><h3>Submit a complaint</h3><input placeholder="Subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} required/><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>General</option><option>Facilities</option><option>Cleanliness</option><option>Academic</option><option>IT Support</option></select><textarea placeholder="Describe your complaint" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required/><button className="primary-btn">Submit Complaint</button></form><Cards items={complaints} type="complaint"/></>}
      {section==="Service Requests" && <><form className="panel-form" onSubmit={sendRequest}><h3>Request a campus service</h3><select value={requestForm.service} onChange={e=>setRequestForm({...requestForm,service:e.target.value})}><option>Maintenance</option><option>IT Support</option><option>Library</option><option>Transport</option><option>Other</option></select><textarea placeholder="Describe what you need" value={requestForm.description} onChange={e=>setRequestForm({...requestForm,description:e.target.value})} required/><button className="primary-btn">Send Request</button></form><Cards items={requests} type="request"/></>}
      {section==="Feedback" && <><form className="panel-form" onSubmit={sendFeedback}><h3>Give Feedback</h3><label>Rating: <select value={rating} onChange={e=>setRating(Number(e.target.value))}>{[5,4,3,2,1].map(x=><option key={x} value={x}>{x}/5</option>)}</select></label><textarea placeholder="Share your feedback" value={comment} onChange={e=>setComment(e.target.value)}/><button className="primary-btn">Submit Feedback</button></form><Cards items={feedback} type="feedback"/></>}
    </main>
  </div>;
}

function Cards({items,type}) {
  if (!items?.length) return <div className="empty-state">Nothing here yet.</div>;
  return <div className="records">{items.map(item=><article className="record-card" key={item._id}><h3>{type==="notice"?item.title:type==="complaint"?item.subject:type==="request"?item.service:`Rating: ${item.rating}/5 ⭐`}</h3><p>{type==="feedback"?item.comment:item.message || item.description}</p>{type!=="notice" && type!=="feedback" && <span className="status">{item.status}</span>}<small>{new Date(item.createdAt).toLocaleDateString()}</small></article>)}</div>;
}
