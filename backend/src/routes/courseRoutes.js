import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  enrollCourse,
  unenrollCourse,
} from "../controllers/courseController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("faculty", "admin"), createCourse);
router.get("/", protect, getCourses);
router.get("/:id", protect, getCourseById);
router.post("/:id/enroll", protect, authorize("student"), enrollCourse);
router.post("/:id/unenroll", protect, authorize("student"), unenrollCourse);

export default router;
