import React from "react";
import { ArrowUpRight, Download, Filter, Mail, MessageSquare, Search, Star, Users } from "lucide-react";
import { cn } from "../../lib/utils.ts";

const groups = [
  { id: 1, name: "Government & Regulators", status: "High Influence", sentiment: "Supportive", topics: ["Climate Change", "Anti-Corruption"], influence: 95, concern: 42, coverage: 88, owner: "Regulatory Affairs", nextStep: "Submit POJK 51 readiness memo" },
  { id: 2, name: "JV Partners (Masdar, Sembcorp)", status: "Direct Interest", sentiment: "Neutral", topics: ["Energy Security", "TKDN"], influence: 82, concern: 58, coverage: 74, owner: "JV Governance", nextStep: "Align JV ESG data room cadence" },
  { id: 3, name: "Local Communities (Karangkates)", status: "Impacted", sentiment: "Concerned", topics: ["Labor Practices", "Water"], influence: 68, concern: 86, coverage: 61, owner: "Community Relations", nextStep: "Close grievance response evidence" },
  { id: 4, name: "Lenders & Investors", status: "Critical", sentiment: "Supportive", topics: ["Climate Change", "Financial Materiality"], influence: 92, concern: 64, coverage: 79, owner: "Investor Relations", nextStep: "Issue lender assurance bridge pack" },
];

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function Stakeholders() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sentimentFilter, setSentimentFilter] = React.useState("All");

  const visibleGroups = React.useMemo(() => groups.filter((group) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || group.name.toLowerCase().includes(query) || group.status.toLowerCase().includes(query) || group.topics.some((topic) => topic.toLowerCase().includes(query));
    const matchesSentiment = sentimentFilter === "All" || group.sentiment === sentimentFilter;
    return matchesSearch && matchesSentiment;
  }), [searchTerm, sentimentFilter]);
  const metrics = React.useMemo(() => {
    const avgInfluence = Math.round(groups.reduce((total, group) => total + group.influence, 0) / groups.length);
    const avgConcern = Math.round(groups.reduce((total, group) => total + group.concern, 0) / groups.length);
    const avgCoverage = Math.round(groups.reduce((total, group) => total + group.coverage, 0) / groups.length);
    const highConcern = groups.filter((group) => group.concern >= 70).length;
    return { avgInfluence, avgConcern, avgCoverage, highConcern };
  }, []);
  const topicFrequency = React.useMemo(() => {
    const counts = groups.flatMap((group) => group.topics).reduce<Record<string, number>>((acc, topic) => {
      acc[topic] = (acc[topic] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, []);

  function exportEngagementPlan() {
    downloadCsv("stakeholder_engagement_plan.csv", visibleGroups.map((group) => ({
      Stakeholder: group.name,
      Status: group.status,
      Sentiment: group.sentiment,
      Influence: group.influence,
      Concern: group.concern,
      Coverage: group.coverage,
      Owner: group.owner,
      "Next Step": group.nextStep,
      Topics: group.topics.join("; "),
    })));
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-[#141414] pb-6">
        <div>
          <h2 className="font-serif italic text-xl font-bold tracking-tight uppercase">Stakeholder Engagement Hub</h2>
          <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Mapping Influence & Materiality Consensus</p>
        </div>
        <div className="flex gap-4">
          <button onClick={exportEngagementPlan} className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest border border-[#141414] hover:bg-[#141414]/5 transition-all">
            <Download className="w-4 h-4" /> Export Plan
          </button>
          <button className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] bg-[#141414] hover:opacity-90 transition-opacity shadow-[4px_4px_0px_0px_#A09F9C]">
            Launch Survey
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: "Influence", value: `${metrics.avgInfluence}%` },
          { label: "Concern", value: `${metrics.avgConcern}%` },
          { label: "Coverage", value: `${metrics.avgCoverage}%` },
          { label: "High Concern", value: metrics.highConcern },
        ].map((metric) => (
          <div key={metric.label} className="border border-[#141414] bg-white p-5 shadow-[4px_4px_0_#D4D3D0]">
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">{metric.label}</span>
            <div className="mt-3 text-2xl font-bold tracking-tight">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 border border-[#141414] bg-white p-4 md:flex-row md:items-center">
        <label className="flex flex-1 items-center gap-2 border border-[#141414]/20 px-3 py-2">
          <Search className="h-4 w-4 opacity-40" />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search group, topic, influence" className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none placeholder:opacity-30" />
        </label>
        <label className="flex items-center gap-2 border border-[#141414]/20 px-3 py-2">
          <Filter className="h-4 w-4 opacity-40" />
          <select value={sentimentFilter} onChange={(event) => setSentimentFilter(event.target.value)} className="bg-white text-[10px] font-bold uppercase tracking-widest outline-none">
            <option>All</option>
            <option>Supportive</option>
            <option>Neutral</option>
            <option>Concerned</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {visibleGroups.map((group) => (
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

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "INF", value: group.influence },
                  { label: "CON", value: group.concern },
                  { label: "COV", value: group.coverage },
                ].map((score) => (
                  <div key={score.label}>
                    <div className="mb-1 flex items-center justify-between text-[8px] font-bold uppercase opacity-50">
                      <span>{score.label}</span>
                      <span>{score.value}</span>
                    </div>
                    <div className="h-1 bg-[#141414]/10">
                      <div className={cn("h-full", score.label === "CON" && group.concern >= 70 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${score.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-l-2 border-[#141414] bg-[#F9F9F8] p-3">
                <span className="mb-1 block text-[8px] font-bold uppercase opacity-50">Next Step - {group.owner}</span>
                <p className="text-[10px] italic leading-relaxed opacity-80">{group.nextStep}</p>
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="border border-[#141414] bg-white p-6 shadow-[6px_6px_0_#D4D3D0] lg:col-span-2">
          <h3 className="mb-5 text-[11px] font-bold uppercase tracking-widest">Topic Frequency</h3>
          <div className="space-y-4">
            {topicFrequency.map(([topic, count]) => (
              <div key={topic}>
                <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
                  <span>{topic}</span>
                  <span>{count}</span>
                </div>
                <div className="h-1.5 bg-[#141414]/10">
                  <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, count * 45)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden border border-[#141414] bg-white shadow-[6px_6px_0_#141414] lg:col-span-3">
          <div className="col-header border-b border-[#141414] bg-[#D4D3D0]/30">Priority Engagement Plan</div>
          <div className="divide-y divide-[#141414]/10">
            {visibleGroups.map((group) => (
              <div key={group.id} className="grid gap-3 p-4 text-[10px] md:grid-cols-[1.1fr_0.8fr_1.5fr] md:items-center">
                <div>
                  <span className="font-bold uppercase tracking-tight">{group.name}</span>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-widest opacity-40">{group.owner}</p>
                </div>
                <span className={cn("w-fit px-2 py-1 text-[8px] font-bold uppercase", group.concern >= 70 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                  Concern {group.concern}
                </span>
                <p className="italic opacity-70">{group.nextStep}</p>
              </div>
            ))}
          </div>
        </div>
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
