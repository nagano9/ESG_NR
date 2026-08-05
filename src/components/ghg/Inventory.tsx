import React from "react";
import { Plus, Download, Filter, Info, ChevronDown, BarChart3, Zap, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils.ts";
import { formatNumber } from "../../lib/format.ts";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart
} from 'recharts';

import { ghgSummary2025 } from "../../data/ghgData.ts";

const chartData = [
  { year: '2023', scope1: 74.89, scope2: 67.19, scope3: 185.30, target: 350 },
  { year: '2024', scope1: 43.29, scope2: 69.55, scope3: 172.98, target: 320 },
  { year: '2025', scope1: 24.27, scope2: 70.77, scope3: 384.20, target: 300 },
];

const scopeDetails = {
  1: [
    { asset: "Mobile Combustion (Dexlite/B30)", methodology: "Fuel Consumption x Density x NCV x Emission Factor (NCV Data National)", equity: "100%", boundary: "Operational", val: 6.84, status: "Verified", assurance: "Reasonable", verifier: "Peterson", dqr: "1.2", source: "Fuel Log" },
    { asset: "Mobile Combustion (Gasoline)", methodology: "Fuel Consumption x Density x NCV x EF (IPCC 2006)", equity: "100%", boundary: "Operational", val: 17.42, status: "Verified", assurance: "Reasonable", verifier: "Peterson", dqr: "1.2", source: "Fuel Log" },
    { asset: "Refrigerants (R600A)", methodology: "Inventory Mass x Leakage Factor (0.5%) x GWP (AR6)", equity: "100%", boundary: "Operational", val: 0.000003, status: "Estimated", assurance: "Limited", verifier: "Internal", dqr: "4.5", source: "Inventory" },
  ],
  2: [
    { asset: "HO Electricity (Grid)", methodology: "kWh Consumption x Grid Emission Factor (Jamali 0.87)", equity: "100%", boundary: "Operational", val: 65.30, status: "Verified", assurance: "Reasonable", verifier: "Peterson", dqr: "1.1", source: "PLN Bill" },
    { asset: "EV Charging (HO)", methodology: "kWh Metered x Grid Emission Factor (0.87)", equity: "100%", boundary: "Operational", val: 5.47, status: "Verified", assurance: "Reasonable", verifier: "Peterson", dqr: "1.1", source: "Meter" },
  ],
  3: [
    { asset: "C1: Purchased Goods & Services", methodology: "Spend-based (IDR -> USD 2018) x US EPA Supply Chain EF", equity: "N/A", boundary: "Value Chain", val: 31.73, status: "Estimated", assurance: "Limited", verifier: "Internal", dqr: "3.2", source: "Spend Data" },
    { asset: "C6: Business Travel", methodology: "Distance-based (ICAO) x radiative forcing multiplier (3x)", equity: "N/A", boundary: "Value Chain", val: 198.55, status: "Verified", assurance: "Reasonable", verifier: "Peterson", dqr: "2.1", source: "SPPD Log" },
    { asset: "C7: Employee Commuting", methodology: "Fuel-based Survey Data x IPCC Mobile Combustion EF", equity: "N/A", boundary: "Value Chain", val: 148.04, status: "Estimated", assurance: "Limited", verifier: "Internal", dqr: "3.8", source: "Survey" },
    { asset: "C15: Investments (Portfolio)", methodology: "Equity Share of JVC Scope 1 & 2 Emissions (GHG Protocol)", equity: "Various", boundary: "Equity Share", val: 1465502.64, status: "Reporting", assurance: "N/A", verifier: "JVCs", dqr: "4.0", source: "Equity Rpt" },
  ]
};

const scopes = [
  { id: 1, label: "Scope 1", description: "Direct emissions from owned or controlled sources" },
  { id: 2, label: "Scope 2", description: "Indirect emissions from the generation of purchased energy" },
  { id: 3, label: "Scope 3", description: "All other indirect emissions in the value chain" },
];

export function Inventory() {
  const [selectedScope, setSelectedScope] = React.useState(1);
  const [reductionScenario, setReductionScenario] = React.useState(false);

  const scenarioData = chartData.map(d => ({
    ...d,
    scope3: reductionScenario && d.year === '2025' ? d.scope3 * 0.85 : d.scope3
  }));

  return (
    <div className="space-y-8">
      {/* 5-Year Trend Chart */}
      <div className="flex flex-col border border-[#141414] bg-white overflow-hidden shadow-[8px_8px_0px_0px_#141414]">
        <div className="col-header bg-[#D4D3D0]/30 border-b border-[#141414] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3 h-3" />
            <span>Emissions Trend & Scenarios (tCO2e)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold uppercase opacity-60">15% Reduction Scenario</span>
            <button 
              onClick={() => setReductionScenario(!reductionScenario)}
              className={cn(
                "w-8 h-4 border border-[#141414] relative transition-colors",
                reductionScenario ? "bg-emerald-500" : "bg-white"
              )}
            >
              <div className={cn(
                "absolute top-0 w-4 h-full bg-[#141414] transition-all",
                reductionScenario ? "left-4" : "left-0"
              )} />
            </button>
          </div>
        </div>
        <div className="p-8 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={scenarioData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141420" />
              <XAxis 
                dataKey="year" 
                axisLine={{ stroke: '#141414' }} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#141414' }}
              />
              <YAxis 
                axisLine={{ stroke: '#141414' }} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#141414' }}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip 
                cursor={{ fill: '#14141410' }}
                contentStyle={{ 
                  backgroundColor: '#141414', 
                  border: 'none', 
                  color: '#E4E3E0',
                  borderRadius: '0px',
                  fontFamily: 'Courier New, Courier, monospace',
                  fontSize: '11px'
                }}
                itemStyle={{ color: '#E4E3E0' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                iconType="rect"
              />
              <Bar dataKey="scope1" name="Scope 1" fill="#141414" radius={[0, 0, 0, 0]} />
              <Bar dataKey="scope2" name="Scope 2" fill="#10B981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="scope3" name="Scope 3" fill="#D4D3D0" radius={[0, 0, 0, 0]} />
              <Line type="monotone" dataKey="target" name="NZT Target" stroke="#EF4444" strokeWidth={2} dot={{ r: 4, fill: '#EF4444' }} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#141414] pb-6">
        <div className="flex items-center gap-1">
          {scopes.map((scope) => (
            <button
              key={scope.id}
              onClick={() => setSelectedScope(scope.id)}
              className={cn(
                "px-8 py-2 text-[11px] font-bold uppercase tracking-widest transition-all border border-[#141414]",
                selectedScope === scope.id 
                  ? "bg-[#141414] text-[#E4E3E0]" 
                  : "bg-white text-[#141414] hover:bg-[#141414]/5"
              )}
            >
              Scope {scope.id}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#141414] border border-[#141414] hover:bg-[#141414]/5 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export XLSX
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] bg-[#141414] hover:opacity-90 transition-opacity shadow-[4px_4px_0px_0px_#A09F9C]">
            <Plus className="w-3.5 h-3.5" /> Add Data Point
          </button>
        </div>
      </div>

      <div className="bg-[#141414] text-[#E4E3E0] p-4 border border-[#141414] flex items-start gap-4">
        <div className="w-8 h-8 flex items-center justify-center border border-[#E4E3E0]/30 shrink-0">
          <Info className="w-4 h-4 opacity-70" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{scopes.find(s => s.id === selectedScope)?.label}</p>
          <p className="text-xs italic opacity-80">{scopes.find(s => s.id === selectedScope)?.description}</p>
        </div>
      </div>

      {/* Consultant Enrichment: Materiality & REC Linkage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-sky-50 border border-sky-200 p-4 flex items-start gap-4 shadow-[4px_4px_0px_0px_#0EA5E9]">
          <div className="p-2 bg-sky-500 text-white">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-tight text-sky-900 mb-1">Financial Materiality Link</h4>
            <p className="text-[10px] italic text-sky-800 leading-relaxed">
              "GHG performance is linked to SLL margin reductions. Achieving 5% reduction triggers 15bps margin benefit."
            </p>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-4 shadow-[4px_4px_0px_0px_#10B981]">
          <div className="p-2 bg-emerald-500 text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-tight text-emerald-900 mb-1">REC Generation Status</h4>
            <div className="flex gap-4 mt-1">
              <div>
                <span className="text-[8px] uppercase opacity-60 block">Verified RECs</span>
                <span className="text-[11px] font-bold">142,500 MWh</span>
              </div>
              <div className="border-l border-emerald-200 pl-4">
                <span className="text-[8px] uppercase opacity-60 block">Carbon Credits (SRN)</span>
                <span className="text-[11px] font-bold">Pending Verif.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Section: Management Discussion & Analysis (MD&A) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="flex flex-col border border-[#141414] bg-white overflow-hidden shadow-[4px_4px_0px_0px_#141414]">
            <div className="grid grid-cols-10 bg-[#D4D3D0]/30 border-b border-[#141414]">
          <div className="col-header">Asset / Entity</div>
          <div className="col-header">Equity %</div>
          <div className="col-header text-right">Emissions (tCO2e)</div>
          <div className="col-header">Boundary</div>
          <div className="col-header">Source</div>
          <div className="col-header">Audit Status</div>
          <div className="col-header">DQR</div>
          <div className="col-header">Assurance</div>
          <div className="col-header">Verifier</div>
        </div>
        
        <div className="divide-y divide-[#141414]/10">
          {(scopeDetails[selectedScope as keyof typeof scopeDetails] || []).map((item, i) => (
                <div key={i} className="grid grid-cols-10 px-4 py-4 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group cursor-pointer items-center relative">
                  <div className="flex flex-col col-span-1">
                    <span className="font-bold text-[10px] uppercase tracking-tight">{item.asset}</span>
                    <span className="text-[8px] opacity-60 italic group-hover:text-emerald-400 transition-colors mt-0.5 line-clamp-1">
                      {item.methodology}
                    </span>
                    <span className="text-[8px] opacity-40 italic group-hover:text-[#E4E3E0]/40 transition-colors mt-0.5">ID: INV-25-{selectedScope}-{i}</span>
                  </div>
                  <div className="text-[10px] font-bold">{item.equity}</div>
                  <div className="text-right flex flex-col items-end group/val">
                    <span className="data-value text-emerald-600 group-hover:text-emerald-400 font-bold">{formatNumber(item.val, item.val < 0.01 ? 6 : 2)}</span>
                    <span className="text-[7px] opacity-40 uppercase font-bold transition-opacity">tCO2e</span>
                  </div>
                  <div className="text-[9px] uppercase font-bold opacity-60">{item.boundary}</div>
              <div className="flex">
                <span className={cn(
                  "text-[8px] font-bold uppercase px-1.5 py-0.5 border",
                  item.source === "PLN Bill" || item.source === "Fuel Log" ? "border-sky-500/30 text-sky-500" : "border-[#141414]/20 text-[#141414]/60 group-hover:text-white/60"
                )}>
                  {item.source}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  item.status === "Verified" ? "bg-emerald-500" : "bg-amber-500"
                )} />
                <span className="text-[9px] font-bold uppercase">{item.status}</span>
              </div>
              <div className="text-[9px] font-bold opacity-70 italic">{item.dqr}</div>
              <div className="text-[10px] font-medium opacity-60 group-hover:text-white/80">{item.assurance}</div>
              <div className="text-[10px] font-bold uppercase tracking-tighter opacity-80 group-hover:text-white/80">{item.verifier}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

      <div className="lg:col-span-1 space-y-6">
        <div className="bg-[#141414] text-[#E4E3E0] p-6 shadow-[8px_8px_0px_0px_#10B981]">
          <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Executive Commentary
          </h3>
          <p className="text-[11px] italic font-serif leading-relaxed opacity-80">
            "The significant increase in Scope 3 (Category 6) is attributed to the intense site visit schedule for the **Karangkates 100MW** pre-financing audit. We expect a 15% reduction in Q3 as the project moves to construction phase."
          </p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <span className="text-[9px] font-bold uppercase block">Author: Head of ESG</span>
            <span className="text-[8px] opacity-40 uppercase">Verified: 24 Oct 2025</span>
          </div>
        </div>

        <div className="border border-[#141414] p-6 bg-white shadow-[4px_4px_0px_0px_#D4D3D0]">
          <span className="text-[9px] font-bold uppercase opacity-60 block mb-4 border-b border-[#141414]/10 pb-2">Assurance Status</span>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase">Ready for Limited Assurance</p>
              <p className="text-[8px] opacity-60">Audit Trail Score: 98/100</p>
            </div>
          </div>
        </div>
      </div>

      {/* MACC (Marginal Abatement Cost Curve) Simulation */}
      <div className="bg-white border border-[#141414] p-8 shadow-[12px_12px_0px_0px_#141414] mt-12 animate-in slide-in-from-bottom-8 duration-1000">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="font-serif italic text-xl font-bold tracking-tight">Marginal Abatement Cost (MACC)</h3>
            <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Strategic Prioritization Engine</p>
          </div>
          <div className="flex gap-4">
            <div className="p-4 border border-[#141414]/10 bg-[#F9F9F8]">
              <span className="text-[8px] font-bold uppercase opacity-40 block mb-1">Portfolio Carbon Shadow Price</span>
              <span className="text-sm font-bold">$12.50 / tCO2e</span>
            </div>
            <div className="p-4 border border-[#141414]/10 bg-[#F9F9F8]">
              <span className="text-[8px] font-bold uppercase opacity-40 block mb-1">Transition ROI</span>
              <span className="text-sm font-bold text-emerald-600">+14.2%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {[
            { project: "EV Fleet Conversion", cost: -45, potential: 120, status: "Feasible" },
            { project: "Solar Rooftop HO", cost: -12, potential: 450, status: "Active" },
            { project: "HVAC Optimization", cost: 15, potential: 85, status: "Review" },
            { project: "REC Procurement", cost: 65, potential: 1200, status: "Planned" },
          ].map((proj, i) => (
            <div key={i} className="group border border-[#141414] p-6 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className={cn(
                  "text-[8px] font-bold uppercase px-1.5 py-0.5 border",
                  proj.cost < 0 ? "border-emerald-500/30 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white" : "border-amber-500/30 text-amber-500 group-hover:bg-amber-500 group-hover:text-white"
                )}>
                  {proj.cost < 0 ? "Cost Saving" : "Capital Required"}
                </span>
                <span className="text-[10px] font-bold opacity-40 uppercase group-hover:opacity-100">{proj.status}</span>
              </div>
              <h4 className="text-sm font-bold uppercase tracking-tight mb-4">{proj.project}</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[9px] font-bold uppercase opacity-60 group-hover:opacity-100 mb-1">
                    <span>Cost of Decarbonization</span>
                    <span>${proj.cost}/t</span>
                  </div>
                  <div className="h-1 bg-[#141414]/10 w-full group-hover:bg-white/10">
                    <div 
                      className={cn("h-full", proj.cost < 0 ? "bg-emerald-400" : "bg-amber-400")} 
                      style={{ width: `${Math.abs(proj.cost)}%` }} 
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[9px] font-bold uppercase opacity-60 group-hover:opacity-100 mb-1">
                    <span>Reduction Potential</span>
                    <span>{proj.potential} tCO2e</span>
                  </div>
                  <div className="h-1 bg-[#141414]/10 w-full group-hover:bg-white/10">
                    <div className="h-full bg-sky-400" style={{ width: `${(proj.potential / 1200) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
}
