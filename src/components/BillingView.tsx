import React, { useState } from "react";
import {
  CreditCard,
  Sparkles,
  Check,
  Database,
  ShieldCheck,
  Loader2,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Lock,
  RefreshCw,
  Search,
  FileText,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  X
} from "lucide-react";
import { Invoice, PlanType } from "../types";
import { formatTransactionToInvoice, printInvoicePDF } from "../invoiceUtils";
import { supabase, hasSupabaseConfig } from "../supabase";

interface BillingViewProps {
  currentPlan: PlanType;
  analysesLeft: number;
  projectSlots: number;
  savedProjectsCount: number;
  onUpgradePlan: (plan: PlanType, newSlotsCount: number) => void;
  currentUser: any;
  onRefreshPlan?: () => void;
}

export default function BillingView({
  currentPlan,
  analysesLeft,
  projectSlots,
  savedProjectsCount,
  onUpgradePlan,
  currentUser,
  onRefreshPlan
}: BillingViewProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "invoices">("plans");
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    plan: PlanType;
    cost: number;
    title: string;
    isSlotPurchase: boolean;
  }>({
    isOpen: false,
    plan: "free",
    cost: 0,
    title: "",
    isSlotPurchase: false
  });

  const [paymentMethod, setPaymentMethod] = useState<"upi">("upi");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchTransactions = async () => {
    if (!currentUser || currentUser.uid === "anonymous" || currentUser.uid === "admin-uid") return;
    setLoadingTransactions(true);
    try {
      const response = await fetch(`/api/admin/payments-user?userId=${currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data || []);
      }
    } catch (e) {
      console.warn("Failed to fetch payments:", e);
    } finally {
      setLoadingTransactions(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, [currentUser]);

  // Derived Invoices list
  const invoices: Invoice[] = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // If user has an active paid plan or current logged in user exists, provide a sample invoice so they can view bill immediately
      if (currentPlan !== "free" || (currentUser && currentUser.uid !== "anonymous")) {
        const mockTxn = {
          id: "TXN-9842",
          created_at: new Date().toISOString(),
          plan: currentPlan === "free" ? "core" : currentPlan,
          amount: currentPlan === "prime" ? 349 : currentPlan === "apex" ? 4999 : 89,
          upi_id: "user@upi",
          transaction_ref: "UTN-8874920194",
          status: "approved",
          email: currentUser?.email || "user@dataglance.com"
        };
        return [formatTransactionToInvoice(mockTxn, currentUser)];
      }
      return [];
    }
    return transactions.map((t) => formatTransactionToInvoice(t, currentUser));
  }, [transactions, currentPlan, currentUser]);

  // Filtered invoices by search query (Invoice Number, Plan Name, UTN Ref)
  const filteredInvoices = React.useMemo(() => {
    if (!invoiceSearchQuery.trim()) return invoices;
    const q = invoiceSearchQuery.toLowerCase().trim();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.planName.toLowerCase().includes(q) ||
        inv.transactionRef.toLowerCase().includes(q) ||
        inv.customerEmail.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q)
    );
  }, [invoices, invoiceSearchQuery]);

  const plans = [
    {
      id: "free" as PlanType,
      name: "Free Sandbox",
      cost: "Rs. 0",
      period: "forever",
      description: "Ideal for testing and previewing core dashboard builders.",
      icon: Database,
      color: "border-slate-200 dark:border-slate-800",
      accent: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350",
      features: [
        "1 Saved Project workspace",
        "5 Free Dataset Analyses",
        "Standard layout canvases",
        "Excel/CSV manual imports"
      ],
      cta: "Current Plan",
      disabled: true
    },
    {
      id: "core" as PlanType,
      name: "Core Plan",
      cost: "Rs. 89",
      period: "per project",
      description: "Pay-As-You-Go pricing. Buy extra project workspace slots only as you need them.",
      icon: Zap,
      color: "border-blue-200 dark:border-blue-900/50 hover:shadow-blue-500/5 hover:border-blue-400",
      accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      features: [
        "Rs. 89 per active project slot",
        "Unlimited AI Narrative Audits",
        "Advanced formula & measure modeling",
        "Role preview templates access"
      ],
      cta: "Buy Project Slot",
      disabled: false
    },
    {
      id: "prime" as PlanType,
      name: "Prime Plan",
      cost: "Rs. 349",
      period: "per month",
      description: "Perfect for active analysts managing small portfolios.",
      icon: TrendingUp,
      color: "border-purple-200 dark:border-purple-900/50 hover:shadow-purple-500/5 hover:border-purple-400 relative border-2 border-purple-500",
      accent: "bg-purple-500 text-white shadow-sm",
      popular: true,
      features: [
        "5 Saved Project workspaces",
        "Unlimited AI Narrative Audits",
        "AI Insights custom grounding chat",
        "Priority analytics generation"
      ],
      cta: "Upgrade to Prime",
      disabled: false
    },
    {
      id: "apex" as PlanType,
      name: "Apex Plan",
      cost: "Rs. 4999",
      period: "per year",
      description: "High-tier subscription for professional power users.",
      icon: Award,
      color: "border-amber-200 dark:border-amber-900/50 hover:shadow-amber-500/5 hover:border-amber-400",
      accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      features: [
        "60 Saved Project workspaces",
        "Unlimited AI Narrative Audits",
        "Full AI Insights panel features",
        "24/7 Priority support & audit logs"
      ],
      cta: "Upgrade to Apex",
      disabled: false
    }
  ];

  const handleOpenCheckout = (planId: PlanType, title: string, costStr: string, isSlotPurchase: boolean) => {
    const numericCost = parseInt(costStr.replace(/[^\d]/g, ""), 10);
    setCheckoutError("");
    setSuccessMessage("");
    setCheckoutModal({
      isOpen: true,
      plan: planId,
      cost: numericCost,
      title,
      isSlotPurchase
    });
  };

  const handleCloseCheckout = () => {
    setCheckoutModal(prev => ({ ...prev, isOpen: false }));
    // Clear inputs
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setUpiId("");
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");

    if (!upiId || !upiId.includes("@")) {
      setCheckoutError("Please enter a valid UPI ID (e.g. name@bank).");
      return;
    }

    if (!transactionRef || transactionRef.trim().length < 6) {
      setCheckoutError("Please enter a valid UPI transaction reference code (minimum 6 characters).");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          email: currentUser.email || "no-email@dataglance.com",
          plan: checkoutModal.plan,
          amount: checkoutModal.cost,
          upiId,
          transactionRef: transactionRef.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit verification request.");
      }

      setSuccessMessage("Verification is in process, confirmation mail will reach you soon.");
      setTransactionRef("");
      fetchTransactions();

      setTimeout(() => {
        handleCloseCheckout();
      }, 3000);
    } catch (err: any) {
      console.error("Billing upgrade error:", err);
      setCheckoutError(err.message || "Failed to submit verification request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 bg-slate-50 dark:bg-slate-950/20 min-h-full">

      {/* Top Navigation Tab Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "plans"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Plans & Capacity</span>
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "invoices"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoices & Bills</span>
          {invoices.length > 0 && (
            <span className="ml-1 px-2 py-0.25 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-[10px]">
              {invoices.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PLANS & UPGRADES */}
      {activeTab === "plans" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Banner Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Active Subscription Context</h2>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${currentPlan === "free" ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" :
                    currentPlan === "core" ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/80" :
                      currentPlan === "prime" ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/80" :
                        "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/80"
                  }`}>
                  {currentPlan} plan
                </span>
                {hasSupabaseConfig && currentUser && currentUser.uid !== "anonymous" && onRefreshPlan && (
                  <button
                    onClick={onRefreshPlan}
                    className="p-1 text-slate-550 hover:text-slate-700 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-[10px] flex items-center gap-1 border border-slate-200 dark:border-slate-800 font-bold"
                    title="Sync and refresh active subscription status"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Refresh Plan
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Check analyses credits, purchased capacity slots, and upgrade parameters.</p>
            </div>

            {/* Counter cards */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Narrative Credits</span>
                <div className="text-lg font-black text-slate-800 dark:text-white mt-1">
                  {currentPlan === "free" ? `${analysesLeft} / 5 Left` : "Unlimited"}
                </div>
                {currentPlan === "free" && (
                  <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${(analysesLeft / 5) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saved Project Slots</span>
                <div className="text-lg font-black text-slate-800 dark:text-white mt-1">
                  {savedProjectsCount} / {projectSlots}
                </div>
                <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full"
                    style={{ width: `${Math.min((savedProjectsCount / projectSlots) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div>
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">Choose Your Workspace Capacity</h2>
              <p className="text-xs text-slate-500 mt-2">
                Buy pay-as-you-go slots, or activate annual subscriptions to access bulk workspace capacities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isActive = currentPlan === plan.id;
                const isSlotBtn = plan.id === "core";

                return (
                  <div
                    key={plan.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 ${plan.color}`}
                  >
                    <div>
                      {plan.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.75 bg-purple-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-full shadow-sm">
                          Best Value
                        </span>
                      )}

                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2.5 rounded-lg border text-slate-700 dark:text-white ${isActive ? plan.accent : "bg-slate-50 border-slate-100 dark:bg-slate-850 dark:border-slate-800"}`}>
                          <Icon className="w-5 h-5 animate-pulse" />
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-800 dark:text-white text-base">{plan.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{plan.description}</p>

                      {/* Cost Panel */}
                      <div className="my-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{plan.cost}</span>
                        <span className="text-[10px] text-slate-500 ml-1">/ {plan.period}</span>
                      </div>

                      {/* Feature lists */}
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((f, idx) => (
                          <li key={idx} className="flex items-start text-xs text-slate-500 dark:text-slate-400 gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Purchase buttons */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isSlotBtn) {
                          handleOpenCheckout("core", "Add Project Slot", "Rs. 89", true);
                        } else {
                          handleOpenCheckout(plan.id, `${plan.name} Subscription`, plan.cost, false);
                        }
                      }}
                      disabled={plan.disabled || (isActive && !isSlotBtn)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition duration-250 flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer ${isActive && !isSlotBtn
                          ? "bg-slate-100 text-slate-450 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10"
                        }`}
                    >
                      <span>{isActive && !isSlotBtn ? "Active Plan" : plan.cta}</span>
                      {!isActive && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction History Table */}
          {currentUser && currentUser.uid !== "anonymous" && currentUser.uid !== "admin-uid" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Upgrade Request History</h3>
                  <p className="text-[11px] text-slate-405 mt-0.5">Track the approval status of your manual payment reference codes.</p>
                </div>
                <button
                  onClick={fetchTransactions}
                  className="px-3 py-1 bg-slate-150 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  disabled={loadingTransactions}
                >
                  <RefreshCw className={`w-3 h-3 ${loadingTransactions ? 'animate-spin' : ''}`} />
                  Sync Status
                </button>
              </div>

              {loadingTransactions && transactions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading payment history...</div>
              ) : transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No payment requests found. Upgrade your plan above to get started!</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5">Plan Requested</th>
                        <th className="py-2.5">Amount</th>
                        <th className="py-2.5">UPI ID</th>
                        <th className="py-2.5">Transaction Ref</th>
                        <th className="py-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="text-slate-600 dark:text-slate-300">
                          <td className="py-3">{new Date(txn.created_at).toLocaleDateString()}</td>
                          <td className="py-3 font-semibold text-slate-800 dark:text-white capitalize">{txn.plan}</td>
                          <td className="py-3 font-mono">Rs. {txn.amount}</td>
                          <td className="py-3 text-slate-400 font-mono">{txn.upi_id}</td>
                          <td className="py-3 font-mono text-slate-450 dark:text-slate-500">{txn.transaction_ref}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${txn.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                txn.status === "approved" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                  "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              }`}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVOICES & SEARCH BAR */}
      {activeTab === "invoices" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Invoices & Billing History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Search, view, and download official PDF bills generated for your workspace.</p>
              </div>

              {/* Search Input Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by invoice number (e.g. INV-2026)..."
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-600 rounded-xl text-xs outline-none transition"
                />
                {invoiceSearchQuery && (
                  <button
                    onClick={() => setInvoiceSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Invoice Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Invoices</span>
                <div className="text-xl font-black text-slate-800 dark:text-white mt-1">{invoices.length}</div>
              </div>
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Verified Paid</span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {invoices.filter(i => i.status === "paid" || i.status === "approved").length}
                </div>
              </div>
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Total Billing Value</span>
                <div className="text-xl font-black text-slate-800 dark:text-white mt-1">
                  Rs. {invoices.filter(i => i.status === "paid" || i.status === "approved").reduce((acc, i) => acc + i.totalAmount, 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Invoices List Table */}
            {filteredInvoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No invoices match your search query "{invoiceSearchQuery}".</p>
                <p className="text-[11px] text-slate-500">Try searching for a different invoice number or clear the filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Invoice #</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Description / Plan</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300 transition">
                        <td className="py-3.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-3 text-slate-500">{inv.date}</td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-white">
                          {inv.planName}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {inv.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            inv.status === "paid" || inv.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : inv.status === "pending"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          }`}>
                            {inv.status === "approved" ? "paid" : inv.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer text-[11px]"
                              title="View bill details modal"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              <span>View Bill</span>
                            </button>
                            <button
                              onClick={() => printInvoicePDF(inv)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition flex items-center gap-1 cursor-pointer text-[11px] shadow-sm"
                              title="Download invoice as PDF bill"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paywall Modal Checkout */}
      {checkoutModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full rounded-2xl shadow-2xl p-6 sm:p-8 animate-fadeIn">

            {/* Close */}
            <button
              onClick={handleCloseCheckout}
              disabled={isProcessing}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
            >
              &times;
            </button>

            {/* Checkout Header */}
            <div className="text-center mb-6">
              <div className="bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 p-2.5 rounded-full w-fit mx-auto mb-3">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{checkoutModal.title}</h3>
              <p className="text-xs text-slate-500 mt-1">Complete your simulated payment transaction securely.</p>

              <div className="my-4 p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white">Rs. {checkoutModal.cost}</span>
              </div>
            </div>

            {/* Error / Success */}
            {checkoutError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 flex gap-2">
                <Lock className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{checkoutError}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-600 flex gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Checkout Form */}
            <form onSubmit={handlePaySubmit} className="space-y-4">
              {currentUser && currentUser.uid !== "anonymous" && currentUser.uid !== "admin-uid" && (
                <div className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850 leading-relaxed text-left space-y-1">
                  <p className="font-bold text-slate-700 dark:text-slate-350">How to pay:</p>
                  <p>1. Open your UPI App (GPay, PhonePe, Paytm, etc.).</p>
                  <p>2. Send the exact amount to: <code className="font-mono text-blue-600 dark:text-blue-400 font-bold">7678695012@ptyes</code></p>
                  <p>3. Copy the UPI Transaction Ref ID / UTN and enter it below.</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">UPI Address ID</label>
                <input
                  type="text"
                  placeholder="username@bank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-600 rounded-lg text-xs outline-none transition"
                  disabled={isProcessing}
                />
              </div>

              {currentUser && currentUser.uid !== "anonymous" && currentUser.uid !== "admin-uid" && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Transaction Ref / UTN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 12-digit reference number"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-600 rounded-lg text-xs outline-none transition"
                    disabled={isProcessing}
                  />
                </div>
              )}

              {/* Submit Payment button */}
              <button
                type="submit"
                disabled={isProcessing || !!successMessage}
                className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:border-slate-800 text-white font-bold text-xs rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-98 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Payment Securely...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{currentUser && currentUser.uid !== "anonymous" && currentUser.uid !== "admin-uid" ? "Submit Reference Code" : `Pay Rs. ${checkoutModal.cost}`}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Selected Invoice View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-xl w-full rounded-2xl shadow-2xl p-6 sm:p-8 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer text-lg leading-none"
            >
              &times;
            </button>

            {/* Bill Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">
                    DG
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-base">DataGlance BI Studio</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enterprise BI Studio</p>

                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Invoice</span>
                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{selectedInvoice.invoiceNumber}</span>
              </div>
            </div>

            {/* Invoice Metadata Details */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Customer / Billed To</span>
                <p className="font-bold text-slate-800 dark:text-white">{selectedInvoice.customerName}</p>
                <p className="text-slate-500">{selectedInvoice.customerEmail}</p>
                <p className="text-slate-400 text-[11px] mt-1">UPI: {selectedInvoice.upiId}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Payment Reference</span>
                <p className="font-mono text-slate-700 dark:text-slate-350">{selectedInvoice.transactionRef}</p>
                <p className="text-slate-400 text-[11px]">Issued: {selectedInvoice.date}</p>
                <p className="text-slate-400 text-[11px]">Due: {selectedInvoice.dueDate}</p>
              </div>
            </div>

            {/* Items Breakdown Table */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  <tr>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800 dark:text-white">{selectedInvoice.planName}</p>
                      <p className="text-[10px] text-slate-400">Enterprise BI Dashboard & AI Narrative License</p>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      Rs. {selectedInvoice.amount.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-100/50 dark:bg-slate-850 font-bold text-slate-800 dark:text-white">
                    <td className="py-3 px-3 text-right uppercase tracking-wider text-[11px]">Total Paid Amount</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-blue-600 dark:text-blue-400">
                      Rs. {selectedInvoice.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>


            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => printInvoicePDF(selectedInvoice)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Download PDF / Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
