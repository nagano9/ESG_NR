export type OrganizationType = "HOLDING" | "JVC" | "ASSET";
export type MaterialityScore = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type ActionStatus = "OPEN" | "IN_PROGRESS" | "CLOSED" | "OVERDUE";
export type RiskCategory = "A" | "B" | "C" | "FI";

export interface Organization {
  id: number;
  name: string;
  type: OrganizationType;
  parentId?: number;
  description?: string;
  location?: string;
  sector?: string;
}

export interface Framework {
  id: number;
  name: string;
  version: string;
  description?: string;
  isGlobal: boolean;
}

export interface DisclosureRequirement {
  id: number;
  frameworkId: number;
  code: string;
  title: string;
  description?: string;
  taxonomyData?: any;
  requirementType?: string;
  unit?: string;
}

export interface DataPoint {
  id: number;
  orgId: number;
  requirementId?: number;
  periodStart: string;
  periodEnd: string;
  value?: string;
  numericValue?: number;
  unit?: string;
  source?: string;
  methodology?: string;
  owner?: string;
  status: string;
}

export interface GHGEntry {
  id: number;
  orgId: number;
  scope: number;
  category: string;
  gasType: string;
  emissions: number;
  unit: string;
  periodStart: string;
  periodEnd: string;
  methodology?: string;
  locationBased: boolean;
}
