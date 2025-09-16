import express, { Request, Response } from "express";
import sql, { config as SQLConfig } from "mssql";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const config: SQLConfig = {
    user: username,
    password: password,
    server: "10.10.0.14", 
    database: "PROJECT_LEGO", 
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
      .query('SELECT Roleflag FROM dbo.Cecil WHERE UserName = @username');

    await pool.close();

    if (result.recordset.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Employee record not found.",
      });
    }

    const employee = result.recordset[0];

    let role = "Unknown";
    if (employee.Department_ID === "DP001") {
      role = "Documentation";
    } else if (employee.Department_ID === "DP004") {
      role = "Membership";
    }

    return res.json({
      success: true,
      message: `Welcome, ${employee.First_Name}`,
      role,
      employeeData: employee,
    });
  } catch (err: any) {
    console.error("Login error:", err); 
    return res.status(401).json({
      success: false,
      message: "Invalid credentials or unable to connect to database.",
    });
  }
});

export default router;
