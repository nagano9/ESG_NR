import React from "react";
import { AlertCircle, Info, Plus, Save, ShieldCheck, X } from "lucide-react";
import { motion } from "motion/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { createMaterialityAssessment, listMaterialityAssessments, listOrganizations } from "../../lib/api.ts";
import { jvcEntities } from "../../data/ghgData.ts";
import { cn } from "../../lib/utils.ts";
import { useAuth } from "../../lib/AuthContext.tsx";
import type { MaterialityAssessment, MaterialityScore, Organization } from "../../types.ts";

const demoAssessments = [
  { id: 1, orgId: 1, topic: "Climate Change", impactMateriality: "VERY_HIGH", financialMateriality: "VERY_HIGH", period: "FY2025", rationale: "High portfolio exposure to transition risk, GHG disclosure, and lender covenants." },
  { id: 2, orgId: 1, topic: "Energy Security", impactMateriality: "HIGH", financialMateriality: "VERY_HIGH", period: "FY2025", rationale: "Grid reliability and renewable dispatchability affect portfolio revenue quality." },
  { id: 3, orgId: 2, topic: "Labor Practices", impactMateriality: "VERY_HIGH", financialMateriality: "HIGH", period: "FY2025", rationale: "Contractor safety and workforce compliance remain a recurring assurance topic." },
  { id: 4, orgId: 3, topic: "Local Communities", impactMateriality: "VERY_HIGH", financialMateriality: "MEDIUM", period: "FY2025", rationale: "Land access, community benefit, and social license risks require board visibility." },
  { id: 5, orgId: 1, topic: "Anti-Corruption", impactMateriality: "HIGH", financialMateriality: "VERY_HIGH", period: "FY2025", rationale: "SMAP / ISO 37001 controls shape procurement, partnership, and disbursement readiness." },
  { id: 6, orgId: 2, topic: "Water Management", impactMateriality: "MEDIUM", financialMateriality: "LOW", period: "FY2025", rationale: "Asset-level issue with lower portfolio financial exposure." },
] satisfies MaterialityAssessment[];

const materialitySchema = z.object({
  orgId: z.string().min(1, "Organization is required"),
  topic: z.string().min(1, "Topic is required"),
  impactMateriality: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  financialMateriality: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  period: z.string().min(1, "Period is required"),
  rationale: z.string().min(10, "Rationale must be at least 10 characters"),
});

type MaterialityFormData = z.infer<typeof materialitySchema>;

const scoreLabel: Record<MaterialityScore, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  VERY_HIGH: "Very High",
};

function scoreToAxis(score: MaterialityScore) {
  return {
    LOW: 35,
    MEDIUM: 55,
    HIGH: 75,
    VERY_HIGH: 92,
  }[score];
}

function categoryFor(topic: string) {
  const lower = topic.toLowerCase();
  if (lower.includes("climate") || lower.includes("energy") || lower.includes("water") || lower.includes("carbon")) return "Environmental";
  if (lower.includes("labor") || lower.includes("community") || lower.includes("safety")) return "Social";
  return "Governance";
}

function aggregatePriority(assessment: MaterialityAssessment) {
  return scoreToAxis(assessment.impactMateriality) + scoreToAxis(assessment.financialMateriality);
}

export function Materiality() {
  const [assessments, setAssessments] = React.useState<MaterialityAssessment[]>([]);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdding, setIsAdding] = React.useState(false);
  const [usingFallback, setUsingFallback] = React.useState(false);
  const { getToken } = useAuth();

  const form = useForm<MaterialityFormData>({
    resolver: zodResolver(materialitySchema),
    defaultValues: {
      orgId: "1",
      topic: "",
      impactMateriality: "HIGH",
      financialMateriality: "HIGH",
      period: "FY2025",
      rationale: "",
    },
  });

  React.useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      try {
        const [orgs, items] = await Promise.all([listOrganizations(), listMaterialityAssessments()]);
        if (!active) return;
        setOrganizations(orgs);
        setAssessments(items);
        if (orgs[0]) form.setValue("orgId", String(orgs[0].id));
      } catch (error) {
        if (!active) return;
        setUsingFallback(true);
        setAssessments(demoAssessments);
        toast.warning("Using demo materiality matrix", {
          description: "Configure database/API to enable live materiality workflow.",
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

  const priorityTopics = [...assessments].sort((a, b) => aggregatePriority(b) - aggregatePriority(a));
  const criticalTopics = priorityTopics.filter((topic) => aggregatePriority(topic) >= 150);
  const topTopic = priorityTopics[0];

  async function onSubmit(data: MaterialityFormData) {
    try {
      const created = await createMaterialityAssessment({
        orgId: Number(data.orgId),
        topic: data.topic,
        impactMateriality: data.impactMateriality,
        financialMateriality: data.financialMateriality,
        period: data.period,
        rationale: data.rationale,
      }, getToken);
      setAssessments((current) => [created, ...current]);
      setIsAdding(false);
      form.reset();
      toast.success("Materiality assessment saved");
    } catch (error) {
      toast.error("Failed to save assessment", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <div className="space-y-12">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col gap-4 border-b border-[#141414] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-serif italic text-xl font-bold uppercase tracking-tight">Double Materiality Matrix</h2>
          <p className="mt-1 text-[10px] uppercase tracking-widest opacity-60">Portfolio prioritization, stakeholder signal, and disclosure trigger map</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="border border-[#141414] px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-[#141414]/5">
            JV Partner Sync
          </button>
          <button onClick={() => setIsAdding(true)} disabled={usingFallback} className="flex items-center gap-2 bg-[#141414] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] shadow-[4px_4px_0_#A09F9C] transition-opacity hover:opacity-90 disabled:opacity-50">
            <Plus className="h-4 w-4" /> New Assessment
          </button>
        </div>
      </div>

      {usingFallback && (
        <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-[4px_4px_0_#D97706]">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Fallback materiality data is active. Live writes are disabled until backend data is reachable.</p>
        </div>
      )}

      {isAdding && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 border border-[#141414] bg-white p-6 shadow-[8px_8px_0_#10B981] lg:grid-cols-6">
          <select {...form.register("orgId")} className="border-b-2 border-[#141414] py-2 text-[11px] font-bold uppercase outline-none lg:col-span-2">
            {orgOptions.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
          <input {...form.register("topic")} placeholder="Material topic" className="border-b-2 border-[#141414] py-2 text-[11px] font-bold outline-none lg:col-span-2" />
          <input {...form.register("period")} placeholder="FY2025" className="border-b-2 border-[#141414] py-2 text-[11px] font-bold outline-none" />
          <select {...form.register("impactMateriality")} className="border-b-2 border-[#141414] py-2 text-[11px] font-bold uppercase outline-none">
            {Object.entries(scoreLabel).map(([value, label]) => <option key={value} value={value}>{label} impact</option>)}
          </select>
          <select {...form.register("financialMateriality")} className="border-b-2 border-[#141414] py-2 text-[11px] font-bold uppercase outline-none lg:col-span-2">
            {Object.entries(scoreLabel).map(([value, label]) => <option key={value} value={value}>{label} financial</option>)}
          </select>
          <textarea {...form.register("rationale")} placeholder="Assessment rationale and stakeholder evidence basis" className="min-h-24 border-2 border-[#141414] p-3 text-[11px] outline-none lg:col-span-3" />
          <div className="flex gap-3 lg:col-span-1">
            <button type="submit" className="flex flex-1 items-center justify-center gap-2 bg-[#141414] py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0]">
              <Save className="h-4 w-4 text-emerald-400" /> Save
            </button>
            <button type="button" onClick={() => setIsAdding(false)} className="flex items-center justify-center border border-[#141414] px-4">
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="relative flex flex-col border border-[#141414] bg-white p-8 shadow-[8px_8px_0_#141414] md:p-12">
          <div className="absolute left-1/2 top-4 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Impact Materiality</div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Financial Materiality</div>

          <div className="relative aspect-square w-full border-b-2 border-l-2 border-[#141414] bg-[#F9F9F8]">
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="border-b border-r border-[#141414]/10" />
              <div className="border-b border-[#141414]/10" />
              <div className="border-r border-[#141414]/10" />
            </div>

            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest opacity-50">Loading matrix...</div>
            ) : assessments.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest opacity-50">No topics assessed</div>
            ) : assessments.map((topic, index) => {
              const category = categoryFor(topic.topic);
              return (
                <motion.div
                  key={topic.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group absolute z-10 h-4 w-4 -translate-x-1/2 translate-y-1/2 cursor-pointer"
                  style={{ left: `${scoreToAxis(topic.impactMateriality)}%`, bottom: `${scoreToAxis(topic.financialMateriality)}%` }}
                >
                  <div className={cn("h-full w-full border border-[#141414] shadow-[2px_2px_0_#141414]", category === "Environmental" ? "bg-emerald-500" : category === "Social" ? "bg-sky-500" : "bg-violet-500")} />
                  <div className="pointer-events-none absolute left-6 top-1/2 z-20 -translate-y-1/2 whitespace-nowrap bg-[#141414] px-2 py-1 text-[9px] font-bold uppercase tracking-tighter text-[#E4E3E0] opacity-0 transition-opacity group-hover:opacity-100">
                    {topic.topic} / {scoreLabel[topic.impactMateriality]} + {scoreLabel[topic.financialMateriality]}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden border border-[#141414] bg-white shadow-[8px_8px_0_#D4D3D0]">
          <div className="col-header border-b border-[#141414] bg-[#D4D3D0]/30">Portfolio Priority ESG Topics</div>
          <div className="divide-y divide-[#141414]/10">
            {priorityTopics.map((topic) => {
              const org = orgOptions.find((item) => item.id === topic.orgId);
              return (
                <div key={topic.id} className="px-6 py-4 transition-colors hover:bg-[#141414] hover:text-[#E4E3E0]">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-tight">{topic.topic}</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="border border-[#141414]/10 bg-[#141414]/5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest">
                          {org?.name ?? `Org ${topic.orgId}`}
                        </span>
                        <span className="border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-amber-600">
                          Period: {topic.period}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] italic opacity-60">{categoryFor(topic.topic)}</span>
                  </div>
                  <div className="flex gap-6">
                    <ScorePill label="Impact" score={topic.impactMateriality} />
                    <ScorePill label="Financial" score={topic.financialMateriality} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border border-[#141414] bg-[#141414] p-6 text-[#E4E3E0] shadow-[4px_4px_0_#A09F9C]">
        <div className="flex items-start gap-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#E4E3E0]/30">
            <Info className="h-5 w-5 opacity-70" />
          </div>
          <div>
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400">Materiality Summary</h4>
            <p className="max-w-2xl text-[13px] italic leading-relaxed opacity-80">
              {topTopic
                ? `${topTopic.topic} is currently the strongest materiality node. ${criticalTopics.length} topic(s) trigger high-priority disclosure and risk monitoring.`
                : "No materiality topics have been assessed yet. Create an assessment to trigger disclosure prioritization."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-t border-white/10 pt-6 md:grid-cols-3">
          <FactorTile label="Assessment Count" value={String(assessments.length)} />
          <FactorTile label="Critical Topics" value={String(criticalTopics.length)} />
          <FactorTile label="Data Mode" value={usingFallback ? "Demo" : "Live API"} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="border border-[#141414] bg-white p-8 shadow-[8px_8px_0_#141414]">
          <h3 className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Mandatory Framework Triggered
          </h3>
          <div className="space-y-6">
            {[
              { framework: "GRI 305-1", disclosure: "Direct GHG", status: criticalTopics.some((item) => item.topic.toLowerCase().includes("climate")) ? "Ready" : "Review", data: "100%" },
              { framework: "TCFD Metrics", disclosure: "Scope 3 Portfolio", status: criticalTopics.length > 0 ? "Gap" : "Review", data: "42%" },
              { framework: "POJK 51-C", disclosure: "Social Program Impact", status: criticalTopics.some((item) => categoryFor(item.topic) === "Social") ? "Ready" : "Review", data: "95%" },
              { framework: "IFC PS1", disclosure: "ESMS Management", status: "Audit", data: "88%" },
            ].map((rule) => (
              <div key={rule.framework} className="flex items-center justify-between border-b border-[#141414]/5 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-tight">{rule.framework}</span>
                  <p className="text-[9px] italic opacity-60">{rule.disclosure}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold">{rule.data}</span>
                    <div className="h-1 w-12 bg-[#141414]/5">
                      <div className={cn("h-full", parseInt(rule.data) > 80 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: rule.data }} />
                    </div>
                  </div>
                  <span className={cn("border px-2 py-0.5 text-[8px] font-bold uppercase", rule.status === "Ready" ? "border-emerald-500/30 text-emerald-500" : rule.status === "Gap" ? "border-red-500/30 text-red-500" : "border-sky-500/30 text-sky-500")}>
                    {rule.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between bg-[#141414] p-8 text-[#E4E3E0] shadow-[8px_8px_0_#A09F9C]">
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-emerald-400">Strategic Capital Allocation</h3>
            <p className="mb-8 font-serif text-[13px] italic leading-relaxed opacity-80">
              {topTopic
                ? `Prioritize mitigation spend against ${topTopic.topic}. The current matrix places this topic in the highest combined impact and financial materiality band.`
                : "Capital allocation recommendations will activate once a materiality assessment is available."}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FactorTile label="Carbon ROI" value="18.4%" compact />
              <FactorTile label="ESG Risk Offset" value="-1.2M" compact />
            </div>
          </div>
          <button className="mt-8 w-full bg-emerald-500 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#141414] transition-colors hover:bg-emerald-400">
            Approve Allocation Draft
          </button>
        </div>
      </div>
    </div>
  );
}

function ScorePill({ label, score }: { label: string; score: MaterialityScore }) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] font-bold uppercase opacity-40">{label}</span>
      <span className="data-value">{scoreLabel[score]}</span>
    </div>
  );
}

function FactorTile({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={cn("border border-white/10 bg-white/5 p-4", compact && "bg-white/5")}>
      <span className="mb-1 block text-[8px] font-bold uppercase opacity-60">{label}</span>
      <span className="font-mono text-[10px] text-emerald-400">{value}</span>
    </div>
  );
}
