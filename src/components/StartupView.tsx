import React, { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Activity, 
  Flame, 
  RotateCcw, 
  HelpCircle, 
  Info, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  ListChecks,
  Sparkles,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { ColumnMetadata } from "../types";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  Tooltip as RechartsTooltip 
} from "recharts";

interface StartupViewProps {
  dataset: any[];
  columns: ColumnMetadata[];
  onNavigateToBilling: () => void;
}

export default function StartupView({ dataset, columns, onNavigateToBilling }: StartupViewProps) {
  // 1. Column Mapping Configuration (AI KPI Detection)
  const [mappings, setMappings] = useState({
    dateCol: "",
    revenueCol: "",
    spendCol: "",
    newCustomersCol: "",
    activeCustomersCol: "",
    churnCol: ""
  });

  const [cashOnHand, setCashOnHand] = useState<number>(250000);
  const [showConfig, setShowConfig] = useState(false);
  const [activeEvidenceMetric, setActiveEvidenceMetric] = useState<string | null>(null);

  // Auto-detect columns on mount or when dataset columns change
  useEffect(() => {
    if (!columns || columns.length === 0) return;

    const findCol = (keys: string[], type?: "number" | "string" | "date") => {
      const match = columns.find(c => {
        const nameLower = c.name.toLowerCase();
        const matchesKey = keys.some(k => nameLower.includes(k));
        const matchesType = type ? c.type === type : true;
        return matchesKey && matchesType;
      });
      return match ? match.name : "";
    };

    setMappings({
      dateCol: findCol(["date", "month", "year", "time"]),
      revenueCol: findCol(["revenue", "sales", "rev", "income", "billing", "mrr", "gross sales"], "number") || findCol(["revenue", "sales", "rev", "income"], "number") || columns.find(c => c.type === "number")?.name || "",
      spendCol: findCol(["spend", "cost", "opex", "ad spend", "marketing", "expenses", "compensation"], "number") || "",
      newCustomersCol: findCol(["new customers", "conversions", "signups", "leads won", "deals won", "subscribers acquired"], "number") || "",
      activeCustomersCol: findCol(["active customers", "total customers", "headcount", "subscribers", "active"], "number") || "",
      churnCol: findCol(["churn", "cancellations", "lost", "attritions", "returns", "churned"], "number") || ""
    });
  }, [columns]);

  // Clean numerical parsing helper
  const parseNum = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return val;
    const clean = String(val).replace(/[$,\s]/g, "");
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Group and sort data chronologically by month
  const monthlyData = useMemo(() => {
    if (!dataset || dataset.length === 0) return [];

    const dateField = mappings.dateCol || columns.find(c => c.type === "date" || c.name.toLowerCase().includes("date"))?.name;
    if (!dateField) {
      // Fallback: If no date column is mapped, treat raw dataset as a single time series sequence
      return dataset.map((row, idx) => ({
        label: `Row ${idx + 1}`,
        revenue: mappings.revenueCol ? parseNum(row[mappings.revenueCol]) : 0,
        spend: mappings.spendCol ? parseNum(row[mappings.spendCol]) : 0,
        newCustomers: mappings.newCustomersCol ? parseNum(row[mappings.newCustomersCol]) : 0,
        activeCustomers: mappings.activeCustomersCol ? parseNum(row[mappings.activeCustomersCol]) : 0,
        churnCount: mappings.churnCol ? parseNum(row[mappings.churnCol]) : 0
      }));
    }

    // Bucket by month
    const groups: Record<string, any[]> = {};
    dataset.forEach(row => {
      const rawDate = row[dateField];
      let bucket = "Unknown";
      if (rawDate) {
        const dateStr = String(rawDate);
        if (dateStr.includes("-")) {
          // YYYY-MM-DD -> YYYY-MM
          const parts = dateStr.split("-");
          bucket = parts[0] + "-" + (parts[1] || "01");
        } else if (dateStr.includes(" ") || isNaN(Number(dateStr))) {
          // Month Name e.g. "Jan 2026"
          bucket = dateStr;
        } else {
          bucket = dateStr.substring(0, 7);
        }
      }

      if (!groups[bucket]) groups[bucket] = [];
      groups[bucket].push(row);
    });

    // Sort buckets chronologically
    const sortedBuckets = Object.keys(groups).sort((a, b) => {
      const timeA = new Date(a).getTime();
      const timeB = new Date(b).getTime();
      if (isNaN(timeA) || isNaN(timeB)) {
        return a.localeCompare(b);
      }
      return timeA - timeB;
    });

    return sortedBuckets.map(bucket => {
      const rows = groups[bucket];
      const revenueSum = rows.reduce((sum, r) => sum + (mappings.revenueCol ? parseNum(r[mappings.revenueCol]) : 0), 0);
      const spendSum = rows.reduce((sum, r) => sum + (mappings.spendCol ? parseNum(r[mappings.spendCol]) : 0), 0);
      const newCustSum = rows.reduce((sum, r) => sum + (mappings.newCustomersCol ? parseNum(r[mappings.newCustomersCol]) : 0), 0);
      const activeCustAvg = rows.reduce((sum, r) => sum + (mappings.activeCustomersCol ? parseNum(r[mappings.activeCustomersCol]) : 0), 0) / rows.length;
      const churnSum = rows.reduce((sum, r) => sum + (mappings.churnCol ? parseNum(r[mappings.churnCol]) : 0), 0);

      return {
        label: bucket,
        revenue: revenueSum,
        spend: spendSum,
        newCustomers: newCustSum,
        activeCustomers: activeCustAvg || Math.max(15, newCustSum * 3.5), // sensible fallback if active customers not mapped
        churnCount: churnSum
      };
    });
  }, [dataset, columns, mappings]);

  // Compute calculated metrics
  const calculatedMetrics = useMemo(() => {
    const defaultRes = {
      mrr: 0,
      mrrTrend: 0,
      cac: 0,
      cacTrend: 0,
      ltv: 0,
      ltvTrend: 0,
      ltvCacRatio: 0,
      churnRate: 0,
      churnTrend: 0,
      monthlyBurn: 0,
      monthlyBurnTrend: 0,
      runway: 0,
      quickRatio: 0,
      arpu: 0,
      confidenceScore: 90
    };

    if (monthlyData.length === 0) return defaultRes;

    const latest = monthlyData[monthlyData.length - 1];
    const prev = monthlyData[monthlyData.length - 2] || latest;

    // 1. MRR (Revenues for latest month)
    const mrr = latest.revenue;
    const mrrTrend = prev.revenue > 0 ? ((latest.revenue - prev.revenue) / prev.revenue) * 100 : 0;

    // 2. CAC
    const cac = latest.newCustomers > 0 ? latest.spend / latest.newCustomers : 0;
    const prevCac = prev.newCustomers > 0 ? prev.spend / prev.newCustomers : 0;
    const cacTrend = prevCac > 0 ? ((cac - prevCac) / prevCac) * 100 : 0;

    // 3. Churn Rate
    const totalCust = latest.activeCustomers || 1;
    const churnRate = totalCust > 0 ? (latest.churnCount / totalCust) * 100 : 0;
    const prevTotalCust = prev.activeCustomers || 1;
    const prevChurnRate = prevTotalCust > 0 ? (prev.churnCount / prevTotalCust) * 100 : 0;
    const churnTrend = churnRate - prevChurnRate; // absolute point difference

    // 4. LTV
    const arpu = totalCust > 0 ? mrr / totalCust : 0;
    const prevArpu = prevTotalCust > 0 ? prev.revenue / prevTotalCust : 0;
    const monthlyChurnFraction = churnRate / 100;
    // SaaS Standard: ARPU / Churn. Guard against churn = 0%
    const ltv = monthlyChurnFraction > 0 ? arpu / monthlyChurnFraction : arpu * 36; // assume 3 year lifetime if zero churn
    const prevMonthlyChurnFraction = prevChurnRate / 100;
    const prevLtv = prevMonthlyChurnFraction > 0 ? prevArpu / prevMonthlyChurnFraction : prevArpu * 36;
    const ltvTrend = prevLtv > 0 ? ((ltv - prevLtv) / prevLtv) * 100 : 0;

    // 5. LTV:CAC Ratio
    const ltvCacRatio = cac > 0 ? ltv / cac : ltv > 0 ? 99 : 0; // Guard against free CAC

    // 6. Monthly Burn (Spend)
    const monthlyBurn = latest.spend;
    const monthlyBurnTrend = prev.spend > 0 ? ((latest.spend - prev.spend) / prev.spend) * 100 : 0;

    // 7. Runway (Cash / Net Burn Rate)
    // Net burn is spend minus revenue. If revenue exceeds spend, startup is cash flow positive
    const netBurn = Math.max(0, latest.spend - latest.revenue);
    const runway = netBurn > 0 ? cashOnHand / netBurn : 999; // 999 denotes profitability

    // 8. Quick Ratio: (New MRR + Expansion MRR) / (Contraction MRR + Churned MRR)
    // Heuristic approximation from monthly data:
    const mrrGained = Math.max(0, latest.revenue - prev.revenue);
    const estimatedChurnRev = latest.churnCount * arpu;
    const quickRatio = estimatedChurnRev > 0 ? (mrrGained + (latest.newCustomers * arpu)) / estimatedChurnRev : mrrGained > 0 ? 4.5 : 1.0;

    // 9. Confidence score based on column completeness
    let missingColsCount = 0;
    Object.values(mappings).forEach(val => {
      if (!val) missingColsCount++;
    });
    const confidenceScore = Math.max(45, 100 - (missingColsCount * 10) - (dataset.length < 15 ? 10 : 0));

    return {
      mrr,
      mrrTrend,
      cac,
      cacTrend,
      ltv,
      ltvTrend,
      ltvCacRatio,
      churnRate,
      churnTrend,
      monthlyBurn,
      monthlyBurnTrend,
      runway,
      quickRatio,
      arpu,
      confidenceScore
    };
  }, [monthlyData, mappings, cashOnHand, dataset.length]);

  // Dynamic recommendations generator
  const recommendations = useMemo(() => {
    const list = [];
    const metrics = calculatedMetrics;

    if (metrics.runway !== 999 && metrics.runway < 12) {
      list.push({
        id: "runway_risk",
        level: "critical",
        title: "Extend Financial Cash Runway",
        metric: `Cash Runway: ${metrics.runway === 999 ? "Infinite" : metrics.runway.toFixed(1)} Months`,
        desc: `Your current cash runway is below the 12-month safety threshold. Implement immediate budget freezes on non-performing marketing campaigns, reduce operational overhead, and align with investors for an inside bridge round.`,
        action: "Freeze non-essential SaaS spend and audit marketing CAC segments."
      });
    }

    if (metrics.ltvCacRatio < 3.0 && metrics.cac > 0) {
      list.push({
        id: "ltv_cac_low",
        level: "warning",
        title: "Optimize Marketing Acquisition (LTV:CAC)",
        metric: `LTV:CAC Ratio: ${metrics.ltvCacRatio.toFixed(2)}x`,
        desc: `A unit economic ratio of ${metrics.ltvCacRatio.toFixed(2)}x is below the healthy venture standard of 3.0x. This indicates you are spending too much to acquire customers relative to their lifetime value.`,
        action: "Pause bottom 25% ROI ad channels and increase subscription price tiers."
      });
    }

    if (metrics.churnRate > 5.0) {
      list.push({
        id: "churn_high",
        level: "warning",
        title: "Audit Customer Retention / Churn",
        metric: `Monthly Churn Rate: ${metrics.churnRate.toFixed(2)}%`,
        desc: `Your churn rate is currently at ${metrics.churnRate.toFixed(2)}% per month. Standard SaaS churn should be under 3%. High churn destroys LTV and neutralizes incoming sales growth.`,
        action: "Run customer feedback surveys on cancelled accounts and check product onboarding drop-off."
      });
    }

    if (metrics.quickRatio < 2.0) {
      list.push({
        id: "quick_ratio_low",
        level: "info",
        title: "Boost Recurring Revenue Momentum",
        metric: `SaaS Quick Ratio: ${metrics.quickRatio.toFixed(2)}x`,
        desc: `Your Quick Ratio is below 2.0x, meaning revenue expansion is barely keeping pace with churn losses. You need to focus on expansion MRR and upselling current customers.`,
        action: "Launch annual plan pre-payment discounts to capture near-term revenue."
      });
    }

    // Default recommendation if everything is healthy
    if (list.length === 0) {
      list.push({
        id: "all_healthy",
        level: "healthy",
        title: "Aggressively Scale Growth Channels",
        metric: `LTV:CAC: ${metrics.ltvCacRatio.toFixed(1)}x | Runway: ${metrics.runway === 999 ? "Profitable" : metrics.runway.toFixed(1) + " Mo"}`,
        desc: `Excellent unit economics detected! Your LTV:CAC ratio is highly profitable and runway is stable. Focus on scaling your highest ROI customer acquisition channels.`,
        action: "Increase marketing ad budgets by 25% on Meta/Google and check hiring plans."
      });
    }

    return list;
  }, [calculatedMetrics]);

  // Executive summary narration generator
  const executiveSummaryNarrative = useMemo(() => {
    const m = calculatedMetrics;
    const isProfitable = m.runway === 999;

    let healthReport = "";
    if (m.ltvCacRatio >= 3.0 && m.churnRate <= 4.0 && (isProfitable || m.runway >= 18)) {
      healthReport = "Your startup shows **exceptional financial health** and strong product-market fit. Unit economics exceed standard venture-backed benchmarks, representing a highly investable profile.";
    } else if (m.ltvCacRatio < 2.5 || m.churnRate > 6.0 || (!isProfitable && m.runway < 8)) {
      healthReport = "Your startup exhibits **systemic operational risks**. Underperforming unit economics combined with a short cash runway require immediate tactical corrections to preserve capital.";
    } else {
      healthReport = "Your startup is in a **moderate consolidation phase**. Growth is stable, but optimization is required around marketing efficiency or customer churn retention to unlock scaling velocity.";
    }

    return `
### 📑 Executive Briefing: Startup Unit Economics & Health Audit

Based on the parsed **${monthlyData.length} month cohorts** from your raw database, here is the automated strategic summary:

* **MRR Runway Analysis**: Currently operating with **$${m.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })} MRR**. ${isProfitable ? "The company is **operating profitably**; monthly revenue covers operating expenditures." : `With **$${m.monthlyBurn.toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly spend**, your cash runway is estimated at **${m.runway.toFixed(1)} months** based on current burn velocity.`}
* **Acquisition Efficiency (CAC)**: Customer Acquisition Cost stands at **$${m.cac.toFixed(2)}**. Paired with an estimated Lifetime Value (LTV) of **$${m.ltv.toFixed(2)}**, the platform is generating a **${m.ltvCacRatio.toFixed(2)}x return** on acquisition investment (LTV:CAC).
* **Workforce & Retention**: Customer cancellation rates are logged at **${m.churnRate.toFixed(2)}%** monthly. Your Quick Ratio of **${m.quickRatio.toFixed(2)}x** signals that incoming growth is ${m.quickRatio >= 2.0 ? "healthy and outperforming leakage" : "vulnerable to churn drag factors"}.

**Strategic Conclusion:**
${healthReport}
`;
  }, [calculatedMetrics, monthlyData.length]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 text-slate-800 dark:text-slate-200">
      
      {/* Title Header with settings toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-3xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div className="text-left">
              <h2 className="text-lg font-extrabold tracking-tight">Startup Analyst Workspace</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Auto-detecting SaaS metrics & capital efficiency ratios</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Cash on Hand:</span>
            <div className="flex items-center font-bold text-xs">
              <span className="text-slate-400 mr-0.5">$</span>
              <input 
                type="text" 
                value={cashOnHand.toLocaleString()}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/,/g, ""), 10);
                  setCashOnHand(isNaN(val) ? 0 : val);
                }}
                className="w-20 bg-transparent border-none text-slate-850 dark:text-white font-bold p-0 focus:ring-0 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{showConfig ? "Hide Mappings" : "Column Mapping"}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showConfig ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Column Config Mapping Collapse Panel (AI KPI Detection Settings) */}
      {showConfig && (
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-850 pb-2.5">
            <div className="text-left">
              <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>AI KPI Auto-Detection Mappings</span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Override auto-detected variables to refine calculated startup metrics.</p>
            </div>
            <button
              onClick={() => {
                if (columns.length > 0) {
                  // Trigger re-detect
                  const findCol = (keys: string[], type?: "number" | "string" | "date") => {
                    const match = columns.find(c => {
                      const nameLower = c.name.toLowerCase();
                      const matchesKey = keys.some(k => nameLower.includes(k));
                      const matchesType = type ? c.type === type : true;
                      return matchesKey && matchesType;
                    });
                    return match ? match.name : "";
                  };
                  setMappings({
                    dateCol: findCol(["date", "month", "year", "time"]),
                    revenueCol: findCol(["revenue", "sales", "rev", "income", "billing", "mrr", "gross sales"], "number") || columns.find(c => c.type === "number")?.name || "",
                    spendCol: findCol(["spend", "cost", "opex", "ad spend", "marketing", "expenses"], "number") || "",
                    newCustomersCol: findCol(["new customers", "conversions", "signups", "leads won", "deals won"], "number") || "",
                    activeCustomersCol: findCol(["active customers", "total customers", "headcount", "subscribers", "active"], "number") || "",
                    churnCol: findCol(["churn", "cancellations", "lost", "attritions", "returns", "churned"], "number") || ""
                  });
                }
              }}
              className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold flex items-center gap-1"
              title="Scan database columns using AI heuristic patterns"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to AI Auto-Detect</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {[
              { key: "dateCol", label: "Date Dimension", icon: Calendar, required: true },
              { key: "revenueCol", label: "Revenue Column (MRR)", icon: DollarSign, required: true },
              { key: "spendCol", label: "Marketing Spend (OpEx)", icon: Flame, required: false },
              { key: "newCustomersCol", label: "New Customers Acquired", icon: Target, required: false },
              { key: "activeCustomersCol", label: "Active Customers (Total)", icon: Users, required: false },
              { key: "churnCol", label: "Cancellations / Churn", icon: Activity, required: false }
            ].map((cfg) => {
              const Icon = cfg.icon;
              return (
                <div key={cfg.key} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Icon className="w-3 h-3 text-slate-400" />
                    <span>{cfg.label}</span>
                    {cfg.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={mappings[cfg.key as keyof typeof mappings]}
                    onChange={(e) => setMappings(prev => ({ ...prev, [cfg.key]: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Unmapped --</option>
                    {columns.map((col) => (
                      <option key={col.name} value={col.name}>
                        {col.name} ({col.type})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8 Premium Metric Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {[
          {
            id: "mrr",
            title: "Monthly Recurring Revenue",
            val: `$${calculatedMetrics.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            trend: calculatedMetrics.mrrTrend,
            trendType: "pct",
            desc: "Active contract revenues",
            icon: DollarSign,
            color: "blue",
            dataKey: "revenue"
          },
          {
            id: "cac",
            title: "Customer Acquisition Cost",
            val: calculatedMetrics.cac > 0 ? `$${calculatedMetrics.cac.toFixed(2)}` : "N/A",
            trend: calculatedMetrics.cacTrend,
            trendType: "pct",
            desc: "Sales & marketing cost per user",
            icon: Target,
            color: "indigo",
            inverseTrend: true,
            dataKey: "spend" // CAC trend tracks spend or calculations
          },
          {
            id: "ltv",
            title: "Lifetime Value (LTV)",
            val: calculatedMetrics.ltv > 0 ? `$${calculatedMetrics.ltv.toFixed(2)}` : "N/A",
            trend: calculatedMetrics.ltvTrend,
            trendType: "pct",
            desc: "Projected lifecycle gross values",
            icon: Users,
            color: "emerald",
            dataKey: "activeCustomers"
          },
          {
            id: "ltvCac",
            title: "LTV : CAC Ratio",
            val: calculatedMetrics.ltvCacRatio > 0 ? `${calculatedMetrics.ltvCacRatio.toFixed(2)}x` : "N/A",
            status: calculatedMetrics.ltvCacRatio >= 3.0 ? "healthy" : calculatedMetrics.ltvCacRatio >= 1.5 ? "warning" : "danger",
            desc: "Target healthy multiplier: >3.0x",
            icon: Activity,
            color: calculatedMetrics.ltvCacRatio >= 3.0 ? "emerald" : "amber",
            dataKey: "revenue"
          },
          {
            id: "churn",
            title: "Monthly Churn Rate",
            val: `${calculatedMetrics.churnRate.toFixed(2)}%`,
            trend: calculatedMetrics.churnTrend,
            trendType: "diff",
            desc: "Active cancellation percentages",
            icon: Activity,
            color: "red",
            inverseTrend: true,
            dataKey: "churnCount"
          },
          {
            id: "burn",
            title: "Monthly Burn Rate",
            val: `$${calculatedMetrics.monthlyBurn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            trend: calculatedMetrics.monthlyBurnTrend,
            trendType: "pct",
            desc: "Operating spend values",
            icon: Flame,
            color: "orange",
            inverseTrend: true,
            dataKey: "spend"
          },
          {
            id: "runway",
            title: "Cash Runway",
            val: calculatedMetrics.runway === 999 ? "Profitable 🚀" : `${calculatedMetrics.runway.toFixed(1)} Months`,
            status: calculatedMetrics.runway === 999 || calculatedMetrics.runway >= 18 ? "healthy" : calculatedMetrics.runway >= 12 ? "warning" : "danger",
            desc: `Based on $${cashOnHand.toLocaleString()} Cash`,
            icon: Calendar,
            color: calculatedMetrics.runway === 999 || calculatedMetrics.runway >= 18 ? "emerald" : "red",
            dataKey: "spend"
          },
          {
            id: "quickRatio",
            title: "SaaS Quick Ratio",
            val: `${calculatedMetrics.quickRatio.toFixed(2)}x`,
            status: calculatedMetrics.quickRatio >= 2.0 ? "healthy" : "warning",
            desc: "Ideal ratio: >2.0x",
            icon: TrendingUp,
            color: "sky",
            dataKey: "revenue"
          }
        ].map((item) => {
          const Icon = item.icon;
          const isPct = item.trendType === "pct";
          const trendVal = item.trend || 0;
          
          let trendColor = "text-slate-400";
          let isTrendUp = trendVal > 0;
          let isTrendNeutral = trendVal === 0;

          if (!isTrendNeutral) {
            if (item.inverseTrend) {
              trendColor = isTrendUp ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400";
            } else {
              trendColor = isTrendUp ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400";
            }
          }

          const hasTrendVal = item.trend !== undefined;

          return (
            <div 
              key={item.id} 
              onClick={() => setActiveEvidenceMetric(activeEvidenceMetric === item.id ? null : item.id)}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-3xs space-y-2 relative overflow-hidden transition hover:border-blue-400 dark:hover:border-blue-700 cursor-pointer select-none ${
                activeEvidenceMetric === item.id ? "ring-1 ring-blue-500 border-blue-500 dark:border-blue-500 bg-blue-50/5 dark:bg-blue-950/5" : ""
              }`}
            >
              {/* Header block */}
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">{item.title}</span>
                <span className={`p-1.5 rounded-lg bg-${item.color}-500/10 text-${item.color}-600 dark:text-${item.color}-400`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Value and Trend block */}
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{item.val}</span>
                
                {hasTrendVal && !isTrendNeutral && (
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 ${trendColor}`}>
                    {isTrendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{Math.abs(trendVal).toFixed(1)}{isPct ? "%" : "pt"}</span>
                  </span>
                )}
                {item.status && (
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                    item.status === "healthy" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                    item.status === "warning" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                    "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  }`}>
                    {item.status}
                  </span>
                )}
              </div>

              {/* Sparkline visualization */}
              {monthlyData.length > 1 && (
                <div className="h-8 w-full mt-1.5 opacity-60 hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <defs>
                        <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={item.color === "red" ? "#ef4444" : item.color === "emerald" ? "#10b981" : "#3b82f6"} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={item.color === "red" ? "#ef4444" : item.color === "emerald" ? "#10b981" : "#3b82f6"} stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey={item.dataKey} 
                        stroke={item.color === "red" ? "#ef4444" : item.color === "emerald" ? "#10b981" : "#3b82f6"} 
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill={`url(#grad-${item.id})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Footer description */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                <span>{item.desc}</span>
                <span className="text-blue-500 dark:text-blue-400 font-medium text-[9px] hover:underline flex items-center gap-0.5">
                  <span>Formula</span>
                  <Info className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Evidence-Based Insight Drawer (Math explanation panel) */}
      {activeEvidenceMetric && (
        <div className="bg-blue-50/20 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4 text-left animate-fadeIn">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <span>Evidence-Based Calculation Audit</span>
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Verifiable trace map showing raw math and spreadsheet inputs</p>
            </div>
            <button 
              onClick={() => setActiveEvidenceMetric(null)}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold"
            >
              Close Audit
            </button>
          </div>

          <div className="mt-3.5 space-y-2.5 text-xs">
            {activeEvidenceMetric === "mrr" && (
              <>
                <p><strong>Metric:</strong> Monthly Recurring Revenue (MRR)</p>
                <p><strong>SaaS Standard Formula:</strong> <code>Sum(Revenue of active customers in latest month cohort)</code></p>
                <p><strong>Your Math:</strong> Sum of <code>{mappings.revenueCol || "[unmapped revenue]"}</code> column aggregated in month bucket <code>{monthlyData[monthlyData.length-1]?.label || "Latest"}</code>.</p>
                <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1 overflow-x-auto">
                  <div>Latest Month Revenue Sum: {calculatedMetrics.mrr.toLocaleString(undefined, {style: "currency", currency: "USD"})}</div>
                  <div>Previous Month Revenue Sum: {(monthlyData[monthlyData.length-2]?.revenue || 0).toLocaleString(undefined, {style: "currency", currency: "USD"})}</div>
                  <div>Formula Run: <code>({calculatedMetrics.mrr} - {monthlyData[monthlyData.length-2]?.revenue || 0}) / {monthlyData[monthlyData.length-2]?.revenue || 1} = {calculatedMetrics.mrrTrend.toFixed(1)}% Trend</code></div>
                </div>
              </>
            )}
            {activeEvidenceMetric === "cac" && (
              <>
                <p><strong>Metric:</strong> Customer Acquisition Cost (CAC)</p>
                <p><strong>SaaS Standard Formula:</strong> <code>Total Sales & Marketing Outlay / New Customers Acquired</code></p>
                <p><strong>Your Math:</strong> Sum of <code>{mappings.spendCol || "[unmapped spend]"}</code> divided by Sum of <code>{mappings.newCustomersCol || "[unmapped conversion]"}</code> for the latest cohort.</p>
                <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1 overflow-x-auto">
                  <div>Latest Spend Sum: ${(monthlyData[monthlyData.length-1]?.spend || 0).toLocaleString()}</div>
                  <div>Latest Conversions: {monthlyData[monthlyData.length-1]?.newCustomers || 0} users</div>
                  <div>Formula Run: <code>${(monthlyData[monthlyData.length-1]?.spend || 0).toLocaleString()} / {monthlyData[monthlyData.length-1]?.newCustomers || 1} = ${calculatedMetrics.cac.toFixed(2)} CAC</code></div>
                </div>
              </>
            )}
            {activeEvidenceMetric === "ltv" && (
              <>
                <p><strong>Metric:</strong> Customer Lifetime Value (LTV)</p>
                <p><strong>SaaS Standard Formula:</strong> <code>Average Revenue Per User (ARPU) / Monthly User Churn Rate</code></p>
                <p><strong>Your Math:</strong> <code>(Latest MRR / Active Accounts) / (Churned Accounts / Active Accounts)</code></p>
                <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1 overflow-x-auto">
                  <div>Latest ARPU (MRR/Customers): ${calculatedMetrics.arpu.toFixed(2)}</div>
                  <div>Latest Churn Rate: {calculatedMetrics.churnRate.toFixed(2)}% ({monthlyData[monthlyData.length-1]?.churnCount || 0} cancellations)</div>
                  <div>Formula Run: <code>${calculatedMetrics.arpu.toFixed(2)} / {(calculatedMetrics.churnRate/100).toFixed(4)} = ${calculatedMetrics.ltv.toFixed(2)} LTV</code></div>
                </div>
              </>
            )}
            {activeEvidenceMetric === "ltvCac" && (
              <>
                <p><strong>Metric:</strong> LTV to CAC Ratio</p>
                <p><strong>SaaS Standard Formula:</strong> <code>LTV / CAC</code></p>
                <p><strong>Your Math:</strong> Projected Customer LTV divided by acquisition cost CAC. (Ideal range is &gt;3.0x for SaaS).</p>
                <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1 overflow-x-auto">
                  <div>Calculated LTV: ${calculatedMetrics.ltv.toFixed(2)}</div>
                  <div>Calculated CAC: ${calculatedMetrics.cac.toFixed(2)}</div>
                  <div>Formula Run: <code>${calculatedMetrics.ltv.toFixed(2)} / ${calculatedMetrics.cac.toFixed(2)} = {calculatedMetrics.ltvCacRatio.toFixed(2)}x Ratio</code></div>
                </div>
              </>
            )}
            {activeEvidenceMetric === "churn" && (
              <>
                <p><strong>Metric:</strong> Customer Churn Rate</p>
                <p><strong>SaaS Standard Formula:</strong> <code>Lost Customers during period / Total Customers at start of period</code></p>
                <p><strong>Your Math:</strong> Sum of churn rows divided by active user cohort averages in the latest month bucket.</p>
                <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1 overflow-x-auto">
                  <div>Latest Cohort Cancellations: {monthlyData[monthlyData.length-1]?.churnCount || 0} accounts</div>
                  <div>Latest Active Customers Average: {monthlyData[monthlyData.length-1]?.activeCustomers || 0} accounts</div>
                  <div>Formula Run: <code>{monthlyData[monthlyData.length-1]?.churnCount || 0} / {monthlyData[monthlyData.length-1]?.activeCustomers || 1} = {calculatedMetrics.churnRate.toFixed(2)}% Churn</code></div>
                </div>
              </>
            )}
            {activeEvidenceMetric === "burn" && (
              <>
                <p><strong>Metric:</strong> Monthly Burn Rate (OpEx)</p>
                <p><strong>SaaS Standard Formula:</strong> <code>Sum(Operating Expenditures in month)</code></p>
                <p><strong>Your Math:</strong> Aggregation of <code>{mappings.spendCol || "[unmapped spend]"}</code> columns for the latest month cohort.</p>
                <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1 overflow-x-auto">
                  <div>Latest Month Operating Spend: ${calculatedMetrics.monthlyBurn.toLocaleString()}</div>
                  <div>Previous Month Operating Spend: {(monthlyData[monthlyData.length-2]?.spend || 0).toLocaleString()}</div>
                  <div>Formula Run: <code>(${calculatedMetrics.monthlyBurn} - {monthlyData[monthlyData.length-2]?.spend || 0}) / {monthlyData[monthlyData.length-2]?.spend || 1} = {calculatedMetrics.monthlyBurnTrend.toFixed(1)}% Trend</code></div>
                </div>
              </>
            )}
            {activeEvidenceMetric === "runway" && (
              <>
                <p><strong>Metric:</strong> Cash Runway (Months)</p>
                <p><strong>SaaS Standard Formula:</strong> <code>Cash Balance / Net Monthly Cash Burn</code></p>
                <p><strong>Your Math:</strong> Cash on Hand divided by net negative cash outflows (Spend minus MRR).</p>
                <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1 overflow-x-auto">
                  <div>Editable Cash Balance: ${cashOnHand.toLocaleString()}</div>
                  <div>Net Cash Burn (Spend - Revenue): ${Math.max(0, calculatedMetrics.monthlyBurn - calculatedMetrics.mrr).toLocaleString()}</div>
                  <div>Formula Run: <code>${cashOnHand} / ${Math.max(0, calculatedMetrics.monthlyBurn - calculatedMetrics.mrr) || 1} = {calculatedMetrics.runway === 999 ? "Profitable" : calculatedMetrics.runway.toFixed(1) + " Months Runway"}</code></div>
                </div>
              </>
            )}
            {activeEvidenceMetric === "quickRatio" && (
              <>
                <p><strong>Metric:</strong> SaaS Quick Ratio</p>
                <p><strong>SaaS Standard Formula:</strong> <code>(New MRR + Expansion MRR) / (Contraction MRR + Churned MRR)</code></p>
                <p><strong>Your Math:</strong> <code>(MRR Gained + (New customers * ARPU)) / (Churned Accounts * ARPU)</code>. A score of &gt;2.0x is ideal.</p>
                <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1 overflow-x-auto">
                  <div>Estimated MRR Gains: ${(Math.max(0, calculatedMetrics.mrr - (monthlyData[monthlyData.length-2]?.revenue || 0)) + (monthlyData[monthlyData.length-1]?.newCustomers * calculatedMetrics.arpu)).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                  <div>Estimated MRR Lost (Churn): ${(calculatedMetrics.churnRate/100 * calculatedMetrics.mrr).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                  <div>Formula Run: <code>MRR Gains / MRR Losses = {calculatedMetrics.quickRatio.toFixed(2)}x Quick Ratio</code></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Executive Summary & Actionable Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
        
        {/* Executive Summary Card */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-3xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-extrabold tracking-tight">AI Executive Summary</h3>
              </div>

              {/* Confidence Score */}
              <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg text-[10px] font-extrabold">
                <span>Confidence:</span>
                <span className="font-mono">{calculatedMetrics.confidenceScore}%</span>
              </div>
            </div>
            
            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-350 leading-relaxed max-w-none prose dark:prose-invert">
              {/* Process executiveSummaryNarrative variables into formatted lines */}
              {executiveSummaryNarrative.split("\n").map((line, idx) => {
                if (line.startsWith("###")) {
                  return null;
                }
                if (line.startsWith("* ")) {
                  const content = line.substring(2);
                  const boldPart = content.split("**");
                  return (
                    <div key={idx} className="flex gap-1.5 items-start mt-2">
                      <span className="text-blue-500 mt-1 select-none">•</span>
                      <p className="m-0">
                        {boldPart.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-slate-850 dark:text-white font-bold">{p}</strong> : p)}
                      </p>
                    </div>
                  );
                }
                const boldPart = line.split("**");
                return (
                  <p key={idx} className="m-0 mt-2">
                    {boldPart.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-slate-850 dark:text-white font-bold">{p}</strong> : p)}
                  </p>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-5 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Calculated based on active data cohorts</span>
            </span>
            <button
              onClick={onNavigateToBilling}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-bold"
            >
              Unlock Board PDF Reports →
            </button>
          </div>
        </div>

        {/* Actionable Recommendations Panel */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-3xs flex flex-col">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-extrabold tracking-tight">Founder Action Plan</h3>
          </div>

          <div className="flex-1 mt-4 space-y-4 overflow-y-auto max-h-[340px] pr-1">
            {recommendations.map((rec) => (
              <div 
                key={rec.id} 
                className={`p-3.5 rounded-xl border text-xs text-left transition ${
                  rec.level === "critical" ? "bg-red-500/5 border-red-500/20 text-red-950 dark:text-red-200" :
                  rec.level === "warning" ? "bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-200" :
                  rec.level === "info" ? "bg-blue-500/5 border-blue-500/20 text-blue-950 dark:text-blue-200" :
                  "bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-200"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`p-1 rounded-md ${
                      rec.level === "critical" ? "bg-red-500/10 text-red-500" :
                      rec.level === "warning" ? "bg-amber-500/10 text-amber-500" :
                      rec.level === "info" ? "bg-blue-500/10 text-blue-500" :
                      "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {rec.level === "critical" ? <AlertTriangle className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                    </span>
                    <span className="font-extrabold text-[11px] uppercase tracking-wider">{rec.title}</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-75">{rec.metric}</span>
                </div>
                
                <p className="mt-2 text-[11px] leading-relaxed opacity-90">{rec.desc}</p>
                
                <div className="mt-3 pt-2.5 border-t border-slate-200/40 dark:border-slate-700/40 flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider font-bold opacity-60">Strategic Next Step:</span>
                  <span className="font-bold text-[11px] flex items-center gap-1 text-slate-850 dark:text-white">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{rec.action}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-4 text-[10px] text-slate-400 text-center">
            <span>Playbooks generated dynamically using local rules</span>
          </div>
        </div>

      </div>

    </div>
  );
}
