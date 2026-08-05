import express from "express";
import path from "path";
import { z } from "zod";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { organizations, frameworks, disclosureRequirements, dataPoints, ghgInventory } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";
import { draftNarrativeDisclosure, performGapAnalysis } from "./src/lib/gemini.ts";
import { seedESGData } from "./src/lib/seed.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";

const organizationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["HOLDING", "JVC", "ASSET"]).default("JVC"),
  parentId: z.number().int().positive().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  sector: z.string().optional(),
});

const dataPointSchema = z.object({
  orgId: z.number().int().positive(),
  requirementId: z.number().int().positive().optional(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  value: z.string().optional(),
  numericValue: z.number().finite().optional(),
  unit: z.string().optional(),
  source: z.string().optional(),
  methodology: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(["DRAFT", "REVIEW", "APPROVED"]).default("REVIEW"),
}).refine((data) => data.periodEnd >= data.periodStart, {
  message: "periodEnd must be after or equal to periodStart",
  path: ["periodEnd"],
});

const aiDraftSchema = z.object({
  data: z.unknown(),
  framework: z.string().min(1),
});

const gapAnalysisSchema = z.object({
  currentData: z.unknown(),
  requirements: z.unknown(),
});

function validationError(error: z.ZodError) {
  return {
    error: "Validation failed",
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  const PORT = Number(process.env.PORT ?? 3000);

  if (process.env.SEED_ON_STARTUP === "true") {
    try {
      await seedESGData();
    } catch (err) {
      console.error("Seeding failed", err);
    }
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
      const parsed = organizationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(validationError(parsed.error));
      }

      const [newOrg] = await db.insert(organizations).values(parsed.data).returning();
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
      const parsed = dataPointSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(validationError(parsed.error));
      }

      const [newData] = await db.insert(dataPoints).values(parsed.data).returning();
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
      const parsed = aiDraftSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(validationError(parsed.error));
      }

      const { data, framework } = parsed.data;
      const result = await draftNarrativeDisclosure(data, framework);
      res.json(result);
    } catch (err) {
      console.error("AI Drafting failed:", err);
      res.status(500).json({ error: "AI Drafting failed" });
    }
  });

  app.post("/api/ai/gap-analysis", requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = gapAnalysisSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(validationError(parsed.error));
      }

      const { currentData, requirements } = parsed.data;
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
