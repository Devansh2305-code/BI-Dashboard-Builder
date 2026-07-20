export type Role = "CMO" | "Business Analyst" | "CFO" | "Sales Director" | "HR Specialist" | "CEO";

export interface ColumnMetadata {
  name: string;
  type: "number" | "string" | "date";
}

export interface Measure {
  id: string;
  name: string;
  formula: string; // e.g. "SUM(spend)" or "[Total Revenue] / [Total Spend]"
  expressionType: "simple" | "custom"; // simple = SUM/AVG/COUNT on column, custom = expression of other measures
  columnName?: string; // for simple types
  aggregation?: "SUM" | "AVG" | "COUNT" | "MIN" | "MAX"; // for simple types
  format: "number" | "currency" | "percent" | "integer";
  isCustom: boolean;
  description: string;
  category?: string;
}

export type ChartType = "kpi" | "bar" | "line" | "area" | "pie" | "scatter" | "radar" | "funnel" | "combo" | "table";

export interface WidgetConfig {
  xAxis: string;
  yAxisMeasures: string[]; // List of measure IDs to plot
  colorTheme: string; // Tailwind color class stem (e.g. "indigo", "emerald", "amber")
  showLegend: boolean;
  showGrid: boolean;
  limit?: number;
}

export interface Widget {
  id: string;
  title: string;
  type: ChartType;
  config: WidgetConfig;
  gridSpan?: "col-span-1" | "col-span-2" | "col-span-3" | "col-span-4" | "col-span-5" | "col-span-6";
}

export interface AIInsight {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  metricAffected: string;
  decreaseDetected?: boolean;
  rootCause?: string;
  resolution?: string;
}

export interface AISuggestedKPI {
  name: string;
  formula: string;
  description: string;
}

export interface AIRecommendedChart {
  title: string;
  chartType: ChartType;
  xAxis: string;
  yAxis: string;
  reason: string;
}

export interface AIAnalysisResult {
  insights: AIInsight[];
  suggestedKPIs: AISuggestedKPI[];
  recommendedCharts: AIRecommendedChart[];
}

// ============ ADMIN TYPES ============

export type PlanType = "free" | "core" | "prime" | "apex";

export interface SavedProject {
  id: string;
  name: string;
  dataset: any[];
  columns: ColumnMetadata[];
  measures: Measure[];
  widgets: Widget[];
  updatedAt: string;
}

export interface UserPlan {
  userId: string;
  email: string;
  plan: PlanType;
  createdAt: string;
  updatedAt: string;
  features: {
    maxDatasets: number;
    maxRows: number;
    aiAnalysisCount: number;
    customReports: boolean;
    advancedCharts: boolean;
    exportFormats: string[];
  };
}

export interface PlanConfiguration {
  free: {
    maxDatasets: number;
    maxRows: number;
    aiAnalysisCount: number;
    customReports: boolean;
    advancedCharts: boolean;
    exportFormats: string[];
  };
  pro: {
    maxDatasets: number;
    maxRows: number;
    aiAnalysisCount: number;
    customReports: boolean;
    advancedCharts: boolean;
    exportFormats: string[];
  };
  enterprise: {
    maxDatasets: number;
    maxRows: number;
    aiAnalysisCount: number;
    customReports: boolean;
    advancedCharts: boolean;
    exportFormats: string[];
  };
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalDatasets: number;
  totalRowsProcessed: number;
  aiAnalysisExecuted: number;
  reportsGenerated: number;
  timestamp: string;
}

export interface SystemConfiguration {
  maintenanceMode: boolean;
  maxFileSize: number; // in MB
  enableAiAnalysis: boolean;
  enableCustomReports: boolean;
  defaultTimeout: number; // in seconds
  geminiApiKey?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  targetUser?: string;
  changes: Record<string, any>;
  timestamp: string;
  status: "success" | "failed";
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  upiId?: string;
  transactionRef: string;
  status: "approved" | "pending" | "failed" | "paid";
}


