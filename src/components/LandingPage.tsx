import React, { useState } from "react";
import { 
  PieChart, 
  Mail, 
  Lock, 
  User, 
  Briefcase, 
  Eye, 
  EyeOff, 
  X, 
  ArrowRight, 
  Chrome, 
  Sparkles, 
  TrendingUp, 
  Database, 
  Calculator, 
  ShieldCheck, 
  Loader,
  HelpCircle,
  Menu,
  ChevronRight,
  Info,
  Sun,
  Moon,
  ChevronDown,
  Activity,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { Role } from "../types";
import { 
  auth, 
  googleProvider, 
  hasFirebaseConfig
} from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from "firebase/auth";
import { supabase, hasSupabaseConfig } from "../supabase";

interface LandingPageProps {
  onMockLogin: (mockUser: { uid: string; email: string; displayName: string }) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export default function LandingPage({ onMockLogin, isDarkMode, setIsDarkMode }: LandingPageProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup" | "admin">("login");
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("CMO");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Landing Page Interactive States
  const [previewRole, setPreviewRole] = useState<"CEO" | "CFO" | "CMO" | "Analyst">("CEO");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const roles: Role[] = ["CMO", "Business Analyst", "CFO", "Sales Director", "HR Specialist", "CEO"];

  const handleOpenModal = (tab: "login" | "signup") => {
    setAuthTab(tab);
    setError("");
    setSuccess("");
    setIsAuthModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAuthModalOpen(false);
    // Clear forms
    setEmail("");
    setPassword("");
    setName("");
    setRole("CMO");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (authTab === "signup" && !name) {
      setError("Please enter your name.");
      return;
    }

    // Secure Admin Intercept Check
    if (email === "admin@dataglance.com" || authTab === "admin") {
      setIsLoading(true);
      
      const checkPasscode = async () => {
        try {
          const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ password })
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Invalid administrative credentials.");
          }

          const data = await response.json();
          localStorage.setItem("admin-key", data.token);
          
          onMockLogin({
            uid: "admin-uid",
            email: "admin@dataglance.com",
            displayName: JSON.stringify({ name: "System Admin", role: "admin" })
          });
          
          setSuccess("Admin Authorized! Accessing secure system terminal...");
          setTimeout(() => {
            handleCloseModal();
          }, 1000);
        } catch (err: any) {
          setError(err.message || "Invalid administrative credentials.");
        } finally {
          setIsLoading(false);
        }
      };
      
      checkPasscode();
      return;
    }

    setIsLoading(true);

    if (hasFirebaseConfig && auth) {
      // --- REAL FIREBASE AUTHENTICATION ---
      try {
        if (authTab === "login") {
          await signInWithEmailAndPassword(auth, email, password);
          setSuccess("Login successful! Redirecting...");
          setTimeout(() => {
            handleCloseModal();
          }, 1000);
        } else {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const profileJson = JSON.stringify({ name, role });
          await updateProfile(userCredential.user, { displayName: profileJson });
          setSuccess("Registration successful! Building workspace...");
          setTimeout(() => {
            handleCloseModal();
          }, 1000);
        }
      } catch (err: any) {
        console.error("Firebase Auth Error:", err);
        let friendlyMessage = err.message;
        if (err.code === "auth/unauthorized-domain") {
          friendlyMessage = `Unauthorized Domain: Please add "${window.location.hostname}" to the "Authorized Domains" list in your Firebase Console (Authentication > Settings > Authorized Domains).`;
        } else if (err.code === "auth/invalid-credential") {
          friendlyMessage = "Invalid email or password credentials.";
        } else if (err.code === "auth/email-already-in-use") {
          friendlyMessage = "This email address is already in use.";
        } else if (err.code === "auth/weak-password") {
          friendlyMessage = "Password should be at least 6 characters.";
        } else if (err.code === "auth/invalid-email") {
          friendlyMessage = "Please enter a valid email address.";
        }
        setError(friendlyMessage);
      } finally {
        setIsLoading(false);
      }
    } else {
      // --- MOCK AUTH MODE ---
      setTimeout(() => {
        setIsLoading(false);
        const userUid = `mock-${Date.now()}`;
        const mockProfile = authTab === "signup" 
          ? JSON.stringify({ name, role }) 
          : JSON.stringify({ name: email.split("@")[0], role: "Business Analyst" }); // default role for login if not signed up
        
        onMockLogin({
          uid: userUid,
          email,
          displayName: mockProfile
        });
        
        setSuccess("Mock authentication successful! Logging in...");
        setTimeout(() => {
          handleCloseModal();
        }, 1000);
      }, 1500);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (hasFirebaseConfig && auth && googleProvider) {
      // --- REAL FIREBASE GOOGLE SIGN-IN ---
      try {
        await signInWithPopup(auth, googleProvider);
        setSuccess("Logged in with Google! Redirecting...");
        setTimeout(() => {
          handleCloseModal();
        }, 1000);
      } catch (err: any) {
        console.error("Google Auth Error:", err);
        let friendlyMessage = err.message;
        if (err.code === "auth/unauthorized-domain") {
          friendlyMessage = `Unauthorized Domain: Please add "${window.location.hostname}" to the "Authorized Domains" list in your Firebase Console (Authentication > Settings > Authorized Domains).`;
        }
        setError(friendlyMessage || "Failed to login with Google.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // --- MOCK GOOGLE AUTH ---
      setTimeout(() => {
        setIsLoading(false);
        onMockLogin({
          uid: `mock-google-${Date.now()}`,
          email: "google.user@example.com",
          displayName: "" // Empty so that RoleOnboarding gets triggered
        });
        setSuccess("Mock Google login successful!");
        setTimeout(() => {
          handleCloseModal();
        }, 1000);
      }, 1200);
    }
  };

  // Mock roles data for interactive preview section
  const previewData = {
    CEO: {
      metrics: [
        { label: "Enterprise Revenue", val: "$5.24M", change: "+14.2% vs target", up: true },
        { label: "EBITDA Margin", val: "28.4%", change: "+2.1% points", up: true },
        { label: "Brand NPS Score", val: "82", change: "Stable", up: true }
      ],
      insight: "Enterprise revenue margins continue to expand across European and APAC regions. Operational expense variances are clustered safely within budgetary guidelines.",
      chartLabel: "Revenue vs Expenses Cohort"
    },
    CFO: {
      metrics: [
        { label: "Monthly Cash Inflow", val: "$840K", change: "+8.7% vs forecast", up: true },
        { label: "OpEx Spend Outlay", val: "$114K", change: "-4.2% reduction", up: true },
        { label: "Payroll Headcount", val: "52 FTEs", change: "Within safety ratio", up: true }
      ],
      insight: "Monthly Net Inflows are expanding, increasing capital runway buffers. OpEx reductions in server integrations saved $12K this month.",
      chartLabel: "Inflows by Operating Cycle"
    },
    CMO: {
      metrics: [
        { label: "Ad Spend Outlay", val: "$45.2K", change: "Allocated 94%", up: true },
        { label: "Acquired Leads", val: "2,420", change: "+18.4% volume", up: true },
        { label: "ROAS Ratio", val: "3.42x", change: "Excellent return", up: true }
      ],
      insight: "Paid social campaigns are displaying highly efficient acquisition trends. Cost Per Acquisition (CPA) on Google Search core dropped by 11%.",
      chartLabel: "ROI Conversions by Campaign Channel"
    },
    Analyst: {
      metrics: [
        { label: "Database Rows", val: "12,450", change: "Completeness: 99.8%", up: true },
        { label: "Variance Coefficient", val: "0.14", change: "Low skewness", up: false },
        { label: "Std Deviation", val: "12.4", change: "Normal clustering", up: true }
      ],
      insight: "Statistical audit scans show uniform distribution. Anomaly algorithms detected 2 outlier transactions in European sales volumes.",
      chartLabel: "Volume Dispatch Distribution"
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDarkMode 
        ? "bg-slate-950 text-slate-100 dark" 
        : "bg-slate-50 text-slate-800"
    }`}>
      
      {/* Dynamic Background Glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] sm:blur-[120px] animate-pulse"></div>
        <div className="absolute top-[5%] right-[15%] w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[80px] sm:blur-[100px] animate-pulse duration-4000"></div>
      </div>

      {/* Header / Navbar */}
      <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-300 ${
        isDarkMode 
          ? "border-slate-900 bg-slate-950/80" 
          : "border-slate-200 bg-white/80"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-2 rounded-lg shadow-lg">
              <PieChart className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className={`font-extrabold text-lg tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              DataGlance
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg border transition ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-850" 
                  : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
              }`}
              title={isDarkMode ? "Toggle Light Mode" : "Toggle Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            <button 
              type="button"
              onClick={() => handleOpenModal("login")}
              className={`text-sm font-semibold transition-colors cursor-pointer ${
                isDarkMode ? "text-slate-350 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Login
            </button>
            
            <button 
              type="button"
              onClick={() => handleOpenModal("signup")}
              className="text-xs font-bold px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-lg shadow-blue-500/10 active:scale-98 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-20 sm:pb-28 text-center animate-fadeIn">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Self-Service AI Business Analyst Workspace</span>
          </div>
          
          <h1 className={`text-4xl sm:text-6xl font-black leading-[1.1] tracking-tight transition-colors duration-300 ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}>
            Turn Raw Data Into{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Executive Action.
            </span>{" "}
            Instantly.
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto transition-colors duration-300 ${
            isDarkMode ? "text-slate-400" : "text-slate-655"
          }`}>
            DataGlance is a self-service BI platform that auto-detects SaaS startup metrics, simulates runways, flags anomalies with confidence, and writes actionable briefs tailored to your role. Connect public Google Sheets or upload CSVs to build executive visuals in seconds.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleOpenModal("signup")}
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-650 hover:bg-blue-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xl shadow-blue-650/20 active:scale-98 cursor-pointer hover:scale-102 duration-200"
            >
              <span>Build Startup Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenModal("login")}
              className={`w-full sm:w-auto px-6 py-3.5 border font-semibold rounded-xl transition cursor-pointer hover:scale-102 duration-200 ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-850 hover:border-slate-700" 
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              Access Demo Workspace
            </button>
          </div>
        </div>

        {/* Dashboard Mockup Preview */}
        <div className={`mt-16 sm:mt-20 max-w-5xl mx-auto border rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl group transition-all duration-300 hover:scale-[1.01] ${
          isDarkMode 
            ? "border-slate-800 bg-slate-950/40" 
            : "border-slate-200 bg-white/40"
        }`}>
          <div className={`border rounded-xl overflow-hidden shadow-inner relative transition-colors duration-300 ${
            isDarkMode ? "border-slate-900 bg-slate-900/60" : "border-slate-300 bg-slate-100/60"
          }`}>
            
            {/* Header bar mock */}
            <div className={`h-11 border-b px-4 flex items-center justify-between transition-colors duration-300 ${
              isDarkMode ? "bg-slate-950/90 border-slate-900" : "bg-slate-200/90 border-slate-350"
            }`}>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/60"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/60"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/60"></span>
              </div>
              <div className={`px-3 py-0.5 rounded border text-[10px] font-mono transition-colors duration-300 ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-500" : "bg-slate-300/40 border-slate-300 text-slate-600"
              }`}>
                dataglance.app/startup-workspace
              </div>
              <div className={`w-12 h-2.5 rounded ${isDarkMode ? "bg-slate-900" : "bg-slate-300"}`}></div>
            </div>

            {/* Dashboard Content Mock */}
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              
              {/* Sidebar Mock */}
              <div className={`space-y-4 border-r pr-4 hidden md:block transition-colors duration-300 ${
                isDarkMode ? "border-slate-900/80" : "border-slate-300/80"
              }`}>
                <div className={`p-2.5 rounded border text-xs transition-colors duration-300 ${
                  isDarkMode ? "bg-slate-950/40 border-slate-900" : "bg-slate-200/40 border-slate-300"
                }`}>
                  <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Workspace Desk</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Startup Analyst
                  </div>
                </div>
                <div className={`space-y-1.5 text-xs font-semibold ${
                  isDarkMode ? "text-slate-500" : "text-slate-500"
                }`}>
                  <div className={`px-2 py-1.5 rounded border transition-colors duration-300 ${
                    isDarkMode ? "bg-slate-950/60 text-slate-200 border-slate-900" : "bg-white text-slate-800 border-slate-300"
                  }`}>Report Canvas</div>
                  <div className="px-2 py-1.5 hover:text-blue-500 transition-colors">Data View</div>
                  <div className="px-2 py-1.5 hover:text-blue-500 transition-colors">Measures & Modeling</div>
                  <div className="px-2 py-1.5 hover:text-blue-500 transition-colors flex items-center justify-between">
                    <span>AI Insights</span>
                    <span className="px-1 py-0.25 bg-blue-500/10 text-blue-500 dark:text-blue-400 text-[8px] rounded border border-blue-500/20 uppercase font-mono">AI Active</span>
                  </div>
                </div>
              </div>

              {/* Main Canvas Mock */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 border rounded-lg transition-colors duration-300 ${
                    isDarkMode ? "bg-slate-950/40 border-slate-900" : "bg-white border-slate-200 shadow-3xs"
                  }`}>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Monthly MRR</div>
                    <div className={`text-lg font-black mt-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>$48.5K</div>
                    <div className="text-[9px] text-emerald-600 font-bold mt-0.5">▲ +14.2% vs prev</div>
                  </div>
                  <div className={`p-3 border rounded-lg transition-colors duration-300 ${
                    isDarkMode ? "bg-slate-950/40 border-slate-900" : "bg-white border-slate-200 shadow-3xs"
                  }`}>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">LTV:CAC Ratio</div>
                    <div className={`text-lg font-black mt-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>3.42x</div>
                    <div className="text-[9px] text-emerald-600 font-bold mt-0.5">▲ Healthy Unit Econ</div>
                  </div>
                  <div className={`p-3 border rounded-lg transition-colors duration-300 ${
                    isDarkMode ? "bg-slate-950/40 border-slate-900" : "bg-white border-slate-200 shadow-3xs"
                  }`}>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cash Runway</div>
                    <div className={`text-lg font-black mt-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>18.4 Mo</div>
                    <div className="text-[9px] text-emerald-600 font-bold mt-0.5">Stable Cap Runway</div>
                  </div>
                </div>

                <div className={`p-4 border rounded-lg relative overflow-hidden transition-colors duration-300 ${
                  isDarkMode ? "bg-slate-950/30 border-slate-900" : "bg-white border-slate-200 shadow-3xs"
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className={`text-xs font-bold ${isDarkMode ? "text-slate-350" : "text-slate-800"}`}>Startup Growth Analytics (Runway & Burn)</div>
                    <span className="text-[9px] text-slate-500">Live preview values</span>
                  </div>
                  
                  {/* Mock Bar chart lines */}
                  <div className={`h-24 flex items-end justify-between px-6 pt-4 border-b border-l transition-colors duration-300 ${
                    isDarkMode ? "border-slate-900" : "border-slate-300"
                  }`}>
                    <div className="w-8 bg-blue-600/20 border-t-2 border-blue-500 h-10 rounded-t group-hover:h-12 transition-all duration-1000"></div>
                    <div className="w-8 bg-indigo-600/20 border-t-2 border-indigo-500 h-14 rounded-t group-hover:h-20 transition-all duration-1000"></div>
                    <div className="w-8 bg-blue-600/20 border-t-2 border-blue-500 h-16 rounded-t group-hover:h-18 transition-all duration-1000"></div>
                    <div className="w-8 bg-purple-600/20 border-t-2 border-purple-500 h-22 rounded-t group-hover:h-24 transition-all duration-1000"></div>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 px-2 mt-1.5 font-mono">
                    <span>Month 1</span>
                    <span>Month 2</span>
                    <span>Month 3</span>
                    <span>Month 4 (Latest)</span>
                  </div>
                </div>

                {/* Mock AI summary */}
                <div className={`p-3 border rounded-lg flex gap-3 text-xs transition-colors duration-300 ${
                  isDarkMode ? "bg-blue-500/5 border-blue-500/10" : "bg-blue-50 border-blue-200/50"
                }`}>
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="font-bold text-blue-700 dark:text-blue-400">AI Business Audit:</span>
                    <p className={`mt-0.5 leading-relaxed text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      MRR grew 14% to **$48.5K**. Low monthly churn of **2.1%** keeps LTV high at **$154K**, offsetting your acquisition cost CAC of **$45**. Recommended action: Scale campaigns on highest ROI channel.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Dynamic Role Template Interactive Section */}
      <section className={`py-20 border-t transition-colors duration-300 ${
        isDarkMode ? "border-slate-900 bg-slate-950/20" : "border-slate-200 bg-slate-100/50"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Role-Tailored Dashboards</span>
            <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Tailored Layouts For Every Stakeholder
            </h2>
            <p className={`text-sm mt-3 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Select a position below to interactively preview what KPIs, visual summaries, and AI strategic recommendations DataGlance prepares out of the box.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left selector sidebar */}
            <div className="lg:col-span-4 flex flex-col justify-center space-y-2">
              {[
                { id: "CEO", title: "Chief Executive (CEO)", desc: "Overall business health, margins, and NPS." },
                { id: "CFO", title: "Chief Financial (CFO)", desc: "Opex burn rates, income inflows, and cash runways." },
                { id: "CMO", title: "Marketing Officer (CMO)", desc: "Ad spend budgets, conversions, and campaign ROAS." },
                { id: "Analyst", title: "Business Analyst", desc: "Outliers, statistics, coefficients, and distribution variances." }
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setPreviewRole(r.id as any)}
                  className={`p-4 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                    previewRole === r.id 
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/10 scale-[1.02]"
                      : isDarkMode
                        ? "bg-slate-900/40 border-slate-900 text-slate-350 hover:bg-slate-850 hover:border-slate-800"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-250 shadow-3xs"
                  }`}
                >
                  <h4 className="font-bold text-sm">{r.title}</h4>
                  <p className={`text-[11px] mt-1.5 leading-relaxed ${
                    previewRole === r.id ? "text-blue-100" : "text-slate-400 dark:text-slate-500"
                  }`}>{r.desc}</p>
                </button>
              ))}
            </div>

            {/* Right preview canvas */}
            <div className={`lg:col-span-8 border rounded-2xl p-5 sm:p-6 text-left flex flex-col justify-between transition-all duration-300 ${
              isDarkMode ? "bg-slate-900/30 border-slate-900" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Live Dashboard Simulation: {previewRole}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Preset configuration templates</span>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {previewData[previewRole].metrics.map((m, idx) => (
                    <div key={idx} className={`p-4 border rounded-xl transition-all duration-300 ${
                      isDarkMode ? "bg-slate-950/60 border-slate-900" : "bg-slate-50 border-slate-200/60"
                    }`}>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">{m.label}</span>
                      <h4 className={`text-xl font-extrabold mt-1.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{m.val}</h4>
                      <span className={`text-[9px] font-semibold block mt-1 ${
                        m.up ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                      }`}>{m.change}</span>
                    </div>
                  ))}
                </div>

                {/* Interactive chart layout representation */}
                <div className={`p-4 border rounded-xl relative overflow-hidden transition-all duration-300 ${
                  isDarkMode ? "bg-slate-950/40 border-slate-900" : "bg-slate-50 border-slate-200/60"
                }`}>
                  <span className="text-[10px] text-slate-500 font-bold block mb-3 uppercase tracking-wider">
                    {previewData[previewRole].chartLabel}
                  </span>
                  <div className="h-16 flex items-end justify-between px-10 border-b border-slate-350 dark:border-slate-900">
                    <div className="w-12 bg-blue-600/30 border-t border-blue-500 h-10 rounded-t"></div>
                    <div className="w-12 bg-indigo-650/30 border-t border-indigo-500 h-6 rounded-t"></div>
                    <div className="w-12 bg-blue-600/30 border-t border-blue-500 h-14 rounded-t"></div>
                  </div>
                </div>

                {/* Written brief preview */}
                <div className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed transition-all duration-300 ${
                  isDarkMode ? "bg-blue-500/5 border-blue-500/10" : "bg-blue-50/50 border-blue-200/40"
                }`}>
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className={isDarkMode ? "text-slate-400" : "text-slate-655"}>
                    <strong>Tailored briefing:</strong> {previewData[previewRole].insight}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mt-6 border-slate-200 dark:border-slate-850 flex items-center justify-between text-[11px] text-slate-450">
                <span>Supports dynamic Google Sheets connectivity</span>
                <button
                  onClick={() => handleOpenModal("signup")}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5"
                >
                  <span>Build This Dashboard Layout</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className={`relative z-10 border-t transition-colors duration-300 ${
        isDarkMode ? "border-slate-900 bg-slate-950/20" : "border-slate-200 bg-white"
      } py-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Core Architecture</span>
            <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              A Complete Data Engine, Built for Speed
            </h2>
            <p className={`text-sm mt-3 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Professional visual canvases, custom modeling, and AI summaries designed without database server overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Briefcase,
                color: "blue",
                title: "Role-Based Portals",
                desc: "Switch views between CEO, CFO, CMO, Analyst, or Sales layouts. Access metrics configured specifically for each operational focus."
              },
              {
                icon: Sparkles,
                color: "purple",
                title: "AI Insights Narratives",
                desc: "Translate aggregations into text. Engage in conversational QA chats with Gemini to write strategies and audit outlier records."
              },
              {
                icon: Calculator,
                color: "emerald",
                title: "Metrics Modeling Canvas",
                desc: "Build simple aggregates or custom algebraic expressions across multiple measures. Control widget alignments, sizing, and themes."
              },
              {
                icon: Database,
                color: "amber",
                title: "Zero-DB browser parsing",
                desc: "Parse local CSV or Excel files instantly in React memory. Your files are never uploaded to any remote database, preserving data privacy."
              }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div 
                  key={i} 
                  className={`p-6 border rounded-xl transition duration-350 hover:-translate-y-1 hover:shadow-md ${
                    isDarkMode 
                      ? "bg-slate-900/30 border-slate-900 hover:border-slate-800" 
                      : "bg-slate-50 border-slate-200 hover:border-slate-300 shadow-3xs"
                  }`}
                >
                  <div className={`p-2.5 rounded-lg w-fit border mb-5 ${
                    isDarkMode 
                      ? `bg-${f.color}-600/10 text-${f.color}-400 border-${f.color}-500/20` 
                      : `bg-${f.color}-50 text-${f.color}-650 border-${f.color}-200`
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{f.title}</h3>
                  <p className={`text-xs mt-2.5 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className={`py-20 border-t transition-colors duration-300 ${
        isDarkMode ? "border-slate-900 bg-slate-950/20" : "border-slate-200 bg-slate-100/50"
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Common Questions</span>
            <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Frequently Asked Questions
            </h2>
            <p className={`text-sm mt-3 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Everything you need to know about the DataGlance engine, auto-mappings, and integration models.
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              {
                q: "How does the AI KPI Auto-detection work?",
                a: "When you upload your CSV or Excel files, our built-in semantic heuristic parser scans your column names to identify variables matching dates, revenues, ad spend, new signups, and churn cancellations. You can review, refine, and override these auto-detected variables at any time in the Column Mapping panel."
              },
              {
                q: "Is my spreadsheet data secure?",
                a: "Yes, completely. DataGlance processes, parses, and aggregates all spreadsheet uploads locally inside your browser memory using SheetJS. Your raw rows are never sent or stored on any server. Gemini AI requests only receive structured aggregated summaries, preventing any customer data exposure."
              },
              {
                q: "Can I connect live Google Sheets?",
                a: "Absolutely. Instead of uploading static CSV files repeatedly, you can connect your live Google Sheet CSV export URLs. This lets you reload, synchronize, and update dashboard charts dynamically with one click."
              },
              {
                q: "Can I customize calculated measures?",
                a: "Yes. The Measures Manager supports standard aggregates like SUM, AVG, MIN, MAX, and count parameters. It also supports custom expressions allowing you to build composite algebra formulas (e.g. dividing a Gross Profit measure by a Sales volume measure to calculate custom margin indicators)."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                  isDarkMode ? "bg-slate-900/30 border-slate-900" : "bg-white border-slate-200 shadow-3xs"
                }`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between font-bold text-xs sm:text-sm cursor-pointer select-none"
                >
                  <span className={isDarkMode ? "text-white" : "text-slate-900"}>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-250 ${
                    expandedFaq === idx ? "rotate-180" : ""
                  }`} />
                </button>
                
                {/* Smooth accordion body height transitions */}
                {expandedFaq === idx && (
                  <div className={`p-4 pt-0 text-xs leading-relaxed border-t transition-all duration-300 ${
                    isDarkMode ? "text-slate-400 border-slate-900" : "text-slate-600 border-slate-100"
                  }`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-10 relative z-10 text-center text-xs transition-colors duration-300 ${
        isDarkMode ? "border-slate-900 bg-slate-950 text-slate-500" : "border-slate-250 bg-white text-slate-500"
      }`}>
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 DataGlance Inc. All rights reserved. Self-service role-based AI analytics.</p>
          <div className="flex justify-center gap-4 text-[10px] text-slate-400">
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Security Audits</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 dark:bg-slate-950/90 backdrop-blur-xs animate-fadeIn">
          
          <div className={`relative w-full max-w-md border rounded-2xl shadow-2xl p-6 sm:p-8 animate-slideIn transition-colors duration-300 ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={handleCloseModal}
              disabled={isLoading}
              className={`absolute top-4 right-4 p-1 rounded-lg transition-colors cursor-pointer ${
                isDarkMode ? "bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title / Badge */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-2 rounded-lg">
                  <PieChart className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
              <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {authTab === "login" ? "Login to DataGlance" : authTab === "signup" ? "Create Your Account" : "Secure Admin Console"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {authTab === "login" ? "Welcome back! Access your dashboard workspaces" : authTab === "signup" ? "Start designing your analytics dashboards" : "Enter administrator credentials to access master database"}
              </p>

              {/* Mock vs Live badge */}
              <div className={`mt-3 mx-auto w-fit flex items-center gap-1.5 px-2.5 py-0.75 text-[10px] font-semibold rounded-full border ${
                hasFirebaseConfig 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasFirebaseConfig ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                <span>{hasFirebaseConfig ? "Firebase Auth Connected" : "Local Development Mode (Mock)"}</span>
              </div>
            </div>

            {/* Error or Success alerts */}
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-500 dark:text-rose-450 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-500 dark:text-emerald-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Tab switch buttons */}
            <div className={`grid grid-cols-3 border rounded-lg p-1 mb-5 text-xs font-semibold ${
              isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                type="button"
                onClick={() => { setAuthTab("login"); setError(""); }}
                disabled={isLoading}
                className={`py-1.5 rounded-md transition cursor-pointer ${
                  authTab === "login" 
                    ? isDarkMode ? "bg-slate-900 text-white border border-slate-800 shadow" : "bg-white text-slate-800 border border-slate-200/80 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("signup"); setError(""); }}
                disabled={isLoading}
                className={`py-1.5 rounded-md transition cursor-pointer ${
                  authTab === "signup" 
                    ? isDarkMode ? "bg-slate-900 text-white border border-slate-800 shadow" : "bg-white text-slate-800 border border-slate-200/80 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("admin"); setError(""); }}
                disabled={isLoading}
                className={`py-1.5 rounded-md transition cursor-pointer ${
                  authTab === "admin" 
                    ? isDarkMode ? "bg-red-950/40 text-red-400 border border-red-950 shadow" : "bg-red-50 text-red-700 border border-red-200 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Admin
              </button>
            </div>

            {/* Main Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              
              {/* Name Field (Sign Up only) */}
              {authTab === "signup" && (
                <div>
                  <label htmlFor="name-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className={`w-full pl-9 pr-3 py-2 border focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-colors ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-700" : "bg-slate-50 border-slate-250 text-slate-800 placeholder-slate-400"
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@organization.com"
                    className={`w-full pl-9 pr-3 py-2 border focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-colors ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-700" : "bg-slate-50 border-slate-250 text-slate-800 placeholder-slate-400"
                    }`}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-9 py-2 border focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-colors ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-700" : "bg-slate-50 border-slate-250 text-slate-800 placeholder-slate-400"
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Select Dropdown (Sign Up only) */}
              {authTab === "signup" && (
                <div>
                  <label htmlFor="role-select-signup" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Organization Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <select
                      id="role-select-signup"
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                      className={`w-full pl-9 pr-3 py-2 border focus:border-blue-600 rounded-lg text-xs focus:outline-none cursor-pointer transition-colors ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-800"
                      }`}
                      disabled={isLoading}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r} className={isDarkMode ? "bg-slate-950" : "bg-white"}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-2 py-2.5 disabled:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  authTab === "admin"
                    ? "bg-red-700 hover:bg-red-650 shadow-red-950/30"
                    : "bg-blue-650 hover:bg-blue-600 shadow-blue-500/10"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{authTab === "login" ? "Login" : authTab === "signup" ? "Sign Up" : "Authorize Admin Console"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            {authTab !== "admin" && (
              <>
                {/* Divider */}
                <div className="relative my-5 flex items-center">
                  <div className={`flex-1 h-px ${isDarkMode ? "bg-slate-800/80" : "bg-slate-200"}`}></div>
                  <span className="px-3 text-[10px] text-slate-400 uppercase tracking-wider">Or continue with</span>
                  <div className={`flex-1 h-px ${isDarkMode ? "bg-slate-800/80" : "bg-slate-200"}`}></div>
                </div>

                {/* Google provider button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className={`w-full py-2 border font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isDarkMode 
                      ? "bg-slate-950 hover:bg-slate-850 border-slate-800 hover:border-slate-700 disabled:border-slate-850 text-slate-250" 
                      : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-700"
                  }`}
                >
                  <Chrome className="w-3.5 h-3.5 text-blue-500" />
                  <span>Continue with Google</span>
                </button>
              </>
            )}

            {/* Footnote about test account */}
            {authTab !== "admin" && !hasFirebaseConfig && (
              <div className="mt-4 text-[9px] text-slate-400 text-center leading-relaxed">
                Tip: In local Mock mode, you can sign in with any email and password to instantly access the workspace!
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
