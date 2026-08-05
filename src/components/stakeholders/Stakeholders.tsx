import React from "react";
import { Users, Mail, MessageSquare, Star, ArrowUpRight, Filter } from "lucide-react";
import { cn } from "../../lib/utils.ts";

const groups = [
  { id: 1, name: "Government & Regulators", status: "High Influence", sentiment: "Supportive", topics: ["Climate Change", "Anti-Corruption"] },
  { id: 2, name: "JV Partners (Masdar, Sembcorp)", status: "Direct Interest", sentiment: "Neutral", topics: ["Energy Security", "TKDN"] },
  { id: 3, name: "Local Communities (Karangkates)", status: "Impacted", sentiment: "Concerned", topics: ["Labor Practices", "Water"] },
  { id: 4, name: "Lenders & Investors", status: "Critical", sentiment: "Supportive", topics: ["Climate Change", "Financial Materiality"] },
];

export function Stakeholders() {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-[#141414] pb-6">
        <div>
          <h2 className="font-serif italic text-xl font-bold tracking-tight uppercase">Stakeholder Engagement Hub</h2>
          <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Mapping Influence & Materiality Consensus</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest border border-[#141414] hover:bg-[#141414]/5 transition-all">
            <Filter className="w-4 h-4" /> Filter Groups
          </button>
          <button className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] bg-[#141414] hover:opacity-90 transition-opacity shadow-[4px_4px_0px_0px_#A09F9C]">
            Launch Survey
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {groups.map((group) => (
          <div key={group.id} className="bg-white border border-[#141414] p-6 shadow-[6px_6px_0px_0px_#141414] hover:shadow-[10px_10px_0px_0px_#141414] transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 border border-[#141414] flex items-center justify-center bg-[#F9F9F8]">
                <Users className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className={cn(
                "text-[8px] font-bold uppercase px-2 py-1 border",
                group.sentiment === "Concerned" ? "border-amber-500 text-amber-600 bg-amber-50" : "border-emerald-500 text-emerald-600 bg-emerald-50"
              )}>
                {group.sentiment}
              </span>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-tight mb-1">{group.name}</h3>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-4">{group.status}</p>
            
            <div className="space-y-4">
              <div>
                <span className="text-[8px] font-bold uppercase opacity-60 block mb-2">Key Concerns</span>
                <div className="flex flex-wrap gap-2">
                  {group.topics.map(topic => (
                    <span key={topic} className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-[#141414]/5 border border-[#141414]/10">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#141414]/10 flex gap-3">
                <button className="p-2 border border-[#141414]/20 hover:bg-[#141414] hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </button>
                <button className="p-2 border border-[#141414]/20 hover:bg-[#141414] hover:text-white transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 text-[9px] font-bold uppercase border border-[#141414] hover:bg-[#141414]/5 transition-colors">
                  Full Profile <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Consensus Matrix Simulation */}
      <div className="bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] shadow-[8px_8px_0px_0px_#10B981]">
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Materiality Consensus Score</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { label: "Internal Alignment", val: 88 },
            { label: "External Validity", val: 72 },
            { label: "Data Availability", val: 94 },
            { label: "Audit Readiness", val: 82 },
          ].map(stat => (
            <div key={stat.label}>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[9px] font-bold uppercase opacity-60">{stat.label}</span>
                <span className="text-xl font-bold">{stat.val}%</span>
              </div>
              <div className="h-1 bg-white/10 w-full">
                <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${stat.val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
