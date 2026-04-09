import express from "express";
import { getSettings, updateSettings } from "../controllers/settingsController";
import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/roleMiddleware";

const router = express.Router();

router.get("/", protect, authorize("ADMIN", "DIRECTOR"), getSettings);
router.put("/", protect, authorize("ADMIN"), updateSettings);

export default router;