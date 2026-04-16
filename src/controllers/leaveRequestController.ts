import { Response } from "express";
import pool from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";

// CREATE leave request
export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const {
      leave_type_id,
      start_date,
      end_date,
      unit,
      total_days,
      total_hours,
      reason,
    } = req.body;

    const user_id = req.user?.id;

    if (!leave_type_id || !start_date || !end_date || !unit) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    if (!user_id) {
      return res.status(401).json({
        message: "User not authorized",
      });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        message: "Start date cannot be after end date",
      });
    }

    // 1. Check if leave type exists
    const leaveTypeResult = await pool.query(
      "SELECT * FROM leave_types WHERE id = $1",
      [leave_type_id]
    );

    if (leaveTypeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Leave type not found",
      });
    }

    // 2. Check overlapping requests for same user
    const overlapResult = await pool.query(
      `SELECT * FROM leave_requests
       WHERE user_id = $1
         AND status IN ('PENDING', 'APPROVED')
         AND start_date <= $3
         AND end_date >= $2`,
      [user_id, start_date, end_date]
    );

    if (overlapResult.rows.length > 0) {
      return res.status(400).json({
        message: "You already have a leave request overlapping these dates",
      });
    }

    // 3. Create leave request
    const result = await pool.query(
      `INSERT INTO leave_requests
      (user_id, leave_type_id, start_date, end_date, unit, total_days, total_hours, reason, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING')
      RETURNING *`,
      [
        user_id,
        leave_type_id,
        start_date,
        end_date,
        unit.toUpperCase(),
        total_days || null,
        total_hours || null,
        reason || null,
      ]
    );

    res.status(201).json({
      message: "Leave request created",
      leaveRequest: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE LEAVE REQUEST ERROR:", error);
    res.status(500).json({ message: "Failed to create leave request" });
  }
};

// GET all (admin)
export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM leave_requests ORDER BY created_at DESC"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET LEAVE REQUESTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch leave requests" });
  }
};

// GET my requests
export const getMyLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user?.id;

    const result = await pool.query(
      "SELECT * FROM leave_requests WHERE user_id = $1 ORDER BY created_at DESC",
      [user_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET MY LEAVE REQUESTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch your leave requests" });
  }
};

// GET all request by department (Director)
export const getDepartmentLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const directorId = req.user?.id;

    if (!directorId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Get director's department
    const directorResult = await pool.query(
      "SELECT department_id, role FROM users WHERE id = $1",
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
         lr.id,
         lr.user_id,
         u.full_name,
         u.department_id,
         d.name AS department_name,
         lt.name AS leave_type,
         lr.start_date,
         lr.end_date,
         lr.unit,
         lr.total_days,
         lr.total_hours,
         lr.reason,
         lr.status,
         lr.approved_by,
         lr.approved_at,
         lr.created_at
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE u.department_id = $1
       ORDER BY lr.created_at DESC`,
      [director.department_id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET DEPARTMENT LEAVE REQUESTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch department leave requests" });
  }
};



// APPROVE
export const approveLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = req.user?.id;

    // 1. Find the leave request first
    const leaveResult = await pool.query(
      "SELECT * FROM leave_requests WHERE id = $1",
      [id]
    );

    if (leaveResult.rows.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const leave = leaveResult.rows[0];

    // 2. Only allow approval if request is still pending
    if (leave.status !== "PENDING") {
      return res.status(400).json({
        message: `Leave request is already ${leave.status}`,
      });
    }

    // 3. Check if this leave type exists
    const leaveTypeResult = await pool.query(
      "SELECT * FROM leave_types WHERE id = $1",
      [leave.leave_type_id]
    );

    if (leaveTypeResult.rows.length === 0) {
      return res.status(404).json({ message: "Leave type not found" });
    }

    const leaveType = leaveTypeResult.rows[0];

    // 4. Approve the leave request
    const updatedLeave = await pool.query(
      `UPDATE leave_requests
       SET status = 'APPROVED',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [approverId, id]
    );

    // 5. If deductible, update leave balance
    if (leaveType.is_deductible) {
      const balanceResult = await pool.query(
        `UPDATE leave_balances
         SET deducted = deducted + $1,
             remaining = remaining - $1
         WHERE user_id = $2 AND leave_type_id = $3
         RETURNING *`,
        [
          leave.total_days || leave.total_hours || 0,
          leave.user_id,
          leave.leave_type_id,
        ]
      );

      if (balanceResult.rows.length === 0) {
        return res.status(404).json({
          message: "Leave balance record not found for this user and leave type",
        });
      }
    }

    res.status(200).json({
      message: "Leave approved and balance updated",
      leaveRequest: updatedLeave.rows[0],
    });
  } catch (error) {
    console.error("APPROVE ERROR:", error);
    res.status(500).json({ message: "Failed to approve leave" });
  }
};

// REJECT
export const rejectLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Find the leave request first
    const leaveResult = await pool.query(
      "SELECT * FROM leave_requests WHERE id = $1",
      [id]
    );

    if (leaveResult.rows.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const leave = leaveResult.rows[0];

    // 2. Only allow rejection if request is still pending
    if (leave.status !== "PENDING") {
      return res.status(400).json({
        message: `Leave request is already ${leave.status}`,
      });
    }

    // 3. Reject the leave request
    const result = await pool.query(
      `UPDATE leave_requests
       SET status = 'REJECTED'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.status(200).json({
      message: "Leave rejected",
      leaveRequest: result.rows[0],
    });
  } catch (error) {
    console.error("REJECT ERROR:", error);
    res.status(500).json({ message: "Failed to reject leave" });
  }
};