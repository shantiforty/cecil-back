// src/router/membership.ts
import express, { Request, Response } from "express";
import { query } from "../db";

const router = express.Router();

// Helper: sanitize values
const clean = (val: any) => (val === "" ? null : val);

/**
 * GET ALL MEMBERS
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT * FROM [PROJECT_LEGO].[dbo].[MIM]   
      ORDER BY Member_No ASC
    `); //in prod change query
    res.json(result.recordset);
  } catch (err: any) {
    console.error("Error fetching members:", err.message);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

/**
 * ADD MEMBER
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const Member_Category = (req.body.Member_Category || "").toUpperCase();
    if (!Member_Category) {
      return res.status(400).json({ error: "Member_Category is required" });
    }

    // prefix rules
    let prefix = "";
    let numberLength = 6;
    switch (Member_Category) {
      case "FULL COMPOSER":
      case "ASSOCIATE COMPOSER":
        prefix = "C";
        break;
      case "PUBLISHER":
        prefix = "P";
        break;
      case "COPYRIGHT OWNER":
        prefix = "T";
        break;
      default:
        return res.status(400).json({ error: "Invalid Member_Category" });
    }

    // generate next Membership_ID
    const idResult = await query(
      `SELECT TOP 1 Membership_ID
       FROM [PROJECT_LEGO].[dbo].[MIM]
       WHERE Membership_ID LIKE '${prefix}%'
       ORDER BY Membership_ID DESC`
    ); //change query in prod

    let nextNumber = 1;
    if (idResult.recordset.length > 0) {
      const lastId = idResult.recordset[0].Membership_ID;
      const lastNumber = parseInt(lastId.substring(prefix.length));
      nextNumber = lastNumber + 1;
    }
    const nextMembershipId = prefix + nextNumber.toString().padStart(numberLength, "0");

    // generate next Member_No
    const memberNoResult = await query(
      `SELECT TOP 1 Member_No
       FROM [PROJECT_LEGO].[dbo].[MIM]
       ORDER BY CAST(Member_No AS INT) DESC`
    ); //change query in prod

    let nextMemberNo = 1;
    if (memberNoResult.recordset.length > 0) {
      const lastNo = parseInt(memberNoResult.recordset[0].Member_No);
      nextMemberNo = lastNo + 1;
    }

    // prepare insert params
    const params: Record<string, any> = {
      Member_No: nextMemberNo.toString(),
      Membership_ID: nextMembershipId,
      Member_Category,
      Member_Status: clean(req.body.Member_Status),
      Last_Name: clean(req.body.Last_Name),
      First_Name: clean(req.body.First_Name),
      Middle_Name: clean(req.body.Middle_Name),
      Suffix: clean(req.body.Suffix),
      Name: clean(req.body.Name),
      Sex: clean(req.body.Sex),
      Prefix: clean(req.body.Prefix),
      CAE_No: clean(req.body.CAE_No),
      Band_Name: clean(req.body.Band_Name),
      Pseudonym: clean(req.body.Pseudonym),
      Address: clean(req.body.Address),
      Contact_Number: clean(req.body.Contact_Number),
      Email_Address: clean(req.body.Email_Address),
      Tin_Number: clean(req.body.Tin_Number),
      Primary_Contact_Number: clean(req.body.Primary_Contact_Number),
      Secondary_Contact_Number: clean(req.body.Secondary_Contact_Number),
      Official_Representative: clean(req.body.Official_Representative),
      Office_Number: clean(req.body.Office_Number),
      Office_Address: clean(req.body.Office_Address),
      Landline: clean(req.body.Landline),
      Signatory: clean(req.body.Signatory),
      Bank_Account_Info: clean(req.body.Bank_Account_Info),
      Bank_Name: clean(req.body.Bank_Name),
      Contact_Person: clean(req.body.Contact_Person),
      Date_of_Membership: clean(req.body.Date_of_Membership),
      Date_of_Birth: clean(req.body.Date_of_Birth),
      Date_of_Death: clean(req.body.Date_of_Death),
      "Date of Membership Termination/Resignation": clean(
        req.body.Date_of_Membership_Termination_Resignation
      ),
      Remarks: clean(req.body.Remarks),
      Type_of_Business_Entity: clean(req.body.Type_of_Business_Entity),
      Remarks2: clean(req.body.Remarks2),
      Related_files: clean(req.body.Related_files),
      Date_Registred_National_Library: clean(req.body.Date_Registred_National_Library),
    };

    const columns = Object.keys(params).map((col) => `[${col}]`).join(", ");
    const values = Object.keys(params).map((_, i) => `@val${i}`).join(", ");

    const sql = `INSERT INTO [PROJECT_LEGO].[dbo].[MIM] (${columns}) VALUES (${values})`;

    const sqlParams: Record<string, any> = {};
    Object.keys(params).forEach((col, i) => {
      sqlParams[`val${i}`] = params[col];
    });

    await query(sql, sqlParams);

    // insert into logs
  //   await query(
  //     `INSERT INTO [PROJECT_LEGO].[dbo].[MIM_Logs]
  //  (Member_No, ActionType, UpdatedBy, UpdatedAt, ActionDetails)
  //  VALUES (@no, 'CREATE', @by, GETDATE(), @details)`,
  //     {
  //       no: nextMemberNo, // or nextMembershipId if you prefer
  //       by: req.body.Changed_By || "system",
  //       details: JSON.stringify(params),
  //     }
  //   );

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      Member_No: nextMemberNo,
      Membership_ID: nextMembershipId,
    });
  } catch (err: any) {
    console.error("Error inserting member:", err.message);
    res.status(500).json({ error: "Failed to add new member" });
  }
});

/**
 * UPDATE MEMBER
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (["Member_No", "Membership_ID"].includes(key)) continue;
      updates[key] = clean(value);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const setClauses = Object.keys(updates)
      .map((col, i) => `[${col}] = @val${i}`)
      .join(", ");

    const sql = `UPDATE [PROJECT_LEGO].[dbo].[MIM]
                 SET ${setClauses}
                 WHERE Membership_ID = @id`;

    const sqlParams: Record<string, any> = { id };
    Object.keys(updates).forEach((col, i) => {
      sqlParams[`val${i}`] = updates[col];
    });

    const result = await query(sql, sqlParams);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

  //   // insert into logs
  //   await query(
  //     `INSERT INTO [PROJECT_LEGO].[dbo].[MIM_Logs]
  //  (Member_No, ActionType, UpdatedBy, UpdatedAt, ActionDetails)
  //  VALUES (@no, 'UPDATE', @by, GETDATE(), @details)`,
  //     {
  //       no: id,
  //       by: req.body.Changed_By || "system",
  //       details: JSON.stringify(updates),
  //     }
  //   );

    res.json({ success: true, message: "Member updated successfully" });
  } catch (err: any) {
    console.error("Error updating member:", err.message);
    res.status(500).json({ error: "Failed to update member" });
  }
});

export default router;
