/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import RawDataImporter from "./components/RawDataImporter";
import ReportCanvas from "./components/ReportCanvas";
import DataTableView from "./components/DataTableView";
import MeasuresManager from "./components/MeasuresManager";
import AIInsightsPanel from "./components/AIInsightsPanel";
import AdminPanel from "./components/AdminPanel";
import LandingPage from "./components/LandingPage";
import RoleOnboarding from "./components/RoleOnboarding";
import BillingView from "./components/BillingView";
import { Role, ColumnMetadata, Measure, Widget, AIAnalysisResult, PlanType, SavedProject } from "./types";
import { getTemplateForRole } from "./utils";
import { downloadHTMLReport } from "./reportGenerator";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { auth, hasFirebaseConfig } from "./firebase";
import { supabase, hasSupabaseConfig } from "./supabase";
import { 
  Database, 
  RefreshCw, 
  Sliders, 
  TrendingUp, 
  Upload, 
  Layout, 
  HelpCircle,
  FileSpreadsheet,
  Sun,
  Moon,
  FileDown,
  Menu,
  Shield,
  LogOut,
  PieChart,
  Loader,
  X,
  Sparkles
} from "lucide-react";

const getDefaultWidgets = (role: Role, availableMeasures: Measure[]): Widget[] => {
  const getMId = (prefix: string) => {
    return availableMeasures.find(m => m.id.includes(prefix))?.id || availableMeasures[0]?.id || "";
  };

  switch (role) {
    case "CMO":
      return [
        {
          id: "cmo_kpi_rev",
          title: "Revenue Actualized",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("rev_sum")], colorTheme: "emerald", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "cmo_kpi_spend",
          title: "Ad Spend Outlay",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("spend_sum")], colorTheme: "indigo", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "cmo_kpi_roas",
          title: "Return on Ad Spend (ROAS)",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("roas")], colorTheme: "amber", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "cmo_chart_bar",
          title: "Ad Outlay vs Revenue Return by Channel",
          type: "bar",
          config: { xAxis: "Channel", yAxisMeasures: [getMId("spend_sum"), getMId("rev_sum")], colorTheme: "indigo", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        },
        {
          id: "cmo_chart_line",
          title: "Conversions & Action Acquisition Count",
          type: "line",
          config: { xAxis: "Date", yAxisMeasures: [getMId("conv_sum")], colorTheme: "emerald", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        }
      ];
    case "Business Analyst":
      return [
        {
          id: "ba_kpi_gross",
          title: "Gross Sales Volume",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("sales_sum")], colorTheme: "indigo", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "ba_kpi_net",
          title: "Net Sales Actual",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("net_sales")], colorTheme: "emerald", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "ba_kpi_units",
          title: "Volume Dispatch (Units)",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("units_sum")], colorTheme: "sky", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "ba_chart_category",
          title: "Gross Sales Contribution by Category",
          type: "bar",
          config: { xAxis: "Product Category", yAxisMeasures: [getMId("sales_sum")], colorTheme: "indigo", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        },
        {
          id: "ba_chart_region",
          title: "Discounts applied by Regional Market",
          type: "area",
          config: { xAxis: "Region", yAxisMeasures: [getMId("discounts_sum")], colorTheme: "rose", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        }
      ];
    case "CFO":
      return [
        {
          id: "cfo_kpi_income",
          title: "Actual Cash Inflows",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("cfo_income")], colorTheme: "emerald", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "cfo_kpi_spend",
          title: "Operating Expenses (OpEx)",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("cfo_spend")], colorTheme: "rose", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "cfo_kpi_variance",
          title: "Capital Buffer Variance",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("cfo_variance")], colorTheme: "amber", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "cfo_chart_dept",
          title: "OpEx Burn vs Budget Allocation by Dept",
          type: "bar",
          config: { xAxis: "Department", yAxisMeasures: [getMId("cfo_spend"), getMId("cfo_budget")], colorTheme: "sky", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        },
        {
          id: "cfo_chart_month",
          title: "Inflows by Operating Month",
          type: "line",
          config: { xAxis: "Month", yAxisMeasures: [getMId("cfo_income")], colorTheme: "emerald", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        }
      ];
    case "Sales Director":
      return [
        {
          id: "sales_kpi_rev",
          title: "Total Closed Revenue",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("sales_revenue")], colorTheme: "emerald", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "sales_kpi_leads",
          title: "Total Lead Pipeline",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("sales_leads")], colorTheme: "indigo", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "sales_kpi_win",
          title: "Average Lead Win Rate",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("sales_win_rate")], colorTheme: "amber", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "sales_chart_mgr",
          title: "Deals Won by Account Manager",
          type: "bar",
          config: { xAxis: "Account Manager", yAxisMeasures: [getMId("sales_won")], colorTheme: "sky", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        },
        {
          id: "sales_chart_combo",
          title: "Leads vs Deals Won (Combo Analysis)",
          type: "combo",
          config: { xAxis: "Region", yAxisMeasures: [getMId("sales_leads"), getMId("sales_won")], colorTheme: "emerald", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        }
      ];
    case "HR Specialist":
      return [
        {
          id: "hr_kpi_count",
          title: "Total Workforce Headcount",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("hr_headcount")], colorTheme: "indigo", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "hr_kpi_turnover",
          title: "Attrition Index %",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("hr_turnover_rate")], colorTheme: "rose", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "hr_kpi_sat",
          title: "Employee Satisfaction Index",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("hr_avg_sat")], colorTheme: "amber", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "hr_chart_training",
          title: "Training Hours Logged by Department",
          type: "bar",
          config: { xAxis: "Department", yAxisMeasures: [getMId("hr_training")], colorTheme: "sky", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        },
        {
          id: "hr_chart_sat_trend",
          title: "Satisfaction Index by Reporting Cycle",
          type: "line",
          config: { xAxis: "Month", yAxisMeasures: [getMId("hr_avg_sat")], colorTheme: "emerald", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        }
      ];
    case "CEO":
      return [
        {
          id: "ceo_kpi_rev",
          title: "Total Enterprise Revenue",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("ceo_revenue")], colorTheme: "emerald", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "ceo_kpi_ebitda",
          title: "EBITDA Operating Income",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("ceo_ebitda")], colorTheme: "indigo", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "ceo_kpi_nps",
          title: "Brand NPS Score Average",
          type: "kpi",
          config: { xAxis: "", yAxisMeasures: [getMId("ceo_avg_nps")], colorTheme: "amber", showLegend: false, showGrid: false },
          gridSpan: "col-span-2"
        },
        {
          id: "ceo_chart_radar",
          title: "Enterprise EBITDA Margin % by Region",
          type: "radar",
          config: { xAxis: "Region", yAxisMeasures: [getMId("ceo_ebitda_margin")], colorTheme: "rose", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        },
        {
          id: "ceo_chart_scatter",
          title: "Revenue vs Operating Expenses (Scatter Plot)",
          type: "scatter",
          config: { xAxis: "Region", yAxisMeasures: [getMId("ceo_revenue"), getMId("ceo_opex")], colorTheme: "indigo", showLegend: true, showGrid: true },
          gridSpan: "col-span-3"
        }
      ];
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (!hasFirebaseConfig) {
      const saved = localStorage.getItem("bi-mock-user");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState(true);

  const [activeRole, setActiveRole] = useState<Role>(() => {
    const saved = localStorage.getItem("bi-active-role");
    return (saved as Role) || "CMO";
  });
  
  const [isCustomDataset, setIsCustomDataset] = useState<boolean>(() => {
    return localStorage.getItem("bi-is-custom-dataset") === "true";
  });

  const [dataset, setDataset] = useState<any[]>(() => {
    const saved = localStorage.getItem("bi-dataset");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [columns, setColumns] = useState<ColumnMetadata[]>(() => {
    const saved = localStorage.getItem("bi-columns");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [measures, setMeasures] = useState<Measure[]>(() => {
    const saved = localStorage.getItem("bi-measures");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [widgets, setWidgets] = useState<Widget[]>(() => {
    const saved = localStorage.getItem("bi-widgets");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [currentView, setView] = useState<"report" | "data" | "measures" | "ai" | "admin" | "billing">(() => {
    const saved = localStorage.getItem("bi-current-view");
    return (saved as any) || "report";
  });

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme-mode") === "dark";
  });
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return localStorage.getItem("admin-key") !== null;
  });

  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);

  const [aiCleanMessage, setAiCleanMessage] = useState<string | null>(null);
  const isFirstMount = useRef(true);

  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [analysesLeft, setAnalysesLeft] = useState<number>(5);
  const [projectSlots, setProjectSlots] = useState<number>(1);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  // Synchronize with logged-in user details
  useEffect(() => {
    const uid = currentUser?.uid || "anonymous";
    if (uid === "anonymous") {
      setUserPlan("free");
      setAnalysesLeft(5);
      setProjectSlots(1);
      setSavedProjects([]);
      return;
    }
    
    // 1. Initial load from localStorage (instant cache read)
    const plan = localStorage.getItem(`bi-plan-${uid}`) as PlanType || "free";
    const credits = localStorage.getItem(`bi-credits-${uid}`);
    const slots = localStorage.getItem(`bi-slots-${uid}`);
    const projs = localStorage.getItem(`bi-projects-${uid}`);

    setUserPlan(plan);
    setAnalysesLeft(credits ? parseInt(credits, 10) : 5);
    setProjectSlots(slots ? parseInt(slots, 10) : (plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 1));

    if (projs) {
      try {
        setSavedProjects(JSON.parse(projs));
      } catch (e) {
        setSavedProjects([]);
      }
    } else {
      setSavedProjects([]);
    }

    // 2. Fetch from Supabase for real-time cross-device sync
    if (hasSupabaseConfig && uid !== "admin-uid" && uid !== "anonymous") {
      supabase
        .from("users")
        .select("*")
        .eq("user_id", uid)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            const serverPlan = data.plan as PlanType || "free";
            const serverCredits = data.analyses_left !== undefined ? Number(data.analyses_left) : 5;
            const serverSlots = data.project_slots !== undefined ? Number(data.project_slots) : (serverPlan === "free" ? 1 : serverPlan === "prime" ? 5 : serverPlan === "apex" ? 60 : 1);

            // Update states if they differ from localStorage cache
            setUserPlan(serverPlan);
            setAnalysesLeft(serverCredits);
            setProjectSlots(serverSlots);

            // Save back to localStorage cache
            localStorage.setItem(`bi-plan-${uid}`, serverPlan);
            localStorage.setItem(`bi-credits-${uid}`, String(serverCredits));
            localStorage.setItem(`bi-slots-${uid}`, String(serverSlots));
          }
        })
        .catch((err) => {
          console.warn("Supabase fetch on login failed:", err);
        });
    }
  }, [currentUser]);

  // Synchronize master bi-global-users database for Admin Console visibility
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const email = currentUser.email || "no-email@dataglance.com";
    
    // Skip system admin
    if (email === "admin@dataglance.com") return;

    const roleJson = currentUser.displayName || '{"name":"User","role":"Business Analyst"}';
    let parsedRole = "Business Analyst";
    let userName = "User";
    try {
      const p = JSON.parse(roleJson);
      parsedRole = p.role || "Business Analyst";
      userName = p.name || "User";
    } catch (e) {}

    const stored = localStorage.getItem("bi-global-users");
    let list: any[] = stored ? JSON.parse(stored) : [];

    const existingIdx = list.findIndex(u => u.userId === uid);
    let changed = false;
    let userObj: any = null;

    if (existingIdx === -1) {
      userObj = {
        userId: uid,
        email,
        name: userName,
        role: parsedRole,
        plan: userPlan,
        analysesLeft,
        projectSlots,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.push(userObj);
      changed = true;
    } else {
      userObj = { ...list[existingIdx] };
      if (userObj.plan !== userPlan) {
        userObj.plan = userPlan;
        changed = true;
      }
      if (userObj.analysesLeft !== analysesLeft) {
        userObj.analysesLeft = analysesLeft;
        changed = true;
      }
      if (userObj.projectSlots !== projectSlots) {
        userObj.projectSlots = projectSlots;
        changed = true;
      }
      if (changed) {
        userObj.updatedAt = new Date().toISOString();
        list[existingIdx] = userObj;
      }
    }

    if (changed) {
      localStorage.setItem("bi-global-users", JSON.stringify(list));
    }

    // Always push updates to Supabase if configured to ensure other browsers see it
    if (hasSupabaseConfig && uid !== "admin-uid" && uid !== "anonymous") {
      try {
        supabase
          .from("users")
          .upsert({
            user_id: uid,
            email,
            name: userName,
            role: parsedRole,
            plan: userPlan,
            analyses_left: analysesLeft,
            project_slots: projectSlots,
            updated_at: new Date().toISOString()
          })
          .catch(err => {
            console.warn("Supabase user sync failed:", err);
          });
      } catch (e) {
        console.warn("Supabase sync trigger failed:", e);
      }
    }
  }, [currentUser, userPlan, analysesLeft, projectSlots]);

  const handleDecrementAnalyses = () => {
    if (userPlan !== "free") return; // Premium plans have unlimited narratives
    const uid = currentUser?.uid || "anonymous";
    const nextCredits = Math.max(analysesLeft - 1, 0);
    setAnalysesLeft(nextCredits);
    localStorage.setItem(`bi-credits-${uid}`, String(nextCredits));
  };

  const handleUpgradePlan = (plan: PlanType, newSlotsCount: number) => {
    const uid = currentUser?.uid || "anonymous";
    setUserPlan(plan);
    setProjectSlots(newSlotsCount);
    localStorage.setItem(`bi-plan-${uid}`, plan);
    localStorage.setItem(`bi-slots-${uid}`, String(newSlotsCount));
  };

  const syncUserPlan = async () => {
    if (!currentUser || currentUser.uid === "anonymous" || currentUser.uid === "admin-uid" || !hasSupabaseConfig) return;
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", currentUser.uid)
        .single();
      if (data && !error) {
        const serverPlan = data.plan as PlanType || "free";
        const serverCredits = data.analyses_left !== undefined ? Number(data.analyses_left) : 5;
        const serverSlots = data.project_slots !== undefined ? Number(data.project_slots) : (serverPlan === "free" ? 1 : serverPlan === "prime" ? 5 : serverPlan === "apex" ? 60 : 1);

        setUserPlan(serverPlan);
        setAnalysesLeft(serverCredits);
        setProjectSlots(serverSlots);

        localStorage.setItem(`bi-plan-${currentUser.uid}`, serverPlan);
        localStorage.setItem(`bi-credits-${currentUser.uid}`, String(serverCredits));
        localStorage.setItem(`bi-slots-${currentUser.uid}`, String(serverSlots));
        alert("Subscription and limits refreshed successfully!");
      } else {
        alert("Could not fetch latest plan details. Please check connection.");
      }
    } catch (e) {
      console.warn("Failed to sync plan:", e);
      alert("An error occurred during synchronization.");
    }
  };

  const handleSaveCurrentProject = (name: string) => {
    if (savedProjects.length >= projectSlots) {
      alert(`You have reached the limit of ${projectSlots} saved projects for your plan. Please upgrade your plan in Billing.`);
      setView("billing");
      return;
    }

    const uid = currentUser?.uid || "anonymous";
    const newProject: SavedProject = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      dataset,
      columns,
      measures,
      widgets,
      updatedAt: new Date().toISOString()
    };

    const updatedProjects = [...savedProjects, newProject];
    setSavedProjects(updatedProjects);
    localStorage.setItem(`bi-projects-${uid}`, JSON.stringify(updatedProjects));
    alert(`Project "${name}" saved successfully!`);
  };

  const handleLoadProject = (id: string) => {
    const proj = savedProjects.find(p => p.id === id);
    if (!proj) return;

    setDataset(proj.dataset);
    setColumns(proj.columns);
    setMeasures(proj.measures);
    setWidgets(proj.widgets);
    setIsCustomDataset(true);
    setAiAnalysisResult(null);
    setView("report");
    alert(`Project "${proj.name}" loaded successfully!`);
  };

  const handleDeleteProject = (id: string) => {
    const uid = currentUser?.uid || "anonymous";
    const updatedProjects = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updatedProjects);
    localStorage.setItem(`bi-projects-${uid}`, JSON.stringify(updatedProjects));
  };

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setAuthLoading(false);
      return;
    }

    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user && user.displayName) {
        try {
          const profile = JSON.parse(user.displayName);
          if (profile.role) {
            setActiveRole(profile.role);
          }
        } catch (e) {
          // Plain text profile display name from Google Sign-In
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelectRole = async (role: Role) => {
    if (hasFirebaseConfig && auth && auth.currentUser) {
      const name = auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "User";
      const profileJson = JSON.stringify({ name, role });
      await updateProfile(auth.currentUser, { displayName: profileJson });
      setCurrentUser({
        ...auth.currentUser,
        displayName: profileJson
      });
    } else {
      if (currentUser) {
        const name = currentUser.email.split("@")[0];
        const updatedUser = {
          ...currentUser,
          displayName: JSON.stringify({ name, role })
        };
        setCurrentUser(updatedUser);
        localStorage.setItem("bi-mock-user", JSON.stringify(updatedUser));
      }
    }
    setActiveRole(role);
  };

  const handleMockLogin = (mockUser: { uid: string; email: string; displayName: string }) => {
    setCurrentUser(mockUser);
    localStorage.setItem("bi-mock-user", JSON.stringify(mockUser));
    
    // Check if logging in as Admin
    if (mockUser.email === "admin@dataglance.com") {
      setIsAdminMode(true);
      setView("admin");
      return;
    }

    if (mockUser.displayName) {
      try {
        const profile = JSON.parse(mockUser.displayName);
        if (profile.role) {
          setActiveRole(profile.role);
        }
      } catch (e) {
        // No role parsed
      }
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("admin-key");
    setIsAdminMode(false);
    
    if (hasFirebaseConfig && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Sign out failed:", err);
      }
    } else {
      localStorage.removeItem("bi-mock-user");
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme-mode", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme-mode", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("bi-active-role", activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem("bi-is-custom-dataset", isCustomDataset ? "true" : "false");
  }, [isCustomDataset]);

  useEffect(() => {
    localStorage.setItem("bi-dataset", JSON.stringify(dataset));
  }, [dataset]);

  useEffect(() => {
    localStorage.setItem("bi-columns", JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem("bi-measures", JSON.stringify(measures));
  }, [measures]);

  useEffect(() => {
    localStorage.setItem("bi-widgets", JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    localStorage.setItem("bi-current-view", currentView);
  }, [currentView]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      const savedDataset = localStorage.getItem("bi-dataset");
      if (savedDataset) {
        return;
      }
    }

    if (isCustomDataset && dataset.length > 0 && columns.length > 0) {
      return;
    }

    const template = getTemplateForRole(activeRole);
    setDataset(template.data);
    setColumns(template.columns);
    setMeasures(template.measures);
    setIsCustomDataset(false);
    setAiAnalysisResult(null);
    setWidgets(getDefaultWidgets(activeRole, template.measures));
  }, [activeRole, isCustomDataset, dataset.length, columns.length]);

  const handleImportCustomData = (importedData: any[], importedColumns: ColumnMetadata[], cleanSummary?: string | null) => {
    setDataset(importedData);
    setColumns(importedColumns);
    setIsCustomDataset(true);
    setAiAnalysisResult(null);
    setIsImportOpen(false);

    const numericCols = importedColumns.filter(c => c.type === "number");
    const autoMeasures: Measure[] = numericCols.map((col, index) => ({
      id: `auto_sum_${index}`,
      name: `Sum of ${col.name}`,
      formula: `SUM(${col.name})`,
      expressionType: "simple",
      columnName: col.name,
      aggregation: "SUM",
      format: col.name.toLowerCase().includes("spend") || col.name.toLowerCase().includes("sales") || col.name.toLowerCase().includes("revenue") || col.name.toLowerCase().includes("income") || col.name.toLowerCase().includes("cost") ? "currency" : "number",
      isCustom: false,
      description: `Auto-generated sum aggregation of ${col.name}.`,
    }));

    setMeasures(autoMeasures);

    const stringCols = importedColumns.filter(c => c.type === "string");
    const defaultXAxis = stringCols[0]?.name || importedColumns[0]?.name || "";
    
    const freshWidgets: Widget[] = [];
    
    autoMeasures.slice(0, 3).forEach((measure, idx) => {
      freshWidgets.push({
        id: `auto_kpi_${idx}`,
        title: measure.name,
        type: "kpi",
        config: {
          xAxis: "",
          yAxisMeasures: [measure.id],
          colorTheme: idx === 0 ? "indigo" : idx === 1 ? "emerald" : "amber",
          showLegend: false,
          showGrid: false
        },
        gridSpan: "col-span-2"
      });
    });

    if (defaultXAxis && autoMeasures[0]) {
      freshWidgets.push({
        id: "auto_bar_chart",
        title: `${autoMeasures[0].name} by ${defaultXAxis}`,
        type: "bar",
        config: {
          xAxis: defaultXAxis,
          yAxisMeasures: [autoMeasures[0].id],
          colorTheme: "indigo",
          showLegend: true,
          showGrid: true
        },
        gridSpan: "col-span-3"
      });
    }

    if (defaultXAxis && autoMeasures[1]) {
      freshWidgets.push({
        id: "auto_line_chart",
        title: `${autoMeasures[1].name} by ${defaultXAxis}`,
        type: "line",
        config: {
          xAxis: defaultXAxis,
          yAxisMeasures: [autoMeasures[1].id],
          colorTheme: "emerald",
          showLegend: true,
          showGrid: true
        },
        gridSpan: "col-span-3"
      });
    }

    setWidgets(freshWidgets);
    setView("report");
    if (cleanSummary) {
      setAiCleanMessage(cleanSummary);
      setTimeout(() => {
        setAiCleanMessage(null);
      }, 7000);
    }
  };

  const handleAddMeasure = (newMeasure: Measure) => {
    setMeasures(prev => [...prev, newMeasure]);
  };

  const handleUpdateMeasure = (id: string, updated: Partial<Measure>) => {
    setMeasures(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
  };

  const handleRemoveMeasure = (id: string) => {
    setMeasures(prev => prev.filter(m => m.id !== id));
    setWidgets(prev => prev.map(w => ({
      ...w,
      config: {
        ...w.config,
        yAxisMeasures: w.config.yAxisMeasures.filter(mId => mId !== id)
      }
    })).filter(w => w.type !== "kpi" || w.config.yAxisMeasures.length > 0));
  };

  const handleAddWidget = (widget: Widget) => {
    setWidgets(prev => [...prev, widget]);
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const handleUpdateWidget = (id: string, updated: Partial<Widget>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updated } : w));
  };

  const handleReorderWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
  };

  const handleDownloadReport = (filters: Record<string, string> = {}) => {
    let filtered = dataset;
    if (filters) {
      filtered = dataset.filter(row => {
        for (const [colName, val] of Object.entries(filters)) {
          if (val) {
            const rowVal = row[colName];
            const rowValStr = rowVal === null || rowVal === undefined ? "" : String(rowVal);
            if (rowValStr !== val) return false;
          }
        }
        return true;
      });
    }

    downloadHTMLReport(
      filtered,
      columns,
      measures,
      widgets,
      activeRole,
      filters,
      aiAnalysisResult ? aiAnalysisResult.insights : null
    );
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      localStorage.removeItem("admin-key");
      setIsAdminMode(false);
      setView("report");
    } else {
      const key = prompt("Enter admin key:");
      if (key) {
        localStorage.setItem("admin-key", key);
        setIsAdminMode(true);
        setView("admin");
      }
    }
  };

  // User profile and role derivation
  let userRole: Role | null = null;
  let userName = "";
  if (currentUser) {
    if (currentUser.displayName) {
      try {
        const parsed = JSON.parse(currentUser.displayName);
        if (parsed.role) userRole = parsed.role;
        if (parsed.name) userName = parsed.name;
      } catch (e) {
        userName = currentUser.displayName;
      }
    }
    if (!userName) {
      userName = currentUser.email?.split("@")[0] || "User";
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-3 rounded-lg shadow-lg mb-6 animate-pulse">
            <PieChart className="w-8 h-8 stroke-[2.5]" />
          </div>
          <Loader className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LandingPage onMockLogin={handleMockLogin} />;
  }

  if (!userRole) {
    return <RoleOnboarding userName={userName} onSelectRole={handleSelectRole} />;
  }

  return (
    <div id="app-viewport-frame" className={`flex h-screen bg-slate-50 font-sans overflow-hidden print:bg-white print:h-auto ${isDarkMode ? "dark" : ""}`}>
      <div className="hidden lg:block print:hidden h-full">
        <Sidebar 
          currentView={currentView} 
          setView={setView} 
          activeRole={activeRole} 
          setRole={setActiveRole}
          dataLoaded={dataset.length > 0}
          isAdminMode={isAdminMode}
          userPlan={userPlan}
          analysesLeft={analysesLeft}
          projectSlots={projectSlots}
          savedProjects={savedProjects}
          onSaveCurrentProject={handleSaveCurrentProject}
          onLoadProject={handleLoadProject}
          onDeleteProject={handleDeleteProject}
        />
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden print:hidden" id="mobile-sidebar-drawer">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-slate-900 focus:outline-none shadow-xl transform transition-transform duration-200">
            <Sidebar 
              currentView={currentView} 
              setView={setView} 
              activeRole={activeRole} 
              setRole={setActiveRole}
              dataLoaded={dataset.length > 0}
              isAdminMode={isAdminMode}
              onClose={() => setIsMobileMenuOpen(false)}
              userPlan={userPlan}
              analysesLeft={analysesLeft}
              projectSlots={projectSlots}
              savedProjects={savedProjects}
              onSaveCurrentProject={handleSaveCurrentProject}
              onLoadProject={handleLoadProject}
              onDeleteProject={handleDeleteProject}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:h-auto print:overflow-visible">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 print:hidden shadow-xs">
          <div className="flex items-center space-x-2 sm:space-x-3.5">
            <button
              id="btn-open-mobile-menu"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-800 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 hidden xs:inline">Profile:</span>
              <span className="text-blue-700 dark:text-blue-400 font-bold">{activeRole}</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono hidden sm:inline-block">
              Dataset Context: <strong className="text-slate-600 dark:text-slate-300">{dataset.length}</strong> active rows
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">


            <button
              id="btn-toggle-dark-mode"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500 animate-pulse" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              id="btn-global-download-report"
              onClick={() => handleDownloadReport({})}
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs py-2 px-3 sm:px-4 rounded-lg transition flex items-center gap-1.5 shadow-sm"
              title="Download clean executive report as PDF"
            >
              <FileDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">Download Report</span>
            </button>

            {!isAdminMode && (
              <button
                id="btn-toggle-importer"
                onClick={() => setIsImportOpen(!isImportOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 sm:px-4 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isImportOpen ? "View Dashboard" : "Import CSV / Excel"}</span>
                <span className="inline sm:hidden">{isImportOpen ? "View" : "Import"}</span>
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden xs:block" />

            <div className="hidden xs:flex flex-col items-end leading-none text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-28 truncate">{userName}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-28 truncate">{currentUser?.email}</span>
            </div>

            <button
              id="btn-logout"
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/20 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-450 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/50 transition cursor-pointer"
              title={`Logged in as ${userName} (${currentUser?.email}). Click to log out.`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden print:overflow-visible">
          {currentView === "admin" && isAdminMode ? (
            <AdminPanel />
          ) : isImportOpen ? (
            <div className="h-full overflow-y-auto p-6 bg-slate-50">
              <div className="max-w-xl mx-auto text-center mb-4">
                <button 
                  onClick={() => setIsImportOpen(false)} 
                  className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline"
                >
                  ← Return back to active report dashboard
                </button>
              </div>
              <RawDataImporter 
                activeRole={activeRole} 
                onImport={handleImportCustomData}
                currentDataLength={dataset.length}
              />
            </div>
          ) : (
            <>
              {currentView === "report" && (
                <ReportCanvas 
                  dataset={dataset}
                  columns={columns}
                  measures={measures}
                  widgets={widgets}
                  onAddWidget={handleAddWidget}
                  onRemoveWidget={handleRemoveWidget}
                  onUpdateWidget={handleUpdateWidget}
                  onReorderWidgets={handleReorderWidgets}
                  onDownloadReport={handleDownloadReport}
                />
              )}

              {currentView === "data" && (
                <div id="data-view-scroll" className="h-full overflow-y-auto">
                  <DataTableView 
                    dataset={dataset}
                    columns={columns}
                    measures={measures}
                  />
                </div>
              )}

              {currentView === "measures" && (
                <div id="measures-view-scroll" className="h-full overflow-y-auto">
                  <MeasuresManager 
                    measures={measures}
                    columns={columns}
                    dataset={dataset}
                    onAddMeasure={handleAddMeasure}
                    onRemoveMeasure={handleRemoveMeasure}
                    onUpdateMeasure={handleUpdateMeasure}
                  />
                </div>
              )}

              {currentView === "ai" && (
                <div id="ai-view-scroll" className="h-full overflow-y-auto">
                  <AIInsightsPanel 
                    dataset={dataset}
                    activeRole={activeRole}
                    columns={columns}
                    measures={measures}
                    onAddWidget={handleAddWidget}
                    result={aiAnalysisResult}
                    setResult={setAiAnalysisResult}
                    userPlan={userPlan}
                    analysesLeft={analysesLeft}
                    onDecrementAnalyses={handleDecrementAnalyses}
                    setView={setView}
                  />
                </div>
              )}

              {currentView === "admin" && isAdminMode && (
                <AdminPanel />
              )}

              {currentView === "billing" && (
                <div id="billing-view-scroll" className="h-full overflow-y-auto">
                  <BillingView 
                    currentPlan={userPlan}
                    analysesLeft={analysesLeft}
                    projectSlots={projectSlots}
                    savedProjectsCount={savedProjects.length}
                    onUpgradePlan={handleUpgradePlan}
                    currentUser={currentUser}
                    onRefreshPlan={syncUserPlan}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* AI Data Cleaning Toast Notification */}
      {aiCleanMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 dark:bg-slate-950/98 backdrop-blur-md border border-blue-500/30 rounded-xl shadow-2xl p-4 flex gap-3 text-slate-100 animate-slideIn">
          <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 shrink-0 h-fit">
            <Sparkles className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-white uppercase tracking-wider">AI Quality Cleaned</span>
              <button 
                onClick={() => setAiCleanMessage(null)}
                className="text-slate-500 hover:text-white transition cursor-pointer p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-1">{aiCleanMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
