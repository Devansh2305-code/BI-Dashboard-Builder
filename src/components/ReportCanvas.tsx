import React, { useState, useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";
import { 
  Plus, 
  Trash2, 
  Settings, 
  ChevronRight, 
  Layout, 
  Maximize2, 
  Minimize2, 
  Palette,
  FileSpreadsheet,
  Download,
  Check,
  Edit,
  Sliders,
  FileDown,
  HelpCircle,
  GripVertical,
  Search,
  X,
  Filter
} from "lucide-react";
import { Widget, Measure, ColumnMetadata, ChartType, WidgetConfig } from "../types";
import { evaluateMeasure, formatMeasureValue } from "../utils";

interface ReportCanvasProps {
  dataset: any[];
  columns: ColumnMetadata[];
  measures: Measure[];
  widgets: Widget[];
  onAddWidget: (widget: Widget) => void;
  onRemoveWidget: (id: string) => void;
  onUpdateWidget: (id: string, updated: Partial<Widget>) => void;
  onReorderWidgets?: (widgets: Widget[]) => void;
}

const PALETTE_COLORS: Record<string, string[]> = {
  indigo: ["#6366f1", "#4f46e5", "#3730a3", "#818cf8", "#c7d2fe"],
  emerald: ["#10b981", "#059669", "#064e3b", "#34d399", "#a7f3d0"],
  amber: ["#f59e0b", "#d97706", "#78350f", "#fbbf24", "#fef3c7"],
  rose: ["#f43f5e", "#e11d48", "#881337", "#fb7185", "#fecdd3"],
  sky: ["#0ea5e9", "#0284c7", "#0c4a6e", "#38bdf8", "#bae6fd"],
  slate: ["#475569", "#334155", "#0f172a", "#64748b", "#cbd5e1"]
};

const THEME_NAMES = [
  { id: "indigo", name: "Classic Cobalt" },
  { id: "emerald", name: "Corporate Emerald" },
  { id: "amber", name: "Amber Alert" },
  { id: "rose", name: "Crimson Rose" },
  { id: "sky", name: "Pacific Breeze" },
  { id: "slate", name: "Slate Minimalist" }
];

const formatYAxis = (value: any) => {
  if (typeof value === "number") {
    if (value >= 1.0e9) return `${(value / 1.0e9).toFixed(1).replace(/\.0$/, "")}B`;
    if (value >= 1.0e6) return `${(value / 1.0e6).toFixed(1).replace(/\.0$/, "")}M`;
    if (value >= 1.0e3) return `${(value / 1.0e3).toFixed(1).replace(/\.0$/, "")}K`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return String(value);
};

export default function ReportCanvas({
  dataset,
  columns,
  measures,
  widgets,
  onAddWidget,
  onRemoveWidget,
  onUpdateWidget,
  onReorderWidgets
}: ReportCanvasProps) {
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Global Canvas Filtering States
  const [globalFilters, setGlobalFilters] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState("");

  // Find filterable categorical columns dynamically (string columns with small unique values count <= 25)
  const filterableColumns = useMemo(() => {
    return columns.filter(col => {
      if (col.type !== "string") return false;
      const uniqueVals = Array.from(new Set(dataset.map(row => row[col.name]))).filter(v => v !== null && v !== undefined && String(v).trim() !== "");
      return uniqueVals.length > 0 && uniqueVals.length <= 25;
    });
  }, [dataset, columns]);

  // Map of unique sorted options for each filterable column
  const columnOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    filterableColumns.forEach(col => {
      const uniqueVals = Array.from(new Set(dataset.map(row => {
        const v = row[col.name];
        return v === null || v === undefined ? "" : String(v);
      }))).filter(Boolean);
      uniqueVals.sort((a, b) => a.localeCompare(b));
      options[col.name] = uniqueVals;
    });
    return options;
  }, [filterableColumns, dataset]);

  // Compute the active filtered dataset to drive all widgets and sparklines
  const filteredDataset = useMemo(() => {
    return dataset.filter(row => {
      // 1. Column specific categorical filters
      for (const colName of Object.keys(globalFilters)) {
        const filterVal = globalFilters[colName];
        if (filterVal) {
          const rowVal = row[colName];
          const rowValStr = rowVal === null || rowVal === undefined ? "" : String(rowVal);
          if (rowValStr !== filterVal) {
            return false;
          }
        }
      }
      // 2. Global fuzzy query search
      if (globalSearch.trim() !== "") {
        const query = globalSearch.toLowerCase();
        const matchesQuery = Object.values(row).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(query)
        );
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [dataset, globalFilters, globalSearch]);

  // Drag and drop layout states
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);
  const [resizingWidgetId, setResizingWidgetId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    // Prevent drag on interactive child nodes or resize handle to avoid interfering with click selection and resizing
    const isInteractive = (e.target as HTMLElement).closest("button") || 
                          (e.target as HTMLElement).closest("select") || 
                          (e.target as HTMLElement).closest("input") ||
                          (e.target as HTMLElement).closest("textarea") ||
                          (e.target as HTMLElement).closest(".resize-handle");
    if (isInteractive) {
      e.preventDefault();
      return;
    }
    setDraggedWidgetId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragOverWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Set to null when leaving the area
    setDragOverWidgetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetId) {
      setDraggedWidgetId(null);
      setDragOverWidgetId(null);
      return;
    }

    const draggedIndex = widgets.findIndex(w => w.id === draggedWidgetId);
    const targetIndex = widgets.findIndex(w => w.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const updatedWidgets = [...widgets];
      const [removed] = updatedWidgets.splice(draggedIndex, 1);
      updatedWidgets.splice(targetIndex, 0, removed);
      
      if (onReorderWidgets) {
        onReorderWidgets(updatedWidgets);
      }
    }

    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  // Dynamically resize widgets grid span on drag
  const handleResizeStart = (e: React.MouseEvent, widget: Widget) => {
    e.preventDefault();
    e.stopPropagation();

    const widgetId = widget.id;
    const cardEl = document.getElementById(`widget-card-${widgetId}`);
    const gridEl = document.getElementById("dashboard-grid-canvas");
    if (!cardEl || !gridEl) return;

    setResizingWidgetId(widgetId);

    const cardRect = cardEl.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();
    
    // Find initial span
    const initialSpanStr = widget.gridSpan || (widget.type === "kpi" ? "col-span-2" : "col-span-3");
    const initialSpan = parseInt(initialSpanStr.replace("col-span-", "")) || 2;

    const startX = e.clientX;
    const startWidth = cardRect.width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const currentWidth = startWidth + deltaX;
      
      // Calculate single column width including gap approximation (6-column layout)
      const totalWidth = gridRect.width;
      const colWidth = totalWidth / 6;

      let newSpan = Math.round(currentWidth / colWidth);
      newSpan = Math.max(1, Math.min(6, newSpan));

      const newSpanClass = `col-span-${newSpan}` as "col-span-1" | "col-span-2" | "col-span-3" | "col-span-4" | "col-span-5" | "col-span-6";
      if (widget.gridSpan !== newSpanClass) {
        onUpdateWidget(widgetId, { gridSpan: newSpanClass });
      }
    };

    const handleMouseUp = () => {
      setResizingWidgetId(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Widget editing form states
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<ChartType>("bar");
  const [editXAxis, setEditXAxis] = useState("");
  const [editYMeasures, setEditYMeasures] = useState<string[]>([]);
  const [editTheme, setEditTheme] = useState("indigo");
  const [editSpan, setEditSpan] = useState<Widget["gridSpan"]>("col-span-3");

  // New Widget Creation states
  const [newTitle, setNewTitle] = useState("New Visual Analytics");
  const [newType, setNewType] = useState<ChartType>("bar");
  const [newXAxis, setNewXAxis] = useState(columns[0]?.name || "Date");
  const [newYMeasures, setNewYMeasures] = useState<string[]>(measures[0] ? [measures[0].id] : []);
  const [newTheme, setNewTheme] = useState("indigo");
  const [newSpan, setNewSpan] = useState<Widget["gridSpan"]>("col-span-3");

  const editingWidget = useMemo(() => {
    return widgets.find(w => w.id === editingWidgetId) || null;
  }, [widgets, editingWidgetId]);

  const handleOpenEditPanel = (w: Widget) => {
    setEditingWidgetId(w.id);
    setEditTitle(w.title);
    setEditType(w.type);
    setEditXAxis(w.config.xAxis);
    setEditYMeasures(w.config.yAxisMeasures);
    setEditTheme(w.config.colorTheme);
    setEditSpan(w.gridSpan || "col-span-3");
  };

  const handleSaveEdit = () => {
    if (!editingWidgetId) return;
    onUpdateWidget(editingWidgetId, {
      title: editTitle,
      type: editType,
      gridSpan: editSpan,
      config: {
        xAxis: editXAxis,
        yAxisMeasures: editYMeasures,
        colorTheme: editTheme,
        showLegend: true,
        showGrid: true,
        limit: 15
      }
    });
    setEditingWidgetId(null);
  };

  const handleCreateWidget = () => {
    const freshWidget: Widget = {
      id: "widget_" + Date.now(),
      title: newTitle,
      type: newType,
      config: {
        xAxis: newXAxis,
        yAxisMeasures: newYMeasures,
        colorTheme: newTheme,
        showLegend: true,
        showGrid: true,
        limit: 15
      },
      gridSpan: newSpan
    };
    onAddWidget(freshWidget);
    setShowAddModal(false);
  };

  const handlePrintReport = () => {
    window.focus();
    window.print();
  };

  // Helper function to extract trend points for a sparkline
  const getSparklineData = (measureObj: Measure, data: any[]) => {
    if (!data || data.length === 0) return [];
    
    // Find a date column to group/sort by
    const dateCol = columns.find(col => col.type === "date") || columns.find(col => col.name.toLowerCase().includes("date"));
    
    if (dateCol) {
      // Group distinct dates
      const uniqueVals = Array.from(new Set(data.map(row => {
        const v = row[dateCol.name];
        return v === null || v === undefined ? "" : String(v);
      }))).filter(Boolean);
      
      // Sort chronologically
      uniqueVals.sort((a, b) => a.localeCompare(b));
      
      // Limit to last 15 points for visual simplicity in sparkline
      let points = uniqueVals;
      if (points.length > 15) {
        points = points.slice(-15);
      }
      
      return points.map(val => {
        const subset = data.filter(row => String(row[dateCol.name]) === val);
        let valNum = 0;
        try {
          valNum = evaluateMeasure(measureObj, subset, measures);
        } catch (e) {
          valNum = 0;
        }
        return { value: isNaN(valNum) || !isFinite(valNum) ? 0 : valNum };
      });
    } else {
      // Sequential segment fallback if no date/timeline column
      const pointCount = Math.min(10, data.length);
      if (pointCount < 2) return [];
      
      const chunkSize = Math.ceil(data.length / pointCount);
      const dataPoints = [];
      for (let i = 0; i < pointCount; i++) {
        const subset = data.slice(i * chunkSize, (i + 1) * chunkSize);
        let valNum = 0;
        try {
          valNum = evaluateMeasure(measureObj, subset, measures);
        } catch (e) {
          valNum = 0;
        }
        dataPoints.push({
          value: isNaN(valNum) || !isFinite(valNum) ? 0 : valNum
        });
      }
      return dataPoints;
    }
  };

  // Helper function to render a clean, non-interactive responsive sparkline SVG
  const generateSparklineSVG = (points: { value: number }[], colorTheme: string, widgetId: string) => {
    if (points.length < 2) return null;
    const values = points.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;

    const width = 100;
    const height = 30;
    const paddingY = 2;

    const coords = values.map((val, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = paddingY + ((max - val) / range) * (height - 2 * paddingY);
      return { x, y };
    });

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    const firstVal = values[0];
    const lastVal = values[values.length - 1];
    const isUp = lastVal >= firstVal;
    
    const strokeColor = isUp ? "#10b981" : "#f43f5e"; // Emerald vs Rose
    const pctChange = firstVal === 0 ? 0 : ((lastVal - firstVal) / Math.abs(firstVal)) * 100;

    return (
      <div className="h-11 w-full mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex-1 h-7 relative overflow-hidden">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`sparkline-grad-${colorTheme}-${widgetId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#sparkline-grad-${colorTheme}-${widgetId})`} className="opacity-70" />
            <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="2" fill={strokeColor} />
          </svg>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md flex items-center gap-0.5 leading-none ${
            isUp ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
          }`}>
            <span>{isUp ? "▲" : "▼"}</span>
            <span>{Math.abs(pctChange).toFixed(1)}%</span>
          </span>
        </div>
      </div>
    );
  };

  // Helper function: Groups and aggregates data for plotting
  const getAggregatedData = (wConfig: WidgetConfig) => {
    const { xAxis, yAxisMeasures, limit = 15 } = wConfig;
    if (filteredDataset.length === 0 || !xAxis) return [];

    // Find unique keys of xAxis in filteredDataset
    const uniqueVals = Array.from(new Set(filteredDataset.map(row => {
      const v = row[xAxis];
      return v === null || v === undefined ? "N/A" : String(v);
    })));

    let aggregated = uniqueVals.map(val => {
      // Filter filteredDataset rows belonging to this category
      const subRows = filteredDataset.filter(row => {
        const rowVal = row[xAxis];
        const valStr = rowVal === null || rowVal === undefined ? "N/A" : String(rowVal);
        return valStr === val;
      });

      const rowOutput: any = { name: val };

      // Evaluate each metric on this subset
      yAxisMeasures.forEach(mId => {
        const measureObj = measures.find(m => m.id === mId);
        if (measureObj) {
          rowOutput[measureObj.name] = evaluateMeasure(measureObj, subRows, measures);
        }
      });

      return rowOutput;
    });

    // Limit records if list is too large (e.g. dozens of dates)
    if (aggregated.length > limit) {
      aggregated = aggregated.slice(-limit);
    }

    return aggregated;
  };

  return (
    <div id="report-canvas-container" className="flex h-full relative">
      
      {/* Central Report Builder Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Global Dashboard Filter Ribbon */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800">Interactive Canvas Slicer</h3>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-100 font-mono">
                {filteredDataset.length} / {dataset.length} rows matched
              </span>
            </div>
            
            {(Object.values(globalFilters).some(Boolean) || globalSearch.trim() !== "") && (
              <button
                onClick={() => {
                  setGlobalFilters({});
                  setGlobalSearch("");
                }}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear Slicers</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Fuzzy Query Search */}
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
                Fuzzy query search
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Filter key terms..."
                  className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-1 text-xs focus:ring-2 focus:ring-blue-500/30 focus:outline-none focus:border-blue-500 transition"
                />
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
              </div>
            </div>

            {/* Auto-detected categorical filters */}
            {filterableColumns.map(col => {
              const activeVal = globalFilters[col.name] || "";
              const options = columnOptions[col.name] || [];
              return (
                <div key={col.name}>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
                    Slice {col.name}
                  </span>
                  <select
                    value={activeVal}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGlobalFilters(prev => ({
                        ...prev,
                        [col.name]: val
                      }));
                    }}
                    className={`w-full border rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition ${
                      activeVal 
                        ? "border-blue-500 bg-blue-50/20 text-blue-950 font-semibold" 
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <option value="">(All {col.name}s)</option>
                    {options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Top Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 border border-slate-200 rounded-xl shadow-sm print:hidden">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Analytics Report Layout</h2>
            <p className="text-xs text-slate-500 mt-0.5">Customize layout, format series, and add dynamic widgets to build your finalized deck.</p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              id="btn-print-pdf"
              onClick={handlePrintReport}
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2 px-3.5 rounded-lg border border-slate-200 transition flex items-center space-x-1.5 shadow-sm"
            >
              <FileDown className="w-4 h-4 text-slate-500" />
              <span>Export PDF Report</span>
            </button>
            <button
              id="btn-add-visual-modal"
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3.5 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Visual Tile</span>
            </button>
          </div>
        </div>

        {/* Dashboard Canvas Grid */}
        <div id="dashboard-grid-canvas" className="grid grid-cols-6 gap-5 print:grid-cols-6 print:gap-4">
          {widgets.map((widget) => {
            const colors = PALETTE_COLORS[widget.config.colorTheme] || PALETTE_COLORS.indigo;
            const chartData = getAggregatedData(widget.config);

            // Render single KPI Visual
            if (widget.type === "kpi") {
              const activeMeasureId = widget.config.yAxisMeasures[0];
              const measureObj = measures.find(m => m.id === activeMeasureId);
              let kpiValue = 0;
              let kpiFormatted = "N/A";
              if (measureObj) {
                try {
                  kpiValue = evaluateMeasure(measureObj, filteredDataset, measures);
                  kpiFormatted = formatMeasureValue(kpiValue, measureObj.format);
                } catch (err) {
                  kpiFormatted = "Error";
                }
              }

              const isDragged = draggedWidgetId === widget.id;
              const isDragOver = dragOverWidgetId === widget.id;

              let sparklineEl = null;
              if (measureObj && filteredDataset.length > 0) {
                const sparkData = getSparklineData(measureObj, filteredDataset);
                if (sparkData.length >= 2) {
                  sparklineEl = generateSparklineSVG(sparkData, widget.config.colorTheme, widget.id);
                }
              }

              return (
                <div
                  key={widget.id}
                  id={`widget-card-${widget.id}`}
                  draggable={resizingWidgetId !== widget.id}
                  onDragStart={(e) => handleDragStart(e, widget.id)}
                  onDragOver={(e) => handleDragOver(e, widget.id)}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, widget.id)}
                  className={`${widget.gridSpan || "col-span-2"} ${
                    isDragged ? "opacity-30 border-blue-400 bg-blue-50/5 cursor-grabbing" : ""
                  } ${
                    isDragOver && !isDragged ? "ring-2 ring-blue-500 border-transparent scale-[1.01] bg-blue-50/5" : ""
                  } ${
                    editingWidgetId === widget.id ? "ring-2 ring-amber-500 border-transparent bg-amber-500/5" : "bg-white border border-slate-200"
                  } rounded-xl shadow-sm hover:shadow-md ${resizingWidgetId === widget.id ? "" : "transition-all duration-300"} p-5 flex flex-col justify-between relative group overflow-hidden cursor-grab`}
                >
                  {/* Styling Border Accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-${widget.config.colorTheme}-500`} style={{ backgroundColor: colors[0] }} />

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab group-hover:text-slate-600 print:hidden" />
                      <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
                        KPI Card Indicator
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 print:hidden">
                      <button
                        onClick={() => handleOpenEditPanel(widget)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-300 rounded-lg transition-all"
                        title="Edit KPI metrics or visual styling"
                      >
                        <Settings className="w-3.5 h-3.5 text-amber-500" />
                        <span>Edit KPI</span>
                      </button>
                      <button
                        onClick={() => onRemoveWidget(widget.id)}
                        className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Remove Visual"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-700 text-xs truncate leading-normal" title={widget.title}>
                      {widget.title}
                    </h3>
                    <div className="text-3xl font-black text-slate-900 tracking-tight font-sans py-1 truncate">
                      {kpiFormatted}
                    </div>
                    {sparklineEl}
                  </div>

                  <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-50 pt-2.5 mt-2 font-mono truncate">
                    Formula: <span className="font-semibold text-slate-500">{measureObj?.formula || "No Measure"}</span>
                  </div>

                  {/* Dynamic Resize Handle */}
                  <div 
                    className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end resize-handle z-20 print:hidden opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleResizeStart(e, widget)}
                    title="Drag to resize card size"
                  >
                    <svg className="w-3 h-3 text-slate-300 hover:text-slate-500 transition-colors" viewBox="0 0 10 10">
                      <path d="M10,0 L0,10 M10,3 L3,10 M10,6 L6,10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              );
            }

            const isDragged = draggedWidgetId === widget.id;
            const isDragOver = dragOverWidgetId === widget.id;

            // Render Charts (Bar, Line, Area, Pie)
            return (
              <div
                key={widget.id}
                id={`widget-card-${widget.id}`}
                draggable={resizingWidgetId !== widget.id}
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragOver={(e) => handleDragOver(e, widget.id)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, widget.id)}
                className={`${widget.gridSpan || "col-span-3"} ${
                  isDragged ? "opacity-30 border-blue-400 bg-blue-50/5 cursor-grabbing" : ""
                } ${
                  isDragOver && !isDragged ? "ring-2 ring-blue-500 border-transparent scale-[1.01] bg-blue-50/5" : ""
                } ${
                  editingWidgetId === widget.id ? "ring-2 ring-amber-500 border-transparent bg-amber-500/5" : "bg-white border border-slate-200"
                } rounded-xl shadow-sm hover:shadow-md ${resizingWidgetId === widget.id ? "" : "transition-all duration-300"} p-5 flex flex-col h-96 relative group print:break-inside-avoid print:h-80 cursor-grab`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0 cursor-grab group-hover:text-slate-600 print:hidden" />
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm leading-tight truncate max-w-[150px]" title={widget.title}>
                        {widget.title}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase mt-0.5 block">
                        {widget.type} chart • grouped by {widget.config.xAxis}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 print:hidden">
                    <button
                      onClick={() => handleOpenEditPanel(widget)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-300 rounded-lg transition-all"
                      title="Edit Chart Metrics and Y-Axis"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      <span>Edit Y-Axis / Chart</span>
                    </button>
                    <button
                      onClick={() => onRemoveWidget(widget.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Visual Box */}
                <div className="flex-1 w-full min-h-0 pt-2">
                  {chartData.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                      <Layout className="w-8 h-8 text-slate-200 mb-1.5" />
                      <span>Configure fields to display graph</span>
                    </div>
                  ) : widget.type === "table" ? (
                    <div className="w-full h-full overflow-auto text-xs border border-slate-150 rounded-lg">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                          <tr>
                            <th className="px-3 py-2.5 font-semibold text-slate-600">{widget.config.xAxis}</th>
                            {widget.config.yAxisMeasures.map(mId => {
                              const measureObj = measures.find(m => m.id === mId);
                              return (
                                <th key={mId} className="px-3 py-2.5 text-right font-semibold text-slate-600">
                                  {measureObj?.name || mId}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {chartData.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                              {widget.config.yAxisMeasures.map(mId => {
                                const measureObj = measures.find(m => m.id === mId);
                                const val = row[measureObj?.name || mId];
                                return (
                                  <td key={mId} className="px-3 py-2 text-right text-slate-700 font-mono">
                                    {formatMeasureValue(val, measureObj?.format || "number")}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200 sticky bottom-0 text-[11px]">
                          <tr>
                            <td className="px-3 py-2 text-slate-800 font-bold">Total / Average</td>
                            {widget.config.yAxisMeasures.map(mId => {
                              const measureObj = measures.find(m => m.id === mId);
                              const colName = measureObj?.name || mId;
                              // Compute sum or avg
                              const values = chartData.map((r: any) => r[colName]).filter((v: any) => typeof v === 'number');
                              const total = values.reduce((sum: number, v: number) => sum + v, 0);
                              const avg = values.length > 0 ? total / values.length : 0;
                              const displayValue = measureObj?.format === "percent" || measureObj?.format === "number" || measureObj?.id.includes("avg") || measureObj?.id.includes("rate")
                                ? avg
                                : total;
                              return (
                                <td key={mId} className="px-3 py-2 text-right text-slate-900 font-mono font-bold">
                                  {formatMeasureValue(displayValue, measureObj?.format || "number")}
                                </td>
                              );
                            })}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {widget.type === "bar" ? (
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                          {widget.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} width={40} tickFormatter={formatYAxis} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                          {widget.config.showLegend && <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />}
                          {widget.config.yAxisMeasures.map((mId, index) => {
                            const measureObj = measures.find(m => m.id === mId);
                            const name = measureObj?.name || mId;
                            return (
                              <Bar
                                key={mId}
                                dataKey={name}
                                fill={colors[index % colors.length]}
                                radius={[4, 4, 0, 0]}
                              />
                            );
                          })}
                        </BarChart>
                      ) : widget.type === "line" ? (
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                          {widget.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} width={40} tickFormatter={formatYAxis} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                          {widget.config.showLegend && <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />}
                          {widget.config.yAxisMeasures.map((mId, index) => {
                            const measureObj = measures.find(m => m.id === mId);
                            const name = measureObj?.name || mId;
                            return (
                              <Line
                                key={mId}
                                type="monotone"
                                dataKey={name}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2.5}
                                dot={{ r: 3 }}
                              />
                            );
                          })}
                        </LineChart>
                      ) : widget.type === "area" ? (
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                          {widget.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} width={40} tickFormatter={formatYAxis} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                          {widget.config.showLegend && <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />}
                          {widget.config.yAxisMeasures.map((mId, index) => {
                            const measureObj = measures.find(m => m.id === mId);
                            const name = measureObj?.name || mId;
                            return (
                              <Area
                                key={mId}
                                type="monotone"
                                dataKey={name}
                                fill={colors[index % colors.length]}
                                fillOpacity={0.15}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                              />
                            );
                          })}
                        </AreaChart>
                      ) : widget.type === "pie" ? (
                        <PieChart>
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                          {widget.config.showLegend && <Legend wrapperStyle={{ fontSize: 10 }} />}
                          <Pie
                            data={chartData}
                            dataKey={measures.find(m => m.id === widget.config.yAxisMeasures[0])?.name || "value"}
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={65}
                            innerRadius={30}
                            paddingAngle={2}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      ) : widget.type === "combo" ? (
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                          {widget.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} width={40} tickFormatter={formatYAxis} />
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                          {widget.config.showLegend && <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />}
                          {widget.config.yAxisMeasures.map((mId, index) => {
                            const measureObj = measures.find(m => m.id === mId);
                            const name = measureObj?.name || mId;
                            if (index === 0) {
                              return (
                                <Bar
                                  key={mId}
                                  dataKey={name}
                                  fill={colors[index % colors.length]}
                                  radius={[4, 4, 0, 0]}
                                  barSize={25}
                                />
                              );
                            } else {
                              return (
                                <Line
                                  key={mId}
                                  type="monotone"
                                  dataKey={name}
                                  stroke={colors[index % colors.length]}
                                  strokeWidth={2.5}
                                  dot={{ r: 3 }}
                                />
                              );
                            }
                          })}
                        </ComposedChart>
                      ) : widget.type === "radar" ? (
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="name" stroke="#64748b" fontSize={9} />
                          <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#94a3b8" fontSize={8} />
                          {widget.config.yAxisMeasures.map((mId, index) => {
                            const measureObj = measures.find(m => m.id === mId);
                            const name = measureObj?.name || mId;
                            return (
                              <Radar
                                key={mId}
                                name={name}
                                dataKey={name}
                                stroke={colors[index % colors.length]}
                                fill={colors[index % colors.length]}
                                fillOpacity={0.25}
                              />
                            );
                          })}
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                          {widget.config.showLegend && <Legend wrapperStyle={{ fontSize: 10 }} />}
                        </RadarChart>
                      ) : widget.type === "funnel" ? (
                        <FunnelChart>
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                          {widget.config.showLegend && <Legend wrapperStyle={{ fontSize: 10 }} />}
                          <Funnel
                            dataKey={measures.find(m => m.id === widget.config.yAxisMeasures[0])?.name || "value"}
                            data={chartData.sort((a, b) => {
                              const key = measures.find(m => m.id === widget.config.yAxisMeasures[0])?.name || "value";
                              return (b[key] || 0) - (a[key] || 0);
                            })}
                            isAnimationActive
                          >
                            <LabelList position="right" fill="#475569" stroke="none" dataKey="name" fontSize={9} />
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                          </Funnel>
                        </FunnelChart>
                      ) : (
                        (() => {
                          const measure1Id = widget.config.yAxisMeasures[0];
                          const measure2Id = widget.config.yAxisMeasures[1] || widget.config.yAxisMeasures[0];
                          const measure1Obj = measures.find(m => m.id === measure1Id);
                          const measure2Obj = measures.find(m => m.id === measure2Id);
                          const m1Name = measure1Obj?.name || "Measure 1";
                          const m2Name = measure2Obj?.name || "Measure 2";
                          return (
                            <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                              {widget.config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
                              <XAxis type="number" dataKey={m1Name} name={m1Name} stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={formatYAxis} />
                              <YAxis type="number" dataKey={m2Name} name={m2Name} stroke="#94a3b8" fontSize={10} tickLine={false} width={40} tickFormatter={formatYAxis} />
                              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                              {widget.config.showLegend && <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />}
                              <Scatter name={`${m1Name} vs ${m2Name}`} data={chartData} fill={colors[0]}>
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                              </Scatter>
                            </ScatterChart>
                          );
                        })()
                      )}
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Dynamic Resize Handle */}
                <div 
                  className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end resize-handle z-20 print:hidden opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, widget)}
                  title="Drag to resize card size"
                >
                  <svg className="w-3 h-3 text-slate-300 hover:text-slate-500 transition-colors" viewBox="0 0 10 10">
                    <path d="M10,0 L0,10 M10,3 L3,10 M10,6 L6,10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Editor Flyout Panel (Power BI Properties / Format Panel Replica) */}
      {editingWidgetId && editingWidget && (
        <div id="format-panel-flyout" className="w-80 bg-slate-50 border-l border-slate-200 p-5 overflow-y-auto space-y-5 shrink-0 print:hidden shadow-lg animate-in slide-in-from-right duration-250">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <h3 className="font-bold text-slate-850 text-sm flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Format Visual Properties</span>
            </h3>
            <button
              onClick={() => setEditingWidgetId(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Close
            </button>
          </div>

          <div className="space-y-4">
            {/* Title Property */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Visual Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500 bg-white"
              />
            </div>

            {/* Visual Type Property */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Chart Type</label>
              <select
                value={editType}
                onChange={(e) => {
                  const type = e.target.value as ChartType;
                  setEditType(type);
                  if ((type === "kpi" || type === "pie" || type === "funnel") && editYMeasures.length > 1) {
                    setEditYMeasures([editYMeasures[0]]);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              >
                <option value="kpi">KPI Card Indicator</option>
                <option value="bar">Bar (Column) Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Donut (Pie) Chart</option>
                <option value="scatter">Scatter Plot Chart</option>
                <option value="radar">Radar (Spider) Chart</option>
                <option value="funnel">Funnel Conversion Chart</option>
                <option value="combo">Combo (Bar + Line) Chart</option>
                <option value="table">Table Visual Grid</option>
              </select>
            </div>

            {/* Layout Span Property */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Tile Dimensions (Grid width)</label>
              <select
                value={editSpan}
                onChange={(e) => setEditSpan(e.target.value as Widget["gridSpan"])}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-mono"
              >
                <option value="col-span-1">1 Col (Narrow)</option>
                <option value="col-span-2">2 Cols (Standard KPI)</option>
                <option value="col-span-3">3 Cols (Half Page Chart)</option>
                <option value="col-span-4">4 Cols (Wide)</option>
                <option value="col-span-6">6 Cols (Full Row Banner)</option>
              </select>
            </div>

            {/* X Axis Dimension */}
            {editType !== "kpi" && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">X-Axis Column Dimension</label>
                <select
                  value={editXAxis}
                  onChange={(e) => setEditXAxis(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  {columns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Y Axis Measures */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Y-Axis Plotted Measures (Metrics)
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                {measures.map((m) => {
                  const isChecked = editYMeasures.includes(m.id);
                  return (
                    <label key={m.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            // don't allow unchecking everything
                            if (editYMeasures.length > 1) {
                              setEditYMeasures(editYMeasures.filter(id => id !== m.id));
                            }
                          } else {
                            if (editType === "kpi" || editType === "pie" || editType === "funnel") {
                              // Pie, KPI, and Funnel only support 1 metric
                              setEditYMeasures([m.id]);
                            } else {
                              setEditYMeasures([...editYMeasures, m.id]);
                            }
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-400 cursor-pointer"
                      />
                      <span className="truncate">{m.name}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                {editType === "kpi" || editType === "pie" || editType === "funnel"
                  ? "KPI, Pie, and Funnel visuals only support plotting exactly 1 measure."
                  : editType === "scatter"
                  ? "Scatter plots compare exactly 2 measures (Plot 1 on X-axis, Plot 2 on Y-axis)."
                  : "Bar, Line, Area, Combo, Radar, and Table visuals support multiple measures simultaneously!"}
              </p>
            </div>

            {/* Color Palette Series */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Color Palette Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {THEME_NAMES.map((theme) => {
                  const paletteColors = PALETTE_COLORS[theme.id];
                  const isSelected = editTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setEditTheme(theme.id)}
                      className={`p-2 rounded-xl text-left border flex flex-col justify-between h-14 bg-white transition-all ${
                        isSelected 
                          ? "border-blue-600 ring-2 ring-blue-600/10" 
                          : "border-slate-200 hover:border-slate-350"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-700 truncate leading-tight block">{theme.name}</span>
                      <div className="flex gap-1 pt-1.5">
                        {paletteColors.slice(0, 4).map((c, idx) => (
                          <div key={idx} className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              onClick={() => setEditingWidgetId(null)}
              className="px-3.5 py-1.5 border border-slate-250 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 px-4 rounded-lg text-xs flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Widget Modal Dialog */}
      {showAddModal && (
        <div id="add-visual-modal-backdrop" className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 print:hidden">
          <div id="add-visual-modal" className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Layout className="w-5 h-5 text-blue-600" />
                <span>Add Custom Visualization Card</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Visual Heading / Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Chart Type</label>
                <select
                  value={newType}
                  onChange={(e) => {
                    const type = e.target.value as ChartType;
                    setNewType(type);
                    if ((type === "kpi" || type === "pie" || type === "funnel") && newYMeasures.length > 1) {
                      setNewYMeasures([newYMeasures[0]]);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                >
                  <option value="kpi">KPI Card Indicator</option>
                  <option value="bar">Bar (Column) Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Donut (Pie) Chart</option>
                  <option value="scatter">Scatter Plot Chart</option>
                  <option value="radar">Radar (Spider) Chart</option>
                  <option value="funnel">Funnel Conversion Chart</option>
                  <option value="combo">Combo (Bar + Line) Chart</option>
                  <option value="table">Table Visual Grid</option>
                </select>
              </div>

              {newType !== "kpi" && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">X-Axis Group Dimension</label>
                  <select
                    value={newXAxis}
                    onChange={(e) => setNewXAxis(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  >
                    {columns.map(col => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Layout Grid Width (Span)</label>
                <select
                  value={newSpan}
                  onChange={(e) => setNewSpan(e.target.value as Widget["gridSpan"])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-mono"
                >
                  <option value="col-span-1">1 Column (Narrow)</option>
                  <option value="col-span-2">2 Columns (KPI Card)</option>
                  <option value="col-span-3">3 Columns (Standard Chart)</option>
                  <option value="col-span-4">4 Columns (Wide Card)</option>
                  <option value="col-span-6">6 Columns (Full Row Banner)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Y-Axis Plotted Measures / Metrics (Choose at least one)
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {measures.map((m) => {
                    const isChecked = newYMeasures.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer p-1 rounded hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              if (newYMeasures.length > 1) {
                                setNewYMeasures(newYMeasures.filter(id => id !== m.id));
                              }
                            } else {
                              if (newType === "kpi" || newType === "pie" || newType === "funnel") {
                                setNewYMeasures([m.id]);
                              } else {
                                setNewYMeasures([...newYMeasures, m.id]);
                              }
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-400 cursor-pointer"
                        />
                        <span className="truncate">{m.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  {newType === "kpi" || newType === "pie" || newType === "funnel"
                    ? "KPI, Pie, and Funnel charts only support plotting exactly 1 measure."
                    : newType === "scatter"
                    ? "Scatter plots compare exactly 2 measures (Plot 1 on X-axis, Plot 2 on Y-axis)."
                    : "Bar, Line, Area, Combo, Radar, and Table visuals support multiple measures simultaneously!"}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-150 flex justify-end gap-2.5">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-250 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Close Dialog
              </button>
              <button
                onClick={handleCreateWidget}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Instantiate Visual</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
