import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  BrainCircuit, 
  AlertCircle, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  Plus,
  Compass,
  Check,
  Send,
  User,
  MessageSquare,
  HelpCircle,
  Sparkle,
  Key
} from "lucide-react";
import Markdown from "react-markdown";
import { AIAnalysisResult, AIRecommendedChart, AISuggestedKPI, Widget, Role, Measure, ColumnMetadata } from "../types";

interface AIInsightsPanelProps {
  dataset: any[];
  activeRole: Role;
  columns: ColumnMetadata[];
  measures: Measure[];
  onAddWidget: (widget: Widget) => void;
  result: AIAnalysisResult | null;
  setResult: (res: AIAnalysisResult | null) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ⚡ Dynamic Local Heuristic Engine for Instant Statistical Insights & BI Auditing
export function generateLocalHeuristicInsights(
  dataset: any[],
  columns: ColumnMetadata[],
  measures: Measure[],
  activeRole: Role
): AIAnalysisResult {
  const numericCols = columns.filter(c => c.type === "number");
  const stringCols = columns.filter(c => c.type === "string");
  const dateCols = columns.filter(c => 
    c.type === "date" || 
    c.name.toLowerCase().includes("date") || 
    c.name.toLowerCase().includes("time") || 
    c.name.toLowerCase().includes("month") || 
    c.name.toLowerCase().includes("year")
  );

  const insights: any[] = [];
  const suggestedKPIs: any[] = [];
  const recommendedCharts: any[] = [];

  if (!dataset || dataset.length === 0) {
    return {
      insights: [
        {
          title: "Insufficient Data Volume",
          description: "The active dataset is currently empty. Please upload or paste records to generate statistical insights.",
          impact: "high",
          metricAffected: "Row Count",
          decreaseDetected: false,
          rootCause: "The analysis engine was triggered without any active rows in the database.",
          resolution: "Please upload a CSV or paste JSON data to seed the spreadsheet database and run the audit."
        }
      ],
      suggestedKPIs: [
        {
          name: "Data Density Ratio",
          formula: "COUNT(Records) / Total Fields",
          description: "Measures the completeness and quality of data entries across all rows."
        }
      ],
      recommendedCharts: []
    };
  }

  // Calculate statistics for numeric columns
  const numericStats = numericCols.map(col => {
    const vals = dataset.map(row => Number(row[col.name])).filter(v => !isNaN(v));
    if (vals.length === 0) return null;
    const sum = vals.reduce((a, b) => a + b, 0);
    const mean = sum / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    return {
      name: col.name,
      sum,
      mean,
      stdDev,
      max,
      min,
      count: vals.length
    };
  }).filter(Boolean) as Array<{ name: string; sum: number; mean: number; stdDev: number; max: number; min: number; count: number }>;

  // Outlier / Anomaly detection based on standard deviation boundaries (mean + 2*sigma)
  numericStats.forEach(stat => {
    const threshold = stat.mean + 1.8 * stat.stdDev;
    const outliers = dataset.filter(row => {
      const v = Number(row[stat.name]);
      return !isNaN(v) && v > threshold;
    });

    if (outliers.length > 0) {
      insights.push({
        title: `Outliers and Volatility Detected in ${stat.name}`,
        description: `We detected ${outliers.length} records that significantly exceed normal variance thresholds (exceeding standard deviation threshold of ${threshold.toFixed(1)}). The peak value recorded is ${stat.max.toLocaleString()} compared to the cohort average of ${stat.mean.toFixed(1)}.`,
        impact: stat.stdDev / stat.mean > 0.4 ? "high" : "medium",
        metricAffected: stat.name,
        decreaseDetected: false,
        rootCause: "Extreme values or unique operational events are introducing strong mathematical variance, which shifts standard averages.",
        resolution: "To resolve mathematical skewing, implement robust data sanitization or segment these extreme outlier cases into a dedicated executive report."
      });
    }
  });

  // Chronological trend line analysis
  const primaryDateCol = dateCols[0]?.name || columns.find(c => c.name.toLowerCase().includes("date") || c.name.toLowerCase().includes("month"))?.name;
  const primaryNumericStat = numericStats[0];

  if (primaryDateCol && primaryNumericStat && dataset.length >= 4) {
    try {
      const sortedData = [...dataset].sort((a, b) => {
        const da = new Date(a[primaryDateCol]).getTime();
        const db = new Date(b[primaryDateCol]).getTime();
        return da - db;
      });

      const half = Math.floor(sortedData.length / 2);
      const firstHalf = sortedData.slice(0, half);
      const secondHalf = sortedData.slice(half);

      const firstAvg = firstHalf.map(r => Number(r[primaryNumericStat.name])).filter(v => !isNaN(v)).reduce((a, b) => a + b, 0) / Math.max(1, firstHalf.length);
      const secondAvg = secondHalf.map(r => Number(r[primaryNumericStat.name])).filter(v => !isNaN(v)).reduce((a, b) => a + b, 0) / Math.max(1, secondHalf.length);

      if (firstAvg > 0) {
        const pctChange = ((secondAvg - firstAvg) / firstAvg) * 100;
        const trendDirection = pctChange > 0 ? "Expansion" : "Contraction";
        insights.push({
          title: `Temporal Trend ${trendDirection}: ${primaryNumericStat.name}`,
          description: `Chronological analysis shows that the average ${primaryNumericStat.name} moved from ${firstAvg.toFixed(1)} in the first half of the dataset to ${secondAvg.toFixed(1)} in the second half. This constitutes a ${Math.abs(pctChange).toFixed(1)}% temporal ${pctChange > 0 ? "growth surge" : "downward adjustment"}.`,
          impact: Math.abs(pctChange) > 15 ? "high" : "medium",
          metricAffected: primaryNumericStat.name,
          decreaseDetected: pctChange < 0,
          rootCause: pctChange < 0
            ? "The chronological decrease points to a structural downswing in the latter half of the records, potentially due to seasonal trends, customer drop-offs, or marketing run-down."
            : "Positive momentum is observed over time, showing progressive expansion in metric averages across the chronological cohort.",
          resolution: pctChange < 0
            ? "Address this chronological contraction immediately by conducting a re-engagement campaign, optimizing pricing or resource allocation, and auditing low-performing cohorts."
            : "Document the key contributors to this expansion and replicate these process adjustments across other operations segments to capitalize on the momentum."
        });
      }
    } catch (e) {
      // Date parse error fallback
    }
  }

  // Categorical concentration metrics
  stringCols.forEach(col => {
    const freq: Record<string, number> = {};
    dataset.forEach(row => {
      const val = String(row[col.name] || "Unknown");
      freq[val] = (freq[val] || 0) + 1;
    });

    const sortedCats = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
      const [topCat, count] = sortedCats[0];
      const pct = (count / dataset.length) * 100;

      if (pct > 30 && dataset.length > 4) {
        insights.push({
          title: `Dominant Segment Concentration in '${col.name}'`,
          description: `The categorical segment "${topCat}" accounts for ${pct.toFixed(1)}% of all entries (${count} out of ${dataset.length} records). This signals a strong structural concentration which might expose the report to category-specific biases.`,
          impact: pct > 55 ? "high" : "medium",
          metricAffected: col.name,
          decreaseDetected: false,
          rootCause: "Over-reliance or customer preference skew towards a single category exposes the system to high structural bias.",
          resolution: "De-risk segment dependency by aggressively targeting underrepresented categories, optimizing cross-segment campaigns, or introducing dedicated incentives."
        });
      }
    }
  });

  // Guarantee at least 2 insights
  if (insights.length < 2) {
    insights.push({
      title: "Stable Operational Metrics",
      description: `Analysis of your ${dataset.length} active data rows shows uniform distribution. Standard metrics are within normal control limits without extreme outliers or anomalies detected.`,
      impact: "low",
      metricAffected: "Core Cohort",
      decreaseDetected: false,
      rootCause: "Uniform distribution of metric values indicates quiet operational margins and absence of high volatility.",
      resolution: "Introduce dynamic experiments, incentive changes, or product bundles to break the plateau and trigger high-yield growth patterns."
    });
  }

  // Suggested KPIs by role (matching system specs perfectly)
  const roleKPIs: Record<Role, AISuggestedKPI[]> = {
    CEO: [
      {
        name: "Operational Performance Coefficient",
        formula: "AVG(Primary_Metric) * 1.15",
        description: "An index combining total volume and trend stability to gauge general enterprise output."
      },
      {
        name: "Enterprise Value Leverage",
        formula: "SUM(Metrics) / COUNT(Records)",
        description: "Normalized net contribution per atomic interaction or transaction."
      }
    ],
    CFO: [
      {
        name: "Heuristic Gross Margin Strategy",
        formula: "([Total Revenue] - [Costs]) / [Total Revenue]",
        description: "Assesses raw operating margin efficiency. If actual cost columns aren't defined, defaults to a standard 38% baseline margins."
      },
      {
        name: "Resource Yield Ratio",
        formula: "SUM(Metrics) / StandardDeviation",
        description: "Standard risk-adjusted output ratio to measure asset efficiency and capital deployment stability."
      }
    ],
    CMO: [
      {
        name: "Campaign Engagement Index",
        formula: "(SUM(Engagement) * 0.7) + (SUM(Conversions) * 0.3)",
        description: "Aggregates multi-channel interaction metrics into a singular normalized score for executive briefings."
      },
      {
        name: "Customer Acquisition Velocity",
        formula: "COUNT(Clicks) / AverageDays",
        description: "Measures the operational acceleration of leads converting through the sales funnel."
      }
    ],
    "Sales Director": [
      {
        name: "Sales Velocity Factor",
        formula: "(SUM(Sales) / AVG(UnitCost)) * ConversionRate",
        description: "Quantifies the conversion velocity of products moving through active regional distribution lists."
      },
      {
        name: "Average Deal Concentration",
        formula: "MAX(Sales) / SUM(Sales)",
        description: "Identifies whale-account dependency risks. A high ratio indicates revenue is tied to too few deals."
      }
    ],
    "HR Specialist": [
      {
        name: "FTE Productivity Index",
        formula: "SUM(MetricValue) / Headcount",
        description: "Tracks individual productivity quotas normalized by department headcount and hours."
      },
      {
        name: "Labor Investment Return (LIR)",
        formula: "TotalRevenue / TotalCompensation",
        description: "Heuristic multiplier describing the economic returns generated on human capital investments."
      }
    ],
    "Business Analyst": [
      {
        name: "Coefficient of Variance (CoV)",
        formula: "StandardDeviation / Mean",
        description: "Measures dispersion of data points relative to the mean. Excellent for tracking process consistency."
      },
      {
        name: "Normal Distribution Z-Score Threshold",
        formula: "(Value - Mean) / StandardDeviation",
        description: "Calculates the dynamic Z-Score to isolate systemic noise from statistically significant performance indicators."
      }
    ]
  };

  const selectedKPIs = roleKPIs[activeRole] || roleKPIs["Business Analyst"];
  suggestedKPIs.push(...selectedKPIs);

  if (numericStats.length > 1) {
    suggestedKPIs.push({
      name: `${numericStats[0].name} Correlation Ratio`,
      formula: `CORREL(${numericStats[0].name}, ${numericStats[1].name})`,
      description: "Mathematical dependency value identifying whether changes in one variable statistically explain movements in another."
    });
  }

  // Chart Recommendations
  if (primaryDateCol && primaryNumericStat) {
    recommendedCharts.push({
      title: `${primaryNumericStat.name} Chronological Trend Analysis`,
      chartType: "line",
      xAxis: primaryDateCol,
      yAxis: primaryNumericStat.name,
      reason: `Tracking ${primaryNumericStat.name} over ${primaryDateCol} using a Line Chart is ideal for observing long-term growth vectors, cyclic patterns, and sudden outlier dips.`
    });
  }

  const primaryStringCol = stringCols[0]?.name;
  if (primaryStringCol && primaryNumericStat) {
    recommendedCharts.push({
      title: `${primaryNumericStat.name} Distribution by ${primaryStringCol}`,
      chartType: "bar",
      xAxis: primaryStringCol,
      yAxis: primaryNumericStat.name,
      reason: `Comparing ${primaryNumericStat.name} across different ${primaryStringCol} values in a Bar Chart exposes competitive performance margins and localized strongholds.`
    });
  }

  if (recommendedCharts.length === 0 && columns.length >= 2) {
    recommendedCharts.push({
      title: "Active Core Data Dimensions",
      chartType: "bar",
      xAxis: columns[0].name,
      yAxis: columns[1]?.name || columns[0].name,
      reason: "Visualizes the physical volume of active records to compare data frequency distributions."
    });
  }

  return {
    insights,
    suggestedKPIs,
    recommendedCharts
  };
}

// 💬 Dynamic Local Conversational Assistant respond engine for chat fallback
export function generateLocalChatResponse(
  query: string,
  dataset: any[],
  columns: ColumnMetadata[],
  measures: Measure[],
  activeRole: Role
): string {
  const normalizedQuery = query.toLowerCase();
  const numericCols = columns.filter(c => c.type === "number");
  const stringCols = columns.filter(c => c.type === "string");
  const totalRows = dataset?.length || 0;

  if (normalizedQuery.includes("anomaly") || normalizedQuery.includes("outlier") || normalizedQuery.includes("spike") || normalizedQuery.includes("exception")) {
    let report = `### 🔍 Local Statistical Outlier Audit\n\nI have parsed all **${totalRows} rows** for numeric variance beyond standard tolerances (mean ± 1.8σ):\n\n`;
    let found = false;

    numericCols.forEach(col => {
      const vals = dataset.map(row => Number(row[col.name])).filter(v => !isNaN(v));
      if (vals.length < 2) return;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const stdDev = Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length);
      const threshold = mean + 1.8 * stdDev;
      const outliers = dataset.filter(row => Number(row[col.name]) > threshold);

      if (outliers.length > 0) {
        found = true;
        report += `- **Metric '${col.name}'**: Found **${outliers.length} anomalous spikes** exceeding standard deviation threshold of \`${threshold.toFixed(2)}\`. Peak value is \`${Math.max(...vals).toLocaleString()}\` (cohort mean: \`${mean.toFixed(2)}\`).\n`;
      }
    });

    if (!found) {
      report += `No statistically significant anomalies were detected. All numeric distributions are clustered safely within normal operational deviation boundaries.`;
    } else {
      report += `\n**Strategic Recommendation:** Investigate the temporal sources of these spikes to isolate operational seasonality from structural data logging issues.`;
    }
    return report;
  }

  if (normalizedQuery.includes("strategy") || normalizedQuery.includes("decision") || normalizedQuery.includes("action") || normalizedQuery.includes("optimize") || normalizedQuery.includes("proposal")) {
    return `### 💡 Strategic Growth Actions (Local Heuristic Engine)

Based on the metadata analysis of the **${activeRole}** dataset, here are three strategic proposals:

1. **Category Concentration Optimization**
   - *Observation:* Categorical distributions reveal concentrated volumes.
   - *Action:* Diversify resources across underrepresented niches to balance total addressable market coverage.

2. **Establish Real-time Outlier Alarms**
   - *Observation:* Standard deviations show structural spikes in metric volumes.
   - *Action:* Set up standard deviation alert rules inside your schema to trigger warnings when parameters shift beyond ±1.8σ.

3. **Incorporate Predictive KPI Calculations**
   - *Observation:* Reports utilize trailing historical aggregations.
   - *Action:* Upgrade report measures to include forward-looking predictive metrics (e.g. rolling 30-day exponentially weighted averages).`;
  }

  if (normalizedQuery.includes("formula") || normalizedQuery.includes("measure") || normalizedQuery.includes("kpi") || normalizedQuery.includes("critique")) {
    return `### 🧮 KPI & Analytical Formulas Critique (Local Heuristics)

The current workspace contains **${measures.length} measures** across **${columns.length} columns**. Here are 2 high-value formulas recommended specifically for a **${activeRole}**:

1. **Volatility Coefficient Formula**
   - *Expression:* \`StandardDeviation([Column]) / Average([Column])\`
   - *Purpose:* Normalizes variance across different product segments, providing a pure risk-to-reward metrics ratio.

2. **Temporal Yield Run-Rate**
   - *Expression:* \`Sum([Metric]) / Unique_Date_Count\`
   - *Purpose:* Calculates standardized run-rates per temporal unit to isolate calendar-day volume variations.

Would you like me to help configure these custom expressions on your dashboard?`;
  }

  if (normalizedQuery.includes("segment") || normalizedQuery.includes("comparison") || normalizedQuery.includes("table") || normalizedQuery.includes("category") || normalizedQuery.includes("region") || normalizedQuery.includes("channel")) {
    if (stringCols.length > 0) {
      const primaryCat = stringCols[0].name;
      const freq: Record<string, number> = {};
      dataset.forEach(row => {
        const val = String(row[primaryCat] || "Unknown");
        freq[val] = (freq[val] || 0) + 1;
      });

      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
      let table = `### 📊 Category Concentration Matrix\n\nHere is a distribution audit of the primary segment column **'${primaryCat}'**:\n\n`;
      table += `| Segment '${primaryCat}' | Record Count | Percentage Contribution |\n`;
      table += `| :--- | :---: | :---: |\n`;
      sorted.forEach(([cat, count]) => {
        const pct = (count / totalRows) * 100;
        table += `| **${cat}** | ${count} | ${pct.toFixed(1)}% |\n`;
      });
      table += `\n*Note: Showing top ${sorted.length} categories represented in the ${totalRows}-record dataset.*`;
      return table;
    }
  }

  return `### 📊 Fast Local Analytics Audit

Here is a quick summary of the **${columns.length} columns** scanned from your active **${activeRole}** workspace:

- **Record Count**: ${totalRows} entries loaded successfully.
- **Identified Dimensions**: ${stringCols.map(c => `\`${c.name}\``).join(", ") || "None"}
- **Identified Metrics**: ${numericCols.map(c => `\`${c.name}\``).join(", ") || "None"}

*Self-Service Tip:* To get the most tailored statistical audit, you can query specific topics such as:
1. **"Perform anomaly audit"** (Detects outliers and mathematical volatility spikes)
2. **"Suggest strategic actions"** (Uncovers business recommendations)
3. **"Review KPI formulas"** (Critiques active metrics and suggests math)
4. **"Show category table"** (Generates a distribution table)`;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIInsightsPanel({
  dataset,
  activeRole,
  columns,
  measures,
  onAddWidget,
  result,
  setResult
}: AIInsightsPanelProps) {
  // Tab control state
  const [activeTab, setActiveTab] = useState<"audit" | "chat">("audit");

  // Executive Audit States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedChartIds, setAppliedChartIds] = useState<Record<string, boolean>>({});
  const [insightMode, setInsightMode] = useState<"gemini" | "local">("gemini");
  const [wasFallbackActivated, setWasFallbackActivated] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem("dg_custom_api_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInputTemp, setKeyInputTemp] = useState("");

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I am your **Gemini Business Intelligence Partner**. I have scanned your raw dataset containing **${dataset.length} records** across **${columns.length} columns**.

How can I help you extract value from your active dataset today? You can write custom queries below or click any of the preset analytical topics to begin!`
    }
  ]);
  const [currentQuery, setCurrentQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  const triggerAIAnalysis = async (forcedMode?: "gemini" | "local", overrideKey?: string) => {
    const targetMode = forcedMode || insightMode;
    const activeKey = overrideKey !== undefined ? overrideKey : customApiKey;
    setLoading(true);
    setError(null);
    setWasFallbackActivated(false);

    if (targetMode === "local") {
      // Fast, zero-dependency client side statistical calculations
      await new Promise(resolve => setTimeout(resolve, 600)); // satisfying analytical loader feedback
      try {
        const localData = generateLocalHeuristicInsights(dataset, columns, measures, activeRole);
        setResult(localData);
      } catch (err: any) {
        setError("Local heuristics engine error: " + err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(activeKey ? { "x-gemini-api-key": activeKey } : {})
        },
        body: JSON.stringify({
          data: dataset,
          role: activeRole,
          columns: columns.map(c => c.name),
          measures: measures.map(m => ({ name: m.name, formula: m.formula }))
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status code ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Gemini API error:", err);
      let errMsg = err.message || "Failed to communicate with Gemini AI Engine.";
      if (errMsg.includes("Failed to fetch")) {
        errMsg = "Failed to fetch (Network connection error: the back-end API at /api/analyze is unreachable. If you are running locally, make sure your backend server is running on port 3000 via 'npm run dev' instead of running 'vite' directly. If you are on Vercel, verify your Serverless Functions deployment is complete and your API key is configured in settings.)";
      }
      setError(errMsg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendedChart = (rec: AIRecommendedChart, index: number) => {
    const resolvedX = columns.find(c => c.name.toLowerCase() === rec.xAxis.toLowerCase())?.name || columns[0]?.name || "Date";
    const matchedMeasure = measures.find(m => m.name.toLowerCase() === rec.yAxis.toLowerCase());
    const matchedCol = columns.find(c => c.name.toLowerCase() === rec.yAxis.toLowerCase());
    
    let resolvedY: string[] = [];
    if (matchedMeasure) {
      resolvedY = [matchedMeasure.id];
    } else if (matchedCol) {
      resolvedY = [measures[0]?.id || "spend_sum"];
    } else {
      resolvedY = [measures[0]?.id || "spend_sum"];
    }

    const newWidget: Widget = {
      id: "widget_ai_" + Date.now() + "_" + index,
      title: rec.title,
      type: rec.chartType,
      config: {
        xAxis: resolvedX,
        yAxisMeasures: resolvedY,
        colorTheme: rec.chartType === "bar" ? "amber" : rec.chartType === "line" ? "emerald" : "indigo",
        showLegend: true,
        showGrid: true,
        limit: 15
      },
      gridSpan: "col-span-3"
    };

    onAddWidget(newWidget);
    setAppliedChartIds(prev => ({ ...prev, [index]: true }));
  };

  // Chat request function with instant heuristic fallback
  const handleSendChatMessage = async (userQueryText: string) => {
    if (!userQueryText.trim() || chatLoading) return;

    const newUserMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: userQueryText
    };

    setChatMessages(prev => [...prev, newUserMsg]);
    setCurrentQuery("");
    setChatLoading(true);
    setChatError(null);

    if (insightMode === "local") {
      await new Promise(resolve => setTimeout(resolve, 500));
      const text = generateLocalChatResponse(userQueryText, dataset, columns, measures, activeRole);
      const assistantMsg: ChatMessage = {
        id: "reply_" + Date.now(),
        role: "assistant",
        content: text
      };
      setChatMessages(prev => [...prev, assistantMsg]);
      setChatLoading(false);
      return;
    }

    const activeHistory = [...chatMessages, newUserMsg].map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(customApiKey ? { "x-gemini-api-key": customApiKey } : {})
        },
        body: JSON.stringify({
          messages: activeHistory,
          data: dataset,
          role: activeRole,
          columns: columns.map(c => c.name),
          measures: measures.map(m => ({ name: m.name, formula: m.formula }))
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Communication failure with back-end chat proxy.");
      }

      const resData = await response.json();
      const assistantMsg: ChatMessage = {
        id: "reply_" + Date.now(),
        role: "assistant",
        content: resData.text || "I was unable to compile an analytical response. Please try another query."
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Chat API error:", err);
      let errMsg = err.message || "Failed to communicate with Gemini AI Chat.";
      if (errMsg.includes("Failed to fetch")) {
        errMsg = "Failed to fetch (Network connection error: the back-end API at /api/chat is unreachable. If you are running locally, make sure your backend server is running on port 3000 via 'npm run dev'. If on Vercel, verify your Serverless Functions deployment is complete.)";
      }
      setChatError(errMsg);
    } finally {
      setChatLoading(false);
    }
  };

  const PRESET_TOPICS = [
    {
      title: "Performance Anomaly Audit",
      prompt: "Perform a rapid statistical audit of this dataset. Highlight any notable anomalies, extreme outliers, or sudden spikes in key metrics.",
    },
    {
      title: "Strategic Action Proposal",
      prompt: "Based on the columns and metrics visible, suggest three strategic growth decisions that would directly optimize our performance/profitability.",
    },
    {
      title: "Formula & Measures Critique",
      prompt: "Review our currently configured formulas and measures. Suggest 2 high-value advanced KPI formulas we should add to our business intelligence report.",
    },
    {
      title: "Segment Matrix Summary",
      prompt: "Create a neat markdown comparison table summarizing trends across the main product categories, regional areas, or channels.",
    }
  ];

  return (
    <div id="ai-insights-panel" className="max-w-5xl mx-auto p-4 space-y-6">
      
      {/* Intro Hero Box */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_107%,rgba(59,130,246,0.08),rgba(255,255,255,0))]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-400" />
              <span>Gemini AI Business Intelligence Desk</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">AI Insights & Conversational Analyst</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Synthesize key trends, run deep automated audits, and ask natural language questions directly grounded on your active <strong>{activeRole}</strong> dataset.
            </p>
          </div>

          <div className="flex bg-slate-850/80 p-1 rounded-lg border border-slate-700 shrink-0">
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition ${
                activeTab === "audit" 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Operational Audit
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                activeTab === "chat" 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Interactive Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optional Custom API Key Override Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-3xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${customApiKey ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
              <Key className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Custom Gemini API Key Override (Vercel Offline Helper)
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {customApiKey 
                  ? `Active Custom Key (${customApiKey.substring(0, 6)}...${customApiKey.substring(customApiKey.length - 4)})`
                  : "Using server configuration (.env file / Vercel variables)"
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowKeyInput(!showKeyInput);
              if (!showKeyInput) setKeyInputTemp(customApiKey);
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
          >
            {showKeyInput ? "Hide Settings" : "Configure Key Override"}
          </button>
        </div>

        {showKeyInput && (
          <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg space-y-3">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              If your Vercel deployment cannot read your local <code>.env</code> file (which is ignored by Git), you can paste your <strong>GEMINI_API_KEY</strong> below. It is saved 100% securely in your browser's local storage and forwarded via secure headers to your server endpoints.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                placeholder="Paste your Gemini API Key here (AIzaSy...)"
                value={keyInputTemp}
                onChange={(e) => setKeyInputTemp(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-150 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    const trimmed = keyInputTemp.trim();
                    localStorage.setItem("dg_custom_api_key", trimmed);
                    setCustomApiKey(trimmed);
                    setShowKeyInput(false);
                    triggerAIAnalysis("gemini", trimmed);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-3xs"
                >
                  Save Override
                </button>
                {customApiKey && (
                  <button
                    onClick={() => {
                      localStorage.removeItem("dg_custom_api_key");
                      setCustomApiKey("");
                      setKeyInputTemp("");
                      setShowKeyInput(false);
                      triggerAIAnalysis("gemini", "");
                    }}
                    className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold cursor-pointer transition-all"
                  >
                    Clear Override
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Render TAB 1: EXECUTIVE AUDIT */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          
          {/* Engine Selector Segment */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 font-mono tracking-wider">Analysis Engine Core</span>
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Generating rich, multi-dimensional analytical insights using the real-time **Gemini AI model** based strictly on your uploaded dataset.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 shadow-3xs shrink-0 select-none">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Gemini Engine Active</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Automated Audit Synthesis</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Run a complete statistical pass over active columns to identify high-impact recommendations.</p>
            </div>
            <button
              id="btn-trigger-ai-analysis"
              onClick={() => triggerAIAnalysis()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-150 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-all flex items-center justify-center space-x-2 shrink-0 shadow-sm disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span>Ingesting Data...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  <span>Run Complete Audit</span>
                </>
              )}
            </button>
          </div>



          {/* Loading Screen */}
          {loading && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Processing analytical insights...</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gemini is auditing {dataset.length} data rows, matching schema dimensions, and compiling business metrics for the <strong className="text-slate-600 dark:text-slate-300">{activeRole}</strong> viewport.
                </p>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono animate-pulse">
                POST /api/analyze - MODEL: gemini-2.5-flash
              </div>
            </div>
          )}

          {/* Error block */}
          {error && (
            <div className="p-5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 rounded-xl flex items-start gap-3.5 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold">AI Analysis Interrupted</h4>
                <p className="leading-relaxed text-rose-700 dark:text-rose-300">{error}</p>
                <p className="text-rose-500 dark:text-rose-400 font-medium mt-1">
                  Please verify that <strong>GEMINI_API_KEY</strong> is configured. 
                  <em> Note: If you added or changed environment variables in Vercel, you <strong>must redeploy</strong> your project on Vercel for the changes to take active effect!</em>
                </p>
              </div>
            </div>
          )}

          {/* Results Rendering */}
          {result && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              
              {/* Narrative insights (2 Columns wide) */}
              <div className="md:col-span-2 space-y-5">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 px-1">
                  <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Core Executive Narratives</span>
                </h3>

                <div className="space-y-3.5">
                  {result.insights.map((insight, idx) => {
                    const isHigh = insight.impact === "high";
                    const isMed = insight.impact === "medium";
                    const isDecrease = !!insight.decreaseDetected;
                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-xl border shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${
                          isHigh 
                            ? "narrative-card-high border-rose-100 dark:border-rose-950/50 bg-rose-50/10 dark:bg-rose-950/5" 
                            : isMed 
                            ? "narrative-card-med border-amber-100 dark:border-amber-950/50 bg-amber-50/10 dark:bg-amber-950/5" 
                            : "narrative-card-low border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          isDecrease
                            ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                            : isHigh 
                            ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400" 
                            : isMed 
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" 
                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}>
                          {isDecrease ? (
                            <TrendingDown className="w-5 h-5 animate-pulse" />
                          ) : (
                            <AlertTriangle className="w-5 h-5" />
                          )}
                        </div>
                        
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2.5">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                              {insight.title}
                            </h4>
                            <div className="flex items-center gap-1.5">
                              {isDecrease && (
                                <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                  <TrendingDown className="w-3 h-3" />
                                  <span>Decline Detected</span>
                                </span>
                              )}
                              <span className={`text-[10px] font-mono tracking-wider uppercase font-bold px-2 py-0.5 rounded ${
                                isHigh 
                                  ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300" 
                                  : isMed 
                                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300" 
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}>
                                {insight.impact} impact
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {insight.description}
                          </p>

                          {/* Root Cause Section */}
                          {insight.rootCause && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-100 dark:border-slate-850 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Why is it so? (Root Cause Analysis)</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                                {insight.rootCause}
                              </p>
                            </div>
                          )}

                          {/* Resolution/Action Section */}
                          {insight.resolution && (
                            <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg border border-emerald-500/10 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                                <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>How can it be resolved? (Action Plan)</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                                {insight.resolution}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono pt-1.5 border-t border-slate-50 dark:border-slate-800/80">
                            <span>Metric Scope:</span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">{insight.metricAffected}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KPI Recommendations & Visuals Panel (1 Column wide) */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 px-1">
                  <BrainCircuit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Recommended Visualizations</span>
                </h3>

                <div className="space-y-4">
                  {/* Dynamic Chart Suggestions with ADD to CANVAS triggers */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider pb-2 border-b border-slate-100 dark:border-slate-805">
                      Instant Report Elements
                    </h4>
                    
                    <div className="space-y-3">
                      {result.recommendedCharts.map((rec, idx) => {
                        const isApplied = appliedChartIds[idx];
                        return (
                          <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-xl space-y-2 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-snug">{rec.title}</div>
                                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 capitalize mt-0.5">
                                  {rec.chartType} chart • X: {rec.xAxis} • Y: {rec.yAxis}
                                </div>
                              </div>
                              
                              <button
                                id={`btn-apply-rec-${idx}`}
                                onClick={() => applyRecommendedChart(rec, idx)}
                                disabled={isApplied}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isApplied 
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 cursor-default" 
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                }`}
                                title={isApplied ? "Applied to report" : "Apply visual to canvas"}
                              >
                                {isApplied ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{rec.reason}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* KPI Suggestions */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider pb-2 border-b border-slate-100 dark:border-slate-805">
                      Departmental formulas
                    </h4>

                    <div className="space-y-3.5">
                      {result.suggestedKPIs.map((kpi, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{kpi.name}</span>
                            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded font-semibold border border-blue-100 dark:border-blue-900/50">
                              {kpi.formula}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{kpi.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {!result && !loading && (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
              <BrainCircuit className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Dashboard Audit is Idle</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1">
                Click the <strong>"Run Complete Audit"</strong> button above to request Gemini to parse your structured raw columns, generate KPI recommendations, and uncover narratives.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Render TAB 2: INTERACTIVE DATA CHATBOT */}
      {activeTab === "chat" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col h-[580px]">
          
          {/* Chat Header Info */}
          <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkle className="w-4 h-4 text-blue-600 animate-spin" style={{ animationDuration: "3s" }} />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>Live BI Conversational Partner</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                    Gemini Engine
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Context: {dataset.length} active rows grounded directly in active report metrics</p>
              </div>
            </div>
            <button
              onClick={() => {
                setChatMessages([
                  {
                    id: "welcome",
                    role: "assistant",
                    content: `Hello! I have reset our conversation history. How can I help you extract value from your **${dataset.length} data rows**?`
                  }
                ]);
                setChatError(null);
              }}
              className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline font-semibold cursor-pointer"
            >
              Reset Chat
            </button>
          </div>

          {/* Quick Preset Queries */}
          {chatMessages.length === 1 && (
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono block mb-2.5">
                Suggested Quick Analysis Prompts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_TOPICS.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChatMessage(topic.prompt)}
                    className="p-2.5 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 rounded-lg text-left text-xs transition-all shadow-2xs text-slate-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-blue-400 flex items-start gap-2 group cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 shrink-0 mt-0.5" />
                    <span>{topic.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Message Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 bg-slate-50/20 dark:bg-slate-950/10">
            {chatMessages.map((msg) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-[85%] ${
                    isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
                    isAssistant 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {isAssistant ? <BrainCircuit className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-3xs ${
                    isAssistant 
                      ? "bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-100" 
                      : "bg-blue-600 text-white"
                  }`}>
                    {isAssistant ? (
                      <div className="markdown-body text-slate-800 dark:text-slate-100 space-y-1.5 prose max-w-none text-xs">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading reply spinner */}
            {chatLoading && (
              <div className="flex gap-3 max-w-[80%] mr-auto">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl flex items-center space-x-2.5">
                  <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 italic font-mono">Gemini is auditing tables...</span>
                </div>
              </div>
            )}

            {/* Chat Error Notice */}
            {chatError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 rounded-xl flex items-start gap-2.5 text-xs max-w-[85%] mx-auto">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">Chat Connection Interrupted</h5>
                  <p className="mt-0.5">{chatError}</p>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChatMessage(currentQuery);
            }}
            className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              disabled={chatLoading}
              placeholder={`Ask Gemini about categories, columns, trends, or OpEx variables...`}
              className="flex-1 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl px-4 py-2.5 text-xs bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 transition"
            />
            <button
              type="submit"
              disabled={!currentQuery.trim() || chatLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 text-white p-2.5 px-4 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
