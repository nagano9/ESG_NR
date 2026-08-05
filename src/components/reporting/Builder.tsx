import React from "react";
import { Sparkles, FileText, CheckCircle2, AlertCircle, Globe, Download, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils.ts";
import * as XLSX from 'xlsx';

const frameworks = [
  { id: "gri", name: "GRI (Global Reporting Initiative)", progress: 65, status: "In Progress" },
  { id: "tcfd", name: "TCFD / IFRS S2 Climate", progress: 82, status: "Review" },
  { id: "pojk51", name: "POJK 51/2017 Indonesia", progress: 40, status: "In Progress" },
  { id: "gresb", name: "GRESB Infrastructure", progress: 0, status: "Not Started" },
];

const disclosures = [
  { code: "305-1", title: "Direct (Scope 1) GHG Emissions", status: "Complete", data: "12,450 tCO2e", reviewer: "Budi Santoso", reviewDate: "2024-10-25" },
  { code: "305-2", title: "Energy indirect (Scope 2) GHG Emissions", status: "Complete", data: "32,780 tCO2e", reviewer: "Siska Wijaya", reviewDate: "2024-10-26" },
  { code: "305-3", title: "Other indirect (Scope 3) GHG Emissions", status: "Incomplete", data: null, reviewer: null, reviewDate: null },
];

export function Builder() {
  const [selectedFramework, setSelectedFramework] = React.useState(frameworks[0]);
  const [isDrafting, setIsDrafting] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiDraft, setAiDraft] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<{ [key: string]: string } | null>(null);

  const handleDraft = async () => {
    setIsDrafting(true);
    setAnalysis(null);
    setTimeout(() => {
      setAiDraft("Based on the 2024 GHG inventory, the holding company achieved a 12% reduction in Scope 2 emissions across the portfolio, primarily driven by energy efficiency measures at Solar Park A. This aligns with our commitment to TCFD Metrics and Targets...");
      setIsDrafting(false);
    }, 2000);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAiDraft(null);
    setTimeout(() => {
      setAnalysis({
        "305-1": "Missing direct emission conversion factor documentation for Solar_A back-up generators.",
        "305-2": "Fully compliant with GRI 2016 standard. Suggest mapping to POJK 51 Section C.2.",
        "305-3": "CRITICAL GAP: Upstream leased assets data missing for Q3-Q4 FY2024."
      });
      setIsAnalyzing(false);
    }, 2500);
  };

  const handleExport = () => {
    const data = disclosures.map(d => ({
      'Disclosure Code': `GRI ${d.code}`,
      'Title': d.title,
      'Status': d.status,
      'Value': d.data || 'N/A',
      'Asset Mapping': d.data ? 'Solar Park A' : 'Pending',
      'Consolidation Method': d.data ? 'Equity Share' : 'N/A',
      'Reporting Year': '2024',
      'Compliance Standard': selectedFramework.name,
      'Reviewer': d.reviewer || 'N/A',
      'Review Date': d.reviewDate || 'N/A',
      'Audit Hash': d.data ? `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}` : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PLN NR Sustainability Report");
    
    // Set column widths
    const wscols = [
      {wch: 15}, {wch: 40}, {wch: 15}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 15}, {wch: 30}, {wch: 20}, {wch: 20}, {wch: 15}
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `PLN_NR_ESG_Report_${selectedFramework.id}_2024.xlsx`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
      {/* Sidebar: Frameworks & Integrity */}
      <div className="lg:col-span-1 space-y-8">
        <div className="flex flex-col border border-[#141414] bg-white overflow-hidden shadow-[4px_4px_0px_0px_#D4D3D0]">
          <div className="col-header bg-[#D4D3D0]/30 border-b border-[#141414]">Standard Frameworks</div>
          <div className="divide-y divide-[#141414]/10">
            {frameworks.map((fw) => (
              <button
                key={fw.id}
                onClick={() => setSelectedFramework(fw)}
                className={cn(
                  "w-full text-left p-6 transition-all group",
                  selectedFramework.id === fw.id 
                    ? "bg-[#141414] text-[#E4E3E0]" 
                    : "hover:bg-[#141414]/5"
                )}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest",
                    selectedFramework.id === fw.id ? "text-[#E4E3E0]/60" : "text-[#141414]/40"
                  )}>{fw.status}</span>
                  <span className={cn(
                    "text-[9px] font-bold",
                    selectedFramework.id === fw.id ? "text-emerald-400" : "text-emerald-600"
                  )}>{fw.progress}%</span>
                </div>
                <h4 className="text-[11px] font-bold uppercase tracking-tight leading-tight group-hover:underline">{fw.name}</h4>
                <div className="mt-3 h-0.5 bg-[#141414]/10 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-500", selectedFramework.id === fw.id ? "bg-emerald-400" : "bg-emerald-600")} 
                    style={{ width: `${fw.progress}%` }} 
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#141414] text-white p-8 shadow-[8px_8px_0px_0px_#10B981]">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-6">Assurance Status</h4>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[9px] font-bold uppercase mb-2">
                <span>Data Veracity</span>
                <span>High</span>
              </div>
              <div className="h-1 bg-white/10 w-full">
                <div className="h-full bg-emerald-500 w-[92%]" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase">Ready for Limited Assurance</span>
            </div>
            <p className="text-[10px] italic opacity-60 leading-relaxed">
              External auditor access (PwC/Deloitte) tokens have been refreshed for FY24.
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_#D4D3D0]">
          <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-6 border-b border-[#141414]/10 pb-2">Regulatory Roadmap</h4>
          <div className="space-y-4">
            {[
              { date: "DEC 31", label: "POJK 51 FY24 Submission", status: "Critical" },
              { date: "MAR 15", label: "ISSB S2 Climate Risk", status: "Upcoming" },
              { date: "JUN 01", label: "GRI 2024 Alignment", status: "Planned" },
            ].map((milestone, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-[9px] font-black opacity-20 shrink-0">{milestone.date}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-tight">{milestone.label}</span>
                  <span className={cn(
                    "text-[7px] font-bold uppercase",
                    milestone.status === "Critical" ? "text-red-500" : "text-sky-500"
                  )}>{milestone.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="lg:col-span-3 flex flex-col border border-[#141414] bg-white overflow-hidden shadow-[8px_8px_0px_0px_#141414]">
        <div className="p-6 border-b border-[#141414] flex items-center justify-between bg-[#F9F9F8]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-[#141414] flex items-center justify-center">
              <FileText className="text-[#141414] w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight">{selectedFramework.name}</h3>
              <p className="text-[10px] italic opacity-60 uppercase tracking-widest">Drafting Environment • FY2024</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-6 py-2.5 border border-[#141414] text-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/5 disabled:opacity-50 transition-all shadow-[4px_4px_0px_0px_#D4D3D0]"
            >
              <AlertCircle className={cn("w-3.5 h-3.5", isAnalyzing ? "animate-pulse" : "")} /> 
              {isAnalyzing ? "Analyzing..." : "Gap Analysis"}
            </button>
            <button 
              onClick={handleDraft}
              disabled={isDrafting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-[4px_4px_0px_0px_#A09F9C]"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> 
              {isDrafting ? "Drafting..." : "AI Narrate"}
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-2.5 border border-[#141414] text-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 space-y-12">
          {/* Disclosure List */}
          <div className="space-y-6">
            <span className="col-header p-0 border-0 mb-4 block">Target Disclosures</span>
            {disclosures.map((item, i) => (
              <div key={item.code} className="group border border-[#141414]/10 hover:border-[#141414] transition-colors">
                <div className="flex items-start justify-between p-4 bg-white">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="framework-tag">GRI {item.code}</span>
                      {item.status === "Complete" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                    <h4 className="text-[11px] font-bold uppercase tracking-tight leading-tight group-hover:underline">{item.title}</h4>
                    {item.reviewer && (
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-40 mt-1 block">
                        Reviewed by {item.reviewer} on {item.reviewDate}
                      </span>
                    )}
                  </div>
                  <button className="p-2 border border-transparent hover:border-[#141414] transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {analysis && analysis[item.code] && (
                  <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 text-[10px] italic text-amber-900 leading-relaxed shadow-[2px_2px_0px_0px_#D97706]">
                    <span className="font-bold uppercase not-italic block mb-1">Consultant Finding:</span>
                    "{analysis[item.code]}"
                  </div>
                )}

                {item.data ? (
                  <div className="bg-[#F9F9F8] p-4 border-t border-[#141414]/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="data-value text-lg">{item.data}</div>
                      <div className="text-[9px] italic opacity-40 uppercase tracking-widest leading-tight">Mapped from<br />Inventory Engine</div>
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40">Immutable Hash: 0x42A...</span>
                  </div>
                ) : (
                  <div className="p-4 bg-[#F9F9F8] border-t border-[#141414]/10 italic text-[10px] opacity-40">
                    No data mapped. Link source data to enable AI drafting.
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AI Suggested Narrative */}
          {aiDraft && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] shadow-[8px_8px_0px_0px_#A09F9C] relative"
            >
              <div className="flex items-center gap-2 mb-6 border-b border-[#E4E3E0]/10 pb-4">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Intelligent Narrative Suggestion</span>
              </div>
              <p className="audit-font italic opacity-90 leading-relaxed text-sm">
                "{aiDraft}"
              </p>
              <div className="mt-8 flex gap-4">
                <button className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border border-[#E4E3E0]/30 hover:bg-[#E4E3E0]/10 transition-colors">
                  Modify Input
                </button>
                <button className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-[#141414] hover:bg-emerald-400 transition-colors">
                  Adopt into Report
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
