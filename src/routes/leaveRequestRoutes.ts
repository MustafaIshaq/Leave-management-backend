import express from "express";
import {
  createLeaveRequest,
  getLeaveRequests,
  getMyLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "../controllers/leaveRequestController";

import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/roleMiddleware";

const router = express.Router();

// user applies leave
router.post("/", protect, createLeaveRequest);

// admin views all
router.get("/", protect, authorize("ADMIN", "DIRECTOR"), getLeaveRequests);

// user views own
router.get("/my", protect, getMyLeaveRequests);

// approve/reject
router.patch("/:id/approve", protect, authorize("ADMIN", "DIRECTOR"), approveLeaveRequest);
router.patch("/:id/reject", protect, authorize("ADMIN", "DIRECTOR"), rejectLeaveRequest);

export default router;