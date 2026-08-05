import { pgTable, serial, text, timestamp, integer, boolean, doublePrecision, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const organizationTypeEnum = pgEnum("organization_type", ["HOLDING", "JVC", "ASSET"]);
export const materialityScoreEnum = pgEnum("materiality_score", ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]);
export const actionStatusEnum = pgEnum("action_status", ["OPEN", "IN_PROGRESS", "CLOSED", "OVERDUE"]);
export const riskCategoryEnum = pgEnum("risk_category", ["A", "B", "C", "FI"]);

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: organizationTypeEnum("type").notNull().default("JVC"),
  parentId: integer("parent_id"), // For holding company hierarchy
  description: text("description"),
  location: text("location"),
  sector: text("sector"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const frameworks = pgTable("frameworks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., GRI, TCFD
  version: text("version").notNull(),
  description: text("description"),
  isGlobal: boolean("is_global").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const disclosureRequirements = pgTable("disclosure_requirements", {
  id: serial("id").primaryKey(),
  frameworkId: integer("framework_id").references(() => frameworks.id).notNull(),
  code: text("code").notNull(), // e.g., GRI 305-1
  title: text("title").notNull(),
  description: text("description"),
  taxonomyData: jsonb("taxonomy_data"), // Full metric taxonomy
  requirementType: text("requirement_type"), // Quantitative vs Qualitative
  unit: text("unit"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mappings = pgTable("mappings", {
  id: serial("id").primaryKey(),
  sourceRequirementId: integer("source_requirement_id").references(() => disclosureRequirements.id).notNull(),
  targetRequirementId: integer("target_requirement_id").references(() => disclosureRequirements.id).notNull(),
  rationale: text("rationale"),
  mappingType: text("mapping_type").default("EQUIVALENT"), // EQUIVALENT, PARTIAL, RELATED
  version: text("version").default("1.0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dataPoints = pgTable("data_points", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  requirementId: integer("requirement_id").references(() => disclosureRequirements.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  value: text("value"), // Store as string to handle various formats
  numericValue: doublePrecision("numeric_value"),
  unit: text("unit"),
  source: text("source"),
  methodology: text("methodology"),
  owner: text("owner"),
  status: text("status").default("DRAFT"), // DRAFT, REVIEW, APPROVED
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const materialityAssessments = pgTable("materiality_assessments", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  topic: text("topic").notNull(),
  impactMateriality: materialityScoreEnum("impact_materiality").notNull(),
  financialMateriality: materialityScoreEnum("financial_materiality").notNull(),
  rationale: text("rationale"),
  period: text("period").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ghgInventory = pgTable("ghg_inventory", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  scope: integer("scope").notNull(), // 1, 2, 3
  category: text("category"), // e.g., Purchased Electricity
  gasType: text("gas_type").default("CO2e"),
  emissions: doublePrecision("emissions").notNull(),
  unit: text("unit").default("tCO2e"),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  methodology: text("methodology"),
  locationBased: boolean("location_based").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  owner: text("owner"),
  dueDate: timestamp("due_date"),
  status: actionStatusEnum("status").default("OPEN"),
  priority: text("priority").default("MEDIUM"),
  sourceType: text("source_type"), // e.g., IFC_PS, AUDIT, MATERIALITY
  sourceId: integer("source_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const evidence = pgTable("evidence", {
  id: serial("id").primaryKey(),
  dataPointId: integer("data_point_id").references(() => dataPoints.id),
  actionId: integer("action_id").references(() => actions.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(),
  recordId: integer("record_id").notNull(),
  action: text("action").notNull(), // INSERT, UPDATE, DELETE
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  changedBy: text("changed_by"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const stakeholders = pgTable("stakeholders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Investor, Employee, Regulator, Community
  influence: text("influence"),
  interest: text("interest"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const engagements = pgTable("engagements", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id).notNull(),
  stakeholderId: integer("stakeholder_id").references(() => stakeholders.id),
  date: timestamp("date").notNull(),
  type: text("type"), // Meeting, Survey, Report
  summary: text("summary"),
  keyOutcomes: text("key_outcomes"),
  createdAt: timestamp("created_at").defaultNow(),
});
