import React from "react";
import { AlertCircle, Building2, CheckCircle2, Database, Gauge, Globe, ListTodo, RotateCcw, Save } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  createAction,
  createDataPoint,
  createGhgEntry,
  createMaterialityAssessment,
  getAccessProfile,
  listActions,
  listDataPoints,
  listGhgInventory,
  listMaterialityAssessments,
  listOrganizations,
  listRequirements,
  updateDataPointStatus,
} from "../../lib/api.ts";
import { useAuth } from "../../lib/AuthContext.tsx";
import type { ActionItem, DataPoint, DisclosureRequirement, GHGEntry, MaterialityAssessment, Organization, UserAccessProfile } from "../../types.ts";
import { cn } from "../../lib/utils.ts";

type MetricForm = {
  requirementId: string;
  value: string;
  numericValue: string;
  unit: string;
  source: string;
  methodology: string;
};

const emptyMetric: MetricForm = {
  requirementId: "",
  value: "",
  numericValue: "",
  unit: "",
  source: "",
  methodology: "",
};

export function EntityWorkspace() {
  const { getToken } = useAuth();
  const [profile, setProfile] = React.useState<UserAccessProfile | null>(null);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [requirements, setRequirements] = React.useState<DisclosureRequirement[]>([]);
  const [selectedOrgId, setSelectedOrgId] = React.useState<number | null>(null);
  const [dataPoints, setDataPoints] = React.useState<DataPoint[]>([]);
  const [ghgEntries, setGhgEntries] = React.useState<GHGEntry[]>([]);
  const [actions, setActions] = React.useState<ActionItem[]>([]);
  const [materiality, setMateriality] = React.useState<MaterialityAssessment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [metricForm, setMetricForm] = React.useState<MetricForm>(emptyMetric);
  const [ghgForm, setGhgForm] = React.useState({ scope: "1", category: "", emissions: "", methodology: "" });
  const [actionForm, setActionForm] = React.useState({ title: "", owner: "", dueDate: "", description: "" });
  const [materialityForm, setMaterialityForm] = React.useState({ topic: "", impactMateriality: "HIGH", financialMateriality: "HIGH", rationale: "" });

  React.useEffect(() => {
    let active = true;
    async function loadAccess() {
      setIsLoading(true);
      try {
        const [access, orgs, reqs] = await Promise.all([
          getAccessProfile(getToken),
          listOrganizations(getToken),
          listRequirements(),
        ]);
        if (!active) return;
        setProfile(access);
        setOrganizations(orgs);
        setRequirements(reqs);
        setSelectedOrgId(orgs[0]?.id ?? null);
        if (reqs[0]) setMetricForm((current) => ({ ...current, requirementId: String(reqs[0].id), unit: reqs[0].unit ?? "" }));
      } catch (error) {
        toast.error("Entity access is not configured", {
          description: error instanceof Error ? error.message : "Ask PLN NR admin to map this email to a JV entity.",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadAccess();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    async function loadEntityData() {
      if (!selectedOrgId) return;
      setIsLoading(true);
      try {
        const [points, ghg, entityActions, topics] = await Promise.all([
          listDataPoints(selectedOrgId, getToken),
          listGhgInventory(selectedOrgId, getToken),
          listActions(selectedOrgId, getToken),
          listMaterialityAssessments(selectedOrgId, getToken),
        ]);
        if (!active) return;
        setDataPoints(points);
        setGhgEntries(ghg);
        setActions(entityActions);
        setMateriality(topics);
      } catch (error) {
        toast.error("Failed to load entity data", {
          description: error instanceof Error ? error.message : "Please refresh and try again.",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadEntityData();
    return () => {
      active = false;
    };
  }, [selectedOrgId]);

  const selectedOrg = organizations.find((org) => org.id === selectedOrgId);
  const totalEmissions = ghgEntries.reduce((sum, entry) => sum + entry.emissions, 0);
  const approvedData = dataPoints.filter((point) => point.status === "APPROVED").length;
  const reviewData = dataPoints.filter((point) => point.status === "REVIEW");
  const openActions = actions.filter((action) => action.status !== "CLOSED").length;

  async function submitMetric(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedOrgId) return;
    setIsSaving(true);
    try {
      const now = new Date();
      const created = await createDataPoint({
        orgId: selectedOrgId,
        requirementId: Number(metricForm.requirementId),
        periodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        periodEnd: now.toISOString(),
        value: metricForm.value,
        numericValue: metricForm.numericValue ? Number(metricForm.numericValue) : undefined,
        unit: metricForm.unit,
        source: metricForm.source,
        methodology: metricForm.methodology,
        owner: profile?.email,
        status: "REVIEW",
      }, getToken);
      setDataPoints((current) => [created, ...current]);
      setMetricForm(emptyMetric);
      toast.success("ESG metric submitted for review");
    } catch (error) {
      toast.error("Metric submission failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  async function submitGhg(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedOrgId) return;
    setIsSaving(true);
    try {
      const now = new Date();
      const created = await createGhgEntry({
        orgId: selectedOrgId,
        scope: Number(ghgForm.scope),
        category: ghgForm.category,
        gasType: "CO2e",
        emissions: Number(ghgForm.emissions),
        unit: "tCO2e",
        periodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        periodEnd: now.toISOString(),
        methodology: ghgForm.methodology,
        locationBased: true,
      }, getToken);
      setGhgEntries((current) => [created, ...current]);
      setGhgForm({ scope: "1", category: "", emissions: "", methodology: "" });
      toast.success("GHG entry submitted");
    } catch (error) {
      toast.error("GHG submission failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  async function submitAction(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedOrgId) return;
    setIsSaving(true);
    try {
      const created = await createAction({
        orgId: selectedOrgId,
        title: actionForm.title,
        description: actionForm.description,
        owner: actionForm.owner || profile?.email,
        dueDate: actionForm.dueDate ? new Date(actionForm.dueDate).toISOString() : undefined,
        priority: "HIGH",
        sourceType: "JV SUBMISSION",
        status: "OPEN",
      }, getToken);
      setActions((current) => [created, ...current]);
      setActionForm({ title: "", owner: "", dueDate: "", description: "" });
      toast.success("Corrective action logged");
    } catch (error) {
      toast.error("Action submission failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  async function submitMateriality(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedOrgId) return;
    setIsSaving(true);
    try {
      const created = await createMaterialityAssessment({
        orgId: selectedOrgId,
        topic: materialityForm.topic,
        impactMateriality: materialityForm.impactMateriality as MaterialityAssessment["impactMateriality"],
        financialMateriality: materialityForm.financialMateriality as MaterialityAssessment["financialMateriality"],
        period: `FY${new Date().getFullYear()}`,
        rationale: materialityForm.rationale,
      }, getToken);
      setMateriality((current) => [created, ...current]);
      setMaterialityForm({ topic: "", impactMateriality: "HIGH", financialMateriality: "HIGH", rationale: "" });
      toast.success("Materiality topic submitted");
    } catch (error) {
      toast.error("Materiality submission failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  async function reviewDataPoint(dataPoint: DataPoint, status: "DRAFT" | "APPROVED") {
    try {
      const updated = await updateDataPointStatus(dataPoint.id, status, getToken);
      setDataPoints((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success(status === "APPROVED" ? "Submission approved" : "Submission returned to draft");
    } catch (error) {
      toast.error("Review action failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <div className="space-y-10">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col gap-4 border-b border-[#141414] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold uppercase italic tracking-tight">JV Entity Workspace</h2>
          <p className="mt-1 text-[10px] uppercase tracking-widest opacity-60">Entity-only submission cockpit with tenant-filtered dashboard</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="border border-[#141414] bg-white px-4 py-3">
            <span className="block text-[8px] font-bold uppercase tracking-widest opacity-40">Access Mode</span>
            <span className="text-[11px] font-bold uppercase">{profile?.role === "PLN_NR" ? "PLN NR All Entities" : "JV Restricted"}</span>
          </div>
          <select
            value={selectedOrgId ?? ""}
            disabled={profile?.role !== "PLN_NR"}
            onChange={(event) => setSelectedOrgId(Number(event.target.value))}
            className="border border-[#141414] bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none disabled:bg-[#D4D3D0]/40"
          >
            {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
        </div>
      </div>

      {!selectedOrg && !isLoading ? (
        <div className="flex items-start gap-3 border border-red-300 bg-red-50 p-5 text-red-900 shadow-[4px_4px_0_#EF4444]">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">This account is authenticated but not mapped to a JV entity.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <WorkspaceMetric icon={Building2} label="Entity" value={selectedOrg?.name ?? "Loading"} />
            <WorkspaceMetric icon={Globe} label="GHG Inventory" value={`${totalEmissions.toLocaleString()} tCO2e`} />
            <WorkspaceMetric icon={Database} label="Approved / Total Data" value={`${approvedData}/${dataPoints.length}`} />
            <WorkspaceMetric icon={ListTodo} label="Open Actions" value={String(openActions)} tone={openActions > 0 ? "amber" : "green"} />
          </div>

          {profile?.role === "PLN_NR" && (
            <div className="border border-[#141414] bg-white p-6 shadow-[8px_8px_0_#141414]">
              <div className="mb-5 flex items-center justify-between border-b border-[#141414] pb-3">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest">PLN NR Review Queue</h3>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-widest opacity-50">Approve JV submitted ESG metrics for consolidation</p>
                </div>
                <span className="border border-amber-500 px-3 py-1 text-[9px] font-bold uppercase text-amber-600">{reviewData.length} Pending</span>
              </div>
              <div className="space-y-3">
                {reviewData.length > 0 ? reviewData.slice(0, 8).map((item) => {
                  const requirement = requirements.find((req) => req.id === item.requirementId);
                  return (
                    <div key={item.id} className="grid grid-cols-1 gap-4 border border-[#141414]/10 p-4 lg:grid-cols-6 lg:items-center">
                      <div className="lg:col-span-2">
                        <p className="text-[11px] font-bold uppercase tracking-tight">{requirement?.code ?? `Metric ${item.id}`}</p>
                        <p className="mt-1 text-[9px] italic opacity-60">{requirement?.title ?? item.methodology ?? "Unmapped metric"}</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold uppercase opacity-40">Value</span>
                        <p className="data-value">{item.value ?? item.numericValue ?? "-"} {item.unit ?? ""}</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold uppercase opacity-40">Source</span>
                        <p className="text-[10px] font-bold uppercase tracking-tight">{item.source ?? "No source"}</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold uppercase opacity-40">Owner</span>
                        <p className="text-[10px] font-bold uppercase tracking-tight">{item.owner ?? "Unknown"}</p>
                      </div>
                      <div className="flex gap-2 lg:justify-end">
                        <button onClick={() => reviewDataPoint(item, "APPROVED")} className="flex items-center gap-1 bg-emerald-500 px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[#141414]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button onClick={() => reviewDataPoint(item, "DRAFT")} className="flex items-center gap-1 border border-[#141414] px-3 py-2 text-[9px] font-bold uppercase tracking-widest">
                          <RotateCcw className="h-3.5 w-3.5" /> Return
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="py-4 text-[10px] font-bold uppercase tracking-widest opacity-40">No submissions waiting for PLN NR review.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SubmissionPanel title="Submit ESG Metric" onSubmit={submitMetric} isSaving={isSaving}>
              <select value={metricForm.requirementId} onChange={(event) => setMetricForm((current) => ({ ...current, requirementId: event.target.value }))} className="field xl:col-span-2">
                {requirements.map((req) => <option key={req.id} value={req.id}>{req.code} / {req.title}</option>)}
              </select>
              <input value={metricForm.value} onChange={(event) => setMetricForm((current) => ({ ...current, value: event.target.value }))} placeholder="Reported value" className="field" required />
              <input value={metricForm.numericValue} onChange={(event) => setMetricForm((current) => ({ ...current, numericValue: event.target.value }))} placeholder="Numeric value" className="field" />
              <input value={metricForm.unit} onChange={(event) => setMetricForm((current) => ({ ...current, unit: event.target.value }))} placeholder="Unit" className="field" />
              <input value={metricForm.source} onChange={(event) => setMetricForm((current) => ({ ...current, source: event.target.value }))} placeholder="Evidence source" className="field" required />
              <textarea value={metricForm.methodology} onChange={(event) => setMetricForm((current) => ({ ...current, methodology: event.target.value }))} placeholder="Methodology / calculation note" className="field min-h-24 xl:col-span-2" required />
            </SubmissionPanel>

            <SubmissionPanel title="Submit GHG Inventory" onSubmit={submitGhg} isSaving={isSaving}>
              <select value={ghgForm.scope} onChange={(event) => setGhgForm((current) => ({ ...current, scope: event.target.value }))} className="field">
                <option value="1">Scope 1</option>
                <option value="2">Scope 2</option>
                <option value="3">Scope 3</option>
              </select>
              <input value={ghgForm.category} onChange={(event) => setGhgForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" className="field" required />
              <input value={ghgForm.emissions} onChange={(event) => setGhgForm((current) => ({ ...current, emissions: event.target.value }))} placeholder="tCO2e" className="field" required />
              <textarea value={ghgForm.methodology} onChange={(event) => setGhgForm((current) => ({ ...current, methodology: event.target.value }))} placeholder="Emission factor and calculation basis" className="field min-h-24 xl:col-span-2" required />
            </SubmissionPanel>

            <SubmissionPanel title="Log Corrective Action" onSubmit={submitAction} isSaving={isSaving}>
              <input value={actionForm.title} onChange={(event) => setActionForm((current) => ({ ...current, title: event.target.value }))} placeholder="Action title" className="field xl:col-span-2" required />
              <input value={actionForm.owner} onChange={(event) => setActionForm((current) => ({ ...current, owner: event.target.value }))} placeholder="Owner" className="field" />
              <input type="date" value={actionForm.dueDate} onChange={(event) => setActionForm((current) => ({ ...current, dueDate: event.target.value }))} className="field" />
              <textarea value={actionForm.description} onChange={(event) => setActionForm((current) => ({ ...current, description: event.target.value }))} placeholder="Corrective action detail" className="field min-h-24 xl:col-span-2" required />
            </SubmissionPanel>

            <SubmissionPanel title="Submit Materiality Topic" onSubmit={submitMateriality} isSaving={isSaving}>
              <input value={materialityForm.topic} onChange={(event) => setMaterialityForm((current) => ({ ...current, topic: event.target.value }))} placeholder="Topic" className="field xl:col-span-2" required />
              <select value={materialityForm.impactMateriality} onChange={(event) => setMaterialityForm((current) => ({ ...current, impactMateriality: event.target.value }))} className="field">
                <option value="LOW">Low impact</option>
                <option value="MEDIUM">Medium impact</option>
                <option value="HIGH">High impact</option>
                <option value="VERY_HIGH">Very high impact</option>
              </select>
              <select value={materialityForm.financialMateriality} onChange={(event) => setMaterialityForm((current) => ({ ...current, financialMateriality: event.target.value }))} className="field">
                <option value="LOW">Low financial</option>
                <option value="MEDIUM">Medium financial</option>
                <option value="HIGH">High financial</option>
                <option value="VERY_HIGH">Very high financial</option>
              </select>
              <textarea value={materialityForm.rationale} onChange={(event) => setMaterialityForm((current) => ({ ...current, rationale: event.target.value }))} placeholder="Rationale and stakeholder evidence" className="field min-h-24 xl:col-span-2" required />
            </SubmissionPanel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <RecentList title="Recent ESG Data" items={dataPoints.map((item) => `${item.value ?? item.numericValue ?? "-"} ${item.unit ?? ""}`)} />
            <RecentList title="Recent GHG Entries" items={ghgEntries.map((item) => `Scope ${item.scope} / ${item.emissions.toLocaleString()} ${item.unit}`)} />
            <RecentList title="Material Topics" items={materiality.map((item) => `${item.topic} / ${item.impactMateriality}`)} />
          </div>
        </>
      )}
    </div>
  );
}

function WorkspaceMetric({ icon: Icon, label, value, tone = "neutral" }: { icon: typeof Gauge; label: string; value: string; tone?: "neutral" | "amber" | "green" }) {
  return (
    <div className="border border-[#141414] bg-white p-5 shadow-[4px_4px_0_#141414]">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">{label}</span>
        <Icon className={cn("h-4 w-4", tone === "amber" ? "text-amber-500" : tone === "green" ? "text-emerald-500" : "opacity-40")} />
      </div>
      <p className="text-lg font-bold uppercase tracking-tight">{value}</p>
    </div>
  );
}

function SubmissionPanel({ title, onSubmit, isSaving, children }: { title: string; onSubmit: (event: React.FormEvent) => void; isSaving: boolean; children: React.ReactNode }) {
  return (
    <form onSubmit={onSubmit} className="border border-[#141414] bg-white p-6 shadow-[6px_6px_0_#D4D3D0]">
      <div className="mb-5 flex items-center justify-between border-b border-[#141414] pb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest">{title}</h3>
        <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-[#141414] px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#E4E3E0] disabled:opacity-50">
          <Save className="h-3.5 w-3.5 text-emerald-400" /> Save
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{children}</div>
    </form>
  );
}

function RecentList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-[#141414] bg-white p-6 shadow-[4px_4px_0_#A09F9C]">
      <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest opacity-50">{title}</h3>
      <div className="space-y-3">
        {items.slice(0, 5).length > 0 ? items.slice(0, 5).map((item, index) => (
          <div key={`${item}-${index}`} className="border-b border-[#141414]/10 pb-2 text-[10px] font-bold uppercase tracking-tight">
            {item}
          </div>
        )) : (
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">No entries yet</p>
        )}
      </div>
    </div>
  );
}
