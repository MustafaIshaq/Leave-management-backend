import { Request, Response } from "express";
import pool from "../config/db";

export const getWallchart = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "start and end query parameters are required",
      });
    }

    const result = await pool.query(
      `SELECT
         lr.id,
         u.id AS user_id,
         u.full_name,
         u.department_id,
         lt.name AS leave_type,
         lr.start_date,
         lr.end_date,
         lr.status,
         lt.color
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.status = 'APPROVED'
         AND lr.start_date <= $2
         AND lr.end_date >= $1
       ORDER BY lr.start_date ASC`,
      [start, end]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET WALLCHART ERROR:", error);
    res.status(500).json({ message: "Failed to fetch wallchart" });
  }
};