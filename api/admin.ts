import express, { Request, Response } from "express";
import { UserPlan, AdminAnalytics, SystemConfiguration, AuditLog, PlanType, PlanConfiguration } from "../src/types";

const adminRouter = express.Router();

// Admin key constant
const ADMIN_KEY = "PratDev0223BI";

// In-memory storage for demo (replace with database)
let users: UserPlan[] = [];
let auditLogs: AuditLog[] = [];
let systemConfig: SystemConfiguration = {
  maintenanceMode: false,
  maxFileSize: 100,
  enableAiAnalysis: true,
  enableCustomReports: true,
  defaultTimeout: 300,
};

const planConfigs: PlanConfiguration = {
  free: {
    maxDatasets: 5,
    maxRows: 10000,
    aiAnalysisCount: 10,
    customReports: false,
    advancedCharts: false,
    exportFormats: ["csv", "xlsx"],
  },
  pro: {
    maxDatasets: 50,
    maxRows: 1000000,
    aiAnalysisCount: 100,
    customReports: true,
    advancedCharts: true,
    exportFormats: ["csv", "xlsx", "pdf", "json"],
  },
  enterprise: {
    maxDatasets: 500,
    maxRows: -1, // unlimited
    aiAnalysisCount: -1, // unlimited
    customReports: true,
    advancedCharts: true,
    exportFormats: ["csv", "xlsx", "pdf", "json", "sql"],
  },
};

// Middleware to verify admin access
const verifyAdmin = (req: Request, res: Response, next: Function) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: "Unauthorized: Admin access required. Invalid or missing admin key." });
  }
  next();
};

// GET: Retrieve all users and their plans
adminRouter.get("/users", verifyAdmin, (req: Request, res: Response) => {
  try {
    res.json({ users, total: users.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Retrieve a specific user's plan
adminRouter.get("/users/:userId", verifyAdmin, (req: Request, res: Response) => {
  try {
    const user = users.find((u) => u.userId === req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create a new user with a plan
adminRouter.post("/users", verifyAdmin, (req: Request, res: Response) => {
  try {
    const { userId, email, plan } = req.body;

    if (!userId || !email || !plan) {
      return res.status(400).json({ error: "Missing required fields: userId, email, plan" });
    }

    if (!planConfigs[plan as PlanType]) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    const existingUser = users.find((u) => u.userId === userId);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser: UserPlan = {
      userId,
      email,
      plan: plan as PlanType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      features: planConfigs[plan as PlanType],
    };

    users.push(newUser);

    // Log the action
    auditLogs.push({
      id: `log-${Date.now()}`,
      action: "USER_CREATED",
      userId: "admin",
      targetUser: userId,
      changes: { plan, email },
      timestamp: new Date().toISOString(),
      status: "success",
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Update user's plan (by admin)
adminRouter.put("/users/:userId/plan", verifyAdmin, (req: Request, res: Response) => {
  try {
    const { plan } = req.body;
    const userId = req.params.userId;

    if (!plan) {
      return res.status(400).json({ error: "Plan is required" });
    }

    if (!planConfigs[plan as PlanType]) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    const user = users.find((u) => u.userId === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const oldPlan = user.plan;
    user.plan = plan as PlanType;
    user.features = planConfigs[plan as PlanType];
    user.updatedAt = new Date().toISOString();

    // Log the action
    auditLogs.push({
      id: `log-${Date.now()}`,
      action: "PLAN_UPDATED",
      userId: "admin",
      targetUser: userId,
      changes: { from: oldPlan, to: plan },
      timestamp: new Date().toISOString(),
      status: "success",
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Remove a user
adminRouter.delete("/users/:userId", verifyAdmin, (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const userIndex = users.findIndex((u) => u.userId === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    const deletedUser = users.splice(userIndex, 1)[0];

    // Log the action
    auditLogs.push({
      id: `log-${Date.now()}`,
      action: "USER_DELETED",
      userId: "admin",
      targetUser: userId,
      changes: { ...deletedUser },
      timestamp: new Date().toISOString(),
      status: "success",
    });

    res.json({ message: "User deleted successfully", deletedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: System analytics and statistics
adminRouter.get("/analytics", verifyAdmin, (req: Request, res: Response) => {
  try {
    const analytics: AdminAnalytics = {
      totalUsers: users.length,
      activeUsers: Math.floor(users.length * 0.7), // Mock: 70% active
      totalDatasets: Math.floor(Math.random() * 1000) + 100,
      totalRowsProcessed: Math.floor(Math.random() * 10000000) + 1000000,
      aiAnalysisExecuted: Math.floor(Math.random() * 500) + 50,
      reportsGenerated: Math.floor(Math.random() * 300) + 30,
      timestamp: new Date().toISOString(),
    };

    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: System configuration
adminRouter.get("/config", verifyAdmin, (req: Request, res: Response) => {
  try {
    const { geminiApiKey, ...config } = systemConfig;
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Update system configuration
adminRouter.put("/config", verifyAdmin, (req: Request, res: Response) => {
  try {
    const { maintenanceMode, maxFileSize, enableAiAnalysis, enableCustomReports, defaultTimeout } = req.body;

    if (maintenanceMode !== undefined) systemConfig.maintenanceMode = maintenanceMode;
    if (maxFileSize !== undefined) systemConfig.maxFileSize = maxFileSize;
    if (enableAiAnalysis !== undefined) systemConfig.enableAiAnalysis = enableAiAnalysis;
    if (enableCustomReports !== undefined) systemConfig.enableCustomReports = enableCustomReports;
    if (defaultTimeout !== undefined) systemConfig.defaultTimeout = defaultTimeout;

    // Log the configuration change
    auditLogs.push({
      id: `log-${Date.now()}`,
      action: "CONFIG_UPDATED",
      userId: "admin",
      changes: req.body,
      timestamp: new Date().toISOString(),
      status: "success",
    });

    const { geminiApiKey, ...config } = systemConfig;
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Plan configurations
adminRouter.get("/plans", verifyAdmin, (req: Request, res: Response) => {
  try {
    res.json(planConfigs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Audit logs
adminRouter.get("/audit-logs", verifyAdmin, (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = auditLogs.slice(-limit);
    res.json({ logs, total: auditLogs.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Generate analytics report
adminRouter.post("/reports/generate", verifyAdmin, (req: Request, res: Response) => {
  try {
    const { format = "json", dateRange = "all" } = req.body;

    const report = {
      generatedAt: new Date().toISOString(),
      format,
      dateRange,
      totalUsers: users.length,
      usersByPlan: {
        free: users.filter((u) => u.plan === "free").length,
        pro: users.filter((u) => u.plan === "pro").length,
        enterprise: users.filter((u) => u.plan === "enterprise").length,
      },
      recentLogs: auditLogs.slice(-20),
    };

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default adminRouter;
