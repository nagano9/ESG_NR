import React from "react";
import { AlertCircle, CheckCircle2, Clock, Database, Download, Filter, Plus, Save, Search, Send, Upload } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, Toaster } from "sonner";
import { createDataPoint, listDataPoints, listOrganizations, listRequirements } from "../../lib/api.ts";
import { useAuth } from "../../lib/AuthContext.tsx";
import { cn } from "../../lib/utils.ts";
import { jvcEntities } from "../../data/ghgData.ts";
import type { DataPoint, DisclosureRequirement, Organization } from "../../types.ts";

const entrySchema = z.object({
  entity: z.string().min(1, "Entity is required"),
  requirementId: z.string().min(1, "Disclosure requirement is required"),
  value: z.string().optional(),
  numericValue: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  period: z.string().min(1, "Reporting period is required"),
  source: z.string().min(1, "Source is required"),
  methodology: z.string().min(10, "Methodology must be at least 10 characters"),
}).refine((data) => Boolean(data.value?.trim()) || Boolean(data.numericValue?.trim()), {
  message: "Reported value or numeric value is required",
  path: ["value"],
}).refine((data) => !data.numericValue || Number.isFinite(Number(data.numericValue)), {
  message: "Numeric value must be a valid number",
  path: ["numericValue"],
});

type EntryFormData = z.infer<typeof entrySchema>;

const demoEntries = [
  { id: 1, orgId: 1, requirementId: 1, periodStart: "2025-01-01", periodEnd: "2025-01-31", value: "650.3", numericValue: 650.3, unit: "Liters", source: "Manual", methodology: "Fuel log and national conversion factor.", owner: "demo", status: "APPROVED" },
  { id: 2, orgId: 1, requirementId: 2, periodStart: "2025-01-01", periodEnd: "2025-01-31", value: "1922.9", numericValue: 1922.9, unit: "kWh", source: "Manual", methodology: "Utility bill and Jamali grid factor.", owner: "demo", status: "REVIEW" },
] satisfies DataPoint[];

function monthBounds(period: string) {
  const [year, month] = period.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
    end: new Date(Date.UTC(year, month, 0)).toISOString(),
  };
}

function downloadCsv(rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] ?? { id: "", metric: "", entity: "", value: "", unit: "", status: "" });
  const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
  const link = document.createElement("a");
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  link.download = `esg_submissions_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function DataEntry() {
  const [activeTab, setActiveTab] = React.useState<"list" | "new">("list");
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [requirements, setRequirements] = React.useState<DisclosureRequirement[]>([]);
  const [dataPoints, setDataPoints] = React.useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [usingFallback, setUsingFallback] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const { user, getToken } = useAuth();

  const form = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      entity: "",
      requirementId: "",
      value: "",
      numericValue: "",
      unit: "tCO2e",
      period: "",
      source: "Manual",
      methodology: "",
    },
  });

  React.useEffect(() => {
    const saved = localStorage.getItem("esg_form_draft");
    if (saved) form.reset(JSON.parse(saved));
  }, [form]);

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem("esg_form_draft", JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  React.useEffect(() => {
    let active = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [orgs, reqs, points] = await Promise.all([listOrganizations(getToken), listRequirements(), listDataPoints(undefined, getToken)]);
        if (!active) return;
        setOrganizations(orgs);
        setRequirements(reqs);
        setDataPoints(points);
        form.reset({
          ...form.getValues(),
          entity: orgs[0]?.name ?? "",
          requirementId: reqs[0]?.id ? String(reqs[0].id) : "",
          unit: reqs[0]?.unit ?? "tCO2e",
        });
      } catch (error) {
        if (!active) return;
        setUsingFallback(true);
        setDataPoints(demoEntries);
        toast.warning("Database API unavailable", {
          description: "Showing demo submissions until PostgreSQL/API are configured.",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const fallbackOrganizations = jvcEntities.map((entity, index) => ({
    id: index + 1,
    name: entity.name,
    type: "JVC" as const,
  }));

  const fallbackRequirements = [
    { id: 1, frameworkId: 1, code: "305-1", title: "Direct GHG Emissions", requirementType: "Quantitative", unit: "tCO2e" },
    { id: 2, frameworkId: 1, code: "305-2", title: "Energy Indirect GHG Emissions", requirementType: "Quantitative", unit: "tCO2e" },
  ] satisfies DisclosureRequirement[];

  const orgOptions = organizations.length > 0 ? organizations : fallbackOrganizations;
  const requirementOptions = requirements.length > 0 ? requirements : fallbackRequirements;

  const rows = dataPoints.map((point) => {
    const org = orgOptions.find((item) => item.id === point.orgId);
    const requirement = requirementOptions.find((item) => item.id === point.requirementId);
    const hasEvidence = Boolean(point.source) && Boolean(point.methodology);
    return {
      id: `DP-${String(point.id).padStart(5, "0")}`,
      metric: requirement ? `${requirement.code}: ${requirement.title}` : "ESG Data Point",
      entity: org?.name ?? `Organization ${point.orgId}`,
      value: point.numericValue ?? point.value ?? "N/A",
      unit: point.unit ?? requirement?.unit ?? "",
      source: point.source ?? "Manual",
      status: point.status,
      period: point.periodEnd?.slice(0, 10) ?? "N/A",
      quality: hasEvidence ? "Evidence ready" : "Needs evidence",
    };
  });
  const filteredRows = rows.filter((row) => {
    const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
    const haystack = `${row.metric} ${row.entity} ${row.source} ${row.status}`.toLowerCase();
    return matchesStatus && haystack.includes(searchTerm.toLowerCase());
  });
  const submissionHealth = {
    total: rows.length,
    review: rows.filter((row) => row.status === "REVIEW").length,
    approved: rows.filter((row) => row.status === "APPROVED").length,
    needsEvidence: rows.filter((row) => row.quality === "Needs evidence").length,
  };

  async function onSubmit(data: EntryFormData) {
    const selectedOrg = orgOptions.find((org) => org.name === data.entity);
    const selectedRequirement = requirementOptions.find((req) => String(req.id) === data.requirementId);
    if (!selectedOrg) {
      toast.error("Organization missing", { description: "Create or seed an organization before submitting." });
      return;
    }

    const period = monthBounds(data.period);
    setIsSubmitting(true);
    try {
      const created = await createDataPoint({
        orgId: selectedOrg.id,
        requirementId: selectedRequirement?.id,
        periodStart: period.start,
        periodEnd: period.end,
        value: data.value,
        numericValue: data.numericValue ? Number(data.numericValue) : undefined,
        unit: data.unit,
        source: data.source,
        methodology: data.methodology,
        owner: user?.email ?? undefined,
        status: "REVIEW",
      }, getToken);
      setDataPoints((current) => [created, ...current]);
      localStorage.removeItem("esg_form_draft");
      form.reset();
      setActiveTab("list");
      toast.success("Submission sent for review");
    } catch (error) {
      toast.error("Submission failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col gap-4 border-b border-[#141414] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-serif italic text-xl font-bold uppercase tracking-tight">JVC Submission Portal</h2>
          <p className="mt-1 text-[10px] uppercase tracking-widest opacity-60">API-backed ESG data intake and evidence readiness</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => downloadCsv(filteredRows)} className="flex items-center gap-2 border border-[#141414] px-5 py-3 text-[10px] font-bold uppercase tracking-widest">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={() => setActiveTab("new")} className="flex items-center gap-2 bg-[#141414] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] shadow-[4px_4px_0_#A09F9C]">
            <Plus className="h-4 w-4" /> New Submission
          </button>
        </div>
      </div>

      {usingFallback && (
        <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-[4px_4px_0_#D97706]">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Fallback data is active. Configure database env and seed data to use live submissions.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SubmissionMetric label="Total Submissions" value={submissionHealth.total} />
        <SubmissionMetric label="In Review" value={submissionHealth.review} tone="amber" />
        <SubmissionMetric label="Approved" value={submissionHealth.approved} tone="green" />
        <SubmissionMetric label="Needs Evidence" value={submissionHealth.needsEvidence} tone={submissionHealth.needsEvidence ? "red" : "green"} />
      </div>

      {activeTab === "list" ? (
        <div className="app-panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search metric, entity, source, or status"
                className="field pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field w-44">
                <option value="ALL">All status</option>
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">Review</option>
                <option value="APPROVED">Approved</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-6 bg-[#D4D3D0]/30">
            <div className="col-header col-span-2">Metric</div>
            <div className="col-header">Value</div>
            <div className="col-header">Source</div>
            <div className="col-header">Status</div>
            <div className="col-header text-right">Period</div>
          </div>
          <div className="divide-y divide-[#141414]/10">
            {isLoading ? (
              <div className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-50">Loading submissions...</div>
            ) : filteredRows.length === 0 ? (
              <div className="p-8 text-center">
                <Database className="mx-auto mb-4 h-8 w-8 opacity-30" />
                <p className="text-[11px] font-bold uppercase tracking-widest">No ESG submissions match the current filter</p>
              </div>
            ) : filteredRows.map((row) => (
              <div key={row.id} className="grid grid-cols-6 items-center px-4 py-4 hover:bg-[#141414] hover:text-[#E4E3E0]">
                <div className="col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-tight">{row.metric}</p>
                  <p className="mt-1 text-[9px] italic opacity-60">{row.entity}</p>
                </div>
                <div className="data-value">{row.value} {row.unit}</div>
                <div>
                  <p className="text-[9px] font-bold uppercase">{row.source}</p>
                  <p className={cn("mt-1 text-[8px] font-semibold", row.quality === "Evidence ready" ? "text-emerald-600" : "text-amber-600")}>{row.quality}</p>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase">
                  {row.status === "APPROVED" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Clock className="h-3 w-3 text-sky-500" />}
                  {row.status}
                </div>
                <div className="text-right text-[9px] font-bold uppercase opacity-60">{row.period}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-8 border border-[#141414] bg-white p-8 shadow-[12px_12px_0_#141414]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Entity</span>
              <select {...form.register("entity")} className="w-full border-b-2 border-[#141414] py-2 text-[12px] font-bold uppercase outline-none">
                {orgOptions.map((org) => <option key={org.id} value={org.name}>{org.name}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Disclosure Requirement</span>
              <select {...form.register("requirementId")} onChange={(event) => {
                form.register("requirementId").onChange(event);
                const selected = requirementOptions.find((req) => String(req.id) === event.target.value);
                if (selected?.unit) form.setValue("unit", selected.unit);
              }} className="w-full border-b-2 border-[#141414] py-2 text-[12px] font-bold uppercase outline-none">
                {requirementOptions.map((req) => <option key={req.id} value={req.id}>{req.code}: {req.title}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Reported Value</span>
              <input {...form.register("value")} className="w-full border-b-2 border-[#141414] py-2 text-[12px] font-bold outline-none" placeholder="Narrative or reported value" />
              {form.formState.errors.value && <p className="text-[9px] font-bold uppercase text-red-500">{form.formState.errors.value.message}</p>}
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Numeric Value</span>
              <input {...form.register("numericValue")} className="w-full border-b-2 border-[#141414] py-2 text-[12px] font-bold outline-none" placeholder="450.2" />
              {form.formState.errors.numericValue && <p className="text-[9px] font-bold uppercase text-red-500">{form.formState.errors.numericValue.message}</p>}
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Unit</span>
              <input {...form.register("unit")} className="w-full border-b-2 border-[#141414] py-2 text-[12px] font-bold outline-none" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Period</span>
              <input type="month" {...form.register("period")} className="w-full border-b-2 border-[#141414] py-2 text-[12px] font-bold outline-none" />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Source</span>
            <input {...form.register("source")} className="w-full border-b-2 border-[#141414] py-2 text-[12px] font-bold outline-none" placeholder="Fuel log, utility bill, SCADA tag" />
          </label>

          <label className="block space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Methodology</span>
            <textarea {...form.register("methodology")} className="min-h-28 w-full border-2 border-[#141414] p-4 text-[11px] outline-none" placeholder="Describe calculation method, source lineage, and evidence basis..." />
            {form.formState.errors.methodology && <p className="text-[9px] font-bold uppercase text-red-500">{form.formState.errors.methodology.message}</p>}
          </label>

          <div className="border-2 border-dashed border-[#141414]/20 p-6 text-center">
            <Upload className="mx-auto mb-3 h-7 w-7 opacity-30" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Evidence upload backend is next in the roadmap</p>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={() => {
              localStorage.setItem("esg_form_draft", JSON.stringify(form.getValues()));
              toast.info("Draft saved locally");
            }} className="flex flex-1 items-center justify-center gap-2 border border-[#141414] py-4 text-[10px] font-bold uppercase tracking-[0.2em]">
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button disabled={isSubmitting || usingFallback} type="submit" className={cn("flex flex-1 items-center justify-center gap-2 bg-[#141414] py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E4E3E0] shadow-[6px_6px_0_#10B981]", (isSubmitting || usingFallback) && "opacity-50")}>
              <Send className="h-4 w-4 text-emerald-400" /> {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function SubmissionMetric({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "amber" | "green" | "red" }) {
  return (
    <div className="app-card p-5">
      <span className="app-muted">{label}</span>
      <p className={cn(
        "mt-2 text-2xl font-semibold tracking-tight",
        tone === "amber" ? "text-amber-600" : tone === "green" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-slate-950",
      )}>
        {value}
      </p>
    </div>
  );
}
