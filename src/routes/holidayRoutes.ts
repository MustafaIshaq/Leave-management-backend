import express from "express";
import {
  getHolidays,
  createHoliday,
  deleteHoliday,
} from "../controllers/holidayController";
import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/roleMiddleware";

const router = express.Router();

// GET all holidays
router.get("/", protect, getHolidays);

// CREATE holiday (admin only)
router.post("/", protect, authorize("ADMIN"), createHoliday);

// DELETE holiday (admin only)
router.delete("/:id", protect, authorize("ADMIN"), deleteHoliday);

export default router;