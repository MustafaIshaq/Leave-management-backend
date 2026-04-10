import express from "express";
import {
  getYearCalendar,
  getUserCalendar,
} from "../controllers/calendarController";
import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/roleMiddleware";

const router = express.Router();

router.get("/year", protect, authorize("ADMIN", "DIRECTOR"), getYearCalendar);
router.get("/user/:id", protect, getUserCalendar);

export default router;