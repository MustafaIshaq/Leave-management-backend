import { Request, Response } from "express";
import pool from "../config/db";

// GET settings
export const getSettings = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM settings ORDER BY id ASC LIMIT 1"
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Settings not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

// UPDATE settings
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const {
      company_name,
      timezone,
      business_hours,
      carry_forward_enabled,
      max_carry_forward_days,
      max_carry_forward_hours,
    } = req.body;

    const existingSettings = await pool.query(
      "SELECT * FROM settings ORDER BY id ASC LIMIT 1"
    );

    if (existingSettings.rows.length === 0) {
      return res.status(404).json({ message: "Settings not found" });
    }

    const settingsId = existingSettings.rows[0].id;

    const result = await pool.query(
      `UPDATE settings
       SET company_name = $1,
           timezone = $2,
           business_hours = $3,
           carry_forward_enabled = $4,
           max_carry_forward_days = $5,
           max_carry_forward_hours = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        company_name,
        timezone,
        business_hours,
        carry_forward_enabled,
        max_carry_forward_days,
        max_carry_forward_hours,
        settingsId,
      ]
    );

    res.status(200).json({
      message: "Settings updated successfully",
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE SETTINGS ERROR:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
};