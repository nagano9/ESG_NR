import React from "react";
import { Plus, Filter, User, Calendar, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils.ts";

const actions = [
  { id: 1, title: "K3 Site Inspection & LTIFR Audit", owner: "Safety Officer", due: "2025-02-15", status: "OPEN", priority: "HIGH", category: "K3 / SAFETY", asset: "PT SGPJB" },
  { id: 2, title: "SMAP ISO 37001 Surveillance Audit", owner: "Compliance Head", due: "2025-03-01", status: "IN_PROGRESS", priority: "MEDIUM", category: "SMAP / GOV", asset: "PT PMSE" },
  { id: 3, title: "Update Land Utilization Agreement (LUA)", owner: "Legal Lead", due: "2025-01-30", status: "OVERDUE", priority: "CRITICAL", category: "TJSL / SOCIAL", asset: "PT NGKI" },
  { id: 4, title: "Financing Document Submission", owner: "Finance Director", due: "2025-04-15", status: "OPEN", priority: "HIGH", category: "FINANCE", asset: "PT NTBE" },
];

export function Tracker() {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-[#141414] pb-6">
        <div>
          <h2 className="font-serif italic text-xl font-bold tracking-tight uppercase">Safeguard Action Tracker</h2>
          <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">E&S Compliance, K3 Safety & SMAP Corrective Measures</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#141414] border border-[#141414] hover:bg-[#141414]/5 transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] bg-[#141414] hover:opacity-90 transition-opacity shadow-[4px_4px_0px_0px_#A09F9C]">
            <Plus className="w-4 h-4" /> Log New Action
          </button>
        </div>
      </div>

      <div className="flex flex-col border border-[#141414] bg-white overflow-hidden shadow-[8px_8px_0px_0px_#141414]">
        <div className="grid grid-cols-7 bg-[#D4D3D0]/30 border-b border-[#141414]">
          <div className="col-header col-span-2">Action Item</div>
          <div className="col-header">Category</div>
          <div className="col-header">Owner</div>
          <div className="col-header">Priority</div>
          <div className="col-header">Due Date</div>
          <div className="col-header">Status</div>
        </div>
        
        <div className="divide-y divide-[#141414]/10">
          {actions.map((action) => (
            <div key={action.id} className="grid grid-cols-7 px-4 py-6 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group cursor-pointer items-center">
              <div className="flex flex-col col-span-2">
                <span className="font-bold text-[11px] uppercase tracking-tight leading-tight group-hover:underline">{action.title}</span>
                <span className="text-[9px] opacity-60 italic group-hover:text-[#E4E3E0]/60 transition-colors mt-1">Asset: {action.asset}</span>
              </div>
              <div>
                <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 border border-[#141414]/20 group-hover:border-white/20">
                  {action.category}
                </span>
              </div>
              <div className="text-[11px] font-medium italic opacity-80">{action.owner}</div>
              <div className="flex">
                <span className={cn(
                  "text-[9px] font-bold px-2 py-0.5 border uppercase",
                  action.priority === "CRITICAL" ? "border-red-500 text-red-500 bg-red-500/10" : 
                  "border-[#141414]/20 group-hover:border-[#E4E3E0]/20"
                )}>
                  {action.priority}
                </span>
              </div>
              <div className="audit-font uppercase tracking-tighter">{action.due}</div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  action.status === "OPEN" ? "bg-amber-500" : 
                  action.status === "OVERDUE" ? "bg-red-500" : "bg-emerald-500"
                )} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{action.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] shadow-[8px_8px_0px_0px_#A09F9C]">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mb-6">CAPA Workflow Maturity</h3>
          <div className="space-y-6">
            {[
              { label: "Identification & Logging", val: 100 },
              { label: "Root Cause Analysis (RCA)", val: 85 },
              { label: "Verification of Effectiveness", val: 42 },
            ].map(step => (
              <div key={step.label}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[9px] font-bold uppercase opacity-60">{step.label}</span>
                  <span className="text-[11px] font-bold">{step.val}%</span>
                </div>
                <div className="h-1.5 bg-white/10 w-full overflow-hidden">
                  <div className="h-full bg-sky-400 transition-all duration-1000" style={{ width: `${step.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_#141414]">
          <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-6">Critical Overdue Alert</h3>
          <div className="flex gap-4 items-start border-l-4 border-red-500 pl-4 py-2">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-tight">PT NGKI: Land Utilization Agreement (LUA)</p>
              <p className="text-[10px] italic opacity-60 leading-relaxed mt-1">
                This item is 5 days overdue. Failure to resolve by EOM will trigger a PS5 compliance breach notification to ADB.
              </p>
              <button className="mt-4 text-[9px] font-bold uppercase underline underline-offset-4 hover:text-red-500 transition-colors">
                Escalate to Legal Lead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
