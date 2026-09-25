import express from "express";
import {
  markAttendance,
  getMyAttendance,
  getAttendanceSummary,
  bulkMarkAttendance,
  startSession,
  checkIn,
  getCourseAttendance,
  getAtRiskStudents,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("faculty", "admin"), markAttendance);
router.post("/bulk", protect, authorize("faculty", "admin"), bulkMarkAttendance);
router.post("/sessions", protect, authorize("faculty", "admin"), startSession);
router.post("/checkin", protect, authorize("student"), checkIn);
router.get("/my", protect, authorize("student"), getMyAttendance);
router.get("/summary", protect, authorize("student"), getAttendanceSummary);
router.get("/risk", protect, authorize("faculty", "admin"), getAtRiskStudents);
router.get("/course/:courseId", protect, authorize("faculty", "admin"), getCourseAttendance);

export default router;
