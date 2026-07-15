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
  RefreshCw
} from "lucide-react";
import { PlanType } from "../types";
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
    if (!hasSupabaseConfig || !currentUser || currentUser.uid === "anonymous" || currentUser.uid === "admin-uid") return;
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", currentUser.uid)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setTransactions(data);
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
      cost: "Rs. 350",
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

    if (hasSupabaseConfig && currentUser && currentUser.uid !== "anonymous" && currentUser.uid !== "admin-uid") {
      if (!transactionRef || transactionRef.trim().length < 6) {
        setCheckoutError("Please enter a valid UPI transaction reference code (minimum 6 characters).");
        return;
      }

      setIsProcessing(true);
      try {
        const { error } = await supabase
          .from("payments")
          .insert({
            user_id: currentUser.uid,
            email: currentUser.email || "no-email@dataglance.com",
            plan: checkoutModal.plan,
            amount: checkoutModal.cost,
            upi_id: upiId,
            transaction_ref: transactionRef.trim(),
            status: "pending"
          });

        if (error) {
          if (error.message && error.message.includes("unique")) {
            throw new Error("This Transaction Reference number has already been submitted for verification.");
          }
          throw error;
        }

        setSuccessMessage(`Upgrade request submitted successfully! Admin will verify Ref ID: ${transactionRef.trim()} and update your plan details.`);
        setTransactionRef("");
        fetchTransactions();

        setTimeout(() => {
          handleCloseCheckout();
        }, 3000);
      } catch (err: any) {
        console.error("Supabase insert error:", err);
        setCheckoutError(err.message || "Failed to submit verification request. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Mock flow
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        
        let newSlots = projectSlots;
        if (checkoutModal.isSlotPurchase) {
          newSlots = projectSlots + 1;
        } else if (checkoutModal.plan === "prime") {
          newSlots = Math.max(projectSlots, 5);
        } else if (checkoutModal.plan === "apex") {
          newSlots = Math.max(projectSlots, 60);
        }

        onUpgradePlan(checkoutModal.plan, newSlots);
        setSuccessMessage(`[MOCK] Payment of Rs. ${checkoutModal.cost} received! Plan status successfully updated.`);
        
        setTimeout(() => {
          handleCloseCheckout();
        }, 1500);
      }, 2000);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 bg-slate-50 dark:bg-slate-950/20 min-h-full">
      
      {/* Top Banner Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
        
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Active Subscription Context</h2>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
              currentPlan === "free" ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" :
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
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition duration-250 flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer ${
                    isActive && !isSlotBtn
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
              {hasSupabaseConfig && currentUser && currentUser.uid !== "anonymous" && (
                <div className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850 leading-relaxed text-left space-y-1">
                  <p className="font-bold text-slate-700 dark:text-slate-350">How to pay:</p>
                  <p>1. Open your UPI App (GPay, PhonePe, Paytm, etc.).</p>
                  <p>2. Send the exact amount to: <code className="font-mono text-blue-600 dark:text-blue-400 font-bold">dataglance@okaxis</code></p>
                  <p>3. Copy the UPI Transaction Ref ID / UTN and enter it below.</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">UPI Address ID</label>
                <input
                  type="text"
                  placeholder="username@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-600 rounded-lg text-xs outline-none transition"
                  disabled={isProcessing}
                />
              </div>

              {hasSupabaseConfig && currentUser && currentUser.uid !== "anonymous" && (
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
                    <span>{hasSupabaseConfig && currentUser && currentUser.uid !== "anonymous" ? "Submit Reference Code" : `Pay Rs. ${checkoutModal.cost}`}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {hasSupabaseConfig && currentUser && currentUser.uid !== "anonymous" && currentUser.uid !== "admin-uid" && (
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                          txn.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
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
  );
}
