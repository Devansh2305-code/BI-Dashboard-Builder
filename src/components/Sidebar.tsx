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
  X
} from "lucide-react";
import { Role } from "../types";

interface SidebarProps {
  currentView: "report" | "data" | "measures" | "ai";
  setView: (view: "report" | "data" | "measures" | "ai") => void;
  activeRole: Role;
  setRole: (role: Role) => void;
  dataLoaded: boolean;
  onClose?: () => void;
}

export default function Sidebar({ 
  currentView, 
  setView, 
  activeRole, 
  setRole,
  dataLoaded,
  onClose
}: SidebarProps) {
  const views = [
    { id: "report", label: "Report Canvas", icon: LayoutDashboard, desc: "Design & visualize" },
    { id: "data", label: "Data View", icon: Database, desc: "Explore raw records" },
    { id: "measures", label: "Measures & Modeling", icon: Calculator, desc: "Formulas & KPI rules" },
    { id: "ai", label: "AI Insights", icon: Sparkles, desc: "Gemini narratives" },
  ] as const;

  const roles: Role[] = ["CMO", "Business Analyst", "CFO", "Sales Director", "HR Specialist", "CEO"];

  const handleRoleChange = (role: Role) => {
    setRole(role);
    onClose?.();
  };

  const handleViewChange = (view: "report" | "data" | "measures" | "ai") => {
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

      {/* Role Picker Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <label htmlFor="role-select" className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block mb-2 px-1">
          Role Profile View
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <select
            id="role-select"
            value={activeRole}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            className="w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer font-medium appearance-none"
          >
            {roles.map((role) => (
              <option key={role} value={role} className="dark:bg-slate-900">
                {role} Profile
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
        </div>
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
      </nav>

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
