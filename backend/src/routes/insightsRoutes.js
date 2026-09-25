import express from "express";
import { getInsights } from "../controllers/insightsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getInsights);

export default router;
