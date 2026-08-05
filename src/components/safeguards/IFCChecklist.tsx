import React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils.ts";

const psStandards = [
  { id: 1, title: "PS1: Assessment and Management of E&S Risks", status: "Compliant", lender: "ADB", gap: "None. ESMS fully operational." },
  { id: 2, title: "PS2: Labor and Working Conditions", status: "Attention Required", lender: "World Bank", gap: "Contractor EHS monitoring lacks real-time reporting at Wind_B." },
  { id: 3, title: "PS3: Resource Efficiency and Pollution Prevention", status: "Compliant", lender: "ADB", gap: "SF6 leakage monitoring improved." },
  { id: 4, title: "PS4: Community Health, Safety, and Security", status: "Compliant", lender: "NEXI", gap: "Emergency Response Plan (ERP) synced with local authorities." },
  { id: 5, title: "PS5: Land Acquisition and Involuntary Resettlement", status: "Attention Required", lender: "ADB", gap: "Livelihood Restoration Plan (LRP) implementation audit due Q3." },
  { id: 6, title: "PS6: Biodiversity Conservation", status: "Compliant", lender: "NEXI", gap: "Critical Habitat Assessment (CHA) verified for Hydro_C." },
];

export function IFCChecklist() {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-[#141414] pb-6">
        <div>
          <h2 className="font-serif italic text-xl font-bold tracking-tight uppercase">IFC Performance Standards</h2>
          <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Lender Alignment & Social Safeguard Maturity</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[8px] uppercase font-bold opacity-40">Portfolio Risk</span>
            <span className="text-xl font-bold tracking-tighter uppercase">Category B</span>
          </div>
          <div className="w-[1px] bg-[#141414] h-10" />
          <div className="flex flex-col items-end">
            <span className="text-[8px] uppercase font-bold opacity-40">Lender Score</span>
            <span className="text-xl font-bold tracking-tighter text-emerald-600">92.4%</span>
          </div>
        </div>
      </div>

      {/* Strategic Enrichment: Social Safeguard Health */}
      <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-4 shadow-[4px_4px_0px_0px_#D97706]">
        <div className="p-2 bg-amber-500 text-white">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-tight text-amber-900 mb-1">Critical Safeguard Warning</h4>
          <p className="text-[10px] italic text-amber-800 leading-relaxed">
            "PS5 (Land Acquisition) at **Hydro Power C** requires urgent LRP documentation for the 2024 ADB audit. Financial disbursement for Tranche 2 is contingent on this evidence."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {psStandards.map((ps) => (
          <div key={ps.id} className="flex flex-col border border-[#141414] bg-white shadow-[4px_4px_0px_0px_#D4D3D0] hover:shadow-[4px_4px_0px_0px_#141414] transition-all group cursor-pointer">
            <div className="p-6 border-b border-[#141414] bg-[#F9F9F8]">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-[#141414] text-[#E4E3E0]">PS {ps.id}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 border border-[#141414]/20 opacity-60">{ps.lender}</span>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  ps.status === "Compliant" ? "bg-emerald-500" : 
                  ps.status === "Attention Required" ? "bg-amber-500" : "bg-slate-300"
                )} />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-tight leading-tight group-hover:underline">{ps.title}</h3>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="bg-slate-50 border-l-2 border-[#141414] p-3 mb-6">
                <span className="text-[8px] font-bold uppercase opacity-60 block mb-1">Gap Analysis</span>
                <p className="text-[10px] italic opacity-80 leading-relaxed font-serif">
                  "{ps.gap}"
                </p>
              </div>
              
              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[8px] uppercase font-bold opacity-40">Status</span>
                  <span className="text-[10px] font-bold uppercase">{ps.status}</span>
                </div>
                <div className="h-1 bg-[#141414]/10 rounded-full overflow-hidden">
                  <div className={cn(
                    "h-full transition-all",
                    ps.status === "Compliant" ? "bg-emerald-500 w-[100%]" : 
                    ps.status === "Attention Required" ? "bg-amber-500 w-[70%]" : "bg-slate-300 w-[0%]"
                  )} />
                </div>
                <button className="w-full py-2.5 border border-[#141414] text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all">
                  Upload Evidence
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-[#141414] bg-white overflow-hidden shadow-[8px_8px_0px_0px_#141414]">
        <div className="col-header bg-[#D4D3D0]/30 border-b border-[#141414] flex justify-between items-center">
          <span>Global Evidence Vault (Audit Ready)</span>
          <span className="text-[9px] opacity-40">Reasonable Assurance Level</span>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { name: "Environmental Management Plan 2024", type: "PDF", hash: "0x882A...B2", date: "Oct 12" },
            { name: "Land Acquisition Agreement v2.1", type: "PDF", hash: "0x12F3...E8", date: "Sep 05" },
            { name: "OHS Training Records - Wind B", type: "XLSX", hash: "0x9911...C3", date: "Nov 01" },
            { name: "Grid Emission Factor Methodology", type: "PDF", hash: "0xAA21...D9", date: "Aug 22" },
          ].map((doc, i) => (
            <div key={i} className="group border border-[#141414]/10 p-4 hover:bg-[#141414] hover:text-white transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="w-8 h-8 border border-[#141414]/20 flex items-center justify-center text-[10px] font-bold group-hover:border-white/20">
                  {doc.type}
                </div>
                <span className="text-[8px] opacity-40 group-hover:text-white/40 italic">{doc.date}</span>
              </div>
              <h5 className="text-[10px] font-bold uppercase tracking-tight mb-2 truncate">{doc.name}</h5>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[8px] font-mono opacity-40 group-hover:text-white/40">{doc.hash}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
