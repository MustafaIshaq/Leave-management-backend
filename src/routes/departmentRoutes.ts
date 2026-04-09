import express from "express";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController";

import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/roleMiddleware";

const router = express.Router();

// GET all (admin + director)
router.get("/", protect, authorize("ADMIN", "DIRECTOR"), getDepartments);

// GET one (logged in user)
router.get("/:id", protect, getDepartmentById);

// CREATE (admin only)
router.post("/", protect, authorize("ADMIN"), createDepartment);

// UPDATE (admin only)
router.put("/:id", protect, authorize("ADMIN"), updateDepartment);

// DELETE (admin only)
router.delete("/:id", protect, authorize("ADMIN"), deleteDepartment);

export default router;