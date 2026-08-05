import express from "express";
import path from "path";
import { z } from "zod";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { organizations, frameworks, disclosureRequirements, dataPoints, ghgInventory, actions, materialityAssessments } from "./src/db/schema.ts";
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

const ghgEntrySchema = z.object({
  orgId: z.number().int().positive(),
  scope: z.coerce.number().int().min(1).max(3),
  category: z.string().min(1).optional(),
  gasType: z.string().min(1).default("CO2e"),
  emissions: z.number().finite().nonnegative(),
  unit: z.string().min(1).default("tCO2e"),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  methodology: z.string().min(1).optional(),
  locationBased: z.boolean().default(true),
}).refine((data) => data.periodEnd >= data.periodStart, {
  message: "periodEnd must be after or equal to periodStart",
  path: ["periodEnd"],
});

const actionSchema = z.object({
  orgId: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional(),
  owner: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED", "OVERDUE"]).default("OPEN"),
  priority: z.string().min(1).default("MEDIUM"),
  sourceType: z.string().optional(),
  sourceId: z.number().int().positive().optional(),
});

const actionStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED", "OVERDUE"]),
});

const materialitySchema = z.object({
  orgId: z.number().int().positive(),
  topic: z.string().min(1),
  impactMateriality: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  financialMateriality: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  rationale: z.string().optional(),
  period: z.string().min(1),
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

type AccessProfile = {
  email: string;
  role: "PLN_NR" | "JV";
  orgIds: number[];
};

function parseEmailList(value?: string) {
  return new Set((value ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

function parseEntityAccess() {
  if (!process.env.JV_ENTITY_ACCESS) return new Map<string, number[]>();
  try {
    const parsed = JSON.parse(process.env.JV_ENTITY_ACCESS) as Record<string, number | number[]>;
    return new Map(Object.entries(parsed).map(([email, orgIds]) => [
      email.toLowerCase(),
      Array.isArray(orgIds) ? orgIds : [orgIds],
    ]));
  } catch (error) {
    console.error("Invalid JV_ENTITY_ACCESS JSON:", error);
    return new Map<string, number[]>();
  }
}

function getAccessProfile(user: AuthRequest["user"]): AccessProfile {
  const email = String(user?.email ?? "").toLowerCase();
  const adminEmails = parseEmailList(process.env.PLN_NR_ADMIN_EMAILS);
  const claimRole = String(user?.role ?? user?.claims?.role ?? "").toUpperCase();

  if (adminEmails.has(email) || claimRole === "PLN_NR") {
    return { email, role: "PLN_NR", orgIds: [] };
  }

  const mappedOrgIds = parseEntityAccess().get(email);
  const claimOrgId = Number(user?.orgId ?? user?.claims?.orgId);
  const orgIds = mappedOrgIds ?? (Number.isInteger(claimOrgId) && claimOrgId > 0 ? [claimOrgId] : []);

  return { email, role: "JV", orgIds };
}

function canAccessOrg(access: AccessProfile, orgId: number) {
  return access.role === "PLN_NR" || access.orgIds.includes(orgId);
}

function requestedOrgId(req: express.Request) {
  const value = Number(req.query.orgId);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function forbiddenTenant(res: express.Response) {
  return res.status(403).json({ error: "Forbidden: entity access is not allowed for this account" });
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

  app.get("/api/me/access", requireAuth, async (req: AuthRequest, res) => {
    try {
      const access = getAccessProfile(req.user);
      if (access.role === "JV" && access.orgIds.length === 0) {
        return forbiddenTenant(res);
      }

      const allOrgs = access.role === "PLN_NR"
        ? await db.select().from(organizations)
        : await db.select().from(organizations).where(eq(organizations.id, access.orgIds[0]));

      res.json({
        email: access.email,
        role: access.role,
        orgIds: access.role === "PLN_NR" ? allOrgs.map((org) => org.id) : access.orgIds,
        orgName: allOrgs[0]?.name,
      });
    } catch (err) {
      console.error("Failed to resolve access profile:", err);
      res.status(500).json({ error: "Failed to resolve access profile" });
    }
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
  app.get("/api/orgs", requireAuth, async (req: AuthRequest, res) => {
    try {
      const access = getAccessProfile(req.user);
      if (access.role === "JV" && access.orgIds.length === 0) {
        return forbiddenTenant(res);
      }

      const allOrgs = access.role === "PLN_NR"
        ? await db.select().from(organizations)
        : await db.select().from(organizations).where(eq(organizations.id, access.orgIds[0]));
      res.json(allOrgs);
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
      res.status(500).json({ error: "Failed to fetch organizations. Please try again later." });
    }
  });

  app.post("/api/orgs", requireAuth, async (req: AuthRequest, res) => {
    try {
      const access = getAccessProfile(req.user);
      if (access.role !== "PLN_NR") {
        return forbiddenTenant(res);
      }

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
  app.get("/api/data-points", requireAuth, async (req: AuthRequest, res) => {
    try {
      const access = getAccessProfile(req.user);
      if (access.role === "JV" && access.orgIds.length === 0) {
        return forbiddenTenant(res);
      }

      const orgId = requestedOrgId(req);
      if (orgId) {
        if (!canAccessOrg(access, orgId)) {
          return forbiddenTenant(res);
        }
        const allData = await db.select().from(dataPoints).where(eq(dataPoints.orgId, orgId));
        res.json(allData);
      } else if (access.role === "JV") {
        const allData = await db.select().from(dataPoints).where(eq(dataPoints.orgId, access.orgIds[0]));
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
      const access = getAccessProfile(req.user);
      if (!canAccessOrg(access, parsed.data.orgId)) {
        return forbiddenTenant(res);
      }

      const [newData] = await db.insert(dataPoints).values(parsed.data).returning();
      res.json(newData);
    } catch (err) {
      console.error("Failed to create data point:", err);
      res.status(500).json({ error: "Failed to create data point" });
    }
  });

  // GHG Inventory
  app.get("/api/ghg", requireAuth, async (req: AuthRequest, res) => {
    try {
      const access = getAccessProfile(req.user);
      if (access.role === "JV" && access.orgIds.length === 0) {
        return forbiddenTenant(res);
      }

      const orgId = requestedOrgId(req);
      if (orgId) {
        if (!canAccessOrg(access, orgId)) {
          return forbiddenTenant(res);
        }
        const data = await db.select().from(ghgInventory).where(eq(ghgInventory.orgId, orgId));
        res.json(data);
      } else if (access.role === "JV") {
        const data = await db.select().from(ghgInventory).where(eq(ghgInventory.orgId, access.orgIds[0]));
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

  app.post("/api/ghg", requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = ghgEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(validationError(parsed.error));
      }
      const access = getAccessProfile(req.user);
      if (!canAccessOrg(access, parsed.data.orgId)) {
        return forbiddenTenant(res);
      }

      const [created] = await db.insert(ghgInventory).values(parsed.data).returning();
      res.json(created);
    } catch (err) {
      console.error("Failed to create GHG inventory entry:", err);
      res.status(500).json({ error: "Failed to create GHG inventory entry" });
    }
  });

  // Actions
  app.get("/api/actions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const access = getAccessProfile(req.user);
      if (access.role === "JV" && access.orgIds.length === 0) {
        return forbiddenTenant(res);
      }

      const orgId = requestedOrgId(req);
      if (orgId) {
        if (!canAccessOrg(access, orgId)) {
          return forbiddenTenant(res);
        }
        const data = await db.select().from(actions).where(eq(actions.orgId, orgId));
        res.json(data);
      } else if (access.role === "JV") {
        const data = await db.select().from(actions).where(eq(actions.orgId, access.orgIds[0]));
        res.json(data);
      } else {
        const data = await db.select().from(actions);
        res.json(data);
      }
    } catch (err) {
      console.error("Failed to fetch actions:", err);
      res.status(500).json({ error: "Failed to fetch actions" });
    }
  });

  app.post("/api/actions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = actionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(validationError(parsed.error));
      }
      const access = getAccessProfile(req.user);
      if (!canAccessOrg(access, parsed.data.orgId)) {
        return forbiddenTenant(res);
      }

      const [created] = await db.insert(actions).values(parsed.data).returning();
      res.json(created);
    } catch (err) {
      console.error("Failed to create action:", err);
      res.status(500).json({ error: "Failed to create action" });
    }
  });

  app.patch("/api/actions/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid action id" });
      }

      const access = getAccessProfile(req.user);
      const [existing] = await db.select().from(actions).where(eq(actions.id, id));
      if (!existing) {
        return res.status(404).json({ error: "Action not found" });
      }
      if (!canAccessOrg(access, existing.orgId)) {
        return forbiddenTenant(res);
      }

      const parsed = actionStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(validationError(parsed.error));
      }

      const [updated] = await db.update(actions).set({
        status: parsed.data.status,
        updatedAt: new Date(),
      }).where(eq(actions.id, id)).returning();

      res.json(updated);
    } catch (err) {
      console.error("Failed to update action:", err);
      res.status(500).json({ error: "Failed to update action" });
    }
  });

  // Materiality Assessments
  app.get("/api/materiality", requireAuth, async (req: AuthRequest, res) => {
    try {
      const access = getAccessProfile(req.user);
      if (access.role === "JV" && access.orgIds.length === 0) {
        return forbiddenTenant(res);
      }

      const orgId = requestedOrgId(req);
      if (orgId) {
        if (!canAccessOrg(access, orgId)) {
          return forbiddenTenant(res);
        }
        const data = await db.select().from(materialityAssessments).where(eq(materialityAssessments.orgId, orgId));
        res.json(data);
      } else if (access.role === "JV") {
        const data = await db.select().from(materialityAssessments).where(eq(materialityAssessments.orgId, access.orgIds[0]));
        res.json(data);
      } else {
        const data = await db.select().from(materialityAssessments);
        res.json(data);
      }
    } catch (err) {
      console.error("Failed to fetch materiality assessments:", err);
      res.status(500).json({ error: "Failed to fetch materiality assessments" });
    }
  });

  app.post("/api/materiality", requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = materialitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(validationError(parsed.error));
      }
      const access = getAccessProfile(req.user);
      if (!canAccessOrg(access, parsed.data.orgId)) {
        return forbiddenTenant(res);
      }

      const [created] = await db.insert(materialityAssessments).values(parsed.data).returning();
      res.json(created);
    } catch (err) {
      console.error("Failed to create materiality assessment:", err);
      res.status(500).json({ error: "Failed to create materiality assessment" });
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
