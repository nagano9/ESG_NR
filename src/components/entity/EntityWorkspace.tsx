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
  listAuditLogs,
  listDataPoints,
  listGhgInventory,
  listMaterialityAssessments,
  listOrganizations,
  listRequirements,
  updateDataPointStatus,
} from "../../lib/api.ts";
import { useAuth } from "../../lib/AuthContext.tsx";
import type { ActionItem, AuditLogEntry, DataPoint, DisclosureRequirement, GHGEntry, MaterialityAssessment, Organization, UserAccessProfile } from "../../types.ts";
import { cn } from "../../lib/utils.ts";
import { AuditTrail } from "../common/AuditTrail.tsx";

type MetricForm = {
  requirementId: string;
  period: string;
  value: string;
  numericValue: string;
  unit: string;
  source: string;
  methodology: string;
};

function reportingMonth() {
  return new Date().toISOString().slice(0, 7);
}

function emptyMetricForm(): MetricForm {
  return {
    requirementId: "",
    period: reportingMonth(),
    value: "",
    numericValue: "",
    unit: "",
    source: "",
    methodology: "",
  };
}

function monthRange(period: string) {
  const [year, month] = period.split("-").map(Number);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);
  return { periodStart, periodEnd };
}

function dataCompleteness(points: DataPoint[]) {
  if (points.length === 0) return 0;
  const complete = points.filter((point) => (
    Boolean(point.source)
    && Boolean(point.methodology)
    && Boolean(point.periodStart)
    && Boolean(point.periodEnd)
    && (Boolean(point.value) || typeof point.numericValue === "number")
  )).length;
  return Math.round((complete / points.length) * 100);
}

function auditField(value: unknown, field: string) {
  if (typeof value !== "object" || value === null || !(field in value)) return null;
  const fieldValue = (value as Record<string, unknown>)[field];
  return fieldValue === null || fieldValue === undefined ? null : String(fieldValue);
}

function formatAuditEntries(entries: AuditLogEntry[]) {
  return entries.slice(0, 6).map((entry) => {
    const oldStatus = auditField(entry.oldValue, "status") ?? "-";
    const newStatus = auditField(entry.newValue, "status") ?? "-";
    const reason = auditField(entry.newValue, "reason");
    return {
      id: String(entry.id),
      user: entry.changedBy ?? "System",
      action: entry.action.replaceAll("_", " "),
      timestamp: entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "Pending timestamp",
      oldValue: oldStatus,
      newValue: reason && reason !== "null" ? `${newStatus} - ${reason}` : newStatus,
    };
  });
}

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
  const [auditEntries, setAuditEntries] = React.useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [metricForm, setMetricForm] = React.useState<MetricForm>(emptyMetricForm);
  const [ghgForm, setGhgForm] = React.useState({ scope: "1", category: "", emissions: "", methodology: "" });
  const [actionForm, setActionForm] = React.useState({ title: "", owner: "", dueDate: "", description: "" });
  const [materialityForm, setMaterialityForm] = React.useState({ topic: "", impactMateriality: "HIGH", financialMateriality: "HIGH", rationale: "" });
  const [returnNotes, setReturnNotes] = React.useState<Record<number, string>>({});

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
        const [points, ghg, entityActions, topics, audits] = await Promise.all([
          listDataPoints(selectedOrgId, getToken),
          listGhgInventory(selectedOrgId, getToken),
          listActions(selectedOrgId, getToken),
          listMaterialityAssessments(selectedOrgId, getToken),
          listAuditLogs(selectedOrgId, getToken),
        ]);
        if (!active) return;
        setDataPoints(points);
        setGhgEntries(ghg);
        setActions(entityActions);
        setMateriality(topics);
        setAuditEntries(audits);
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
  const draftData = dataPoints.filter((point) => point.status === "DRAFT").length;
  const completeness = dataCompleteness(dataPoints);
  const openActions = actions.filter((action) => action.status !== "CLOSED").length;

  async function submitMetric(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedOrgId) return;
    setIsSaving(true);
    try {
      const { periodStart, periodEnd } = monthRange(metricForm.period);
      const created = await createDataPoint({
        orgId: selectedOrgId,
        requirementId: Number(metricForm.requirementId),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        value: metricForm.value,
        numericValue: metricForm.numericValue ? Number(metricForm.numericValue) : undefined,
        unit: metricForm.unit,
        source: metricForm.source,
        methodology: metricForm.methodology,
        owner: profile?.email,
        status: "REVIEW",
      }, getToken);
      setDataPoints((current) => [created, ...current]);
      const audits = await listAuditLogs(selectedOrgId, getToken);
      setAuditEntries(audits);
      setMetricForm((current) => ({
        ...emptyMetricForm(),
        requirementId: current.requirementId,
        unit: current.unit,
      }));
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
    const reason = returnNotes[dataPoint.id]?.trim();
    if (status === "DRAFT" && !reason) {
      toast.error("Return note is required", { description: "Explain what the JV entity must fix before resubmission." });
      return;
    }

    try {
      const updated = await updateDataPointStatus(dataPoint.id, status, getToken, reason);
      setDataPoints((current) => current.map((item) => item.id === updated.id ? updated : item));
      const audits = await listAuditLogs(selectedOrgId ?? undefined, getToken);
      setAuditEntries(audits);
      setReturnNotes((current) => {
        const next = { ...current };
        delete next[dataPoint.id];
        return next;
      });
      toast.success(status === "APPROVED" ? "Submission approved" : "Submission returned to draft");
    } catch (error) {
      toast.error("Review action failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />
      <div className="app-panel flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Building2 className="h-3.5 w-3.5" />
            {profile?.role === "PLN_NR" ? "PLN NR portfolio mode" : "JV restricted mode"}
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Entity ESG Workspace</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A controlled workspace for JV submissions, review status, GHG data, material topics, and corrective actions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="block text-xs font-medium text-slate-500">Access mode</span>
            <span className="text-sm font-semibold text-slate-950">{profile?.role === "PLN_NR" ? "All entities" : "Tenant restricted"}</span>
          </div>
          <select
            value={selectedOrgId ?? ""}
            disabled={profile?.role !== "PLN_NR"}
            onChange={(event) => setSelectedOrgId(Number(event.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500"
          >
            {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
        </div>
      </div>

      {!selectedOrg && !isLoading ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-red-900">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p className="text-sm font-medium">This account is authenticated but not mapped to a JV entity.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <WorkspaceMetric icon={Building2} label="Entity" value={selectedOrg?.name ?? "Loading"} />
            <WorkspaceMetric icon={Globe} label="GHG Inventory" value={`${totalEmissions.toLocaleString()} tCO2e`} />
            <WorkspaceMetric icon={Database} label="Approved Data" value={`${approvedData}/${dataPoints.length}`} tone={approvedData ? "green" : "neutral"} />
            <WorkspaceMetric icon={CheckCircle2} label="Review / Draft" value={`${reviewData.length}/${draftData}`} tone={draftData ? "amber" : "green"} />
            <WorkspaceMetric icon={Gauge} label="Completeness" value={`${completeness}%`} tone={completeness >= 80 ? "green" : "amber"} />
            <WorkspaceMetric icon={ListTodo} label="Open Actions" value={String(openActions)} tone={openActions > 0 ? "amber" : "green"} />
          </div>

          {profile?.role === "PLN_NR" && (
            <div className="app-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="app-section-title">PLN NR Review Queue</h3>
                  <p className="app-muted mt-1">Approve JV submitted ESG metrics for consolidation</p>
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{reviewData.length} pending</span>
              </div>
              <div className="divide-y divide-slate-100">
                {reviewData.length > 0 ? reviewData.slice(0, 8).map((item) => {
                  const requirement = requirements.find((req) => req.id === item.requirementId);
                  return (
                    <div key={item.id} className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-7 lg:items-center">
                      <div className="lg:col-span-2">
                        <p className="text-sm font-semibold text-slate-950">{requirement?.code ?? `Metric ${item.id}`}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{requirement?.title ?? item.methodology ?? "Unmapped metric"}</p>
                      </div>
                      <div>
                        <span className="app-muted">Value</span>
                        <p className="data-value">{item.value ?? item.numericValue ?? "-"} {item.unit ?? ""}</p>
                      </div>
                      <div>
                        <span className="app-muted">Source</span>
                        <p className="text-sm font-medium text-slate-700">{item.source ?? "No source"}</p>
                      </div>
                      <div>
                        <span className="app-muted">Owner</span>
                        <p className="text-sm font-medium text-slate-700">{item.owner ?? "Unknown"}</p>
                      </div>
                      <textarea
                        value={returnNotes[item.id] ?? ""}
                        onChange={(event) => setReturnNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                        placeholder="Return note"
                        className="min-h-20 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                      />
                      <div className="flex gap-2 lg:justify-end">
                        <button onClick={() => reviewDataPoint(item, "APPROVED")} className="btn-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button onClick={() => reviewDataPoint(item, "DRAFT")} className="btn-secondary">
                          <RotateCcw className="h-3.5 w-3.5" /> Return
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="px-6 py-8 text-sm font-medium text-slate-500">No submissions waiting for PLN NR review.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SubmissionPanel title="Submit ESG Metric" onSubmit={submitMetric} isSaving={isSaving}>
              <select value={metricForm.requirementId} onChange={(event) => setMetricForm((current) => ({ ...current, requirementId: event.target.value }))} className="field xl:col-span-2">
                {requirements.map((req) => <option key={req.id} value={req.id}>{req.code} / {req.title}</option>)}
              </select>
              <input type="month" value={metricForm.period} onChange={(event) => setMetricForm((current) => ({ ...current, period: event.target.value }))} className="field" required />
              <input value={metricForm.value} onChange={(event) => setMetricForm((current) => ({ ...current, value: event.target.value }))} placeholder="Reported value" className="field" />
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

          <AuditTrail entries={formatAuditEntries(auditEntries)} />
        </>
      )}
    </div>
  );
}

function WorkspaceMetric({ icon: Icon, label, value, tone = "neutral" }: { icon: typeof Gauge; label: string; value: string; tone?: "neutral" | "amber" | "green" }) {
  return (
    <div className="app-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <Icon className={cn("h-4 w-4", tone === "amber" ? "text-amber-500" : tone === "green" ? "text-emerald-500" : "opacity-40")} />
      </div>
      <p className="text-xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function SubmissionPanel({ title, onSubmit, isSaving, children }: { title: string; onSubmit: (event: React.FormEvent) => void; isSaving: boolean; children: React.ReactNode }) {
  return (
    <form onSubmit={onSubmit} className="app-panel p-6">
      <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
        <h3 className="app-section-title">{title}</h3>
        <button type="submit" disabled={isSaving} className="btn-primary">
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{children}</div>
    </form>
  );
}

function RecentList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="app-panel p-6">
      <h3 className="mb-4 app-section-title">{title}</h3>
      <div className="space-y-3">
        {items.slice(0, 5).length > 0 ? items.slice(0, 5).map((item, index) => (
          <div key={`${item}-${index}`} className="border-b border-slate-100 pb-2 text-sm font-medium text-slate-700">
            {item}
          </div>
        )) : (
          <p className="text-sm font-medium text-slate-500">No entries yet</p>
        )}
      </div>
    </div>
  );
}
