import express, { Request, Response } from "express";
import sql from "mssql";

const router = express.Router();

router.get("/form", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const config: sql.config = {
    user: username,
    password: password,
    server: "10.10.0.12",
    database: "Lego",
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  try {
    const pool = await sql.connect(config);

    const result = await pool
      .request()
      .input("username", sql.VarChar, username)
      .query("SELECT * FROM [dbo].[tbl_Employee] WHERE UserName = @username");

    await pool.close();

    if (result.recordset.length === 0) {
      return res.status(403).json({ success: false, message: "Employee not found." });
    }

    const employee = result.recordset[0];

    if (employee.Department_ID !== "DP004") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Membership department can view this form.",
      });
    }

    return res.json({
      success: true,
      message: "Access granted to Membership form.",
      formData: {
        // You can define or fetch the form structure here
      },
    });
  } catch (err: any) {
    console.error("Form access error:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

export default router;
