// src/router/login.ts
import express, { Request, Response } from "express";
import sql, { config as SQLConfig } from "mssql";
import jwt from "jsonwebtoken";

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

  let pool: sql.ConnectionPool | null = null;
  try {
    // 1) Try connecting with the supplied SQL credentials
    pool = await sql.connect(config);

    // 2) Query Cecil table for Roleflag
    const result = await pool
      .request()
      .input("username", sql.VarChar, username)
      .query("SELECT Roleflag FROM dbo.Cecil WHERE UserName = @username");

    await pool.close();
    pool = null;

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Employee record not found.",
      });
    }

    const { Roleflag } = result.recordset[0];

    // 3) Strict check: must be exactly DP004
    if (Roleflag !== "DP004") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Membership (DP004) can log in.",
        roleflag: Roleflag,
      });
    }

    // 4) Issue JWT
    const secret = process.env.JWT_SECRET || "default_secret";
    const token = jwt.sign(
      { username, roleflag: Roleflag },
      secret,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: `Welcome, ${username}`,
      roleflag: Roleflag,
      token,
    });

  } catch (err: any) {
    console.error("Login error:", err?.message ?? err);
    return res.status(401).json({
      success: false,
      message: "Invalid credentials or unable to connect to database.",
    });
  } finally {
    if (pool && pool.connected) {
      try { await pool.close(); } catch (_) {}
    }
  }
});

export default router;
