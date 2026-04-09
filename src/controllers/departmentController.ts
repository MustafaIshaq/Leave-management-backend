import { Request, Response } from "express";
import pool from "../config/db";

// GET all departments
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM departments ORDER BY id ASC"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET DEPARTMENTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};

// GET single department
export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM departments WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("GET DEPARTMENT ERROR:", error);
    res.status(500).json({ message: "Failed to fetch department" });
  }
};

// CREATE department
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const result = await pool.query(
      "INSERT INTO departments (name) VALUES ($1) RETURNING *",
      [name]
    );

    res.status(201).json({
      message: "Department created successfully",
      department: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE DEPARTMENT ERROR:", error);
    res.status(500).json({ message: "Failed to create department" });
  }
};

// UPDATE department
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const result = await pool.query(
      "UPDATE departments SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({
      message: "Department updated successfully",
      department: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE DEPARTMENT ERROR:", error);
    res.status(500).json({ message: "Failed to update department" });
  }
};

// DELETE department
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM departments WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("DELETE DEPARTMENT ERROR:", error);
    res.status(500).json({ message: "Failed to delete department" });
  }
};