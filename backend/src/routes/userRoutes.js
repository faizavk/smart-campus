import express from "express";
import { getProfile, getUsers, updateUserRole, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/me", protect, getProfile);
router.patch("/me", protect, updateProfile);
router.get("/", protect, authorize("admin", "faculty"), getUsers);
router.patch("/:id/role", protect, authorize("admin"), updateUserRole);

export default router;
