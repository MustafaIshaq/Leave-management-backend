import express from "express";
import {
  getAllLeaveBalances,
  getMyLeaveBalances,
  getUserLeaveBalances,
  getDepartmentLeaveBalances,
} from "../controllers/leaveBalanceController";
import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/roleMiddleware";

const router = express.Router();

router.get("/", protect, authorize("ADMIN"), getAllLeaveBalances);
router.get("/my", protect, getMyLeaveBalances);
router.get("/department", protect, authorize("DIRECTOR"), getDepartmentLeaveBalances);
router.get("/user/:id", protect, authorize("ADMIN"), getUserLeaveBalances);

export default router;