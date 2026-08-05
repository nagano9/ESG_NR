import React from "react";
import { Download, Filter, Plus, Search, ShieldCheck, UploadCloud } from "lucide-react";
import { toast, Toaster } from "sonner";
import { createAction } from "../../lib/api.ts";
import { useAuth } from "../../lib/AuthContext.tsx";
import { cn } from "../../lib/utils.ts";

const psStandards = [
  { id: 1, title: "PS1: Assessment and Management of E&S Risks", status: "Compliant", lender: "ADB", gap: "None. ESMS fully operational.", owner: "ESMS Lead", evidence: 14, dueDate: "2026-09-15" },
  { id: 2, title: "PS2: Labor and Working Conditions", status: "Attention Required", lender: "World Bank", gap: "Contractor EHS monitoring lacks real-time reporting at Wind_B.", owner: "HSE Contractor Lead", evidence: 7, dueDate: "2026-08-30" },
  { id: 3, title: "PS3: Resource Efficiency and Pollution Prevention", status: "Compliant", lender: "ADB", gap: "SF6 leakage monitoring improved.", owner: "Environment Lead", evidence: 11, dueDate: "2026-10-10" },
  { id: 4, title: "PS4: Community Health, Safety, and Security", status: "Compliant", lender: "NEXI", gap: "Emergency Response Plan (ERP) synced with local authorities.", owner: "Community Safety", evidence: 9, dueDate: "2026-09-28" },
  { id: 5, title: "PS5: Land Acquisition and Involuntary Resettlement", status: "Attention Required", lender: "ADB", gap: "Livelihood Restoration Plan (LRP) implementation audit due Q3.", owner: "Social Safeguards", evidence: 5, dueDate: "2026-08-25" },
  { id: 6, title: "PS6: Biodiversity Conservation", status: "Compliant", lender: "NEXI", gap: "Critical Habitat Assessment (CHA) verified for Hydro_C.", owner: "Biodiversity Lead", evidence: 12, dueDate: "2026-11-05" },
];

const evidenceDocs = [
  { name: "Environmental Management Plan 2024", type: "PDF", hash: "0x882A...B2", date: "Oct 12" },
  { name: "Land Acquisition Agreement v2.1", type: "PDF", hash: "0x12F3...E8", date: "Sep 05" },
  { name: "OHS Training Records - Wind B", type: "XLSX", hash: "0x9911...C3", date: "Nov 01" },
  { name: "Grid Emission Factor Methodology", type: "PDF", hash: "0xAA21...D9", date: "Aug 22" },
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

export function IFCChecklist() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [lenderFilter, setLenderFilter] = React.useState("All");
  const [creatingId, setCreatingId] = React.useState<number | null>(null);
  const { getToken } = useAuth();

  const lenders = React.useMemo(() => ["All", ...Array.from(new Set(psStandards.map((ps) => ps.lender)))], []);
  const filteredStandards = React.useMemo(() => psStandards.filter((ps) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || ps.title.toLowerCase().includes(query) || ps.gap.toLowerCase().includes(query) || ps.owner.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || ps.status === statusFilter;
    const matchesLender = lenderFilter === "All" || ps.lender === lenderFilter;
    return matchesSearch && matchesStatus && matchesLender;
  }), [lenderFilter, searchTerm, statusFilter]);
  const summary = React.useMemo(() => {
    const compliant = psStandards.filter((ps) => ps.status === "Compliant").length;
    const attention = psStandards.filter((ps) => ps.status === "Attention Required").length;
    const evidence = psStandards.reduce((total, ps) => total + ps.evidence, 0);
    const score = Math.round((compliant / psStandards.length) * 100);
    return { compliant, attention, evidence, score };
  }, []);

  async function handleCreateAction(ps: typeof psStandards[number]) {
    setCreatingId(ps.id);
    try {
      await createAction({
        orgId: 1,
        title: `Close safeguard gap for ${ps.title}`,
        description: ps.gap,
        owner: ps.owner,
        dueDate: ps.dueDate,
        priority: ps.status === "Attention Required" ? "HIGH" : "MEDIUM",
        sourceType: "IFC Performance Standard",
        sourceId: ps.id,
      }, getToken);
      toast.success("Corrective action created");
    } catch (error) {
      console.error("Failed to create safeguard action", error);
      toast.error("Action creation failed");
    } finally {
      setCreatingId(null);
    }
  }

  function exportRegister() {
    downloadCsv("ifc_safeguard_register.csv", filteredStandards.map((ps) => ({
      Standard: `PS${ps.id}`,
      Title: ps.title,
      Status: ps.status,
      Lender: ps.lender,
      Owner: ps.owner,
      "Due Date": ps.dueDate,
      Evidence: ps.evidence,
      Gap: ps.gap,
    })));
  }

  return (
    <div className="space-y-12">
      <Toaster richColors position="top-right" />
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
            <span className="text-xl font-bold tracking-tighter text-emerald-600">{summary.score}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: "Compliant PS", value: summary.compliant, icon: ShieldCheck },
          { label: "Needs Action", value: summary.attention, icon: Plus },
          { label: "Evidence Docs", value: summary.evidence, icon: UploadCloud },
          { label: "Lender Score", value: `${summary.score}%`, icon: Filter },
        ].map((metric) => (
          <div key={metric.label} className="border border-[#141414] bg-white p-5 shadow-[4px_4px_0_#D4D3D0]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">{metric.label}</span>
              <metric.icon className="h-4 w-4 opacity-50" />
            </div>
            <span className="text-2xl font-bold tracking-tight">{metric.value}</span>
          </div>
        ))}
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

      <div className="flex flex-col gap-3 border border-[#141414] bg-white p-4 md:flex-row md:items-center">
        <label className="flex flex-1 items-center gap-2 border border-[#141414]/20 px-3 py-2">
          <Search className="h-4 w-4 opacity-40" />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search standard, gap, owner" className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none placeholder:opacity-30" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="border border-[#141414]/20 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest outline-none">
          <option>All</option>
          <option>Compliant</option>
          <option>Attention Required</option>
        </select>
        <select value={lenderFilter} onChange={(event) => setLenderFilter(event.target.value)} className="border border-[#141414]/20 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest outline-none">
          {lenders.map((lender) => <option key={lender}>{lender}</option>)}
        </select>
        <button onClick={exportRegister} className="flex items-center justify-center gap-2 border border-[#141414] px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0]">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredStandards.map((ps) => (
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
                <div className="grid grid-cols-2 gap-3 text-[8px] font-bold uppercase tracking-widest opacity-50">
                  <span>Owner: {ps.owner}</span>
                  <span className="text-right">Due: {ps.dueDate}</span>
                </div>
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
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-2.5 border border-[#141414] text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all">
                    <UploadCloud className="h-3.5 w-3.5" /> Evidence
                  </button>
                  <button onClick={() => handleCreateAction(ps)} disabled={creatingId === ps.id} className="flex items-center justify-center gap-2 bg-[#141414] py-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#E4E3E0] hover:opacity-90 disabled:opacity-50">
                    <Plus className="h-3.5 w-3.5" /> {creatingId === ps.id ? "Creating" : "Action"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-[#141414] bg-white overflow-hidden shadow-[8px_8px_0px_0px_#141414]">
        <div className="col-header bg-[#D4D3D0]/30 border-b border-[#141414] flex justify-between items-center">
          <span>Global Evidence Vault (Audit Ready)</span>
          <button onClick={() => downloadCsv("ifc_evidence_vault.csv", evidenceDocs)} className="flex items-center gap-2 text-[9px] opacity-60 hover:opacity-100">
            <Download className="h-3.5 w-3.5" /> Export Vault
          </button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {evidenceDocs.map((doc, i) => (
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
