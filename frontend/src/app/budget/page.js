"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, TrendingDown, TrendingUp, AlertTriangle, Zap, Clock, Calendar, Settings, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatCurrencyNoSymbol, parseCurrency, getCurrencySymbol } from "@/utils/currency";

export default function Budget() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBudget, setNewBudget] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Micro Budgets State
  const [microBudgets, setMicroBudgets] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  useEffect(() => {
    fetchBudget();
    const saved = localStorage.getItem("finvest_micro_budgets");
    if (saved) setMicroBudgets(JSON.parse(saved));
  }, [router]);

  const saveMicroBudget = (category) => {
    const newBudgets = { ...microBudgets };
    const amt = parseCurrency(editAmount);
    if (amt > 0) newBudgets[category] = amt;
    else delete newBudgets[category];
    
    setMicroBudgets(newBudgets);
    localStorage.setItem("finvest_micro_budgets", JSON.stringify(newBudgets));
    setEditingCategory(null);
    setEditAmount("");
  };

  const fetchBudget = async () => {
    try {
      const token = localStorage.getItem("finvest_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/budget", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.removeItem("finvest_token");
        router.push("/login");
        return;
      }

      const json = await res.json();
      if (json.status === "success") {
        setData(json.data);
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError("Failed to fetch budget data.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    if (!newBudget) return;
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("finvest_token");
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/budget/set", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ monthly_budget: parseCurrency(newBudget) })
      });
      const json = await res.json();
      if (json.status === "success") {
        setNewBudget("");
        fetchBudget(); // Refresh
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert("Failed to update budget.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pt-24 pb-12 px-6 animate-pulse space-y-8 min-h-screen">
        <div className="space-y-4 mb-12">
          <div className="w-64 h-12 bg-white/5 rounded-xl" />
          <div className="w-48 h-4 bg-white/5 rounded-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-[280px] bg-white/5 rounded-3xl" />
          <div className="h-[280px] bg-white/5 rounded-3xl" />
          <div className="h-[280px] bg-white/5 rounded-3xl" />
        </div>
        <div className="w-full h-[400px] bg-white/5 rounded-3xl mt-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  const percentage = data?.budget_amount > 0 ? (data.spent / data.budget_amount) * 100 : 0;
  const isOverBudget = data?.spent > data?.budget_amount;

  // Pace Calculations
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = daysInMonth - currentDay;

  const expectedSpend = data ? (data.budget_amount / daysInMonth) * currentDay : 0;
  const isBurnRateHigh = data ? data.spent > expectedSpend : false;
  const safeDailySpend = data && remainingDays > 0 ? Math.max(0, (data.budget_amount - data.spent) / remainingDays) : 0;
  
  // Sort categories for Top Drainers
  const sortedCategories = data?.category_breakdown ? [...data.category_breakdown].sort((a, b) => b.amount - a.amount) : [];

  return (
    <main className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <h1 className="font-grotesk text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
            Budget
          </h1>
          <p className="font-inter text-white/50">Control your spending and set monthly limits.</p>
        </header>

        {/* Top Dashboards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. Global Budget */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bento-card relative overflow-hidden flex flex-col justify-center ${isOverBudget ? 'border-red-500/50 shadow-[0_0_30px_rgba(255,0,0,0.1)]' : 'shadow-lg'}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Target className="w-32 h-32" />
            </div>
            
            <h3 className="font-mono text-xs text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" /> Global Limit
            </h3>
            <p className="font-grotesk text-5xl font-bold text-white mb-6">
              {formatCurrency(data?.budget_amount)}
            </p>

            <div className="space-y-2 relative z-10">
              <div className="flex justify-between font-mono text-xs text-white/60 font-bold">
                <span>Spent: {formatCurrency(data?.spent)}</span>
                <span className={isOverBudget ? 'text-red-400' : ''}>{percentage.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-red-500' : 'bg-[var(--color-neon-green)]'}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              {isOverBudget && (
                <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  <AlertTriangle className="w-3 h-3" /> Exceeded by {formatCurrency(Math.abs(data.remaining))}
                </p>
              )}
            </div>
          </motion.div>

          {/* 2. Pace Tracker / Burn Rate */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bento-card flex flex-col justify-center relative overflow-hidden shadow-lg"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Zap className="w-32 h-32" />
            </div>
            
            <h3 className="font-mono text-xs text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Burn Rate Analysis
            </h3>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/50 text-xs font-mono uppercase tracking-widest mb-1">Status</div>
                  {isBurnRateHigh ? (
                    <div className="text-[var(--color-neon-orange)] font-bold flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5" /> Spending Fast
                    </div>
                  ) : (
                    <div className="text-[var(--color-neon-green)] font-bold flex items-center gap-2 text-lg">
                      <TrendingDown className="w-5 h-5" /> On Track
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-white/50 text-xs font-mono uppercase tracking-widest mb-1">Expected</div>
                  <div className="text-white font-mono font-bold text-lg">{formatCurrency(expectedSpend, 0)}</div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-white/50 text-xs font-mono uppercase tracking-widest mb-1">Safe Daily Spend</div>
                  <div className="text-white font-grotesk font-bold text-3xl">{formatCurrency(safeDailySpend)}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-white/30 text-[10px] uppercase font-mono mb-1">
                    <Calendar className="w-3 h-3" /> Day {currentDay} of {daysInMonth}
                  </div>
                  <div className="text-white/50 text-xs font-mono">{remainingDays} days left</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. Update Budget Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bento-card flex flex-col justify-center shadow-lg"
          >
            <h3 className="font-mono text-xs text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Re-calibrate Limit
            </h3>
            
            <div className="flex items-center justify-between mb-6 p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="font-inter text-sm text-white/50">Total Lifetime Income:</span>
              <span className="text-[var(--color-neon-green)] font-bold font-mono text-lg">
                {formatCurrency(data?.total_income, 0)}
              </span>
            </div>
            
            <form onSubmit={handleUpdateBudget} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono">{getCurrencySymbol()}</span>
                <input 
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  required
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder={formatCurrencyNoSymbol(data?.budget_amount)}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 pl-8 pr-4 font-grotesk text-xl font-bold text-white outline-none focus:border-[var(--color-neon-orange)] transition-colors"
                />
              </div>
              <button 
                type="submit" disabled={isUpdating}
                className="px-6 py-3 bg-white/10 text-white font-grotesk font-bold rounded-xl hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                {isUpdating ? "..." : "Save"}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Tactical Categories & Micro Budgets */}
        {sortedCategories.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bento-card mt-6 shadow-lg"
          >
            <h3 className="font-mono text-xs text-white/40 uppercase tracking-widest mb-8 flex items-center gap-2">
              <PieChart className="w-4 h-4" /> Top Drainers & Micro Budgets
            </h3>
            
            <div className="flex flex-col lg:flex-row items-start gap-12">
              {/* Left: Chart */}
              <div className="w-full lg:w-1/2 h-[350px] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-full" />
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sortedCategories}
                      dataKey="amount" nameKey="category"
                      cx="50%" cy="50%" innerRadius={90} outerRadius={120} paddingAngle={4}
                    >
                      {sortedCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${15 + index * 40}, 90%, 60%)`} className="hover:opacity-80 transition-opacity outline-none" stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Stat */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="block text-white/40 font-mono text-xs uppercase mb-1">Total Outflow</span>
                  <span className="block text-white font-grotesk font-bold text-3xl">{formatCurrency(data.spent, 0)}</span>
                </div>
              </div>

              {/* Right: Micro Budgets List */}
              <div className="w-full lg:w-1/2 space-y-4 max-h-[350px] overflow-y-auto pr-2 hide-scrollbar">
                {sortedCategories.map((cat, idx) => {
                  const limit = microBudgets[cat.category];
                  const progress = limit ? (cat.amount / limit) * 100 : (cat.amount / data.budget_amount) * 100;
                  const isOverMicro = limit && cat.amount > limit;

                  return (
                    <div key={idx} className="bg-black/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-end mb-3 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(${15 + idx * 40}, 90%, 60%)` }} />
                          <span className="font-bold text-white font-inter">{cat.category}</span>
                        </div>
                        <div className="text-right flex items-baseline gap-1">
                          <span className="font-mono font-bold text-lg text-white">{formatCurrency(cat.amount)}</span>
                          {limit ? (
                            <span className="font-mono text-xs text-white/40">/ {formatCurrency(limit, 0)}</span>
                          ) : (
                            <button onClick={() => { setEditingCategory(cat.category); setEditAmount(""); }} className="ml-3 text-[10px] text-[var(--color-neon-orange)] uppercase tracking-widest hover:underline font-bold">
                              Set Limit
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="relative z-10">
                        {editingCategory === cat.category ? (
                          <div className="flex gap-2 mt-3 bg-[#0a0a0a] p-2 rounded-xl border border-white/10">
                            <span className="text-white/40 flex items-center pl-2 font-mono">{getCurrencySymbol()}</span>
                            <input 
                              type="text" 
                              inputMode="decimal"
                              pattern="[0-9.]*"
                              value={editAmount} 
                              onChange={e => setEditAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
                              placeholder="Limit" 
                              className="bg-transparent text-white font-mono outline-none w-full"
                              autoFocus
                            />
                            <button onClick={() => saveMicroBudget(cat.category)} className="bg-white text-black font-bold px-4 py-1.5 rounded-lg text-xs hover:bg-[var(--color-neon-orange)] transition-colors">Save</button>
                            <button onClick={() => setEditingCategory(null)} className="text-white/40 hover:text-white px-2">✕</button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${limit ? (isOverMicro ? 'bg-red-500' : 'bg-white') : 'bg-white/30'}`} 
                                style={{ width: `${Math.min(progress, 100)}%` }} 
                              />
                            </div>
                            
                            {limit && (
                              <div className="flex justify-between items-center mt-2">
                                <button onClick={() => { setEditingCategory(cat.category); setEditAmount(formatCurrencyNoSymbol(limit)); }} className="text-[10px] text-white/30 hover:text-white uppercase tracking-widest font-mono">
                                  Edit Limit
                                </button>
                                {isOverMicro && <span className="text-[10px] text-red-500 uppercase tracking-widest font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Exceeded</span>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </main>
  );
}
