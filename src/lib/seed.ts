import { db } from "../db/index.ts";
import { frameworks, disclosureRequirements, organizations } from "../db/schema.ts";

export async function seedESGData() {
  // Check if already seeded
  const existingOrgs = await db.select().from(organizations);
  if (existingOrgs.length > 0) return;

  // 1. Seed Organizations
  const [holding] = await db.insert(organizations).values({
    name: "Nusantara Renewable Holding",
    type: "HOLDING",
    location: "Jakarta, Indonesia",
    sector: "Renewable Energy",
  }).returning();

  const [solarJvc] = await db.insert(organizations).values({
    name: "Solar Park East Java (JVC)",
    type: "JVC",
    parentId: holding.id,
    location: "Surabaya, Indonesia",
    sector: "Solar Energy",
  }).returning();

  // 2. Seed Frameworks
  const [gri] = await db.insert(frameworks).values({
    name: "GRI (Global Reporting Initiative)",
    version: "2021",
    description: "Universal and Topic Standards for Sustainability Reporting",
  }).returning();

  const [tcfd] = await db.insert(frameworks).values({
    name: "TCFD",
    version: "2017",
    description: "Task Force on Climate-related Financial Disclosures",
  }).returning();

  // 3. Seed Requirements
  await db.insert(disclosureRequirements).values([
    {
      frameworkId: gri.id,
      code: "305-1",
      title: "Direct (Scope 1) GHG Emissions",
      description: "Gross direct (Scope 1) GHG emissions in metric tons of CO2 equivalent.",
      requirementType: "Quantitative",
      unit: "tCO2e",
    },
    {
      frameworkId: gri.id,
      code: "305-2",
      title: "Energy indirect (Scope 2) GHG Emissions",
      description: "Gross location-based energy indirect (Scope 2) GHG emissions.",
      requirementType: "Quantitative",
      unit: "tCO2e",
    },
    {
      frameworkId: tcfd.id,
      code: "MT-1",
      title: "Metrics & Targets - Emissions",
      description: "Disclose Scope 1, Scope 2, and, if appropriate, Scope 3 greenhouse gas (GHG) emissions, and the related risks.",
      requirementType: "Quantitative",
    }
  ]);

  console.log("ESG Data seeded successfully.");
}
