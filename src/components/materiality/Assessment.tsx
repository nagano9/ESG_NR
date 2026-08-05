import React from "react";
import { Plus, Info, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils.ts";

const topics = [
  { name: "Climate Change", impact: 90, financial: 90, category: "Environmental", stakeholderValid: "Verified", linkedAction: "ACT-001", partnerAlign: "High" },
  { name: "Energy Security", impact: 70, financial: 80, category: "Environmental", stakeholderValid: "Verified", linkedAction: "ACT-002", partnerAlign: "High" },
  { name: "Labor Practices", impact: 80, financial: 60, category: "Social", stakeholderValid: "Pending", linkedAction: "ACT-005", partnerAlign: "Med" },
  { name: "Local Communities", impact: 90, financial: 50, category: "Social", stakeholderValid: "Verified", linkedAction: "ACT-009", partnerAlign: "High" },
  { name: "Anti-Corruption", impact: 60, financial: 90, category: "Governance", stakeholderValid: "Verified", linkedAction: "ACT-012", partnerAlign: "High" },
  { name: "Water Management", impact: 50, financial: 40, category: "Environmental", stakeholderValid: "In Review", linkedAction: "ACT-015", partnerAlign: "Low" },
];

export function Materiality() {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-[#141414] pb-6">
        <div>
          <h2 className="font-serif italic text-xl font-bold tracking-tight uppercase">Double Materiality Matrix</h2>
          <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">PLN NR Portfolio Prioritization</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest border border-[#141414] hover:bg-[#141414]/5 transition-all">
            JV Partner Sync
          </button>
          <button className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] bg-[#141414] hover:opacity-90 transition-opacity shadow-[4px_4px_0px_0px_#A09F9C]">
            <Plus className="w-4 h-4" /> New Assessment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Matrix Visualization */}
        <div className="flex flex-col border border-[#141414] bg-white p-12 shadow-[8px_8px_0px_0px_#141414] relative">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Impact Materiality</div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Financial Materiality</div>
          
          <div className="aspect-square w-full border-l-2 border-b-2 border-[#141414] relative bg-[#F9F9F8]">
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="border-r border-b border-[#141414]/10" />
              <div className="border-b border-[#141414]/10" />
              <div className="border-r border-[#141414]/10" />
            </div>
            
            {topics.map((topic, i) => (
              <motion.div
                key={topic.name}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="absolute w-4 h-4 -translate-x-1/2 translate-y-1/2 group cursor-pointer z-10"
                style={{ left: `${topic.impact}%`, bottom: `${topic.financial}%` }}
              >
                <div className={cn(
                  "w-full h-full border border-[#141414] shadow-[2px_2px_0px_0px_#141414]",
                  topic.category === "Environmental" ? "bg-emerald-500" :
                  topic.category === "Social" ? "bg-sky-500" : "bg-purple-500"
                )} />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#141414] text-[#E4E3E0] text-[9px] font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 uppercase tracking-tighter">
                  {topic.name} (Align: {topic.partnerAlign})
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Priority Topics List */}
        <div className="flex flex-col border border-[#141414] bg-white overflow-hidden shadow-[8px_8px_0px_0px_#D4D3D0]">
          <div className="col-header bg-[#D4D3D0]/30 border-b border-[#141414]">Portfolio Priority ESG Topics</div>
          <div className="divide-y divide-[#141414]/10">
            {topics.sort((a, b) => (b.impact + b.financial) - (a.impact + a.financial)).map((topic) => (
              <div key={topic.name} className="px-6 py-4 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-[11px] uppercase tracking-tight">{topic.name}</span>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-[#141414]/5 group-hover:bg-white/10 group-hover:text-white border border-[#141414]/10 group-hover:border-white/20">
                        {topic.stakeholderValid}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-amber-500/10 text-amber-600 group-hover:text-amber-300 border border-amber-500/20">
                        Partner Sync: {topic.partnerAlign}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] italic opacity-60 group-hover:text-[#E4E3E0]/60">{topic.category}</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold opacity-40 group-hover:opacity-60">Impact</span>
                    <span className="data-value">{topic.impact / 10}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold opacity-40 group-hover:opacity-60">Financial</span>
                    <span className="data-value">{topic.financial / 10}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#141414] text-[#E4E3E0] p-6 border border-[#141414] shadow-[4px_4px_0px_0px_#A09F9C] flex flex-col gap-6">
        <div className="flex items-start gap-6">
          <div className="w-10 h-10 border border-[#E4E3E0]/30 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 opacity-70" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">AI Summary Analysis</h4>
            <p className="text-[13px] italic opacity-80 leading-relaxed max-w-2xl">
              "Based on the double materiality assessment, 'Climate Change' and 'Labor Practices' emerge as the most critical topics for the FY2024 cycle. 
              These priority nodes trigger 14 mandatory disclosures across GRI, TCFD, and POJK 51 frameworks. Recommend immediate alignment check on JVC Scope 3 reporting."
            </p>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-6">
          <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 mb-4">Centralized Factor Engine (Audit Log)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 p-4 border border-white/10">
              <span className="text-[8px] font-bold uppercase opacity-60 block mb-1">GWP Standard</span>
              <span className="text-[10px] font-mono text-emerald-400">IPCC AR6 (100-Year)</span>
            </div>
            <div className="bg-white/5 p-4 border border-white/10">
              <span className="text-[8px] font-bold uppercase opacity-60 block mb-1">Grid Methodology</span>
              <span className="text-[10px] font-mono text-emerald-400">Jamali GEF 2023 (0.87)</span>
            </div>
            <div className="bg-white/5 p-4 border border-white/10">
              <span className="text-[8px] font-bold uppercase opacity-60 block mb-1">Audit Trail</span>
              <span className="text-[10px] font-mono text-emerald-400">Verified (PwC-NR-002)</span>
            </div>
          </div>
        </div>
      </div>
      {/* Disclosure Roadmap Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_#141414]">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Mandatory Framework Triggered
          </h3>
          <div className="space-y-6">
            {[
              { framework: "GRI 305-1", disclosure: "Direct GHG", status: "Ready", data: "100%" },
              { framework: "TCFD Metrics", disclosure: "Scope 3 Portfolio", status: "Gap", data: "42%" },
              { framework: "POJK 51-C", disclosure: "Social Program Impact", status: "Ready", data: "95%" },
              { framework: "IFC PS1", disclosure: "ESMS Management", status: "Audit", data: "88%" },
            ].map((rule, i) => (
              <div key={i} className="flex items-center justify-between border-b border-[#141414]/5 pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-tight">{rule.framework}</span>
                  <span className="text-[9px] opacity-60 italic">{rule.disclosure}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold">{rule.data}</span>
                    <div className="w-12 h-1 bg-[#141414]/5">
                      <div 
                        className={cn("h-full", parseInt(rule.data) > 80 ? "bg-emerald-500" : "bg-amber-500")} 
                        style={{ width: rule.data }} 
                      />
                    </div>
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold uppercase px-2 py-0.5 border",
                    rule.status === "Ready" ? "border-emerald-500/30 text-emerald-500" :
                    rule.status === "Gap" ? "border-red-500/30 text-red-500" : "border-sky-500/30 text-sky-500"
                  )}>
                    {rule.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#141414] text-[#E4E3E0] p-8 shadow-[8px_8px_0px_0px_#A09F9C] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-6">Strategic Capital Allocation</h3>
            <p className="text-[13px] italic opacity-80 leading-relaxed font-serif mb-8">
              "Based on the high impact of 'Grid Dependency' in the materiality matrix, we recommend reallocating $2.4M from the 2026 Opex budget to the BESS (Battery Energy Storage System) pilot project. This shift satisfies both Decarbonization (E) and Supply Chain Reliability (G) materiality nodes."
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-white/10 bg-white/5">
                <span className="text-[8px] font-bold uppercase opacity-40 block mb-1">Carbon ROI</span>
                <span className="text-lg font-bold">18.4%</span>
              </div>
              <div className="p-4 border border-white/10 bg-white/5">
                <span className="text-[8px] font-bold uppercase opacity-40 block mb-1">ESG Risk Offset</span>
                <span className="text-lg font-bold">-$1.2M</span>
              </div>
            </div>
          </div>
          <button className="w-full mt-8 bg-emerald-500 text-[#141414] text-[10px] font-black py-4 uppercase tracking-[0.2em] hover:bg-emerald-400 transition-colors">
            Approve Allocation Draft
          </button>
        </div>
      </div>
    </div>
  );
}
