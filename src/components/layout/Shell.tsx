import React from "react";
import {
  BarChart3,
  Bell,
  Building2,
  Database,
  FileText,
  Globe,
  LayoutDashboard,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
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
    <div className="flex h-screen bg-slate-50 text-slate-950">
      <aside
        className={cn(
          "flex flex-col border-r border-slate-200 bg-white transition-all duration-300",
          isSidebarOpen ? "w-72" : "w-20"
        )}
      >
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Globe className="h-5 w-5" />
            </div>
            {isSidebarOpen && (
              <div>
                <h1 className="text-base font-semibold text-slate-950">AIPulse ESG</h1>
                <p className="mt-0.5 text-xs font-medium text-slate-500">PLN NR command workspace</p>
              </div>
            )}
          </div>

          {isSidebarOpen && (
            <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-900">
                {profile?.role === "PLN_NR" ? "Portfolio administrator" : "JV entity access"}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                {profile?.role === "PLN_NR" ? "All entities visible" : "Tenant restricted view"}
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                activeTab === item.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", activeTab === item.id ? "text-emerald-300" : "text-slate-400")} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          {isSidebarOpen && (
            <div className="mb-3 rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-700">System online</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Review queue and tenant filters active</p>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex w-full items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search metrics, assets, or compliance codes..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live</div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                Audit secured
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
              <Bell className="h-4 w-4" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-none text-slate-900">{profile?.role === "PLN_NR" ? "PLN NR" : "JV Entity"}</p>
              <p className="mt-1 text-xs text-slate-500">FY2026 active</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
              <User className="h-4 w-4" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-5 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}
