import { useEffect, useState } from "react";
import api from "./api";

const tabs = ["Overview","Notices","Complaints","Service Requests","Feedback"];
export default function AdminDashboard({ adminName, onLogout }) {
  const [tab,setTab] = useState("Overview");
  const [stats,setStats] = useState({});
  const [notices,setNotices] = useState([]);
  const [complaints,setComplaints] = useState([]);
  const [requests,setRequests] = useState([]);
  const [feedback,setFeedback] = useState([]);
  const [notice,setNotice] = useState({title:"",message:""});
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);

  async function load() {
    try {
      const [s,n,c,r,f] = await Promise.all([api.get("/admin/stats"),api.get("/notices"),api.get("/complaints"),api.get("/requests"),api.get("/feedback")]);
      setStats(s.data); setNotices(n.data); setComplaints(c.data); setRequests(r.data); setFeedback(f.data); setError("");
    } catch(e) { setError(e.response?.data?.message || "Could not load admin data. Check admin login and backend."); }
  }
  useEffect(()=>{load();},[]);

  async function publish(e) {
    e.preventDefault(); setBusy(true); setError("");
    try { await api.post("/notices",notice); setNotice({title:"",message:""}); await load(); }
    catch(e) { setError(e.response?.data?.message || "Could not publish notice"); }
    finally { setBusy(false); }
  }
  async function deleteNotice(id) {
    if (!window.confirm("Delete this notice?")) return;
    try { await api.delete(`/notices/${id}`); await load(); }
    catch(e) { setError(e.response?.data?.message || "Could not delete notice"); }
  }
  async function updateStatus(kind,id,status) {
    try { await api.patch(`/${kind}/${id}`,{status}); await load(); }
    catch(e) { setError(e.response?.data?.message || "Could not update status"); }
  }

  return <div className="dashboard-shell">
    <aside className="sidebar"><h2>Campus<span>Hub</span></h2><p className="admin-label">ADMIN PANEL</p><nav>{tabs.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</nav><button className="logout" onClick={onLogout}>Logout</button></aside>
    <main className="dashboard-main"><header className="dash-header"><div><h1>{tab}</h1><p>Administrator control centre</p></div><span className="user-chip">🛡️ {adminName || "Admin"}</span></header>
      {error && <p className="form-error">{error}</p>}
      {tab==="Overview" && <div className="stat-grid">{[["Students",stats.students],["Notices",stats.notices],["Total Complaints",stats.complaints],["Open Complaints",stats.openComplaints],["Service Requests",stats.requests],["Feedback",stats.feedback]].map(([a,b])=><div className="stat-card" key={a}><p>{a}</p><strong>{b ?? "—"}</strong></div>)}</div>}
      {tab==="Notices" && <><form className="panel-form" onSubmit={publish}><h3>Publish a new notice</h3><input placeholder="Notice title" value={notice.title} onChange={e=>setNotice({...notice,title:e.target.value})} required/><textarea placeholder="Write the announcement..." value={notice.message} onChange={e=>setNotice({...notice,message:e.target.value})} required/><button className="primary-btn" disabled={busy}>{busy?"Publishing...":"Publish Notice"}</button></form><div className="records">{notices.map(n=><article className="record-card" key={n._id}><h3>{n.title}</h3><p>{n.message}</p><small>{new Date(n.createdAt).toLocaleString()}</small><button className="danger-btn" onClick={()=>deleteNotice(n._id)}>Delete</button></article>)}</div></>}
      {tab==="Complaints" && <AdminRecords items={complaints} kind="complaints" onStatus={updateStatus} titleKey="subject" descriptionKey="description" />}
      {tab==="Service Requests" && <AdminRecords items={requests} kind="requests" onStatus={updateStatus} titleKey="service" descriptionKey="description" />}
      {tab==="Feedback" && <div className="records">{feedback.length?feedback.map(f=><article className="record-card" key={f._id}><h3>{f.rating}/5 ⭐</h3><p>{f.comment || "No written comment"}</p><small>{f.student?.name || "Student"} · {f.student?.email || ""} · {new Date(f.createdAt).toLocaleDateString()}</small></article>):<div className="empty-state">No feedback received yet.</div>}</div>}
    </main>
  </div>;
}

function AdminRecords({items,kind,onStatus,titleKey,descriptionKey}) {
  const options = kind==="complaints" ? ["Submitted","In Progress","Resolved","Rejected"] : ["Submitted","In Progress","Completed","Rejected"];
  return <div className="records">{items.length?items.map(item=><article className="record-card" key={item._id}><h3>{item[titleKey]}</h3><p>{item[descriptionKey]}</p><small>{item.student?.name || "Student"} · {item.student?.email || ""} · {new Date(item.createdAt).toLocaleDateString()}</small><div className="status-row"><span className="status">{item.status}</span><select value={item.status} onChange={e=>onStatus(kind,item._id,e.target.value)}>{options.map(s=><option key={s}>{s}</option>)}</select></div>{item.adminNote && <p>Admin note: {item.adminNote}</p>}</article>):<div className="empty-state">No records yet.</div>}</div>;
}
