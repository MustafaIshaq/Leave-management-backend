import express from "express";
import { getWallchart } from "../controllers/wallchartController";
import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/roleMiddleware";

const router = express.Router();

router.get("/", protect, authorize("ADMIN", "DIRECTOR"), getWallchart);

export default router;