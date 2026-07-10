import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  BrainCircuit, 
  AlertCircle, 
  Loader2, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Compass,
  Check,
  Send,
  User,
  MessageSquare,
  HelpCircle,
  Sparkle
} from "lucide-react";
import Markdown from "react-markdown";
import { AIAnalysisResult, AIRecommendedChart, Widget, Role, Measure, ColumnMetadata } from "../types";

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

  const triggerAIAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      console.error(err);
      setError(err.message || "Failed to communicate with AI Engine. Please make sure server is running and API key is set.");
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

  // Chat request function
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

    // Prepare previous messages mapping for the Gemini conversation API format
    const activeHistory = [...chatMessages, newUserMsg].map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      console.error(err);
      setChatError(err.message || "Failed to load response. Ensure your environment has GEMINI_API_KEY.");
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

      {/* Render TAB 1: EXECUTIVE AUDIT */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Automated Audit Synthesis</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Run a complete statistical pass over active columns to identify high-impact recommendations.</p>
            </div>
            <button
              id="btn-trigger-ai-analysis"
              onClick={triggerAIAnalysis}
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
                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-xl border shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${
                          isHigh 
                            ? "narrative-card-high" 
                            : isMed 
                            ? "narrative-card-med" 
                            : "narrative-card-low"
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          isHigh 
                            ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400" 
                            : isMed 
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" 
                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{insight.title}</h4>
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
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{insight.description}</p>
                          
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-1 pt-1.5 border-t border-slate-50 dark:border-slate-800/80">
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
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Live BI Conversational Partner</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Context: {dataset.length} active rows grounded directly with Gemini-3.5-flash</p>
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
