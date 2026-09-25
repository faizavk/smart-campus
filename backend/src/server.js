import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import insightsRoutes from "./routes/insightsRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  if (req.path === "/") return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        "Database is offline. In MongoDB Atlas, whitelist this computer's IP under Network Access, restart the API, then run npm run seed.",
    });
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/search", searchRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Smart Campus API is running", status: "ok" });
});

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    console.error("If you use Atlas, whitelist this machine's IP, then restart and run npm run seed.");
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
