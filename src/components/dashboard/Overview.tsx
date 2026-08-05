import React from "react";
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Clock3, Globe, Shield } from "lucide-react";
import { motion } from "motion/react";
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { listAuditLogs, listDataPoints, listGhgInventory, listOrganizations } from "../../lib/api.ts";
import { ghgSummary2025, jvcEntities } from "../../data/ghgData.ts";
import { formatNumber } from "../../lib/format.ts";
import { cn } from "../../lib/utils.ts";
import { AuditTrail } from "../common/AuditTrail.tsx";
import type { AuditLogEntry, DataPoint, GHGEntry, Organization } from "../../types.ts";
import { useAuth } from "../../lib/AuthContext.tsx";

const missingDisclosures = [
  { framework: "GRI 305-1", description: "Direct GHG Emissions", asset: "Scope 1 inventory", severity: "CRITICAL" },
  { framework: "GRI 305-2", description: "Energy Indirect GHG Emissions", asset: "Scope 2 inventory", severity: "HIGH" },
  { framework: "POJK 51-C", description: "Internal Environmental Strategy", asset: "Corporate", severity: "MEDIUM" },
];

function groupGhgByYear(entries: GHGEntry[]) {
  const yearly = new Map<string, { year: string; actual: number; target: number }>();

  for (const entry of entries) {
    const year = new Date(entry.periodEnd).getFullYear().toString();
    const current = yearly.get(year) ?? { year, actual: 0, target: Number(year) >= 2025 ? 350 : 420 };
    current.actual += entry.emissions;
    yearly.set(year, current);
  }

  if (yearly.size === 0) {
    return [
      { year: "2022", actual: 420, target: 420 },
      { year: "2023", actual: 395, target: 400 },
      { year: "2024", actual: 368, target: 380 },
      { year: "2025", actual: ghgSummary2025.totalEmissions, target: 350 },
      { year: "2030", target: 120 },
    ];
  }

  return [...yearly.values()].sort((a, b) => a.year.localeCompare(b.year));
}

function auditValue(value: unknown, key: string) {
  if (typeof value !== "object" || value === null || !(key in value)) return null;
  const fieldValue = (value as Record<string, unknown>)[key];
  return fieldValue === null || fieldValue === undefined ? null : String(fieldValue);
}

function formatAuditEntries(entries: AuditLogEntry[]) {
  if (entries.length === 0) {
    return [
      { id: "fallback-1", user: "SYSTEM", action: "Waiting for live audit signal", timestamp: "No events yet", oldValue: "-", newValue: "Ready" },
    ];
  }

  return entries.slice(0, 8).map((entry) => ({
    id: String(entry.id),
    user: entry.changedBy ?? "System",
    action: `${entry.tableName} ${entry.action}`.replaceAll("_", " "),
    timestamp: entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "Pending timestamp",
    oldValue: auditValue(entry.oldValue, "status") ?? auditValue(entry.oldValue, "scope") ?? "-",
    newValue: auditValue(entry.newValue, "status") ?? auditValue(entry.newValue, "scope") ?? auditValue(entry.newValue, "topic") ?? "Recorded",
  }));
}

function portfolioHealth(dataPoints: DataPoint[]) {
  const total = Math.max(dataPoints.length, 1);
  const approved = dataPoints.filter((point) => point.status === "APPROVED").length;
  const review = dataPoints.filter((point) => point.status === "REVIEW").length;
  const draft = dataPoints.filter((point) => point.status === "DRAFT").length;
  return {
    approved,
    review,
    draft,
    approvalRate: Math.round((approved / total) * 100),
  };
}

function buildStats(orgs: Organization[], ghg: GHGEntry[], dataPoints: DataPoint[]) {
  const totalEmissions = ghg.reduce((sum, entry) => sum + entry.emissions, 0) || ghgSummary2025.totalEmissions;
  const approvedPoints = dataPoints.filter((point) => point.status === "APPROVED").length;
  const revenue = ghgSummary2025.revenue;
  const intensity = totalEmissions / revenue;
  const jvcCount = orgs.filter((org) => org.type === "JVC").length || jvcEntities.length;

  return [
    { label: "GHG Inventory", value: formatNumber(totalEmissions), unit: "tCO2e", change: ghg.length ? "Live API" : "Demo baseline", trend: ghg.length ? "neutral" : "up" },
    { label: "Emission Intensity", value: formatNumber(intensity), unit: "t/bn IDR", change: "Revenue normalized", trend: "neutral" },
    { label: "Approved Data", value: formatNumber(approvedPoints), unit: "points", change: `${dataPoints.length} total`, trend: approvedPoints ? "down" : "up" },
    { label: "JVC Entities", value: formatNumber(jvcCount), unit: "entities", change: orgs.length ? "API synced" : "Demo portfolio", trend: "neutral" },
  ];
}

function buildPortfolioRows(orgs: Organization[], ghg: GHGEntry[]) {
  const rows = (orgs.length > 0 ? orgs : jvcEntities.map((entity, index) => ({
    id: index + 1,
    name: entity.name,
    type: "JVC" as const,
    sector: entity.category,
  }))).filter((org) => org.type === "JVC" || org.type === "ASSET");

  return rows.map((org, index) => {
    const fallback = jvcEntities[index % jvcEntities.length];
    const emissions = ghg.filter((entry) => entry.orgId === org.id).reduce((sum, entry) => sum + entry.emissions, 0) || fallback.emissions;
    const liveRecords = ghg.filter((entry) => entry.orgId === org.id).length;

    return {
      name: org.name,
      emissions,
      social: 92,
      governance: 100,
      status: liveRecords > 0 ? "Live Signal" : fallback.status === "Operasional" ? "Demo Signal" : "Needs Data",
      variance: liveRecords > 0 ? `${liveRecords} records` : "Demo",
      equity: fallback.equity,
      tkdn: "46.4%",
      partner: fallback.partner,
      partnerSync: liveRecords > 0 ? "Synced" : "Pending",
    };
  });
}

export function Overview() {
  const { getToken } = useAuth();
  const [selectedJVC, setSelectedJVC] = React.useState<string | null>(null);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [ghgEntries, setGhgEntries] = React.useState<GHGEntry[]>([]);
  const [dataPoints, setDataPoints] = React.useState<DataPoint[]>([]);
  const [auditEntries, setAuditEntries] = React.useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [usingFallback, setUsingFallback] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [orgs, ghg, points, audits] = await Promise.all([
          listOrganizations(getToken),
          listGhgInventory(undefined, getToken),
          listDataPoints(undefined, getToken),
          listAuditLogs(undefined, getToken, { limit: 50 }),
        ]);
        if (!active) return;
        setOrganizations(orgs);
        setGhgEntries(ghg);
        setDataPoints(points);
        setAuditEntries(audits);
      } catch (error) {
        if (!active) return;
        setUsingFallback(true);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadDashboardData();
    return () => {
      active = false;
    };
  }, []);

  const stats = buildStats(organizations, ghgEntries, dataPoints);
  const roadmapData = groupGhgByYear(ghgEntries);
  const portfolioRows = buildPortfolioRows(organizations, ghgEntries);
  const activeJVC = portfolioRows.find((jvc) => jvc.name === selectedJVC);
  const gapCount = missingDisclosures.length + Math.max(0, portfolioRows.filter((row) => row.partnerSync === "Pending").length - 1);
  const health = portfolioHealth(dataPoints);

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-8">
          <div className="overflow-hidden border border-red-500 bg-red-50/10 shadow-[8px_8px_0_#EF4444]">
            <div className="flex items-center justify-between border-b border-red-600 bg-red-500 p-3 text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Framework Disclosure Gap Alerts</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{gapCount} Flags Detected</span>
            </div>
            <div className="divide-y divide-red-500/20">
              {missingDisclosures.map((alert) => (
                <div key={alert.framework} className="grid grid-cols-1 gap-3 p-4 transition-colors hover:bg-red-500/5 md:grid-cols-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-red-500 px-2 py-0.5 text-[9px] font-bold uppercase text-white">{alert.severity}</span>
                    <span className="text-[11px] font-bold uppercase tracking-tight">{alert.framework}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest opacity-60">Disclosure</span>
                    <p className="text-[11px] italic font-medium">{alert.description}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest opacity-60">Target Asset</span>
                    <p className="text-[11px] font-bold uppercase">{alert.asset}</p>
                  </div>
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 underline underline-offset-2">Map Evidence</span>
                    <ArrowRight className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {usingFallback && (
            <div className="border border-amber-300 bg-amber-50 p-4 text-[10px] font-bold uppercase tracking-widest text-amber-900 shadow-[4px_4px_0_#D97706]">
              Dashboard fallback is active. Configure database and API routes to see live KPIs.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="app-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="app-muted">Approval Rate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-slate-950">{health.approvalRate}%</p>
              <p className="mt-2 text-xs font-medium text-slate-500">{health.approved} approved submissions</p>
            </div>
            <div className="app-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="app-muted">Review Queue</span>
                <Clock3 className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-slate-950">{health.review}</p>
              <p className="mt-2 text-xs font-medium text-slate-500">{health.draft} returned/draft items</p>
            </div>
            <div className="app-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="app-muted">Audit Events</span>
                <Shield className="h-4 w-4 text-sky-500" />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-slate-950">{auditEntries.length}</p>
              <p className="mt-2 text-xs font-medium text-slate-500">Latest tenant-filtered events</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#141414] p-5 text-[#E4E3E0] shadow-[4px_4px_0_#A09F9C]">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-amber-400">Carbon Tax Liability (Est.)</span>
            <p className="text-2xl font-bold tracking-tighter">IDR {formatNumber((ghgEntries.reduce((sum, entry) => sum + entry.emissions, 0) || ghgSummary2025.totalEmissions) * 8750, 1)}</p>
            <p className="mt-2 border-t border-white/10 pt-2 text-[8px] italic uppercase opacity-60">@ IDR 8,750/tCO2e working assumption</p>
          </div>
          <div className="border border-[#141414] bg-white p-5 shadow-[4px_4px_0_#141414]">
            <span className="mb-2 block text-[9px] font-bold uppercase opacity-60">Scope 3 C15 Portfolio</span>
            <p className="text-2xl font-bold tracking-tighter">{formatNumber(ghgSummary2025.investmentPortfolio / 1000, 1)}k <span className="text-[10px] font-normal opacity-60">tCO2e</span></p>
            <div className="mt-2 flex justify-between">
              <span className="text-[8px] font-bold uppercase text-amber-600">Investments</span>
              <span className="text-[8px] font-bold uppercase text-slate-600">Equity Share Bound</span>
            </div>
          </div>
          <div className="border border-[#141414] bg-white p-5 shadow-[4px_4px_0_#141414]">
            <span className="mb-2 block text-[9px] font-bold uppercase opacity-60">SMAP Compliance</span>
            <p className="text-2xl font-bold tracking-tighter">100%</p>
            <p className="mt-2 text-[8px] font-bold uppercase text-emerald-600">ISO 37001 assumed certified</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#141414] border border-[#141414] bg-white shadow-[4px_4px_0_#141414] md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-6">
            <span className="font-serif italic text-[10px] uppercase tracking-widest opacity-60">{stat.label}</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tighter">{stat.value}</span>
              <span className="text-[10px] italic uppercase opacity-60">{stat.unit}</span>
            </div>
            <p className={cn("mt-2 text-[9px] font-bold uppercase tracking-tighter", stat.trend === "up" ? "text-amber-600" : "text-emerald-600")}>{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="border border-[#141414] bg-white p-8 shadow-[8px_8px_0_#141414] md:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-serif italic text-xl font-bold tracking-tight">Net Zero 2030 Roadmap</h3>
                  <p className="mt-1 text-[10px] uppercase tracking-widest opacity-60">API-backed GHG trajectory</p>
                </div>
                <span className="bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase italic text-white">{isLoading ? "Loading" : "On Track"}</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={roadmapData}>
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                    <YAxis hide domain={[0, "dataMax + 100"]} />
                    <Tooltip contentStyle={{ backgroundColor: "#141414", border: "none", color: "#E4E3E0", fontSize: "10px" }} />
                    <Area type="monotone" dataKey="target" fill="#10B981" fillOpacity={0.05} stroke="#10B981" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="actual" stroke="#141414" strokeWidth={3} dot={{ r: 4, fill: "#141414" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col justify-between bg-[#141414] p-8 text-[#E4E3E0] shadow-[12px_12px_0_#10B981]">
              <div>
                <div className="mb-6 flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Climate Liability Alert</span>
                  <Shield className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-2xl font-bold uppercase tracking-tighter">CBAM Phase 2</h3>
                <p className="mb-6 text-[11px] italic leading-relaxed opacity-70">Portfolio carbon exposure should be reviewed against export-market liability assumptions and verified Scope 3 boundaries.</p>
                <div className="border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase opacity-40">Risk Exposure</span>
                    <span className="text-sm font-bold text-amber-400">$2.1M</span>
                  </div>
                  <div className="h-1 bg-white/10">
                    <div className="h-full w-[65%] bg-amber-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {activeJVC ? (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative border border-[#141414] bg-[#141414] p-8 text-[#E4E3E0] shadow-[8px_8px_0_#10B981]">
              <button onClick={() => setSelectedJVC(null)} className="absolute right-4 top-4 border border-white/20 px-3 py-1 text-[10px] font-bold uppercase hover:bg-white/10">Close</button>
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center border border-emerald-500/30 bg-emerald-500/10">
                  <Globe className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold uppercase tracking-tighter">{activeJVC.name}</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">Partner: {activeJVC.partner}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <MetricBlock label="Equity Exposure" value={activeJVC.equity} />
                <MetricBlock label="Governance Index" value={`${activeJVC.governance}%`} tone="green" />
                <MetricBlock label="Operational Emissions" value={`${formatNumber(activeJVC.emissions)} tCO2e`} />
              </div>
              <p className="mt-8 border-t border-white/10 pt-6 text-[12px] italic leading-relaxed opacity-80">Maintain active monitoring. This asset is currently marked as {activeJVC.partnerSync.toLowerCase()} against the API-backed portfolio data.</p>
            </motion.div>
          ) : (
            <div className="overflow-hidden border border-[#141414] bg-white shadow-[4px_4px_0_#141414]">
              <div className="grid grid-cols-7 bg-[#D4D3D0]/30">
                <div className="col-header col-span-2">JVC Entity</div>
                <div className="col-header">Equity</div>
                <div className="col-header text-right">Emissions</div>
                <div className="col-header">Partner Sync</div>
                <div className="col-header">TKDN</div>
                <div className="col-header text-right">Status</div>
              </div>
              <div className="divide-y divide-[#141414]/10">
                {portfolioRows.map((jvc) => (
                  <button key={jvc.name} onClick={() => setSelectedJVC(jvc.name)} className="grid w-full grid-cols-7 items-center px-4 py-4 text-left transition-colors hover:bg-[#141414] hover:text-[#E4E3E0]">
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-tight">{jvc.name}</span>
                      <p className="mt-1 text-[8px] italic opacity-60">{jvc.partner}</p>
                    </div>
                    <div className="text-[10px] font-bold opacity-60">{jvc.equity}</div>
                    <div className="data-value text-right">{formatNumber(jvc.emissions, 1)}</div>
                    <div>
                      <span className={cn("border px-1.5 py-0.5 text-[8px] font-bold uppercase", jvc.partnerSync === "Synced" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-600")}>{jvc.partnerSync}</span>
                    </div>
                    <div className="text-[10px] font-bold">{jvc.tkdn}</div>
                    <div className="flex items-center justify-end gap-2">
                      <span className={cn("h-2 w-2 rounded-full", jvc.partnerSync === "Synced" ? "bg-emerald-500" : "bg-amber-500")} />
                      <span className="text-[9px] font-bold uppercase tracking-tighter">{jvc.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <AuditTrail entries={formatAuditEntries(auditEntries)} />
          <div className="border border-[#141414] bg-white p-6 shadow-[4px_4px_0_#141414]">
            <span className="font-serif italic mb-4 block border-b border-[#141414]/10 pb-2 text-[10px] uppercase tracking-widest opacity-60">Intelligent Feed</span>
            <div className="space-y-4">
              {[
                { title: "New POJK 51 Regulation Draft", source: "OJK", signal: "High Signal" },
                { title: "ISSB S1/S2 Adoption", source: "IAI", signal: "Market Trend" },
                { title: "GRI 2024 Energy Standard Update", source: "GRI", signal: "Market Trend" },
              ].map((item) => (
                <div key={item.title}>
                  <p className="mb-1 text-[9px] font-bold uppercase text-[#141414]/40">{item.source} / {item.signal}</p>
                  <h3 className="text-[11px] font-bold uppercase leading-tight tracking-tight">{item.title}</h3>
                </div>
              ))}
              <button className="mt-4 w-full bg-[#141414] py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0]">Generate Digest</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBlock({ label, value, tone }: { label: string; value: string; tone?: "green" }) {
  return (
    <div>
      <span className="mb-2 block border-b border-white/10 pb-2 text-[9px] font-bold uppercase opacity-40">{label}</span>
      <p className={cn("text-xl font-bold", tone === "green" && "text-emerald-400")}>{value}</p>
    </div>
  );
}
