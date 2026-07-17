import React from "react";
import { 
  LayoutDashboard, 
  Database, 
  Calculator, 
  Sparkles, 
  Settings, 
  BrainCircuit,
  PieChart,
  Grid,
  Users,
  ChevronDown,
  X,
  Shield,
  CreditCard,
  Plus,
  TrendingUp
} from "lucide-react";
import { Role, PlanType, SavedProject } from "../types";

interface SidebarProps {
  currentView: "report" | "data" | "measures" | "ai" | "admin" | "billing" | "startup";
  setView: (view: "report" | "data" | "measures" | "ai" | "admin" | "billing" | "startup") => void;
  activeRole: Role;
  setRole: (role: Role) => void;
  dataLoaded: boolean;
  isAdminMode?: boolean;
  onClose?: () => void;

  // Billing & Project props
  userPlan: PlanType;
  analysesLeft: number;
  projectSlots: number;
  savedProjects: SavedProject[];
  onSaveCurrentProject: (name: string) => void;
  onLoadProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
}

export default function Sidebar({ 
  currentView, 
  setView, 
  activeRole, 
  setRole,
  dataLoaded,
  isAdminMode = false,
  onClose,
  userPlan,
  analysesLeft,
  projectSlots,
  savedProjects,
  onSaveCurrentProject,
  onLoadProject,
  onDeleteProject
}: SidebarProps) {
  const views = [
    { id: "report", label: "Report Canvas", icon: LayoutDashboard, desc: "Design & visualize" },
    { id: "data", label: "Data View", icon: Database, desc: "Explore raw records" },
    { id: "measures", label: "Measures & Modeling", icon: Calculator, desc: "Formulas & KPI rules" },
    { id: "ai", label: "AI Insights", icon: Sparkles, desc: "Gemini narratives" },
    { id: "startup", label: "Startup Analyst", icon: TrendingUp, desc: "Runway & unit economics" },
    { id: "billing", label: "Billing & Plans", icon: CreditCard, desc: "Manage subscription limits" },
  ] as const;

  const roles: Role[] = ["CMO", "Business Analyst", "CFO", "Sales Director", "HR Specialist", "CEO"];

  const handleRoleChange = (role: Role) => {
    setRole(role);
    onClose?.();
  };

  const handleViewChange = (view: "report" | "data" | "measures" | "ai" | "admin" | "billing" | "startup") => {
    setView(view);
    onClose?.();
  };

  return (
    <aside 
      id="sidebar-container" 
      className="w-68 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex flex-col h-full shrink-0"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-2 rounded-md shadow-sm">
            <PieChart className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white tracking-tight text-base">DataGlance</h1>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">BI Workspace</p>
          </div>
        </div>
        
        {onClose && (
          <button 
            id="btn-sidebar-close"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
            title="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>


      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block mb-3 px-1">
          Main Menu
        </label>
        {views.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-view-${item.id}`}
              onClick={() => handleViewChange(item.id)}
              className={`w-full flex items-start space-x-3 p-2.5 rounded-lg text-left transition-all duration-150 border group cursor-pointer ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 font-medium shadow-xs"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
                isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              }`} />
              <div className="leading-snug">
                <div className="text-xs font-semibold">{item.label}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 mt-0.5 font-normal">
                  {item.desc}
                </div>
              </div>
            </button>
          );
        })}

        {/* Admin Dashboard Button */}
        {isAdminMode && (
          <>
            <label className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block mb-3 px-1 mt-6">
              Administration
            </label>
            <button
              id="nav-view-admin"
              onClick={() => handleViewChange("admin")}
              className={`w-full flex items-start space-x-3 p-2.5 rounded-lg text-left transition-all duration-150 border group cursor-pointer ${
                currentView === "admin"
                  ? "bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/40 text-purple-700 dark:text-purple-400 font-medium shadow-xs"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Shield className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
                currentView === "admin" ? "text-purple-600 dark:text-purple-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              }`} />
              <div className="leading-snug">
                <div className="text-xs font-semibold">Admin Dashboard</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 mt-0.5 font-normal">
                  Users & configuration
                </div>
              </div>
            </button>
          </>
        )}
      </nav>

      {/* Saved Projects Section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col min-h-0 shrink-0">
        <div className="flex items-center justify-between mb-3 px-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block">
            Saved Projects ({savedProjects.length} / {projectSlots})
          </label>
          <button 
            onClick={() => {
              const name = prompt("Enter project name to save active workspace:");
              if (name) onSaveCurrentProject(name);
            }}
            className="p-1 text-slate-400 hover:text-blue-650 dark:hover:text-blue-450 transition cursor-pointer"
            title="Save current workspace as new project"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1 overflow-y-auto max-h-32 pr-1">
          {savedProjects.length === 0 ? (
            <div className="text-[10px] text-slate-400 dark:text-slate-650 italic px-1.5 py-1">
              No saved projects yet.
            </div>
          ) : (
            savedProjects.map((proj) => (
              <div 
                key={proj.id}
                className="group w-full flex items-center justify-between p-1 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-slate-850/50 hover:border-slate-100 dark:hover:border-slate-800 text-xs transition"
              >
                <button 
                  onClick={() => onLoadProject(proj.id)}
                  className="flex-1 text-left font-medium text-slate-600 dark:text-slate-400 truncate hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                  title={`Load project: ${proj.name}`}
                >
                  {proj.name}
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`Delete project "${proj.name}"?`)) onDeleteProject(proj.id);
                  }}
                  className="p-0.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  title="Delete project"
                >
                  <X className="w-3 h-3 text-slate-400 hover:text-rose-500" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Credits Alert Badge */}
      {userPlan === "free" && (
        <div className="mx-4 mb-3 p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl flex items-start gap-2.5 shrink-0">
          <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="leading-tight flex-1">
            <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Free AI Credits</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{analysesLeft} / 5 audits left</div>
            <button 
              onClick={() => handleViewChange("billing")}
              className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1.5 block cursor-pointer"
            >
              Upgrade to Premium →
            </button>
          </div>
        </div>
      )}

      {/* Footer System Status Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/40 font-medium space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
            SQL_Cluster_01
          </span>
          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">Sync: OK</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Data Layer Connection</span>
          <span className={dataLoaded ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-350 dark:text-slate-600"}>
            {dataLoaded ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
      </div>
    </aside>
  );
}
