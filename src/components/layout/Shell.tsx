import React from "react";
import { LayoutDashboard, Globe, FileText, BarChart3, ShieldCheck, ListTodo, Users, ChevronRight, Database, Search, User, Plus, Zap, Building2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { getAccessProfile } from "../../lib/api.ts";
import { useAuth } from "../../lib/AuthContext.tsx";
import type { UserAccessProfile } from "../../types.ts";

interface ShellProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: "entity-workspace", label: "JV Workspace", icon: Building2 },
  { id: "overview", label: "Portfolio Overview", icon: LayoutDashboard },
  { id: "data-entry", label: "Data Submission", icon: Database },
  { id: "ghg", label: "GHG Inventory", icon: Globe },
  { id: "materiality", label: "Materiality", icon: BarChart3 },
  { id: "reporting", label: "Disclosure Builder", icon: FileText },
  { id: "safeguards", label: "Safeguards (IFC)", icon: ShieldCheck },
  { id: "actions", label: "Action Tracker", icon: ListTodo },
  { id: "stakeholders", label: "Stakeholders", icon: Users },
];

export function Shell({ children, activeTab, setActiveTab }: ShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [profile, setProfile] = React.useState<UserAccessProfile | null>(null);
  const { getToken } = useAuth();

  React.useEffect(() => {
    let active = true;
    getAccessProfile(getToken)
      .then((access) => {
        if (active) setProfile(access);
      })
      .catch(() => {
        if (active) setProfile({ email: "", role: "JV", orgIds: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleNavItems = profile?.role === "JV"
    ? navItems.filter((item) => item.id === "entity-workspace")
    : navItems;

  React.useEffect(() => {
    if (profile?.role === "JV" && activeTab !== "entity-workspace") {
      setActiveTab("entity-workspace");
    }
  }, [profile, activeTab, setActiveTab]);

  return (
    <div className="flex h-screen bg-[#E4E3E0] text-[#141414]">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-transparent border-r border-[#141414] transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 border-b border-[#141414]">
          <h1 className="font-serif italic text-xl font-bold tracking-tight">AIPulse | ESG</h1>
          {isSidebarOpen && (
            <p className="text-[9px] uppercase tracking-widest opacity-60 mt-1">Nusantara Renewable Holding</p>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-3 text-[11px] font-bold uppercase tracking-wider transition-all",
                activeTab === item.id 
                  ? "bg-[#141414] text-[#E4E3E0]" 
                  : "text-[#141414] hover:bg-[#141414]/5"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 shrink-0",
                activeTab === item.id ? "text-[#E4E3E0]" : "text-[#141414] opacity-40"
              )} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}

          {isSidebarOpen && (
            <div className="mt-8 px-6">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-30 block mb-4">Intelligence</span>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 py-2 text-[10px] font-bold uppercase hover:text-emerald-600 transition-colors group">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Predictive ROI</span>
                </button>
                <button className="w-full flex items-center gap-3 py-2 text-[10px] font-bold uppercase hover:text-emerald-600 transition-colors">
                  <Plus className="w-3.5 h-3.5 opacity-40" />
                  <span>New Data Stream</span>
                </button>
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-[#141414] bg-[#D4D3D0]/50">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
            <span className="text-[10px] uppercase font-bold opacity-70">AI Assistant Online</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 mt-4 border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
          >
            {isSidebarOpen ? <ChevronRight className="rotate-180 w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="h-20 border-b border-[#141414] flex items-center justify-between px-8 bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
              <input 
                type="text" 
                placeholder="Search metrics, assets, or compliance codes..." 
                className="w-full bg-[#141414]/5 border border-[#141414]/10 py-2.5 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-[#141414] transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                <span className="text-[7px] bg-[#141414]/10 px-1 py-0.5 border border-[#141414]/20">âŒ˜</span>
                <span className="text-[7px] bg-[#141414]/10 px-1 py-0.5 border border-[#141414]/20">K</span>
              </div>
            </div>
            <div className="h-8 w-px bg-[#141414]/10 hidden lg:block" />
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Live System</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 opacity-40" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Audit Secured</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest leading-none">Sustainability Lead</p>
              <p className="text-[9px] italic opacity-60 mt-1 uppercase">FY2024 ACTIVE</p>
            </div>
            <div className="w-10 h-10 border border-[#141414] bg-[#141414] text-white flex items-center justify-center shadow-[4px_4px_0px_0px_#A09F9C]">
              <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
