import express from "express";
import {
  createTimetable,
  getTimetable,
  deleteTimetable,
} from "../controllers/timetableController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("admin"), createTimetable);
router.get("/", protect, getTimetable);
router.delete("/:id", protect, authorize("admin"), deleteTimetable);

export default router;
