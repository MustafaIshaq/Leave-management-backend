import express from "express";
import {
  getLeaveTypes,
  getLeaveTypeById,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "../controllers/leaveTypeController";
import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/roleMiddleware";

const router = express.Router();

router.get("/", protect, getLeaveTypes);
router.get("/:id", protect, getLeaveTypeById);
router.post("/", protect, authorize("ADMIN"), createLeaveType);
router.put("/:id", protect, authorize("ADMIN"), updateLeaveType);
router.delete("/:id", protect, authorize("ADMIN"), deleteLeaveType);

export default router;