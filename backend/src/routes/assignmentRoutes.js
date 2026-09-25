import express from "express";
import {
  createAssignment,
  getAssignments,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
} from "../controllers/assignmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("faculty"), createAssignment);
router.get("/", protect, getAssignments);
router.post("/:id/submit", protect, authorize("student"), submitAssignment);
router.get("/:id/submissions", protect, authorize("faculty", "admin"), getSubmissions);
router.patch(
  "/submissions/:submissionId",
  protect,
  authorize("faculty", "admin"),
  gradeSubmission
);

export default router;
