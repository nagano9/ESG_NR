import React from "react";
import { ArrowUpRight, ArrowDownRight, Zap, Droplets, Users, Shield, AlertTriangle, ArrowRight, Globe } from "lucide-react";
import { motion } from "motion/react";
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Area, Line } from "recharts";
import { cn } from "../../lib/utils.ts";
import { formatNumber } from "../../lib/format.ts";
import { ghgSummary2025, jvcEntities } from "../../data/ghgData.ts";

const stats = [
  { label: "HO GHG Inventory", value: formatNumber(ghgSummary2025.totalEmissions), unit: "tCO2e", change: `+${ghgSummary2025.changePercentage}%`, trend: "up" },
  { label: "Emission Intensity", value: formatNumber(ghgSummary2025.intensity), unit: "t/bn IDR", change: `+${ghgSummary2025.intensityChange}%`, trend: "up" },
  { label: "Investment Portfolio", value: formatNumber(ghgSummary2025.investmentPortfolio / 1000000, 2), unit: "M tCO2e", change: "Equity Share", trend: "neutral" },
  { label: "JVC Entities", value: formatNumber(jvcEntities.length), unit: "Entities", change: "Active", trend: "neutral" },
];

const missingDisclosures = [
  { framework: "GRI 305-1", description: "Direct GHG Emissions", asset: "Solar Park A", severity: "CRITICAL" },
  { framework: "GRI 403-1", description: "Occupational Health & Safety", asset: "Wind Farm B", severity: "HIGH" },
  { framework: "POJK 51-C", description: "Internal Environmental Strategy", asset: "Corporate", severity: "MEDIUM" },
];

const jvcPerformance = jvcEntities.map(entity => ({
  name: entity.name,
  emissions: formatNumber(entity.emissions),
  social: 92, // Placeholder for social until data available
  governance: 100, // SMAP certified
  status: entity.status === "Operasional" ? "High Signal" : "Market Trend",
  variance: entity.status === "Operasional" ? "-2.4%" : "New Asset",
  equity: entity.equity,
  tkdn: "46.4%", // Placeholder for TKDN until data available
  partner: entity.partner,
  partnerSync: "Synced"
}));

import { AuditTrail } from "../common/AuditTrail.tsx";

const auditEntries = [
  { id: "1", user: "USER_ADMIN", action: "Updated GRI mapping for 305-1", timestamp: "2024-10-27 14:22", oldValue: "Draft", newValue: "Verified" },
  { id: "2", user: "SYSTEM", action: "Recalculated Scope 2 for Portfolio", timestamp: "2024-10-27 15:01", oldValue: "34,200", newValue: "32,780" },
  { id: "3", user: "AI_ENGINE", action: "Flagged IFC PS3 gap in Solar_A", timestamp: "2024-10-27 16:45", oldValue: "No Issues", newValue: "Flagged" },
];

export function Overview() {
  const [selectedJVC, setSelectedJVC] = React.useState<string | null>(null);
  
  const activeJVC = jvcPerformance.find(j => j.name === selectedJVC);

  return (
    <div className="space-y-12">
      {/* Strategic Enrichment: PLN Sustainability Pathway Shield */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Missing Data Alert Dashboard */}
          <div className="flex flex-col border border-red-500 bg-red-50/10 overflow-hidden shadow-[8px_8px_0px_0px_#EF4444]">
            <div className="bg-red-500 p-3 flex items-center justify-between text-white border-b border-red-600">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Framework Disclosure Gap Alerts</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{missingDisclosures.length} Flags Detected</span>
            </div>
            <div className="divide-y divide-red-500/20">
              {missingDisclosures.map((alert, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 p-4 hover:bg-red-500/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-sm uppercase">{alert.severity}</span>
                    <span className="text-[11px] font-bold uppercase tracking-tight">{alert.framework}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] uppercase opacity-60 tracking-widest leading-none">Disclosure</span>
                    <span className="text-[11px] italic font-medium">{alert.description}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] uppercase opacity-60 tracking-widest leading-none">Target Asset</span>
                    <span className="text-[11px] font-bold uppercase">{alert.asset}</span>
                  </div>
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-[10px] font-bold text-red-600 underline underline-offset-2 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Map Evidence</span>
                    <ArrowRight className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strategic Pathway & Net Zero Engine */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_#141414]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-serif italic text-xl font-bold tracking-tight">Net Zero 2030 Roadmap</h3>
                <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Science-Based Targets Alignment (SBTi)</p>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] font-bold uppercase px-3 py-1 bg-emerald-500 text-white italic">On Track</span>
              </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={[
                  { year: '2022', actual: 4200, target: 4200 },
                  { year: '2023', actual: 3950, target: 4000 },
                  { year: '2024', actual: 3680, target: 3800 },
                  { year: '2025', target: 3500 },
                  { year: '2026', target: 3200 },
                  { year: '2028', target: 2500 },
                  { year: '2030', target: 1200 },
                ]}>
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                  <YAxis hide domain={[0, 5000]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', border: 'none', borderRadius: '0px', color: '#E4E3E0', fontSize: '10px' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="target" fill="#10B981" fillOpacity={0.05} stroke="#10B981" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="actual" stroke="#141414" strokeWidth={3} dot={{ r: 4, fill: '#141414' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-8 border-t border-[#141414]/10 pt-6">
              {[
                { label: "Current Abatement", val: "12.4%", status: "ahead" },
                { label: "Transition Capex", val: "$420M", status: "neutral" },
                { label: "SBTi Verification", val: "L3 Active", status: "ahead" },
                { label: "Carbon Price Exp.", val: "$15/t", status: "warning" },
              ].map(stat => (
                <div key={stat.label}>
                  <span className="text-[8px] font-bold uppercase opacity-40 block mb-1">{stat.label}</span>
                  <span className="text-sm font-bold tracking-tight">{stat.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#141414] text-[#E4E3E0] p-8 shadow-[12px_12px_0px_0px_#10B981] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Climate Liability Alert</span>
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold tracking-tighter uppercase mb-2">CBAM Phase 2</h3>
              <p className="text-[11px] italic opacity-70 leading-relaxed mb-6">
                Upcoming EU Carbon Border Adjustment Mechanism (CBAM) phase transition will increase export liability by 14% for Solar_Park_A production.
              </p>
              <div className="p-4 border border-white/10 bg-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase opacity-40">Risk Exposure</span>
                  <span className="text-sm font-bold text-amber-400">$2.1M</span>
                </div>
                <div className="h-1 bg-white/10 w-full">
                  <div className="h-full bg-amber-400 w-[65%]" />
                </div>
              </div>
            </div>
            <button className="w-full mt-8 py-4 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-[#141414] transition-all">
              View Mitigation Strategy
            </button>
          </div>
        </div>

        {/* JVC Portfolio Performance Shield */}
        <div className="flex flex-col gap-4">
          {/* Carbon Tax Liability Simulation */}
          <div className="bg-[#141414] text-[#E4E3E0] p-4 border border-[#141414] shadow-[4px_4px_0px_0px_#A09F9C]">
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 block mb-2">Carbon Tax Liability (Est.)</span>
            <div className="text-2xl font-bold tracking-tighter">IDR 4.2B</div>
            <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-2">
              <span className="text-[8px] italic opacity-60 uppercase">@ $2.0/tCO2e Rate</span>
              <div className="text-[8px] font-bold uppercase text-amber-400">Financial Risk</div>
            </div>
          </div>
          <div className="bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_0px_#141414]">
            <span className="text-[9px] font-bold uppercase opacity-60 block mb-2">Scope 3 C15 Portfolio</span>
            <div className="text-2xl font-bold tracking-tighter text-[#141414]">{formatNumber(ghgSummary2025.investmentPortfolio / 1000, 1)}k <span className="text-[10px] font-normal opacity-60">tCO2e</span></div>
            <div className="flex justify-between mt-2">
              <span className="text-[8px] font-bold text-amber-600 uppercase">Investments</span>
              <span className="text-[8px] font-bold text-slate-600 uppercase">Equity Share Bound</span>
            </div>
          </div>
          <div className={cn(
            "p-4 border border-[#141414] shadow-[4px_4px_0px_0px_#141414]",
            46.4 < 40 ? "bg-red-50" : "bg-white"
          )}>
            <span className="text-[9px] font-bold uppercase opacity-60 block mb-2">TKDN Portfolio Avg</span>
            <div className="text-2xl font-bold tracking-tighter text-[#141414]">46.4%</div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[8px] font-bold text-emerald-600 uppercase">+2.1% vs Min</span>
              <div className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-700">Safe</div>
            </div>
          </div>

          {/* New Safety (K3) Metric */}
          <div className="bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_0px_#141414]">
            <span className="text-[9px] font-bold uppercase opacity-60 block mb-2">Safety (K3) LTIFR</span>
            <div className="text-2xl font-bold tracking-tighter text-[#141414]">0.00</div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[8px] font-bold text-emerald-600 uppercase">Zero Harm Maintained</span>
              <div className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-blue-100 text-blue-700">K3 Excellence</div>
            </div>
          </div>

          {/* New SMAP Metric */}
          <div className="bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_0px_#141414]">
            <span className="text-[9px] font-bold uppercase opacity-60 block mb-2">SMAP Compliance (ISO 37001)</span>
            <div className="text-2xl font-bold tracking-tighter text-[#141414]">100%</div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[8px] font-bold text-emerald-600 uppercase">All JVCs Certified</span>
              <div className="text-[8px] font-bold uppercase px-1.5 py-0.5 border border-emerald-500 text-emerald-600 italic">Antigraft Verified</div>
            </div>
          </div>

          <div className="bg-[#D4D3D0]/20 p-4 border border-[#141414] border-dashed">
            <span className="text-[9px] font-bold uppercase opacity-60 block mb-2">PLN Group Reporting Sync</span>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold">Consolidated up to PLN Persero</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              </div>
            </div>
            <span className="text-[8px] italic opacity-60 block mt-1">2 of 3 modules ready for quarterly rollup.</span>
          </div>
        </div>
      </div>

      {/* Stats Header Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-[#141414] bg-white divide-x divide-[#141414] shadow-[4px_4px_0px_0px_#141414]">
        {stats.map((stat, i) => (
          <div key={stat.label} className="p-6 flex flex-col justify-center">
            <span className="font-serif italic text-[10px] opacity-60 uppercase tracking-widest mb-1">{stat.label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tighter">{stat.value}</span>
              <span className="text-[10px] italic uppercase opacity-60">{stat.unit}</span>
            </div>
            <div className={cn(
              "mt-2 text-[9px] font-bold uppercase tracking-tighter",
              stat.trend === "up" ? "text-emerald-600" : 
              stat.trend === "down" ? "text-amber-600" : "text-slate-400"
            )}>
              {stat.change} vs Last Year
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Data Grid */}
        <div className="lg:col-span-2 space-y-8">
          {activeJVC ? (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] shadow-[8px_8px_0px_0px_#10B981] relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedJVC(null)}
                className="absolute top-4 right-4 text-[10px] font-bold uppercase border border-white/20 px-3 py-1 hover:bg-white/10"
              >
                Close Drill-down
              </button>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10">
                  <Globe className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tighter uppercase">{activeJVC.name}</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">Asset Class: Renewable Utility | Partner: {activeJVC.partner}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-8">
                <div className="space-y-4">
                  <span className="text-[9px] font-bold uppercase opacity-40 block border-b border-white/10 pb-2">Technical Core</span>
                  <div>
                    <p className="text-[10px] opacity-60 uppercase mb-1">TKDN (Local Content)</p>
                    <p className="text-xl font-bold">{activeJVC.tkdn}</p>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60 uppercase mb-1">Equity Exposure</p>
                    <p className="text-xl font-bold">{activeJVC.equity}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <span className="text-[9px] font-bold uppercase opacity-40 block border-b border-white/10 pb-2">ESG Performance</span>
                  <div>
                    <p className="text-[10px] opacity-60 uppercase mb-1">Social Score (S)</p>
                    <p className="text-xl font-bold text-emerald-400">{activeJVC.social}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60 uppercase mb-1">Governance Index (G)</p>
                    <p className="text-xl font-bold text-emerald-400">{activeJVC.governance}%</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <span className="text-[9px] font-bold uppercase opacity-40 block border-b border-white/10 pb-2">GHG Profile</span>
                  <div>
                    <p className="text-[10px] opacity-60 uppercase mb-1">Operational Emissions</p>
                    <p className="text-xl font-bold">{activeJVC.emissions} <span className="text-[10px] font-normal opacity-40">tCO2e</span></p>
                  </div>
                  <div className="flex gap-2 items-center mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[9px] uppercase font-bold">SMAP ISO 37001 Certified</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-4">Strategic Recommendation</h4>
                <p className="text-[12px] italic opacity-80 leading-relaxed font-serif">
                  "Maintain current equity share. Asset {activeJVC.name} is the primary driver for NR's 2025 renewable yield. TKDN levels are above the regulatory threshold of 40%, supporting continued capital injection for phase 2 expansion."
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col border border-[#141414] bg-white overflow-hidden shadow-[4px_4px_0px_0px_#141414]">
              <div className="grid grid-cols-9 bg-[#D4D3D0]/30 border-b border-[#141414]">
                <div className="col-header">JVC Entity</div>
                <div className="col-header">Equity</div>
                <div className="col-header text-right">Variance</div>
                <div className="col-header">Partner Sync</div>
                <div className="col-header">TKDN</div>
                <div className="col-header">Social</div>
                <div className="col-header">Gov</div>
                <div className="col-header">Target</div>
                <div className="col-header text-right">Status</div>
              </div>
              
              <div className="divide-y divide-[#141414]/10">
                {jvcPerformance.map((jvc) => (
                  <div 
                    key={jvc.name} 
                    onClick={() => setSelectedJVC(jvc.name)}
                    className="grid grid-cols-9 px-4 py-4 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group cursor-pointer items-center"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-[10px] uppercase tracking-tight group-hover:underline">{jvc.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[7px] font-black px-1 py-0 bg-emerald-500 text-white uppercase italic">Top 10%</span>
                        <span className="text-[8px] opacity-60 group-hover:text-white/40 italic">{jvc.partner}</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold opacity-60">{jvc.equity}</div>
                    <div className={cn("text-right text-[10px] font-bold", jvc.variance.startsWith('-') ? "text-emerald-500" : "text-amber-500")}>
                      {jvc.variance}
                    </div>
                    <div className="flex">
                      <span className={cn(
                        "text-[8px] font-bold uppercase px-1.5 py-0.5 border",
                        jvc.partnerSync === "Synced" ? "border-emerald-500/30 text-emerald-500" :
                        jvc.partnerSync === "Gap Detected" ? "border-red-500/30 text-red-500" : "border-slate-500/30 text-slate-500"
                      )}>
                        {jvc.partnerSync}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold">{jvc.tkdn}</div>
                    <div className="text-[11px] font-medium">{jvc.social}%</div>
                    <div className="text-[11px] font-medium">{jvc.governance}%</div>
                    <div className="col-span-1 flex flex-col gap-1 justify-center">
                      <div className="flex justify-between items-center text-[7px] font-bold uppercase opacity-60 group-hover:text-white/60">
                        <span>Gap</span>
                        <span>{jvc.variance}</span>
                      </div>
                      <div className="h-1.5 bg-[#141414]/5 relative overflow-hidden group-hover:bg-white/10">
                        <div 
                          className={cn(
                            "absolute left-0 top-0 h-full transition-all duration-1000",
                            jvc.variance.startsWith('-') ? "bg-emerald-500" : "bg-amber-500"
                          )} 
                          style={{ width: jvc.variance.startsWith('-') ? '85%' : '60%' }} 
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        jvc.status === "High Signal" ? "bg-emerald-500" :
                        jvc.status === "Market Trend" ? "bg-sky-500" : "bg-amber-500"
                      )} />
                      <span className="text-[9px] font-bold uppercase tracking-tighter">{jvc.status === "High Signal" ? "CLEAN" : jvc.status === "Market Trend" ? "TREND" : "WARN"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Governance Governance Scorecard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-[#141414] p-6 bg-[#F9F9F8]">
              <span className="font-serif italic text-[10px] opacity-60 uppercase tracking-widest block mb-4 border-b border-[#141414]/10 pb-2">Board Oversight</span>
              <div className="space-y-4">
                {[
                  { topic: "ESG Committee Frequency", value: "Monthly", status: "Target Met" },
                  { topic: "Executive Pay Link to ESG", value: "15% Weight", status: "In Place" },
                  { topic: "Board ESG Training", value: "85% Comp.", status: "Ongoing" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-tight">{item.topic}</p>
                      <p className="text-[9px] opacity-60 italic">{item.status}</p>
                    </div>
                    <span className="text-[11px] font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-[#141414] p-6 bg-white shadow-[4px_4px_0px_0px_#141414]">
              <span className="font-serif italic text-[10px] opacity-60 uppercase tracking-widest block mb-4 border-b border-[#141414]/10 pb-2">Regulatory Benchmarking</span>
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-tight">Peer Avg (Energy IDN)</span>
                  <span className="text-[10px] opacity-60">14.2k tCO2e</span>
                </div>
                <div className="h-4 bg-[#141414]/5 relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-[#141414]/20 w-[65%]" />
                  <div className="absolute left-0 top-0 h-full bg-emerald-500 w-[45%]" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold uppercase">Our Pos: -20% vs Peer</span>
                </div>
                <p className="text-[9px] italic opacity-60 leading-tight">
                  Compared to Sector average listed in Bursa Efek Indonesia 2023.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit / Intelligence Sidebar */}
        <div className="flex flex-col space-y-8">
          <AuditTrail entries={auditEntries} />

          <div className="bg-white p-6 border border-[#141414] shadow-[4px_4px_0px_0px_#141414]">
            <span className="font-serif italic text-[10px] opacity-60 uppercase tracking-widest block mb-4 border-b border-[#141414]/10 pb-2">Intelligent Feed</span>
            <div className="space-y-4">
              {[
                { title: "New POJK 51 Regulation Draft", source: "OJK", signal: "High Signal" },
                { title: "ISSB S1/S2 Adoption", source: "IAI", signal: "Market Trend" },
                { title: "GRI 2024 Energy Standard Update", source: "GRI", signal: "Market Trend" },
              ].map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <p className="text-[9px] font-bold text-[#141414]/40 uppercase mb-1">{item.source} • {item.signal}</p>
                  <h3 className="text-[11px] font-bold uppercase tracking-tight leading-tight group-hover:underline">{item.title}</h3>
                </div>
              ))}
              <button className="w-full mt-4 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold py-3 uppercase tracking-widest hover:opacity-90 transition-opacity">
                Generate Digest
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
