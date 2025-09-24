// src/index.ts

import "dotenv/config";
import express from "express";
import cors from "cors";
import { query } from "./db";
import loginRoutes from "./router/login";
import membershipRoutes from "./router/membership"; // ⬅️ import it
import membershipLogsRoutes from "./router/membershipLogs";



const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use("/login", loginRoutes);
app.use("/membership", membershipRoutes); // ⬅️ mount it here
app.use("/logs", membershipLogsRoutes);


app.get("/members", async (_req, res) => {
  try {
    const result = await query("SELECT * FROM [PROJECT_LEGO].[dbo].[MIM]");
    res.json(result.recordset);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      "SELECT * FROM [PROJECT_LEGO].[dbo].[MIM] WHERE Member_No = @id",
      { id }
    );

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json(result.recordset[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});