import React from "react";
import { AlertCircle, BarChart3, CheckCircle2, Download, Info, Plus, Save, X } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createGhgEntry, listGhgInventory, listOrganizations } from "../../lib/api.ts";
import { useAuth } from "../../lib/AuthContext.tsx";
import { ghgSummary2025, jvcEntities } from "../../data/ghgData.ts";
import { formatNumber } from "../../lib/format.ts";
import { cn } from "../../lib/utils.ts";
import type { GHGEntry, Organization } from "../../types.ts";

const scopes = [
  { id: 1, label: "Scope 1", description: "Direct emissions from owned or controlled sources" },
  { id: 2, label: "Scope 2", description: "Indirect emissions from purchased energy" },
  { id: 3, label: "Scope 3", description: "Other indirect emissions across the value chain" },
];

const demoEntries = [
  { id: 1, orgId: 1, scope: 1, category: "Mobile Combustion (Dexlite/B30)", gasType: "CO2e", emissions: 6.84, unit: "tCO2e", periodStart: "2025-01-01", periodEnd: "2025-01-31", methodology: "Fuel consumption x density x NCV x national emission factor.", locationBased: true },
  { id: 2, orgId: 1, scope: 2, category: "HO Electricity (Grid)", gasType: "CO2e", emissions: 65.3, unit: "tCO2e", periodStart: "2025-01-01", periodEnd: "2025-01-31", methodology: "kWh consumption x Jamali grid emission factor.", locationBased: true },
  { id: 3, orgId: 1, scope: 3, category: "C6: Business Travel", gasType: "CO2e", emissions: 198.55, unit: "tCO2e", periodStart: "2025-01-01", periodEnd: "2025-01-31", methodology: "Distance-based business travel using ICAO factors.", locationBased: false },
] satisfies GHGEntry[];

const ghgSchema = z.object({
  orgId: z.string().min(1, "Organization is required"),
  scope: z.enum(["1", "2", "3"]),
  category: z.string().min(1, "Category is required"),
  emissions: z.string().refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, "Emissions must be a non-negative number"),
  unit: z.string().min(1),
  period: z.string().min(1, "Period is required"),
  methodology: z.string().min(10, "Methodology must be at least 10 characters"),
  locationBased: z.boolean(),
});

type GhgFormData = z.infer<typeof ghgSchema>;

function monthBounds(period: string) {
  const [year, month] = period.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
    end: new Date(Date.UTC(year, month, 0)).toISOString(),
  };
}

function exportCsv(rows: Array<Record<string, string | number | boolean>>) {
  const headers = Object.keys(rows[0] ?? { id: "", scope: "", category: "", emissions: "", unit: "" });
  const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
  const link = document.createElement("a");
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  link.download = `ghg_inventory_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function buildTrend(entries: GHGEntry[]) {
  const yearly = new Map<string, { year: string; scope1: number; scope2: number; scope3: number; target: number }>();
  for (const entry of entries) {
    const year = new Date(entry.periodEnd).getFullYear().toString();
    const row = yearly.get(year) ?? { year, scope1: 0, scope2: 0, scope3: 0, target: Number(year) >= 2025 ? 300 : 350 };
    row[`scope${entry.scope}` as "scope1" | "scope2" | "scope3"] += entry.emissions;
    yearly.set(year, row);
  }

  if (yearly.size === 0) {
    return [
      { year: "2023", scope1: 74.89, scope2: 67.19, scope3: 185.3, target: 350 },
      { year: "2024", scope1: 43.29, scope2: 69.55, scope3: 172.98, target: 320 },
      { year: "2025", scope1: 24.27, scope2: 70.77, scope3: 384.2, target: 300 },
    ];
  }

  return [...yearly.values()].sort((a, b) => a.year.localeCompare(b.year));
}

export function Inventory() {
  const [selectedScope, setSelectedScope] = React.useState(1);
  const [reductionScenario, setReductionScenario] = React.useState(false);
  const [inventory, setInventory] = React.useState<GHGEntry[]>([]);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdding, setIsAdding] = React.useState(false);
  const [usingFallback, setUsingFallback] = React.useState(false);
  const { getToken } = useAuth();

  const form = useForm<GhgFormData>({
    resolver: zodResolver(ghgSchema),
    defaultValues: {
      orgId: "1",
      scope: "1",
      category: "",
      emissions: "",
      unit: "tCO2e",
      period: "",
      methodology: "",
      locationBased: true,
    },
  });

  React.useEffect(() => {
    let active = true;
    async function loadInventory() {
      setIsLoading(true);
      try {
        const [orgs, ghg] = await Promise.all([listOrganizations(), listGhgInventory()]);
        if (!active) return;
        setOrganizations(orgs);
        setInventory(ghg);
        if (orgs[0]) form.setValue("orgId", String(orgs[0].id));
      } catch (error) {
        if (!active) return;
        setUsingFallback(true);
        setInventory(demoEntries);
        toast.warning("Using demo GHG inventory", {
          description: "Configure PostgreSQL and migrations to load live GHG data.",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadInventory();
    return () => {
      active = false;
    };
  }, []);

  const orgOptions = organizations.length > 0
    ? organizations
    : jvcEntities.map((entity, index) => ({ id: index + 1, name: entity.name, type: "JVC" as const }));

  const scopedEntries = inventory.filter((entry) => entry.scope === selectedScope);
  const trend = buildTrend(inventory).map((row) => ({
    ...row,
    scope3: reductionScenario && row.year === "2025" ? row.scope3 * 0.85 : row.scope3,
  }));

  const total = inventory.reduce((sum, entry) => sum + entry.emissions, 0);
  const scopeTotals = scopes.map((scope) => ({
    ...scope,
    total: inventory.filter((entry) => entry.scope === scope.id).reduce((sum, entry) => sum + entry.emissions, 0),
  }));

  async function onSubmit(data: GhgFormData) {
    const period = monthBounds(data.period);
    try {
      const created = await createGhgEntry({
        orgId: Number(data.orgId),
        scope: Number(data.scope),
        category: data.category,
        gasType: "CO2e",
        emissions: Number(data.emissions),
        unit: data.unit,
        periodStart: period.start,
        periodEnd: period.end,
        methodology: data.methodology,
        locationBased: data.locationBased,
      }, getToken);
      setInventory((current) => [created, ...current]);
      setSelectedScope(created.scope);
      setIsAdding(false);
      form.reset();
      toast.success("GHG inventory entry created");
    } catch (error) {
      toast.error("Failed to save GHG entry", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <div className="space-y-8">
      <Toaster position="top-right" richColors />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="border border-[#141414] bg-white p-5 shadow-[4px_4px_0_#141414]">
          <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Total Inventory</span>
          <p className="mt-2 text-2xl font-black tracking-tight">{formatNumber(total || ghgSummary2025.totalEmissions)} <span className="text-xs">tCO2e</span></p>
        </div>
        {scopeTotals.map((scope) => (
          <button key={scope.id} onClick={() => setSelectedScope(scope.id)} className={cn("border border-[#141414] bg-white p-5 text-left shadow-[4px_4px_0_#D4D3D0]", selectedScope === scope.id && "bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0_#10B981]")}>
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">{scope.label}</span>
            <p className="mt-2 text-xl font-black">{formatNumber(scope.total)} <span className="text-xs">tCO2e</span></p>
          </button>
        ))}
      </div>

      <div className="border border-[#141414] bg-white shadow-[8px_8px_0_#141414]">
        <div className="col-header flex items-center justify-between bg-[#D4D3D0]/30">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3 w-3" />
            <span>Emissions Trend & Scenario</span>
          </div>
          <button onClick={() => setReductionScenario((value) => !value)} className={cn("border border-[#141414] px-3 py-1 text-[9px] font-bold uppercase", reductionScenario && "bg-emerald-500 text-[#141414]")}>
            15% Scope 3 Reduction
          </button>
        </div>
        <div className="h-80 p-8">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141420" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fontWeight: "bold", fill: "#141414" }} />
              <YAxis tick={{ fontSize: 10, fontWeight: "bold", fill: "#141414" }} />
              <Tooltip contentStyle={{ backgroundColor: "#141414", border: "none", color: "#E4E3E0", fontSize: "11px" }} />
              <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }} />
              <Bar dataKey="scope1" name="Scope 1" fill="#141414" />
              <Bar dataKey="scope2" name="Scope 2" fill="#10B981" />
              <Bar dataKey="scope3" name="Scope 3" fill="#D4D3D0" />
              <Line type="monotone" dataKey="target" name="NZT Target" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {usingFallback && (
        <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-[4px_4px_0_#D97706]">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Fallback inventory is active. Live write actions are disabled until backend data is reachable.</p>
        </div>
      )}

      <div className="flex flex-col gap-4 border-b border-[#141414] pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1">
          {scopes.map((scope) => (
            <button key={scope.id} onClick={() => setSelectedScope(scope.id)} className={cn("border border-[#141414] px-6 py-2 text-[11px] font-bold uppercase tracking-widest", selectedScope === scope.id ? "bg-[#141414] text-[#E4E3E0]" : "bg-white")}>
              Scope {scope.id}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportCsv(scopedEntries.map((entry) => ({ ...entry })))} className="flex items-center gap-2 border border-[#141414] px-4 py-2 text-[10px] font-bold uppercase tracking-widest">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button onClick={() => setIsAdding(true)} disabled={usingFallback} className="flex items-center gap-2 bg-[#141414] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] shadow-[4px_4px_0_#A09F9C] disabled:opacity-50">
            <Plus className="h-3.5 w-3.5" /> Add GHG Entry
          </button>
        </div>
      </div>

      <div className="flex items-start gap-4 border border-[#141414] bg-[#141414] p-4 text-[#E4E3E0]">
        <Info className="h-4 w-4 opacity-70" />
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-60">{scopes.find((scope) => scope.id === selectedScope)?.label}</p>
          <p className="text-xs italic opacity-80">{scopes.find((scope) => scope.id === selectedScope)?.description}</p>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 border border-[#141414] bg-white p-6 shadow-[8px_8px_0_#10B981] lg:grid-cols-6">
          <select {...form.register("orgId")} className="border-b-2 border-[#141414] py-2 text-[11px] font-bold uppercase outline-none lg:col-span-2">
            {orgOptions.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
          <select {...form.register("scope")} className="border-b-2 border-[#141414] py-2 text-[11px] font-bold uppercase outline-none">
            <option value="1">Scope 1</option>
            <option value="2">Scope 2</option>
            <option value="3">Scope 3</option>
          </select>
          <input {...form.register("category")} placeholder="Category" className="border-b-2 border-[#141414] py-2 text-[11px] font-bold outline-none lg:col-span-2" />
          <input {...form.register("emissions")} placeholder="tCO2e" className="border-b-2 border-[#141414] py-2 text-[11px] font-bold outline-none" />
          <input type="month" {...form.register("period")} className="border-b-2 border-[#141414] py-2 text-[11px] font-bold outline-none" />
          <input {...form.register("unit")} className="border-b-2 border-[#141414] py-2 text-[11px] font-bold outline-none" />
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <input type="checkbox" {...form.register("locationBased")} /> Location based
          </label>
          <textarea {...form.register("methodology")} placeholder="Methodology and factor source" className="min-h-20 border-2 border-[#141414] p-3 text-[11px] outline-none lg:col-span-4" />
          <div className="flex gap-3 lg:col-span-2">
            <button type="submit" className="flex flex-1 items-center justify-center gap-2 bg-[#141414] py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0]">
              <Save className="h-4 w-4 text-emerald-400" /> Save
            </button>
            <button type="button" onClick={() => setIsAdding(false)} className="flex items-center justify-center border border-[#141414] px-4">
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      <div className="border border-[#141414] bg-white shadow-[4px_4px_0_#141414]">
        <div className="grid grid-cols-8 bg-[#D4D3D0]/30">
          <div className="col-header col-span-2">Category</div>
          <div className="col-header text-right">Emissions</div>
          <div className="col-header">Org</div>
          <div className="col-header">Boundary</div>
          <div className="col-header">Period</div>
          <div className="col-header col-span-2">Methodology</div>
        </div>
        <div className="divide-y divide-[#141414]/10">
          {isLoading ? (
            <div className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-50">Loading GHG inventory...</div>
          ) : scopedEntries.length === 0 ? (
            <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest opacity-50">No Scope {selectedScope} entries yet</div>
          ) : scopedEntries.map((entry) => {
            const org = orgOptions.find((item) => item.id === entry.orgId);
            return (
              <div key={entry.id} className="grid grid-cols-8 items-center px-4 py-4 hover:bg-[#141414] hover:text-[#E4E3E0]">
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-tight">{entry.category ?? "Uncategorized"}</p>
                  <p className="mt-1 text-[8px] italic opacity-50">INV-{entry.id}</p>
                </div>
                <div className="text-right">
                  <span className="data-value text-emerald-600">{formatNumber(entry.emissions, entry.emissions < 0.01 ? 6 : 2)}</span>
                  <span className="ml-1 text-[7px] font-bold uppercase opacity-40">{entry.unit}</span>
                </div>
                <div className="text-[9px] font-bold uppercase opacity-70">{org?.name ?? `Org ${entry.orgId}`}</div>
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {entry.locationBased ? "Location" : "Other"}
                </div>
                <div className="text-[9px] font-bold uppercase opacity-60">{entry.periodEnd?.slice(0, 10)}</div>
                <div className="col-span-2 line-clamp-2 text-[9px] italic opacity-70">{entry.methodology ?? "No methodology captured"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
