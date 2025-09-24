// src/router/membershipLogs.ts
import express, { Request, Response } from "express";
import { query } from "../db";

const router = express.Router();

/**
 * GET ALL LOGS
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        LogID AS Log_ID,
        Member_No AS Membership_ID,
        ActionType AS Action,
        UpdatedBy AS Changed_By,
        UpdatedAt AS Changed_At,
        ActionDetails AS Details
      FROM [PROJECT_LEGO].[dbo].[MIM_Logs]
      ORDER BY UpdatedAt DESC
    `);

    res.json(result.recordset);
  } catch (err: any) {
    console.error("Error fetching logs:", err.message);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});


/**
 * GET LOGS FOR A SPECIFIC MEMBER
 */
router.get("/:membershipId", async (req: Request, res: Response) => {
  try {
    const { membershipId } = req.params;
    const result = await query(
      `SELECT * FROM [PROJECT_LEGO].[dbo].[MIM_Logs]
       WHERE Membership_ID = @id
       ORDER BY Changed_At DESC`,
      { id: membershipId }
    );

    res.json(result.recordset);
  } catch (err: any) {
    console.error("Error fetching member logs:", err.message);
    res.status(500).json({ error: "Failed to fetch member logs" });
  }
});

export default router;
