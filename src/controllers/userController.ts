// users logic
import { Request, Response } from "express";
import pool from "../config/db";
import bcrypt from "bcrypt";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, role, department_id, designation, phone, date_of_birth, leave_start_month, work_start_time, work_end_time, created_at FROM users ORDER BY id ASC"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, full_name, email, role, department_id, designation, phone, date_of_birth, leave_start_month, work_start_time, work_end_time, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("GET USER BY ID ERROR:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      full_name,
      email,
      password,
      role,
      department_id,
      designation,
      phone,
      date_of_birth,
      leave_start_month,
      work_start_time,
      work_end_time,
    } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        message: "full_name, email, password, and role are required",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users 
      (full_name, email, password, role, department_id, designation, phone, date_of_birth, leave_start_month, work_start_time, work_end_time)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id, full_name, email, role, department_id, designation, phone, date_of_birth, leave_start_month, work_start_time, work_end_time, created_at`,
      [
        full_name,
        email,
        hashedPassword,
        role,
        department_id || null,
        designation || null,
        phone || null,
        date_of_birth || null,
        leave_start_month || null,
        work_start_time || null,
        work_end_time || null,
      ]
    );

    const newUser = result.rows[0];

    // Automatically create leave balance rows for all deductible leave types
    await pool.query(
      `INSERT INTO leave_balances (user_id, leave_type_id, total_allowance, deducted, remaining)
       SELECT $1, id, 20, 0, 20
       FROM leave_types
       WHERE is_deductible = true`,
      [newUser.id]
    );

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      role,
      department_id,
      designation,
      phone,
      date_of_birth,
      leave_start_month,
      work_start_time,
      work_end_time,
    } = req.body;

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1,
           email = $2,
           role = $3,
           department_id = $4,
           designation = $5,
           phone = $6,
           date_of_birth = $7,
           leave_start_month = $8,
           work_start_time = $9,
           work_end_time = $10
       WHERE id = $11
       RETURNING id, full_name, email, role, department_id, designation, phone, date_of_birth, leave_start_month, work_start_time, work_end_time, created_at`,
      [
        full_name,
        email,
        role,
        department_id || null,
        designation || null,
        phone || null,
        date_of_birth || null,
        leave_start_month || null,
        work_start_time || null,
        work_end_time || null,
        id,
      ]
    );

    res.status(200).json({
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};