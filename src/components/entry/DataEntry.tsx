import React from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Database,
  ShieldCheck,
  Send,
  Save,
  Download,
  History,
  User,
  Trash2
} from "lucide-react";
import { cn } from "../../lib/utils.ts";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, Toaster } from "sonner";

import { ghgSummary2025, jvcEntities } from "../../data/ghgData.ts";

type SubmissionStatus = "Draft" | "Pending Review" | "Approved" | "Revision Needed";

interface ESGEntry {
  id: string;
  category: string;
  metric: string;
  entity: string;
  value: string;
  unit: string;
  source: "SCADA" | "Manual" | "Estimate";
  status: SubmissionStatus;
  lastUpdated: string;
  evidenceCount: number;
}

const entries: ESGEntry[] = [
  { 
    id: "ENT-25-001", 
    category: "Environmental", 
    metric: "Scope 1: Dexlite/B30 Consumption", 
    entity: "Head Office",
    value: "650.3", 
    unit: "Liters", 
    source: "Manual", 
    status: "Approved", 
    lastUpdated: "2025-01-31" ,
    evidenceCount: 1
  },
  { 
    id: "ENT-25-002", 
    category: "Environmental", 
    metric: "Scope 2: Grid Electricity", 
    entity: "Head Office",
    value: "1922.9", 
    unit: "kWh", 
    source: "Manual", 
    status: "Approved", 
    lastUpdated: "2025-01-31",
    evidenceCount: 1
  },
  { 
    id: "ENT-25-003", 
    category: "Environmental", 
    metric: "Scope 3 C6: Business Travel", 
    entity: "Head Office",
    value: "691.8", 
    unit: "Km", 
    source: "Manual", 
    status: "Pending Review", 
    lastUpdated: "2025-01-31",
    evidenceCount: 2
  },
];

const entrySchema = z.object({
  entity: z.string().min(1, "Entity is required"),
  category: z.string().min(1, "Category is required"),
  metric: z.string().min(1, "Metric is required"),
  value: z.string().refine((val) => !isNaN(Number(val)) && val.length > 0, {
    message: "Value must be a valid number",
  }),
  period: z.string().min(1, "Reporting period is required"),
  description: z.string().min(10, "Description must be at least 10 characters for audit trail"),
});

type EntryFormData = z.infer<typeof entrySchema>;

export function DataEntry() {
  const [activeTab, setActiveTab] = React.useState<"list" | "new">("list");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      entity: "Solar Park A (JV Masdar)",
      category: "Environmental",
      metric: "305-1: Direct Emissions",
      value: "",
      period: "",
      description: "",
    },
  });

  // Autosave Feature
  React.useEffect(() => {
    const saved = localStorage.getItem("esg_form_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        reset(parsed);
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
  }, [reset]);

  React.useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem("esg_form_draft", JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit = (data: EntryFormData) => {
    console.log("Submitting:", data);
    toast.success("Submission Successful", {
      description: `${data.metric} data for ${data.entity} has been sent for review.`,
    });
    localStorage.removeItem("esg_form_draft");
    reset();
    setActiveTab("list");
  };

  const handleSaveDraft = () => {
    toast.info("Draft Saved Locally", {
      description: "You can return to this form anytime to complete your submission.",
    });
    setActiveTab("list");
  };

  const exportToCSV = () => {
    const headers = ["ID", "Category", "Metric", "Entity", "Value", "Unit", "Source", "Status", "Last Updated"];
    const rows = entries.map(e => [
      e.id, 
      e.category, 
      e.metric, 
      `"${e.entity}"`, 
      e.value, 
      e.unit, 
      e.source, 
      e.status, 
      e.lastUpdated
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `esg_inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Export Complete", {
      description: "ESG Inventory data has been downloaded as CSV.",
    });
  };

  return (
    <div className="space-y-12">
      <Toaster position="top-right" richColors />
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-[#141414] pb-6">
        <div>
          <h2 className="font-serif italic text-xl font-bold tracking-tight uppercase">JVC Submission Portal</h2>
          <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Data Governance & Evidence Repository</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest border border-[#141414] hover:bg-[#141414]/5 transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => setActiveTab("new")}
            className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#E4E3E0] bg-[#141414] hover:opacity-90 transition-opacity shadow-[4px_4px_0px_0px_#A09F9C]"
          >
            <Plus className="w-4 h-4" /> New Submission
          </button>
        </div>
      </div>

      {activeTab === "list" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Active Submissions */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col border border-[#141414] bg-white overflow-hidden shadow-[8px_8px_0px_0px_#D4D3D0]">
              <div className="grid grid-cols-6 bg-[#D4D3D0]/30 border-b border-[#141414]">
                <div className="col-header col-span-2">Metric</div>
                <div className="col-header">Value</div>
                <div className="col-header">Source</div>
                <div className="col-header">Status</div>
                <div className="col-header text-right">Action</div>
              </div>
              
              <div className="divide-y divide-[#141414]/10">
                {entries.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-6 px-4 py-4 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group cursor-pointer items-center">
                    <div className="col-span-2 flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-[#141414]/5 group-hover:bg-white/10 group-hover:text-white border border-[#141414]/10 group-hover:border-white/20">
                          {entry.entity}
                        </span>
                        <span className="text-[9px] font-bold uppercase opacity-60 group-hover:text-white/40 tracking-widest">{entry.category}</span>
                      </div>
                      <span className="font-bold text-[11px] uppercase tracking-tight">{entry.metric}</span>
                      <span className="text-[9px] italic opacity-60 mt-1">Last: {entry.lastUpdated}</span>
                    </div>
                    <div className="data-value">{entry.value} {entry.unit}</div>
                    <div>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-[#141414]/20 group-hover:border-white/20">
                        {entry.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {entry.status === "Approved" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        {entry.status === "Pending Review" && <Clock className="w-3 h-3 text-sky-500" />}
                        {entry.status === "Draft" && <FileText className="w-3 h-3 text-slate-400" />}
                        <span className="text-[9px] font-bold uppercase">{entry.status}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((step) => (
                          <div 
                            key={step} 
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              step === 1 ? "bg-emerald-500" : 
                              (step === 2 && entry.status !== "Draft") ? "bg-emerald-500" :
                              (step === 3 && entry.status === "Approved") ? "bg-emerald-500" : "bg-[#141414]/10 group-hover:bg-white/10"
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button className="text-[10px] font-bold uppercase underline underline-offset-4 hover:text-emerald-500 transition-colors">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submission Guidance */}
          <div className="space-y-8">
            <div className="bg-[#141414] text-[#E4E3E0] p-6 border border-[#141414] shadow-[8px_8px_0px_0px_#10B981]">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Audit Readiness Tip</span>
              </div>
              <p className="text-[10px] italic opacity-70 leading-relaxed font-serif">
                "For manual entries, ensure the primary data source (e.g., fuel invoices or meter photos) is attached. Auditor SRS 101 requires clear lineage from source to dashboard."
              </p>
            </div>

            <div className="border border-[#141414] p-6 bg-white shadow-[4px_4px_0px_0px_#D4D3D0]">
              <span className="text-[9px] font-bold uppercase opacity-60 block mb-4 border-b border-[#141414]/10 pb-2">Evidence Coverage</span>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold uppercase">GHG Invoices</span>
                  <span className="text-[10px]">85%</span>
                </div>
                <div className="h-2 bg-[#141414]/5">
                  <div className="h-full bg-emerald-500 w-[85%]" />
                </div>
                <div className="flex justify-between items-end mt-4">
                  <span className="text-[10px] font-bold uppercase">Social Grievance Log</span>
                  <span className="text-[10px]">20%</span>
                </div>
                <div className="h-2 bg-[#141414]/5">
                  <div className="h-full bg-amber-500 w-[20%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white border border-[#141414] shadow-[12px_12px_0px_0px_#141414] p-8 space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Submitting Entity (JVC or HO)</label>
              <select 
                {...register("entity")}
                className="w-full border-b-2 border-[#141414] py-2 text-[12px] font-bold uppercase outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="Head Office">Head Office (NR HO)</option>
                {jvcEntities.map(jvc => (
                  <option key={jvc.name} value={jvc.name}>{jvc.name}</option>
                ))}
              </select>
              {errors.entity && <p className="text-[9px] text-red-500 font-bold uppercase mt-1">{errors.entity.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">ESG Category</label>
                <select 
                  {...register("category")}
                  className="w-full border-b-2 border-[#141414] py-2 text-[12px] font-bold uppercase outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="Environmental">Scope 1: Direct</option>
                  <option value="Environmental">Scope 2: Indirect</option>
                  <option value="Environmental">Scope 3: Value Chain</option>
                  <option value="Social">Social / TJSL</option>
                  <option value="Governance">Governance / SMAP</option>
                </select>
                {errors.category && <p className="text-[9px] text-red-500 font-bold uppercase mt-1">{errors.category.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Specific Metric</label>
                <select 
                  {...register("metric")}
                  className="w-full border-b-2 border-[#141414] py-2 text-[12px] font-bold uppercase outline-none focus:border-emerald-500 transition-colors"
                >
                  <optgroup label="Scope 1">
                    <option value="S1: Dexlite/B30 (L)">Dexlite/B30 (L)</option>
                    <option value="S1: Gasoline/Pertamax (L)">Gasoline/Pertamax (L)</option>
                    <option value="S1: Refrigerant Leakage (kg)">Refrigerant Leakage (kg)</option>
                  </optgroup>
                  <optgroup label="Scope 2">
                    <option value="S2: Grid Electricity (kWh)">Grid Electricity (kWh)</option>
                    <option value="S2: EV Charging (kWh)">EV Charging (kWh)</option>
                  </optgroup>
                  <optgroup label="Scope 3">
                    <option value="S3 C6: Business Travel (Km)">Business Travel (Km)</option>
                    <option value="S3 C7: Commuting (L)">Employee Commuting (L)</option>
                    <option value="S3 C15: Investment Revenue">Investment Revenue (IDR)</option>
                  </optgroup>
                </select>
                {errors.metric && <p className="text-[9px] text-red-500 font-bold uppercase mt-1">{errors.metric.message}</p>}
                <div className="bg-[#141414]/5 p-3 border-l-2 border-emerald-500 mt-2">
                  <p className="text-[8px] font-bold uppercase text-emerald-700 mb-1">Standard Methodology</p>
                  <p className="text-[10px] italic opacity-70 leading-tight">
                    {watch("metric")?.startsWith("S1") ? "Fuel consumption data must be sourced from official logs and multiplied by national density and NCV factors." : 
                     watch("metric")?.startsWith("S2") ? "Electricity consumption requires utility bills and application of the current Jamali grid emission factor." :
                     "Scope 3 calculations must follow the GHG Protocol Value Chain standard using validated activity data."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Numerical Value</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="e.g. 450.2" 
                    {...register("value")}
                    className={cn(
                      "w-full border-b-2 py-2 text-[12px] font-bold outline-none transition-colors",
                      Number(watch("value")) > 1000 ? "border-amber-500 bg-amber-50/30" : "border-[#141414] focus:border-emerald-500"
                    )}
                  />
                  {Number(watch("value")) > 1000 && (
                    <div className="absolute right-0 top-2 flex items-center gap-1 text-amber-600 animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[8px] font-bold uppercase">High Variance Detected</span>
                    </div>
                  )}
                </div>
                {errors.value && <p className="text-[9px] text-red-500 font-bold uppercase mt-1">{errors.value.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Reporting Period</label>
                <input 
                  type="month" 
                  {...register("period")}
                  className="w-full border-b-2 border-[#141414] py-2 text-[12px] font-bold outline-none focus:border-emerald-500 transition-colors" 
                />
                {errors.period && <p className="text-[9px] text-red-500 font-bold uppercase mt-1">{errors.period.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Data Source Description</label>
              <textarea 
                placeholder="Describe the calculation methodology or SCADA source tag..." 
                {...register("description")}
                className="w-full border-2 border-[#141414] p-4 text-[11px] min-h-[100px] outline-none focus:border-emerald-500 transition-colors"
              />
              {errors.description && <p className="text-[9px] text-red-500 font-bold uppercase mt-1">{errors.description.message}</p>}
            </div>

            {/* Evidence Upload Area */}
            <div className="border-2 border-dashed border-[#141414]/20 p-8 text-center space-y-4 hover:border-emerald-500/50 transition-colors cursor-pointer group">
              <div className="flex justify-center">
                <Upload className="w-8 h-8 opacity-20 group-hover:opacity-100 group-hover:text-emerald-500 transition-all" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase">Drag & Drop Evidence</p>
                <p className="text-[9px] opacity-60 italic mt-1">PDF, XLSX, or High-Res PNG up to 25MB</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={handleSaveDraft}
                className="flex-1 flex items-center justify-center gap-2 py-4 border border-[#141414] text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#141414]/5 transition-all"
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>
              <button 
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-[6px_6px_0px_0px_#10B981]"
              >
                <Send className="w-4 h-4 text-emerald-400" /> Submit for Review
              </button>
            </div>
            {/* Audit Trail & Integrity Sidebar */}
            <div className="hidden lg:block space-y-6">
              <div className="bg-[#141414] text-white p-6 shadow-[8px_8px_0px_0px_#10B981]">
                <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Data Integrity Proof
                </h4>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] opacity-40 uppercase">SHA-256 Record Hash</span>
                    <span className="text-[9px] font-mono text-emerald-400 break-all">0x8f2a7b1c9d3e5f7a0b2c4d6e8f1a3b5c7d9e0f2a</span>
                  </div>
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex gap-3 items-start border-l border-white/20 pl-4">
                      <div className="text-[8px] opacity-40 uppercase">10:42 AM</div>
                      <div className="text-[10px]">
                        <span className="font-bold text-emerald-400">System:</span> DQR auto-calculated as <span className="underline">1.2 (High)</span> based on SCADA source.
                      </div>
                    </div>
                    <div className="flex gap-3 items-start border-l border-white/20 pl-4">
                      <div className="text-[8px] opacity-40 uppercase">Yesterday</div>
                      <div className="text-[10px]">
                        <span className="font-bold text-sky-400">Compliance:</span> Requested additional evidence for <span className="italic">ENT-25-003</span>.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#141414] p-6 shadow-[6px_6px_0px_0px_#D4D3D0]">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 opacity-60" />
                  <span className="text-[10px] font-bold uppercase opacity-60">Verified Sign-off</span>
                </div>
                <div className="h-16 border border-dashed border-[#141414]/20 flex flex-col items-center justify-center bg-[#F9F9F8]">
                  <span className="text-[9px] italic opacity-40">Awaiting Digital Signature</span>
                  <span className="text-[8px] font-bold uppercase opacity-30 mt-1">(ISO 27001 Protocol)</span>
                </div>
              </div>

              <div className="p-4 border border-[#141414] bg-amber-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-amber-700">Audit Alert</p>
                    <p className="text-[9px] opacity-70 leading-tight mt-1">
                      Historical data for this asset shows a 12% variance from current entry. Manual override requires justification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
