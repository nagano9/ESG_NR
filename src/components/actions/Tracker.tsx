import React from "react";
import { AlertCircle, Calendar, Filter, Plus, Save, X } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { createAction, listActions, listOrganizations, updateActionStatus } from "../../lib/api.ts";
import { useAuth } from "../../lib/AuthContext.tsx";
import { cn } from "../../lib/utils.ts";
import { jvcEntities } from "../../data/ghgData.ts";
import type { ActionItem, ActionStatus, Organization } from "../../types.ts";

const demoActions = [
  { id: 1, orgId: 1, title: "K3 Site Inspection & LTIFR Audit", owner: "Safety Officer", dueDate: "2025-02-15", status: "OPEN", priority: "HIGH", sourceType: "K3 / SAFETY", description: "Complete site inspection evidence and LTIFR audit pack." },
  { id: 2, orgId: 2, title: "SMAP ISO 37001 Surveillance Audit", owner: "Compliance Head", dueDate: "2025-03-01", status: "IN_PROGRESS", priority: "MEDIUM", sourceType: "SMAP / GOV", description: "Prepare surveillance evidence for anti-bribery management system." },
  { id: 3, orgId: 3, title: "Update Land Utilization Agreement", owner: "Legal Lead", dueDate: "2025-01-30", status: "OVERDUE", priority: "CRITICAL", sourceType: "TJSL / SOCIAL", description: "Resolve pending LUA documentation for lender review." },
] satisfies ActionItem[];

const actionSchema = z.object({
  orgId: z.string().min(1, "Organization is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  owner: z.string().min(1, "Owner is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.string().min(1),
  sourceType: z.string().min(1),
});

type ActionFormData = z.infer<typeof actionSchema>;

const statusOptions: ActionStatus[] = ["OPEN", "IN_PROGRESS", "CLOSED", "OVERDUE"];

function formatDate(value?: string) {
  if (!value) return "No due date";
  return new Date(value).toISOString().slice(0, 10);
}

function maturity(actions: ActionItem[]) {
  const total = Math.max(actions.length, 1);
  const logged = actions.length > 0 ? 100 : 0;
  const inProgress = Math.round((actions.filter((action) => action.status === "IN_PROGRESS" || action.status === "CLOSED").length / total) * 100);
  const closed = Math.round((actions.filter((action) => action.status === "CLOSED").length / total) * 100);
  return [
    { label: "Identification & Logging", val: logged },
    { label: "Root Cause / Owner Assigned", val: inProgress },
    { label: "Verification of Effectiveness", val: closed },
  ];
}

export function Tracker() {
  const [actions, setActions] = React.useState<ActionItem[]>([]);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdding, setIsAdding] = React.useState(false);
  const [usingFallback, setUsingFallback] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<ActionStatus | "ALL">("ALL");
  const { getToken } = useAuth();

  const form = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      orgId: "1",
      title: "",
      description: "",
      owner: "",
      dueDate: "",
      priority: "HIGH",
      sourceType: "ESG GAP",
    },
  });

  React.useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      try {
        const [orgs, items] = await Promise.all([listOrganizations(), listActions()]);
        if (!active) return;
        setOrganizations(orgs);
        setActions(items);
        if (orgs[0]) form.setValue("orgId", String(orgs[0].id));
      } catch (error) {
        if (!active) return;
        setUsingFallback(true);
        setActions(demoActions);
        toast.warning("Using demo action tracker", {
          description: "Configure database/API to enable live action workflow.",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const orgOptions = organizations.length > 0
    ? organizations
    : jvcEntities.map((entity, index) => ({ id: index + 1, name: entity.name, type: "JVC" as const }));

  const visibleActions = statusFilter === "ALL" ? actions : actions.filter((action) => action.status === statusFilter);
  const overdue = actions.filter((action) => action.status === "OVERDUE").sort((a, b) => formatDate(a.dueDate).localeCompare(formatDate(b.dueDate)))[0];

  async function onSubmit(data: ActionFormData) {
    try {
      const created = await createAction({
        orgId: Number(data.orgId),
        title: data.title,
        description: data.description,
        owner: data.owner,
        dueDate: new Date(data.dueDate).toISOString(),
        priority: data.priority,
        sourceType: data.sourceType,
        status: "OPEN",
      }, getToken);
      setActions((current) => [created, ...current]);
      setIsAdding(false);
      form.reset();
      toast.success("Action logged");
    } catch (error) {
      toast.error("Failed to log action", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  async function handleStatusChange(action: ActionItem, status: ActionStatus) {
    if (usingFallback) return;
    try {
      const updated = await updateActionStatus(action.id, status, getToken);
      setActions((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast.success("Action status updated");
    } catch (error) {
      toast.error("Failed to update status", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <div className="space-y-12">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col gap-4 border-b border-[#141414] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-serif italic text-xl font-bold uppercase tracking-tight">Safeguard Action Tracker</h2>
          <p className="mt-1 text-[10px] uppercase tracking-widest opacity-60">E&S compliance, K3 safety, SMAP, and disclosure corrective actions</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setStatusFilter(statusFilter === "ALL" ? "OPEN" : "ALL")} className="flex items-center gap-2 border border-[#141414] px-4 py-2 text-[10px] font-bold uppercase tracking-widest">
            <Filter className="h-3.5 w-3.5" /> {statusFilter === "ALL" ? "Open Filter" : "Show All"}
          </button>
          <button onClick={() => setIsAdding(true)} disabled={usingFallback} className="flex items-center gap-2 bg-[#141414] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] shadow-[4px_4px_0_#A09F9C] disabled:opacity-50">
            <Plus className="h-4 w-4" /> Log New Action
          </button>
        </div>
      </div>

      {usingFallback && (
        <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-[4px_4px_0_#D97706]">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Fallback action data is active. Live write actions are disabled until backend data is reachable.</p>
        </div>
      )}

      {isAdding && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 border border-[#141414] bg-white p-6 shadow-[8px_8px_0_#10B981] lg:grid-cols-6">
          <select {...form.register("orgId")} className="border-b-2 border-[#141414] py-2 text-[11px] font-bold uppercase outline-none lg:col-span-2">
            {orgOptions.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
          <input {...form.register("title")} placeholder="Action title" className="border-b-2 border-[#141414] py-2 text-[11px] font-bold outline-none lg:col-span-2" />
          <input {...form.register("owner")} placeholder="Owner" className="border-b-2 border-[#141414] py-2 text-[11px] font-bold outline-none" />
          <input type="date" {...form.register("dueDate")} className="border-b-2 border-[#141414] py-2 text-[11px] font-bold outline-none" />
          <select {...form.register("priority")} className="border-b-2 border-[#141414] py-2 text-[11px] font-bold uppercase outline-none">
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <input {...form.register("sourceType")} placeholder="Source type" className="border-b-2 border-[#141414] py-2 text-[11px] font-bold outline-none lg:col-span-2" />
          <textarea {...form.register("description")} placeholder="Corrective action description" className="min-h-20 border-2 border-[#141414] p-3 text-[11px] outline-none lg:col-span-4" />
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

      <div className="overflow-hidden border border-[#141414] bg-white shadow-[8px_8px_0_#141414]">
        <div className="grid grid-cols-8 border-b border-[#141414] bg-[#D4D3D0]/30">
          <div className="col-header col-span-2">Action Item</div>
          <div className="col-header">Category</div>
          <div className="col-header">Owner</div>
          <div className="col-header">Priority</div>
          <div className="col-header">Due Date</div>
          <div className="col-header">Status</div>
          <div className="col-header text-right">Workflow</div>
        </div>

        <div className="divide-y divide-[#141414]/10">
          {isLoading ? (
            <div className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-50">Loading actions...</div>
          ) : visibleActions.length === 0 ? (
            <div className="p-8 text-center text-[11px] font-bold uppercase tracking-widest opacity-50">No actions found</div>
          ) : visibleActions.map((action) => {
            const org = orgOptions.find((item) => item.id === action.orgId);
            return (
              <div key={action.id} className="grid grid-cols-8 items-center px-4 py-5 transition-colors hover:bg-[#141414] hover:text-[#E4E3E0]">
                <div className="col-span-2">
                  <p className="text-[11px] font-bold uppercase leading-tight tracking-tight">{action.title}</p>
                  <p className="mt-1 text-[9px] italic opacity-60">Asset: {org?.name ?? `Org ${action.orgId}`}</p>
                </div>
                <div>
                  <span className="border border-[#141414]/20 px-1.5 py-0.5 text-[8px] font-bold uppercase">{action.sourceType ?? "ESG"}</span>
                </div>
                <div className="text-[11px] italic opacity-80">{action.owner ?? "Unassigned"}</div>
                <div>
                  <span className={cn("border px-2 py-0.5 text-[9px] font-bold uppercase", action.priority === "CRITICAL" ? "border-red-500 bg-red-500/10 text-red-500" : "border-[#141414]/20")}>
                    {action.priority ?? "MEDIUM"}
                  </span>
                </div>
                <div className="audit-font flex items-center gap-2 uppercase tracking-tighter">
                  <Calendar className="h-3 w-3 opacity-40" /> {formatDate(action.dueDate)}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full", action.status === "OPEN" ? "bg-amber-500" : action.status === "OVERDUE" ? "bg-red-500" : action.status === "CLOSED" ? "bg-emerald-500" : "bg-sky-500")} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{action.status}</span>
                </div>
                <select
                  value={action.status}
                  disabled={usingFallback}
                  onChange={(event) => handleStatusChange(action, event.target.value as ActionStatus)}
                  className="justify-self-end border border-[#141414] bg-transparent px-2 py-1 text-[9px] font-bold uppercase outline-none disabled:opacity-50"
                >
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="border border-[#141414] bg-[#141414] p-8 text-[#E4E3E0] shadow-[8px_8px_0_#A09F9C]">
          <h3 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-sky-400">CAPA Workflow Maturity</h3>
          <div className="space-y-6">
            {maturity(actions).map((step) => (
              <div key={step.label}>
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-[9px] font-bold uppercase opacity-60">{step.label}</span>
                  <span className="text-[11px] font-bold">{step.val}%</span>
                </div>
                <div className="h-1.5 bg-white/10">
                  <div className="h-full bg-sky-400 transition-all duration-1000" style={{ width: `${step.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#141414] bg-white p-8 shadow-[8px_8px_0_#141414]">
          <h3 className="mb-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Critical Overdue Alert</h3>
          {overdue ? (
            <div className="border-l-4 border-red-500 py-2 pl-4">
              <p className="text-[12px] font-bold uppercase tracking-tight">{overdue.title}</p>
              <p className="mt-1 text-[10px] italic leading-relaxed opacity-60">{overdue.description ?? "No description captured."}</p>
              <p className="mt-4 text-[9px] font-bold uppercase text-red-500">Owner: {overdue.owner ?? "Unassigned"} / Due {formatDate(overdue.dueDate)}</p>
            </div>
          ) : (
            <div className="border-l-4 border-emerald-500 py-2 pl-4">
              <p className="text-[12px] font-bold uppercase tracking-tight">No overdue actions</p>
              <p className="mt-1 text-[10px] italic leading-relaxed opacity-60">Current action register has no overdue items.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
