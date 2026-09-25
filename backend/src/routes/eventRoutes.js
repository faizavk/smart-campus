import express from "express";
import { createEvent, getEvents, rsvpEvent } from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("admin", "faculty"), createEvent);
router.get("/", protect, getEvents);
router.post("/:id/rsvp", protect, rsvpEvent);

export default router;
