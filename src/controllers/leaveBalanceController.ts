import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";

// GET my leave balances
export const getMyLeaveBalances = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const result = await pool.query(
      `SELECT
         lb.id,
         lb.user_id,
         lb.leave_type_id,
         lt.name AS leave_type,
         lt.unit,
         lt.color,
         lb.total_allowance,
         lb.deducted,
         lb.remaining
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.user_id = $1
       ORDER BY lt.id ASC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET MY LEAVE BALANCES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch your leave balances" });
  }
};

// GET one user's leave balances (admin only)
export const getUserLeaveBalances = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         lb.id,
         lb.user_id,
         u.full_name,
         lb.leave_type_id,
         lt.name AS leave_type,
         lt.unit,
         lt.color,
         lb.total_allowance,
         lb.deducted,
         lb.remaining
       FROM leave_balances lb
       JOIN users u ON lb.user_id = u.id
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.user_id = $1
       ORDER BY lt.id ASC`,
      [id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET USER LEAVE BALANCES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch user leave balances" });
  }
};

// GET all leave balances (admin only)
export const getAllLeaveBalances = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
         lb.id,
         lb.user_id,
         u.full_name,
         u.email,
         u.department_id,
         d.name AS department_name,
         lb.leave_type_id,
         lt.name AS leave_type,
         lt.unit,
         lt.color,
         lb.total_allowance,
         lb.deducted,
         lb.remaining
       FROM leave_balances lb
       JOIN users u ON lb.user_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       ORDER BY u.id ASC, lt.id ASC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET ALL LEAVE BALANCES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch all leave balances" });
  }
};

// GET department leave balances (director only)
export const getDepartmentLeaveBalances = async (req: AuthRequest, res: Response) => {
  try {
    const directorId = req.user?.id;

    if (!directorId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const directorResult = await pool.query(
      "SELECT department_id FROM users WHERE id = $1",
      [directorId]
    );

    if (directorResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const director = directorResult.rows[0];

    if (!director.department_id) {
      return res.status(400).json({
        message: "Director is not assigned to any department",
      });
    }

    const result = await pool.query(
      `SELECT
         lb.id,
         lb.user_id,
         u.full_name,
         u.department_id,
         d.name AS department_name,
         lb.leave_type_id,
         lt.name AS leave_type,
         lt.unit,
         lt.color,
         lb.total_allowance,
         lb.deducted,
         lb.remaining
       FROM leave_balances lb
       JOIN users u ON lb.user_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE u.department_id = $1
       ORDER BY u.id ASC, lt.id ASC`,
      [director.department_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET DEPARTMENT LEAVE BALANCES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch department leave balances" });
  }
};