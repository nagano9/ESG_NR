import React from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Download, FileText, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import * as XLSX from "xlsx";
import { draftNarrative, listDataPoints, listRequirements, runGapAnalysis } from "../../lib/api.ts";
import { useAuth } from "../../lib/AuthContext.tsx";
import { cn } from "../../lib/utils.ts";

const frameworks = [
  { id: "gri", name: "GRI (Global Reporting Initiative)", progress: 65, status: "In Progress" },
  { id: "tcfd", name: "TCFD / IFRS S2 Climate", progress: 82, status: "Review" },
  { id: "pojk51", name: "POJK 51/2017 Indonesia", progress: 40, status: "In Progress" },
  { id: "gresb", name: "GRESB Infrastructure", progress: 0, status: "Not Started" },
];

const fallbackDisclosures = [
  { code: "305-1", title: "Direct (Scope 1) GHG Emissions", status: "Complete", data: "12,450 tCO2e", reviewer: "Budi Santoso", reviewDate: "2024-10-25" },
  { code: "305-2", title: "Energy indirect (Scope 2) GHG Emissions", status: "Complete", data: "32,780 tCO2e", reviewer: "Siska Wijaya", reviewDate: "2024-10-26" },
  { code: "305-3", title: "Other indirect (Scope 3) GHG Emissions", status: "Incomplete", data: null, reviewer: null, reviewDate: null },
];

export function Builder() {
  const [selectedFramework, setSelectedFramework] = React.useState(frameworks[0]);
  const [isDrafting, setIsDrafting] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiDraft, setAiDraft] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<Record<string, string>>({});
  const [apiDisclosures, setApiDisclosures] = React.useState(fallbackDisclosures);
  const { getToken } = useAuth();

  React.useEffect(() => {
    let active = true;
    async function loadRequirements() {
      try {
        const requirements = await listRequirements();
        if (!active || requirements.length === 0) return;
        setApiDisclosures(requirements.map((requirement) => ({
          code: requirement.code,
          title: requirement.title,
          status: "Ready",
          data: null,
          reviewer: null,
          reviewDate: null,
        })));
      } catch {
        setApiDisclosures(fallbackDisclosures);
      }
    }
    loadRequirements();
    return () => {
      active = false;
    };
  }, []);

  async function handleDraft() {
    setIsDrafting(true);
    setAnalysis({});
    try {
      const currentData = await listDataPoints();
      const result = await draftNarrative(currentData.length > 0 ? currentData : apiDisclosures, selectedFramework.name, getToken);
      setAiDraft(result.narrative);
    } catch (error) {
      console.error("AI draft failed, using local fallback", error);
      setAiDraft("Based on the available ESG inventory, the report should disclose verified values separately from estimates, cite the source data point for each quantitative claim, and highlight missing evidence before external assurance.");
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setAiDraft(null);
    try {
      const [currentData, requirements] = await Promise.all([listDataPoints(), listRequirements()]);
      const findings = await runGapAnalysis(currentData, requirements.length > 0 ? requirements : apiDisclosures, getToken);
      setAnalysis(Object.fromEntries(findings.map((finding) => [
        finding.requirementCode.replace(/^GRI\s+/i, ""),
        `${finding.status}: ${finding.gapDescription} Suggested action: ${finding.suggestedAction}`,
      ])));
    } catch (error) {
      console.error("Gap analysis failed, using local fallback", error);
      setAnalysis({
        "305-1": "Evidence package should include conversion factor documentation.",
        "305-2": "Scope 2 data should be mapped to POJK 51 and IFRS S2 climate metrics.",
        "305-3": "Critical gap: Scope 3 supporting data remains incomplete.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleExport() {
    const data = apiDisclosures.map((disclosure) => ({
      "Disclosure Code": `${selectedFramework.id.toUpperCase()} ${disclosure.code}`,
      Title: disclosure.title,
      Status: disclosure.status,
      Value: disclosure.data || "N/A",
      "Compliance Standard": selectedFramework.name,
      Reviewer: disclosure.reviewer || "N/A",
      "Review Date": disclosure.reviewDate || "N/A",
      "Audit Hash": disclosure.data ? `ESG-${selectedFramework.id.toUpperCase()}-${disclosure.code.replace(/[^0-9A-Z]/gi, "")}-2024` : "N/A",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Disclosure Register");
    ws["!cols"] = [{ wch: 18 }, { wch: 42 }, { wch: 14 }, { wch: 18 }, { wch: 34 }, { wch: 20 }, { wch: 16 }, { wch: 24 }];
    XLSX.writeFile(wb, `AIPulse_ESG_${selectedFramework.id}_report.xlsx`);
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
      <aside className="space-y-8">
        <div className="border border-[#141414] bg-white shadow-[4px_4px_0_#D4D3D0]">
          <div className="col-header bg-[#D4D3D0]/30">Standard Frameworks</div>
          {frameworks.map((framework) => (
            <button key={framework.id} onClick={() => setSelectedFramework(framework)} className={cn("w-full border-b border-[#141414]/10 p-5 text-left", selectedFramework.id === framework.id && "bg-[#141414] text-[#E4E3E0]")}>
              <div className="mb-2 flex justify-between text-[9px] font-bold uppercase tracking-widest opacity-60">
                <span>{framework.status}</span>
                <span>{framework.progress}%</span>
              </div>
              <h4 className="text-[11px] font-bold uppercase tracking-tight">{framework.name}</h4>
              <div className="mt-3 h-1 bg-[#141414]/10">
                <div className="h-full bg-emerald-500" style={{ width: `${framework.progress}%` }} />
              </div>
            </button>
          ))}
        </div>

        <div className="bg-[#141414] p-6 text-[#E4E3E0] shadow-[8px_8px_0_#10B981]">
          <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-emerald-400">Assurance Readiness</h4>
          <p className="text-[11px] italic leading-relaxed opacity-70">AI output is treated as draft narrative. Numbers must remain traceable to approved data points and evidence.</p>
        </div>
      </aside>

      <section className="lg:col-span-3">
        <div className="border border-[#141414] bg-white shadow-[8px_8px_0_#141414]">
          <header className="flex flex-col gap-4 border-b border-[#141414] bg-[#F9F9F8] p-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center border border-[#141414]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-tight">{selectedFramework.name}</h3>
                <p className="text-[10px] uppercase tracking-widest opacity-60">Disclosure drafting and gap analysis workspace</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleAnalyze} disabled={isAnalyzing} className="flex items-center gap-2 border border-[#141414] px-5 py-3 text-[10px] font-bold uppercase tracking-widest">
                <AlertCircle className={cn("h-4 w-4", isAnalyzing && "animate-pulse")} /> {isAnalyzing ? "Analyzing..." : "Gap Analysis"}
              </button>
              <button onClick={handleDraft} disabled={isDrafting} className="flex items-center gap-2 bg-[#141414] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0]">
                <Sparkles className="h-4 w-4 text-emerald-400" /> {isDrafting ? "Drafting..." : "AI Narrate"}
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 border border-[#141414] px-5 py-3 text-[10px] font-bold uppercase tracking-widest">
                <Download className="h-4 w-4" /> Export Excel
              </button>
            </div>
          </header>

          <div className="space-y-6 p-8">
            <span className="col-header block border-0 p-0">Target Disclosures</span>
            {apiDisclosures.map((item) => (
              <div key={item.code} className="border border-[#141414]/10">
                <div className="flex items-start justify-between p-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="framework-tag">{item.code}</span>
                      {item.status === "Complete" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                    <h4 className="text-[11px] font-bold uppercase tracking-tight">{item.title}</h4>
                    <p className="mt-1 text-[8px] font-bold uppercase tracking-widest opacity-40">Reviewer: {item.reviewer ?? "Pending"}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-40" />
                </div>
                {analysis[item.code] && (
                  <div className="mx-4 mb-4 border border-amber-200 bg-amber-50 p-3 text-[10px] italic text-amber-900 shadow-[2px_2px_0_#D97706]">
                    <span className="mb-1 block font-bold uppercase not-italic">Consultant Finding</span>
                    {analysis[item.code]}
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[#141414]/10 bg-[#F9F9F8] p-4">
                  <span className="data-value">{item.data ?? "No mapped value"}</span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40">{item.data ? "Evidence mapped" : "Needs source data"}</span>
                </div>
              </div>
            ))}

            {aiDraft && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-[#141414] p-8 text-[#E4E3E0] shadow-[8px_8px_0_#A09F9C]">
                <div className="mb-5 flex items-center gap-2 border-b border-white/10 pb-4">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">AI Narrative Suggestion</span>
                </div>
                <p className="audit-font text-sm italic leading-relaxed opacity-90">{aiDraft}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
