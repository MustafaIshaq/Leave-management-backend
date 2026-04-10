import { Request, Response } from "express";
import pool from "../config/db";

// GET company-wide yearly calendar
export const getYearCalendar = async (req: Request, res: Response) => {
  try {
    const year = req.query.year as string;

    if (!year) {
      return res.status(400).json({ message: "year is required" });
    }

    // Approved leave requests
    const leaveResult = await pool.query(
      `SELECT 
         lr.id,
         u.full_name,
         lt.name AS leave_type,
         lr.start_date,
         lr.end_date,
         lr.status,
         lt.color
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.status = 'APPROVED'
         AND (
           EXTRACT(YEAR FROM lr.start_date) = $1
           OR EXTRACT(YEAR FROM lr.end_date) = $1
         )
       ORDER BY lr.start_date ASC`,
      [year]
    );

    // Public holidays
    const holidayResult = await pool.query(
      `SELECT id, title, holiday_date
       FROM public_holidays
       WHERE EXTRACT(YEAR FROM holiday_date) = $1
       ORDER BY holiday_date ASC`,
      [year]
    );

    const leaveEvents = leaveResult.rows.map((leave) => ({
      id: `leave-${leave.id}`,
      title: `${leave.full_name} - ${leave.leave_type}`,
      start: leave.start_date,
      end: leave.end_date,
      type: "leave",
      status: leave.status,
      color: leave.color,
    }));

    const holidayEvents = holidayResult.rows.map((holiday) => ({
      id: `holiday-${holiday.id}`,
      title: holiday.title,
      start: holiday.holiday_date,
      end: holiday.holiday_date,
      type: "holiday",
      color: "red",
    }));

    res.status(200).json([...leaveEvents, ...holidayEvents]);
  } catch (error) {
    console.error("GET YEAR CALENDAR ERROR:", error);
    res.status(500).json({ message: "Failed to fetch calendar" });
  }
};

// GET one user's calendar
export const getUserCalendar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const year = req.query.year as string;

    if (!year) {
      return res.status(400).json({ message: "year is required" });
    }

    const leaveResult = await pool.query(
      `SELECT
         lr.id,
         u.full_name,
         lt.name AS leave_type,
         lr.start_date,
         lr.end_date,
         lr.status,
         lt.color
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.user_id = $1
         AND lr.status = 'APPROVED'
         AND (
           EXTRACT(YEAR FROM lr.start_date) = $2
           OR EXTRACT(YEAR FROM lr.end_date) = $2
         )
       ORDER BY lr.start_date ASC`,
      [id, year]
    );

    const holidayResult = await pool.query(
      `SELECT id, title, holiday_date
       FROM public_holidays
       WHERE EXTRACT(YEAR FROM holiday_date) = $1
       ORDER BY holiday_date ASC`,
      [year]
    );

    const leaveEvents = leaveResult.rows.map((leave) => ({
      id: `leave-${leave.id}`,
      title: `${leave.full_name} - ${leave.leave_type}`,
      start: leave.start_date,
      end: leave.end_date,
      type: "leave",
      status: leave.status,
      color: leave.color,
    }));

    const holidayEvents = holidayResult.rows.map((holiday) => ({
      id: `holiday-${holiday.id}`,
      title: holiday.title,
      start: holiday.holiday_date,
      end: holiday.holiday_date,
      type: "holiday",
      color: "red",
    }));

    res.status(200).json([...leaveEvents, ...holidayEvents]);
  } catch (error) {
    console.error("GET USER CALENDAR ERROR:", error);
    res.status(500).json({ message: "Failed to fetch user calendar" });
  }
};