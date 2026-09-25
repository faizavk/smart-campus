import express from "express";
import {
  createTicket,
  getTickets,
  updateTicket,
  deleteTicket,
  getMyTickets,
} from "../controllers/ticketController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("student", "faculty"), createTicket);
router.get("/", protect, authorize("admin"), getTickets);
router.get("/my", protect, authorize("student", "faculty"), getMyTickets);
router.patch("/:id", protect, authorize("admin"), updateTicket);
router.delete("/:id", protect, authorize("admin"), deleteTicket);

export default router;
