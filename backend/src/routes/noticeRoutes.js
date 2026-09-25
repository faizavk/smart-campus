import express from "express";
import { createNotice, getNotices, deleteNotice } from "../controllers/noticeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("admin", "faculty"), createNotice);
router.get("/", protect, getNotices);
router.delete("/:id", protect, authorize("admin", "faculty"), deleteNotice);

export default router;
