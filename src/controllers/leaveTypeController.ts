import { Request, Response } from "express";
import pool from "../config/db";

// GET all leave types
export const getLeaveTypes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM leave_types ORDER BY id ASC"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET LEAVE TYPES ERROR:", error);
    res.status(500).json({ message: "Failed to fetch leave types" });
  }
};

// GET one leave type
export const getLeaveTypeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM leave_types WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Leave type not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("GET LEAVE TYPE ERROR:", error);
    res.status(500).json({ message: "Failed to fetch leave type" });
  }
};

// CREATE leave type
export const createLeaveType = async (req: Request, res: Response) => {
  try {
    const { name, unit, is_deductible, color } = req.body;

    if (!name || !unit) {
      return res.status(400).json({
        message: "name and unit are required",
      });
    }

    const existingLeaveType = await pool.query(
      "SELECT id FROM leave_types WHERE name = $1",
      [name]
    );

    if (existingLeaveType.rows.length > 0) {
      return res.status(400).json({
        message: "Leave type already exists",
      });
    }

    const result = await pool.query(
      `INSERT INTO leave_types (name, unit, is_deductible, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, unit, is_deductible ?? true, color || null]
    );

    res.status(201).json({
      message: "Leave type created successfully",
      leaveType: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE LEAVE TYPE ERROR:", error);
    res.status(500).json({ message: "Failed to create leave type" });
  }
};

// UPDATE leave type
export const updateLeaveType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, unit, is_deductible, color } = req.body;

    const existingLeaveType = await pool.query(
      "SELECT id FROM leave_types WHERE id = $1",
      [id]
    );

    if (existingLeaveType.rows.length === 0) {
      return res.status(404).json({ message: "Leave type not found" });
    }

    const result = await pool.query(
      `UPDATE leave_types
       SET name = $1,
           unit = $2,
           is_deductible = $3,
           color = $4
       WHERE id = $5
       RETURNING *`,
      [name, unit, is_deductible, color, id]
    );

    res.status(200).json({
      message: "Leave type updated successfully",
      leaveType: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE LEAVE TYPE ERROR:", error);
    res.status(500).json({ message: "Failed to update leave type" });
  }
};

// DELETE leave type
export const deleteLeaveType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM leave_types WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Leave type not found" });
    }

    res.status(200).json({
      message: "Leave type deleted successfully",
    });
  } catch (error) {
    console.error("DELETE LEAVE TYPE ERROR:", error);
    res.status(500).json({ message: "Failed to delete leave type" });
  }
};