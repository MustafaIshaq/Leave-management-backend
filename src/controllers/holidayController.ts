import { Request, Response } from "express";
import pool from "../config/db";

// GET all holidays
export const getHolidays = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM public_holidays ORDER BY holiday_date ASC"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET HOLIDAYS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
};

// CREATE holiday
export const createHoliday = async (req: Request, res: Response) => {
  try {
    const { title, holiday_date } = req.body;

    if (!title || !holiday_date) {
      return res.status(400).json({
        message: "title and holiday_date are required",
      });
    }

    // Check duplicate
    const existingHoliday = await pool.query(
      "SELECT id FROM public_holidays WHERE title = $1 AND holiday_date = $2",
      [title, holiday_date]
    );

    if (existingHoliday.rows.length > 0) {
      return res.status(400).json({
        message: "Holiday already exists for this date",
      });
    }

    // Insert
    const result = await pool.query(
      `INSERT INTO public_holidays (title, holiday_date)
       VALUES ($1, $2)
       RETURNING *`,
      [title, holiday_date]
    );

    res.status(201).json({
      message: "Holiday created successfully",
      holiday: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE HOLIDAY ERROR:", error);
    res.status(500).json({ message: "Failed to create holiday" });
  }
};

// DELETE holiday
export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM public_holidays WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    res.status(200).json({
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    console.error("DELETE HOLIDAY ERROR:", error);
    res.status(500).json({ message: "Failed to delete holiday" });
  }
};