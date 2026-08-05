import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { organizations, frameworks, disclosureRequirements, dataPoints, ghgInventory, materialityAssessments, actions, mappings } from "./src/db/schema.ts";
import { eq, and } from "drizzle-orm";
import { draftNarrativeDisclosure, performGapAnalysis } from "./src/lib/gemini.ts";
import { seedESGData } from "./src/lib/seed.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Run seed on startup
  try {
    await seedESGData();
  } catch (err) {
    console.error("Seeding failed", err);
  }

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/seed", requireAuth, async (req, res) => {
    try {
      await seedESGData();
      res.json({ message: "Seeded successfully" });
    } catch (err) {
      res.status(500).json({ error: "Seeding failed" });
    }
  });

  // Organizations
  app.get("/api/orgs", async (req, res) => {
    try {
      const allOrgs = await db.select().from(organizations);
      res.json(allOrgs);
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
      res.status(500).json({ error: "Failed to fetch organizations. Please try again later." });
    }
  });

  app.post("/api/orgs", requireAuth, async (req: AuthRequest, res) => {
    try {
      const [newOrg] = await db.insert(organizations).values(req.body).returning();
      res.json(newOrg);
    } catch (err) {
      console.error("Failed to create organization:", err);
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  // Frameworks & Requirements
  app.get("/api/frameworks", async (req, res) => {
    try {
      const allFrameworks = await db.select().from(frameworks);
      res.json(allFrameworks);
    } catch (err) {
      console.error("Failed to fetch frameworks:", err);
      res.status(500).json({ error: "Failed to fetch frameworks" });
    }
  });

  app.get("/api/requirements", async (req, res) => {
    try {
      const { frameworkId } = req.query;
      if (frameworkId) {
        const allReqs = await db.select().from(disclosureRequirements).where(eq(disclosureRequirements.frameworkId, Number(frameworkId)));
        res.json(allReqs);
      } else {
        const allReqs = await db.select().from(disclosureRequirements);
        res.json(allReqs);
      }
    } catch (err) {
      console.error("Failed to fetch requirements:", err);
      res.status(500).json({ error: "Failed to fetch requirements" });
    }
  });

  // Data Points
  app.get("/api/data-points", async (req, res) => {
    try {
      const { orgId } = req.query;
      if (orgId) {
        const allData = await db.select().from(dataPoints).where(eq(dataPoints.orgId, Number(orgId)));
        res.json(allData);
      } else {
        const allData = await db.select().from(dataPoints);
        res.json(allData);
      }
    } catch (err) {
      console.error("Failed to fetch data points:", err);
      res.status(500).json({ error: "Failed to fetch data points" });
    }
  });

  app.post("/api/data-points", requireAuth, async (req: AuthRequest, res) => {
    try {
      const [newData] = await db.insert(dataPoints).values(req.body).returning();
      res.json(newData);
    } catch (err) {
      console.error("Failed to create data point:", err);
      res.status(500).json({ error: "Failed to create data point" });
    }
  });

  // GHG Inventory
  app.get("/api/ghg", async (req, res) => {
    try {
      const { orgId } = req.query;
      if (orgId) {
        const data = await db.select().from(ghgInventory).where(eq(ghgInventory.orgId, Number(orgId)));
        res.json(data);
      } else {
        const data = await db.select().from(ghgInventory);
        res.json(data);
      }
    } catch (err) {
      console.error("Failed to fetch GHG inventory:", err);
      res.status(500).json({ error: "Failed to fetch GHG inventory" });
    }
  });

  // AI Routes
  app.post("/api/ai/draft", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { data, framework } = req.body;
      const result = await draftNarrativeDisclosure(data, framework);
      res.json(result);
    } catch (err) {
      console.error("AI Drafting failed:", err);
      res.status(500).json({ error: "AI Drafting failed" });
    }
  });

  app.post("/api/ai/gap-analysis", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { currentData, requirements } = req.body;
      const result = await performGapAnalysis(currentData, requirements);
      res.json(result);
    } catch (err) {
      console.error("Gap analysis failed:", err);
      res.status(500).json({ error: "Gap analysis failed" });
    }
  });

  // --- Vite / Static Assets ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
