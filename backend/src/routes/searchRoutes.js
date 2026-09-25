import express from "express";
import { searchCampus } from "../controllers/searchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, searchCampus);

export default router;
