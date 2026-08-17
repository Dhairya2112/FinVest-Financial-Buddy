"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowUpRight, ArrowDownRight, Activity, Zap, Plus, Camera, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/currency";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30D"); // 7D, 30D, ALL

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("finvest_token");
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/dashboard", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("API Offline");
        const json = await res.json();
        if (json.status === "success") {
          setData(json.data);
        }
      } catch (err) {
        console.warn("Backend offline. Using fallback.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const chartData = useMemo(() => {
    if (!data?.recent_transactions) return [];
    
    // Filter by timeRange
    const now = new Date();
    let daysToKeep = 999;
    if (timeRange === "7D") daysToKeep = 7;
    if (timeRange === "30D") daysToKeep = 30;

    const filtered = data.recent_transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const diffTime = Math.abs(now - txDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= daysToKeep;
    });

    // Group by date to calculate Net Cashflow per day
    const grouped = {};
    filtered.forEach(tx => {
      if (!grouped[tx.date]) grouped[tx.date] = 0;
      grouped[tx.date] += tx.type === "income" ? tx.amount : -tx.amount;
    });

    return Object.keys(grouped).sort().map(date => ({
      date,
      net: grouped[date]
    }));
  }, [data, timeRange]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-32 animate-pulse space-y-8">
        <div className="flex justify-between items-end mb-12">
           <div className="space-y-4"><div className="w-64 h-12 bg-white/5 rounded-xl" /><div className="w-32 h-4 bg-white/5 rounded-full" /></div>
           <div className="w-48 h-10 bg-white/5 rounded-full hidden md:block" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="md:col-span-2 h-[280px] bg-white/5 rounded-3xl" />
           <div className="h-[280px] bg-white/5 rounded-3xl" />
        </div>
        <div className="w-full h-[300px] bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (!data) return null;

  const budgetLimit = data.budget?.monthly_budget || 0;
  const spent = data.metrics.monthly_expenses || 0;
  const budgetPercentage = budgetLimit > 0 ? Math.min((spent / budgetLimit) * 100, 100) : 0;
  const isBudgetCritical = budgetPercentage > 90;

  return (
    <div className="max-w-5xl mx-auto px-6 pt-24 pb-32">
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-grotesk text-5xl md:text-6xl font-bold tracking-tight text-white mb-2">
            OVERVIEW
          </h1>
          <p className="font-mono text-white/40 uppercase tracking-widest text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-neon-green)] animate-pulse"></span>
            System Live
          </p>
        </div>
        
        {/* Time Range Selectors */}
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md self-start md:self-end">
          {["7D", "30D", "ALL"].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-widest transition-colors ${
                timeRange === range ? "bg-white text-black font-bold" : "text-white/40 hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </motion.header>

      {/* Daily Action Center (Insights) */}
      <AnimatePresence>
        {data.insights && data.insights.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-10 space-y-4"
          >
            <h3 className="font-mono text-xs text-white/50 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--color-neon-yellow)]" /> Action Center
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.insights.map((insight, idx) => (
                <div 
                  key={idx} 
                  className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col gap-2 ${
                    insight.type === 'danger' ? 'bg-red-950/30 border-red-500/30 text-red-100' :
                    insight.type === 'warning' ? 'bg-yellow-950/30 border-yellow-500/30 text-yellow-100' :
                    'bg-blue-950/30 border-blue-500/30 text-blue-100'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold font-inter text-lg">
                    <AlertCircle className="w-5 h-5" />
                    {insight.title}
                  </div>
                  <p className="font-inter text-sm opacity-80">{insight.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Metrics Bento Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        {/* Net Worth & Budget Health Card */}
        <div className="bento-card md:col-span-2 flex flex-col justify-between min-h-[280px] relative overflow-hidden">
          {/* Subtle Glow Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-neon-green)]/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="font-mono text-xs text-white/40 uppercase tracking-widest mb-1">Net Balance</h3>
            <h2 className="font-grotesk text-6xl md:text-8xl font-bold tracking-tighter text-white">
              {formatCurrency(data.metrics.balance)}
            </h2>
            
            {/* Budget Health Sync */}
            {budgetLimit > 0 && (
              <div className="mt-6 max-w-md">
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest mb-2">
                  <span className="text-white/50 flex items-center gap-1"><Target className="w-3 h-3"/> Budget Health</span>
                  <span className={isBudgetCritical ? "text-[var(--color-neon-orange)]" : "text-white"}>
                    {formatCurrency(spent, 0)} / {formatCurrency(budgetLimit, 0)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${budgetPercentage}%` }}
                    className={`h-full ${isBudgetCritical ? "bg-[var(--color-neon-orange)]" : "bg-[var(--color-neon-green)]"}`}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
            <div className="bento-inner-block bg-white/5 border border-white/10">
              <div className="font-mono text-xs text-[var(--color-neon-green)] font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                <ArrowUpRight className="w-4 h-4" /> Income
              </div>
              <div className="font-grotesk text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
                {formatCurrency(data.metrics.monthly_income, 0)}
              </div>
            </div>
            
            <div className="bento-inner-block bg-white/5 border border-white/10">
              <div className="font-mono text-xs text-[var(--color-neon-orange)] font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                <ArrowDownRight className="w-4 h-4" /> Expenses
              </div>
              <div className="font-grotesk text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
                {formatCurrency(data.metrics.monthly_expenses, 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity List (Sliced to top 5) */}
        <div className="bento-card flex flex-col min-h-[280px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-mono text-xs text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Recent Logs
            </h3>
            <button onClick={() => window.location.href='/tracker'} className="font-mono text-[10px] text-white/40 hover:text-white uppercase tracking-widest">View All</button>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {data.recent_transactions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center flex-col text-center opacity-50">
                <p className="font-inter text-sm mb-2">No recent activity.</p>
              </div>
            ) : (
              data.recent_transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <p className="font-inter text-white font-medium">{tx.category}</p>
                    <p className="font-mono text-[10px] text-white/40">{tx.date}</p>
                  </div>
                  <p className={`font-mono font-bold ${tx.type === 'income' ? 'text-[var(--color-neon-green)]' : 'text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Cumulative Wealth Area Chart */}
      {chartData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bento-card mb-12"
        >
          <h3 className="font-mono text-xs text-white/40 uppercase tracking-widest mb-6">Cashflow Trend ({timeRange})</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-neon-green)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-neon-green)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value, 0)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000000', border: '1px solid #ffffff20', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--color-neon-green)', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="net" 
                  stroke="var(--color-neon-green)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorNet)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

    </div>
  );
}
