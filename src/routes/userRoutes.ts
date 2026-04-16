// users API routes
import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByDepartment,
} from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/roleMiddleware";


const router = express.Router();

router.get("/", protect, authorize("ADMIN"), getUsers);
router.get("/department", protect, authorize("DIRECTOR"), getUsersByDepartment);
router.get("/:id", protect, getUserById);
router.post("/", protect, authorize("ADMIN"), createUser);
router.put("/:id", protect, authorize("ADMIN"), updateUser);
router.delete("/:id", protect, authorize("ADMIN"), deleteUser);

export default router;