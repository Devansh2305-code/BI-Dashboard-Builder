import express, { Request, Response } from "express";
import { UserPlan, AdminAnalytics, SystemConfiguration, AuditLog, PlanType } from "../src/types";
import {
  getAdminPassword,
  saveAdminPassword,
  getUsers,
  saveUser,
  deleteUser,
  getPayments,
  savePayment,
  getSystemConfig,
  saveSystemConfig,
  getAuditLogs,
  addAuditLog
} from "./dbStore";

const app = express();
app.use(express.json());

const adminRouter = express.Router();

const planConfigs = {
  free: {
    maxDatasets: 1,
    maxRows: 10000,
    aiAnalysisCount: 5,
    customReports: false,
    advancedCharts: false,
    exportFormats: ["csv", "xlsx"],
  },
  core: {
    maxDatasets: 2, // starts with 2, can purchase more
    maxRows: 100000,
    aiAnalysisCount: 999999, // unlimited
    customReports: true,
    advancedCharts: true,
    exportFormats: ["csv", "xlsx", "pdf", "json"],
  },
  prime: {
    maxDatasets: 5,
    maxRows: 1000000,
    aiAnalysisCount: 999999, // unlimited
    customReports: true,
    advancedCharts: true,
    exportFormats: ["csv", "xlsx", "pdf", "json"],
  },
  apex: {
    maxDatasets: 60,
    maxRows: -1, // unlimited
    aiAnalysisCount: 999999, // unlimited
    customReports: true,
    advancedCharts: true,
    exportFormats: ["csv", "xlsx", "pdf", "json", "sql"],
  },
};

// Middleware to verify admin access using the session token header
const verifyAdmin = (req: Request, res: Response, next: Function) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== "dg-admin-session-active") {
    return res.status(403).json({ error: "Unauthorized: Admin access required" });
  }
  next();
};

// PUBLIC: Verify admin login passcode
adminRouter.post("/login", (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const currentPass = getAdminPassword();
    if (password === currentPass) {
      addAuditLog("ADMIN_LOGIN_SUCCESS", "admin", undefined, { ip: req.ip });
      return res.json({ success: true, token: "dg-admin-session-active" });
    } else {
      addAuditLog("ADMIN_LOGIN_FAILED", "admin", undefined, { passwordAttempted: "••••" }, "failed");
      return res.status(401).json({ error: "Invalid administrative credentials." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUBLIC: Sync user details on register/login (Original and Flat paths)
const handleUsersSync = (req: Request, res: Response) => {
  try {
    const { userId, email, name, role, plan } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing required field: userId" });
    }

    const users = getUsers();
    let user = users.find((u) => u.userId === userId);

    if (!user) {
      const initialPlan = (plan as PlanType) || "free";
      user = saveUser({
        userId,
        email: email || "",
        name: name || userId,
        role: role || "Business Analyst",
        plan: initialPlan,
        analysesLeft: initialPlan === "free" ? 5 : 999999,
        projectSlots: initialPlan === "free" ? 1 : initialPlan === "prime" ? 5 : initialPlan === "apex" ? 60 : 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        features: {
          maxDatasets: initialPlan === "free" ? 1 : initialPlan === "prime" ? 5 : initialPlan === "apex" ? 60 : 2,
          maxRows: 100000,
          aiAnalysisCount: initialPlan === "free" ? 5 : 999999,
          customReports: initialPlan !== "free",
          advancedCharts: initialPlan !== "free",
          exportFormats: ["csv", "xlsx"]
        }
      } as any);
      addAuditLog("USER_REGISTERED", userId, userId, { email, role });
    } else {
      let needsSave = false;
      if (name && user.name !== name) {
        user.name = name;
        needsSave = true;
      }
      if (role && user.role !== role) {
        user.role = role;
        needsSave = true;
      }
      if (plan && user.plan !== plan) {
        user.plan = plan;
        const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 2;
        const credits = plan === "free" ? 5 : 999999;
        user.projectSlots = slots;
        user.analysesLeft = credits;
        needsSave = true;
      }
      if (needsSave) {
        saveUser(user);
      }
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

adminRouter.post("/users/sync", handleUsersSync);
adminRouter.post("/users-sync", handleUsersSync);

// PUBLIC: User submit payment (UPI)
adminRouter.post("/payments", (req: Request, res: Response) => {
  try {
    const { userId, email, plan, amount, upiId, transactionRef } = req.body;

    if (!userId || !email || !plan || !amount || !upiId || !transactionRef) {
      return res.status(400).json({ error: "Missing required billing details." });
    }

    const payments = getPayments();
    const duplicate = payments.find((p) => p.transaction_ref === transactionRef.trim());
    if (duplicate) {
      return res.status(400).json({ error: "This Transaction Reference code has already been submitted." });
    }

    const newPayment = savePayment({
      user_id: userId,
      email,
      plan,
      amount,
      upi_id: upiId,
      transaction_ref: transactionRef.trim(),
      status: "pending",
    });

    addAuditLog("PAYMENT_REQUEST_SUBMITTED", userId, "system", { plan, ref: transactionRef, amount });
    res.status(251).json(newPayment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUBLIC: User retrieve their own payments
adminRouter.get("/payments-user", (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }
    const payments = getPayments();
    const userPayments = payments.filter((p) => p.user_id === userId);
    res.json(userPayments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminRouter.get("/payments/user/:userId", (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const payments = getPayments();
    const userPayments = payments.filter((p) => p.user_id === userId);
    res.json(userPayments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Get payments
adminRouter.get("/payments", verifyAdmin, (req: Request, res: Response) => {
  try {
    const payments = getPayments();
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Approve payment (Original & Flat endpoints)
const handlePaymentApprove = (req: Request, res: Response) => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      return res.status(400).json({ error: "Missing payment id" });
    }
    const payments = getPayments();
    const payment = payments.find((p) => String(p.id) === String(id));
    if (!payment) {
      return res.status(404).json({ error: "Payment request not found" });
    }

    payment.status = "approved";
    savePayment(payment);

    const users = getUsers();
    const user = users.find((u) => u.userId === payment.user_id);
    if (user) {
      const plan = payment.plan as PlanType;
      const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 2;
      const credits = plan === "free" ? 5 : 999999;

      user.plan = plan;
      user.projectSlots = slots;
      user.analysesLeft = credits;
      saveUser(user);
      addAuditLog("PAYMENT_APPROVED", "admin", payment.user_id, { plan, ref: payment.transaction_ref });
    }

    res.json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

adminRouter.post("/payments/:id/approve", verifyAdmin, handlePaymentApprove);
adminRouter.post("/payments-approve", verifyAdmin, handlePaymentApprove);

// ADMIN: Reject payment (Original & Flat endpoints)
const handlePaymentReject = (req: Request, res: Response) => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      return res.status(400).json({ error: "Missing payment id" });
    }
    const payments = getPayments();
    const payment = payments.find((p) => String(p.id) === String(id));
    if (!payment) {
      return res.status(404).json({ error: "Payment request not found" });
    }

    payment.status = "rejected";
    savePayment(payment);

    addAuditLog("PAYMENT_REJECTED", "admin", payment.user_id, { plan: payment.plan, ref: payment.transaction_ref });
    res.json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

adminRouter.post("/payments/:id/reject", verifyAdmin, handlePaymentReject);
adminRouter.post("/payments-reject", verifyAdmin, handlePaymentReject);

// ADMIN: Retrieve all users
adminRouter.get("/users", verifyAdmin, (req: Request, res: Response) => {
  try {
    const users = getUsers();
    res.json({ users, total: users.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Get specific user
adminRouter.get("/users/:userId", verifyAdmin, (req: Request, res: Response) => {
  try {
    const users = getUsers();
    const user = users.find((u) => u.userId === req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Create manual user
adminRouter.post("/users", verifyAdmin, (req: Request, res: Response) => {
  try {
    const { userId, email, plan } = req.body;

    if (!userId || !email || !plan) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const users = getUsers();
    if (users.some((u) => u.userId === userId)) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser = saveUser({
      userId,
      email,
      plan,
      name: userId,
      role: "Business Analyst",
    });

    addAuditLog("USER_CREATED", "admin", userId, { plan, email });
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Update manual user plan (Original & Flat endpoints)
const handleUpdateUserPlan = (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || req.body.userId;
    const { plan } = req.body;
    if (!userId || !plan) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const users = getUsers();
    const user = users.find((u) => u.userId === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const oldPlan = user.plan;
    user.plan = plan;
    const slots = plan === "free" ? 1 : plan === "prime" ? 5 : plan === "apex" ? 60 : 2;
    const credits = plan === "free" ? 5 : 999999;
    user.projectSlots = slots;
    user.analysesLeft = credits;

    saveUser(user);
    addAuditLog("PLAN_UPDATED", "admin", userId, { from: oldPlan, to: plan });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

adminRouter.put("/users/:userId/plan", verifyAdmin, handleUpdateUserPlan);
adminRouter.post("/users-update-plan", verifyAdmin, handleUpdateUserPlan);

// ADMIN: Delete user (Original & Flat endpoints)
const handleUserDelete = (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    const users = getUsers();
    const user = users.find((u) => u.userId === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    deleteUser(userId);
    addAuditLog("USER_DELETED", "admin", userId, { ...user });
    res.json({ message: "User deleted successfully", deletedUser: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

adminRouter.delete("/users/:userId", verifyAdmin, handleUserDelete);
adminRouter.post("/users-delete", verifyAdmin, handleUserDelete);

// ADMIN: Analytics and statistics
adminRouter.get("/analytics", verifyAdmin, (req: Request, res: Response) => {
  try {
    const users = getUsers();
    const payments = getPayments();
    const analytics: AdminAnalytics = {
      totalUsers: users.length,
      activeUsers: users.length,
      totalDatasets: users.length * 2,
      totalRowsProcessed: users.length * 5000,
      aiAnalysisExecuted: payments.filter((p) => p.status === "approved").length * 5,
      reportsGenerated: users.length * 3,
      timestamp: new Date().toISOString(),
    };
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Get config
adminRouter.get("/config", verifyAdmin, (req: Request, res: Response) => {
  try {
    const config = getSystemConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Update config & password
adminRouter.put("/config", verifyAdmin, (req: Request, res: Response) => {
  try {
    const { maintenanceMode, maxFileSize, enableAiAnalysis, enableCustomReports, defaultTimeout, adminPassword } = req.body;

    const currentConfig = getSystemConfig();
    if (maintenanceMode !== undefined) currentConfig.maintenanceMode = maintenanceMode;
    if (maxFileSize !== undefined) currentConfig.maxFileSize = maxFileSize;
    if (enableAiAnalysis !== undefined) currentConfig.enableAiAnalysis = enableAiAnalysis;
    if (enableCustomReports !== undefined) currentConfig.enableCustomReports = enableCustomReports;
    if (defaultTimeout !== undefined) currentConfig.defaultTimeout = defaultTimeout;

    saveSystemConfig(currentConfig);

    if (adminPassword && adminPassword.trim().length >= 4) {
      saveAdminPassword(adminPassword.trim());
      addAuditLog("ADMIN_PASSWORD_CHANGED", "admin", undefined, { message: "Passcode updated" });
    }

    addAuditLog("CONFIG_UPDATED", "admin", undefined, req.body);
    res.json(currentConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Get plans
adminRouter.get("/plans", verifyAdmin, (req: Request, res: Response) => {
  try {
    res.json(planConfigs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Audit logs
adminRouter.get("/audit-logs", verifyAdmin, (req: Request, res: Response) => {
  try {
    const logs = getAuditLogs();
    res.json({ logs, total: logs.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/admin", adminRouter);
app.use("/", adminRouter);

export default app;

