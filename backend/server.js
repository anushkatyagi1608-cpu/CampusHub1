import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const { MONGO_URI, JWT_SECRET, ADMIN_SETUP_KEY, PORT = 5000 } = process.env;
if (!MONGO_URI || !JWT_SECRET) {
  console.error("Missing MONGO_URI or JWT_SECRET in backend/.env");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "admin"], default: "student" }
}, { timestamps: true });

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const complaintSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  category: { type: String, default: "General" },
  description: { type: String, required: true },
  status: { type: String, enum: ["Submitted", "In Progress", "Resolved", "Rejected"], default: "Submitted" },
  adminNote: { type: String, default: "" }
}, { timestamps: true });

const requestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  service: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ["Submitted", "In Progress", "Completed", "Rejected"], default: "Submitted" },
  adminNote: { type: String, default: "" }
}, { timestamps: true });

const feedbackSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Notice = mongoose.model("Notice", noticeSchema);
const Complaint = mongoose.model("Complaint", complaintSchema);
const ServiceRequest = mongoose.model("ServiceRequest", requestSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);

const signToken = user => jwt.sign(
  { id: user._id.toString(), role: user.role, name: user.name },
  JWT_SECRET, { expiresIn: "7d" }
);

function auth(requiredRole) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token) return res.status(401).json({ message: "Authentication required" });
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.id).select("-password");
      if (!user) return res.status(401).json({ message: "Account not found" });
      if (requiredRole && user.role !== requiredRole) return res.status(403).json({ message: "Access denied" });
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/", (_req, res) => res.json({ message: "CampusHub API is running" }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ message: "Name, valid email and password (6+ characters) are required" });
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ message: "Email is already registered" });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), role: "student" });
  res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const { email, password, role = "student" } = req.body;
  const user = await User.findOne({ email: String(email || "").toLowerCase(), role });
  if (!user || !(await bcrypt.compare(password || "", user.password)))
    return res.status(401).json({ message: "Invalid email or password" });
  res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

app.post("/api/auth/register-admin", asyncRoute(async (req, res) => {
  const { name, email, password, adminSetupKey } = req.body;
  if (!ADMIN_SETUP_KEY || adminSetupKey !== ADMIN_SETUP_KEY)
    return res.status(403).json({ message: "Admin setup key is incorrect" });
  if (!name || !email || !password || password.length < 8)
    return res.status(400).json({ message: "Name, email and password (8+ characters) are required" });
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ message: "Email is already registered" });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), role: "admin" });
  res.status(201).json({ message: "Admin account created", user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

app.get("/api/notices", auth(), asyncRoute(async (_req, res) => {
  res.json(await Notice.find().sort({ createdAt: -1 }));
}));
app.post("/api/notices", auth("admin"), asyncRoute(async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Title and message are required" });
  res.status(201).json(await Notice.create({ title, message, createdBy: req.user._id }));
}));
app.delete("/api/notices/:id", auth("admin"), asyncRoute(async (req, res) => {
  const item = await Notice.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Notice not found" });
  res.json({ message: "Notice deleted" });
}));

app.get("/api/complaints", auth(), asyncRoute(async (req, res) => {
  const query = req.user.role === "admin" ? {} : { student: req.user._id };
  res.json(await Complaint.find(query).populate("student", "name email").sort({ createdAt: -1 }));
}));
app.post("/api/complaints", auth("student"), asyncRoute(async (req, res) => {
  const { subject, category, description } = req.body;
  if (!subject || !description) return res.status(400).json({ message: "Subject and description are required" });
  res.status(201).json(await Complaint.create({ student: req.user._id, subject, category, description }));
}));
app.patch("/api/complaints/:id", auth("admin"), asyncRoute(async (req, res) => {
  const allowed = ["Submitted", "In Progress", "Resolved", "Rejected"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid complaint status" });
  const item = await Complaint.findByIdAndUpdate(req.params.id,
    { status: req.body.status, adminNote: req.body.adminNote || "" }, { new: true, runValidators: true })
    .populate("student", "name email");
  if (!item) return res.status(404).json({ message: "Complaint not found" });
  res.json(item);
}));

app.get("/api/requests", auth(), asyncRoute(async (req, res) => {
  const query = req.user.role === "admin" ? {} : { student: req.user._id };
  res.json(await ServiceRequest.find(query).populate("student", "name email").sort({ createdAt: -1 }));
}));
app.post("/api/requests", auth("student"), asyncRoute(async (req, res) => {
  const { service, description } = req.body;
  if (!service || !description) return res.status(400).json({ message: "Service and description are required" });
  res.status(201).json(await ServiceRequest.create({ student: req.user._id, service, description }));
}));
app.patch("/api/requests/:id", auth("admin"), asyncRoute(async (req, res) => {
  const allowed = ["Submitted", "In Progress", "Completed", "Rejected"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid request status" });
  const item = await ServiceRequest.findByIdAndUpdate(req.params.id,
    { status: req.body.status, adminNote: req.body.adminNote || "" }, { new: true, runValidators: true })
    .populate("student", "name email");
  if (!item) return res.status(404).json({ message: "Request not found" });
  res.json(item);
}));

app.get("/api/feedback", auth(), asyncRoute(async (req, res) => {
  const query = req.user.role === "admin" ? {} : { student: req.user._id };
  res.json(await Feedback.find(query).populate("student", "name email").sort({ createdAt: -1 }));
}));
app.post("/api/feedback", auth("student"), asyncRoute(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  res.status(201).json(await Feedback.create({ student: req.user._id, rating, comment: req.body.comment || "" }));
}));

app.get("/api/admin/stats", auth("admin"), asyncRoute(async (_req, res) => {
  const [students, notices, complaints, openComplaints, requests, feedback] = await Promise.all([
    User.countDocuments({ role: "student" }), Notice.countDocuments(), Complaint.countDocuments(),
    Complaint.countDocuments({ status: { $in: ["Submitted", "In Progress"] } }),
    ServiceRequest.countDocuments(), Feedback.countDocuments()
  ]);
  res.json({ students, notices, complaints, openComplaints, requests, feedback });
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: "That email is already registered" });
  res.status(500).json({ message: "Server error", detail: process.env.NODE_ENV === "development" ? err.message : undefined });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => console.log(`CampusHub API running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
