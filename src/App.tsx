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
import { Role, ColumnMetadata, Measure, Widget } from "./types";
import { getTemplateForRole } from "./utils";
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
  ExternalLink,
  Menu
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

  const [currentView, setView] = useState<"report" | "data" | "measures" | "ai">(() => {
    const saved = localStorage.getItem("bi-current-view");
    return (saved as any) || "report";
  });

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme-mode") === "dark";
  });

  const isFirstMount = useRef(true);

  // Apply dark class and persist theme configuration
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme-mode", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme-mode", "light");
    }
  }, [isDarkMode]);

  // Persist states to localStorage when they change
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

  // Load Initial Dataset Template on Role Change or Startup
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      const savedDataset = localStorage.getItem("bi-dataset");
      if (savedDataset) {
        return; // Skip loading template on startup if we already have saved data
      }
    }

    const template = getTemplateForRole(activeRole);
    setDataset(template.data);
    setColumns(template.columns);
    setMeasures(template.measures);
    setIsCustomDataset(false);
    // Setup matching widgets
    setWidgets(getDefaultWidgets(activeRole, template.measures));
  }, [activeRole]);

  // Handle fully custom file import
  const handleImportCustomData = (importedData: any[], importedColumns: ColumnMetadata[]) => {
    setDataset(importedData);
    setColumns(importedColumns);
    setIsCustomDataset(true);
    setIsImportOpen(false);

    // Create default aggregates automatically for all numeric columns in the uploaded dataset
    const numericCols = importedColumns.filter(c => c.type === "number");
    const autoMeasures: Measure[] = numericCols.map((col, index) => ({
      id: `auto_sum_${index}`,
      name: `Sum of ${col.name}`,
      formula: `SUM(${col.name})`,
      expressionType: "simple",
      columnName: col.name,
      aggregation: "SUM",
      format: col.name.toLowerCase().includes("spend") || col.name.toLowerCase().includes("sales") || col.name.toLowerCase().includes("revenue") || col.name.toLowerCase().includes("income") || col.name.toLowerCase().includes("$") ? "currency" : "integer",
      isCustom: false,
      description: `Auto-generated sum aggregation of ${col.name}.`,
    }));

    setMeasures(autoMeasures);

    // Build some smart default charts using the imported columns
    const stringCols = importedColumns.filter(c => c.type === "string");
    const defaultXAxis = stringCols[0]?.name || importedColumns[0]?.name || "";
    
    const freshWidgets: Widget[] = [];
    
    // Add first 3 numeric metrics as KPI cards
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

    // Add a default Bar Chart
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

    // Add a default Line Chart
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
  };

  const handleAddMeasure = (newMeasure: Measure) => {
    setMeasures(prev => [...prev, newMeasure]);
  };

  const handleUpdateMeasure = (id: string, updated: Partial<Measure>) => {
    setMeasures(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
  };

  const handleRemoveMeasure = (id: string) => {
    setMeasures(prev => prev.filter(m => m.id !== id));
    // Also strip deleted measure out of any widgets currently plotting it
    setWidgets(prev => prev.map(w => ({
      ...w,
      config: {
        ...w.config,
        yAxisMeasures: w.config.yAxisMeasures.filter(mId => mId !== id)
      }
    })).filter(w => w.type !== "kpi" || w.config.yAxisMeasures.length > 0)); // remove KPI cards that are now empty
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

  const handleDownloadReport = () => {
    // Switch to active report view
    setView("report");
    setIsImportOpen(false);
    
    // Give state/DOM a tiny moment to flush and render charts beautifully before browser opens print dialog
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div id="app-viewport-frame" className={`flex h-screen bg-slate-50 font-sans overflow-hidden print:bg-white print:h-auto ${isDarkMode ? "dark" : ""}`}>
      
      {/* Side Navigation Rail - Desktop */}
      <div className="hidden lg:block print:hidden h-full">
        <Sidebar 
          currentView={currentView} 
          setView={setView} 
          activeRole={activeRole} 
          setRole={setActiveRole}
          dataLoaded={dataset.length > 0}
        />
      </div>

      {/* Side Navigation Rail - Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden print:hidden" id="mobile-sidebar-drawer">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Body */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-slate-900 focus:outline-none shadow-xl transform transition-transform duration-200">
            <Sidebar 
              currentView={currentView} 
              setView={setView} 
              activeRole={activeRole} 
              setRole={setActiveRole}
              dataLoaded={dataset.length > 0}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:h-auto print:overflow-visible">
        
        {/* Top Operational Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 print:hidden shadow-xs">
          <div className="flex items-center space-x-2 sm:space-x-3.5">
            {/* Hamburger button for mobile screens */}
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
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center justify-center shadow-xs"
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500 animate-pulse" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              id="btn-global-download-report"
              onClick={handleDownloadReport}
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs py-2 px-2.5 sm:px-3.5 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
              title="Download clean executive report as PDF"
            >
              <FileDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">Download Report</span>
            </button>

            <a
              id="btn-global-open-new-tab"
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs py-2 px-2.5 sm:px-3.5 rounded-lg transition flex items-center space-x-1.5 shadow-sm print:hidden"
              title="Open preview in a new tab for perfect full-screen layout and print capabilities"
            >
              <ExternalLink className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">Open in New Tab</span>
            </a>

            <button
              id="btn-toggle-importer"
              onClick={() => setIsImportOpen(!isImportOpen)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 sm:px-4 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isImportOpen ? "View Dashboard" : "Import CSV / Excel"}</span>
              <span className="inline sm:hidden">{isImportOpen ? "View" : "Import"}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <main className="flex-1 overflow-hidden print:overflow-visible">
          {isImportOpen ? (
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
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

    </div>
  );
}

