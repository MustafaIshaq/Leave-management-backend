// main Express app
import express, { Request, Response } from "express";
import cors from "cors";
import pool from "./config/db";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import leaveTypeRoutes from "./routes/leaveTypeRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import leaveRequestRoutes from "./routes/leaveRequestRoutes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/departments", departmentRoutes);
app.use("/leave-types", leaveTypeRoutes);
app.use("/settings", settingsRoutes);
app.use("/leave-requests", leaveRequestRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("API running");
});

app.get("/test-db", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connected successfully",
      time: result.rows[0],
    });
  } catch (error) {
    console.error("DB ERROR:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use("/users", userRoutes);
app.use("/auth", authRoutes);

export default app;