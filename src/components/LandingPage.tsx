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
  Info
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

interface LandingPageProps {
  onMockLogin: (mockUser: { uid: string; email: string; displayName: string }) => void;
}

export default function LandingPage({ onMockLogin }: LandingPageProps) {
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
      const activeAdminPassword = localStorage.getItem("bi-admin-password") || "admin123";
      if (email !== "admin@dataglance.com" || password !== activeAdminPassword) {
        setError("Invalid administrative credentials.");
        return;
      }
      
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        localStorage.setItem("admin-key", "dg-admin-session-active");
        
        onMockLogin({
          uid: "admin-uid",
          email: "admin@dataglance.com",
          displayName: JSON.stringify({ name: "System Admin", role: "admin" })
        });
        
        setSuccess("Admin Authorized! Accessing secure system terminal...");
        setTimeout(() => {
          handleCloseModal();
        }, 1000);
      }, 1200);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* Glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[5%] right-[15%] w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse duration-4000"></div>
      </div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-2 rounded-lg shadow-lg">
              <PieChart className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              DataGlance
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              type="button"
              onClick={() => handleOpenModal("login")}
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Login
            </button>
            <button 
              type="button"
              onClick={() => handleOpenModal("signup")}
              className="hidden sm:inline-flex text-xs font-bold px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-lg shadow-blue-500/10 active:scale-98 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-20 sm:pb-28 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Introducing Role-based AI Briefings</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight">
            Turn Raw Data Into{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Executive Insights.
            </span>{" "}
            Instantly.
          </h1>

          <p className="text-slate-400 text-base sm:text-lg mt-6 leading-relaxed max-w-2xl mx-auto">
            The self-service BI Dashboard Builder designed for teams. Import Excel/CSVs, configure live KPI visualizers, model custom formulas, and get AI-narrated summaries tailored to your organization role.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleOpenModal("signup")}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-98 cursor-pointer"
            >
              <span>Build Your Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenModal("login")}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 font-semibold rounded-xl transition cursor-pointer"
            >
              Access Demo Workspace
            </button>
          </div>
        </div>

        {/* Dashboard Mockup Preview */}
        <div className="mt-16 sm:mt-20 max-w-5xl mx-auto border border-slate-800 bg-slate-950/40 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl group">
          <div className="border border-slate-900 bg-slate-900/60 rounded-xl overflow-hidden shadow-inner relative">
            
            {/* Header bar mock */}
            <div className="h-11 bg-slate-950/90 border-b border-slate-900 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/60"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/60"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/60"></span>
              </div>
              <div className="px-3 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-500 font-mono">
                dataglance.app/workspace
              </div>
              <div className="w-12 h-2.5 rounded bg-slate-900"></div>
            </div>

            {/* Dashboard Content Mock */}
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              
              {/* Sidebar Mock */}
              <div className="space-y-4 border-r border-slate-900/80 pr-4 hidden md:block">
                <div className="p-2.5 rounded bg-slate-950/40 border border-slate-900 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Profile</div>
                  <div className="font-bold text-blue-400 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    CMO Profile
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-500 font-semibold">
                  <div className="px-2 py-1.5 bg-slate-950/60 text-slate-200 rounded border border-slate-900">Report Canvas</div>
                  <div className="px-2 py-1.5 hover:text-slate-350">Data Explorer</div>
                  <div className="px-2 py-1.5 hover:text-slate-350">Measures Manager</div>
                  <div className="px-2 py-1.5 hover:text-slate-350 flex items-center justify-between">
                    <span>AI Insights</span>
                    <span className="px-1 py-0.25 bg-blue-500/10 text-blue-400 text-[8px] rounded border border-blue-500/20 uppercase font-mono">Beta</span>
                  </div>
                </div>
              </div>

              {/* Main Canvas Mock */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Revenue Return</div>
                    <div className="text-lg font-black text-white mt-1">$1.24M</div>
                    <div className="text-[9px] text-emerald-500 font-semibold mt-0.5">▲ +12.4% vs target</div>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ad Spend Outlay</div>
                    <div className="text-lg font-black text-white mt-1">$432K</div>
                    <div className="text-[9px] text-slate-500 font-semibold mt-0.5">Budget utilization OK</div>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">ROAS Ratio</div>
                    <div className="text-lg font-black text-white mt-1">2.87x</div>
                    <div className="text-[9px] text-emerald-500 font-semibold mt-0.5">▲ High efficiency</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/30 border border-slate-900 rounded-lg relative overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs font-bold text-slate-300">Campaign Performance Metrics</div>
                    <span className="text-[9px] text-slate-500">Last updated: Just now</span>
                  </div>
                  
                  {/* Mock Bar chart lines */}
                  <div className="h-28 flex items-end justify-between px-6 pt-4 border-b border-l border-slate-900">
                    <div className="w-8 bg-blue-600/20 border-t-2 border-blue-500 h-10 rounded-t group-hover:h-12 transition-all duration-1000"></div>
                    <div className="w-8 bg-indigo-600/20 border-t-2 border-indigo-500 h-16 rounded-t group-hover:h-20 transition-all duration-1000"></div>
                    <div className="w-8 bg-purple-600/20 border-t-2 border-purple-500 h-20 rounded-t group-hover:h-24 transition-all duration-1000"></div>
                    <div className="w-8 bg-blue-600/20 border-t-2 border-blue-500 h-14 rounded-t group-hover:h-16 transition-all duration-1000"></div>
                    <div className="w-8 bg-indigo-600/20 border-t-2 border-indigo-500 h-24 rounded-t group-hover:h-22 transition-all duration-1000"></div>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-650 px-2 mt-1.5 font-mono">
                    <span>Google</span>
                    <span>Meta</span>
                    <span>LinkedIn</span>
                    <span>YouTube</span>
                    <span>Tiktok</span>
                  </div>
                </div>

                {/* Mock AI summary */}
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg flex gap-3 text-xs">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-400">Gemini Executive Insight:</span>
                    <p className="text-slate-400 mt-1 leading-relaxed">
                      Revenue returns spiked 14% on YouTube search optimizations. Suggesting shifting $20k from Meta campaigns into Google Search.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="relative z-10 border-t border-slate-900 bg-slate-950/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              A Complete Data Engine, Built for Everyone
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Get corporate dashboard layouts, modeling canvases, and professional visualizations out of the box.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl transition duration-300">
              <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-lg w-fit border border-blue-500/20 mb-5">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Role-Tailored Portals</h3>
              <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
                Log in and view metrics pre-configured for your position. Preview dashboards as CMO, CFO, Sales Director, HR Specialist, or CEO.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl transition duration-300">
              <div className="p-2.5 bg-purple-600/10 text-purple-400 rounded-lg w-fit border border-purple-500/20 mb-5">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">AI Insights Narrative</h3>
              <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
                Generate automatic briefs from your charts. Ask Gemini questions directly about your performance metrics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl transition duration-300">
              <div className="p-2.5 bg-emerald-600/10 text-emerald-400 rounded-lg w-fit border border-emerald-500/20 mb-5">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">KPI Modeling Canvas</h3>
              <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
                Build simple or complex metrics. Use the drag-and-drop builder to customize layouts, colors, grid sizes, and filters.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl transition duration-300">
              <div className="p-2.5 bg-amber-600/10 text-amber-400 rounded-lg w-fit border border-amber-500/20 mb-5">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">No-DB Excel Imports</h3>
              <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
                Directly import local CSV and Excel spreadsheets. DataGlance processes files instantly in the browser without databases.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 relative z-10 text-center text-xs text-slate-500">
        <p>© 2026 DataGlance Inc. All rights reserved. Self-service role-based analytics.</p>
      </footer>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={handleCloseModal}
              disabled={isLoading}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
              <h2 className="text-xl font-bold text-white">
                {authTab === "login" ? "Login to DataGlance" : authTab === "signup" ? "Create Your Account" : "Secure Admin Console"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {authTab === "login" ? "Welcome back! Access your dashboard workspaces" : authTab === "signup" ? "Start designing your analytics dashboards" : "Enter administrator credentials to access master database"}
              </p>

              {/* Mock vs Live badge */}
              <div className={`mt-3 mx-auto w-fit flex items-center gap-1.5 px-2.5 py-0.75 text-[10px] font-semibold rounded-full border ${
                hasFirebaseConfig 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hasFirebaseConfig ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                <span>{hasFirebaseConfig ? "Firebase Auth Connected" : "Local Development Mode (Mock)"}</span>
              </div>
            </div>

            {/* Error or Success alerts */}
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Tab switch buttons */}
            <div className="grid grid-cols-3 bg-slate-950 border border-slate-800 rounded-lg p-1 mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setAuthTab("login"); setError(""); }}
                disabled={isLoading}
                className={`py-1.5 rounded-md transition cursor-pointer ${
                  authTab === "login" 
                    ? "bg-slate-900 text-white border border-slate-800 shadow" 
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
                    ? "bg-slate-900 text-white border border-slate-800 shadow" 
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
                    ? "bg-red-950/40 text-red-400 border border-red-950 shadow" 
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
                  <label htmlFor="name-input" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-blue-600 rounded-lg text-sm text-slate-200 focus:outline-none placeholder-slate-600 transition-colors"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email-input" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-blue-600 rounded-lg text-sm text-slate-200 focus:outline-none placeholder-slate-600 transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password-input" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                    className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 focus:border-blue-600 rounded-lg text-sm text-slate-200 focus:outline-none placeholder-slate-600 transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-550 hover:text-slate-350 cursor-pointer"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Select Dropdown (Sign Up only) */}
              {authTab === "signup" && (
                <div>
                  <label htmlFor="role-select-signup" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-blue-600 rounded-lg text-sm text-slate-200 focus:outline-none cursor-pointer select-none transition-colors"
                      disabled={isLoading}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r} className="bg-slate-950">
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
                className={`w-full mt-2 py-2.5 disabled:bg-slate-800 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  authTab === "admin"
                    ? "bg-red-750 hover:bg-red-700 shadow-red-950/30"
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/10"
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
                  <div className="flex-1 h-px bg-slate-800/80"></div>
                  <span className="px-3 text-[10px] text-slate-500 uppercase tracking-wider">Or continue with</span>
                  <div className="flex-1 h-px bg-slate-800/80"></div>
                </div>

                {/* Google provider button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 disabled:border-slate-850 text-slate-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Chrome className="w-3.5 h-3.5 text-blue-400" />
                  <span>Continue with Google</span>
                </button>
              </>
            )}

            {/* Footnote about test account */}
            {authTab === "admin" ? (
              <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 text-[10px] text-red-400 rounded-lg leading-relaxed text-left">
                <strong>Console Credentials:</strong> Sign in using <code>admin@dataglance.com</code> and passcode <code>admin123</code> (or your custom password) to access systems settings.
              </div>
            ) : (
              !hasFirebaseConfig && (
                <div className="mt-4 text-[10px] text-slate-500 text-center leading-relaxed">
                  Tip: In local Mock mode, you can sign in with any email and password to instantly access the workspace!
                </div>
              )
            )}

          </div>

        </div>
      )}

    </div>
  );
}
