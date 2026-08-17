"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Trash2, ArrowUpRight, ArrowDownRight, Search, TrendingUp, TrendingDown, DollarSign, ChevronUp, ChevronDown, PieChart } from "lucide-react";
import { useRouter } from "next/navigation";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { formatCurrency } from "@/utils/currency";

export default function Tracker() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Advanced States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Data Pipeline
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || tx.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, filterType]);

  const sortedTransactions = useMemo(() => {
    let sortableItems = [...filteredTransactions];
    sortableItems.sort((a, b) => {
      if (sortConfig.key === 'amount') {
        return sortConfig.direction === 'asc' ? parseFloat(a.amount) - parseFloat(b.amount) : parseFloat(b.amount) - parseFloat(a.amount);
      }
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
      }
      if (sortConfig.key === 'category') {
        return sortConfig.direction === 'asc' ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
      }
      return 0;
    });
    return sortableItems;
  }, [filteredTransactions, sortConfig]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const categoryTotals = {};

    filteredTransactions.forEach(tx => {
      const amt = parseFloat(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amt;
      } else {
        expense += amt;
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
      }
    });

    const categories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount, percentage: expense > 0 ? (amount / expense) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);

    return { income, expense, net: income - expense, categories };
  }, [filteredTransactions]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    fetchTransactions();
  }, [router]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("finvest_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/transactions", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.removeItem("finvest_token");
        router.push("/login");
        return;
      }

      const json = await res.json();
      if (json.status === "success") {
        setTransactions(json.data);
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError("Failed to fetch transactions.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    
    try {
      const token = localStorage.getItem("finvest_token");
      const res = await fetch(`http://localhost:5000/api/transactions/delete/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const json = await res.json();
      if (json.status === "success") {
        setTransactions(transactions.filter(t => t.id !== id));
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert("Failed to delete transaction.");
    }
    setItemToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-[var(--color-neon-yellow)] rounded-full animate-spin" />
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

  return (
    <main className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <h1 className="font-grotesk text-4xl md:text-5xl font-bold text-white tracking-tight mb-2 flex items-center gap-4">
            Command Center
            <span className="px-3 py-1 bg-[var(--color-neon-orange)]/10 text-[var(--color-neon-orange)] text-sm font-mono rounded-full border border-[var(--color-neon-orange)]/30 hidden sm:inline-block">Tactical HUD</span>
          </h1>
          <p className="font-inter text-white/50">Real-time breakdown of your financial trajectory.</p>
        </header>

        {/* Tactical HUD (Stats) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--color-neon-green)]/30 transition-colors shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <span className="text-white/50 font-mono text-sm uppercase tracking-widest">Inflow</span>
              <div className="p-2 bg-[var(--color-neon-green)]/10 text-[var(--color-neon-green)] rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="font-grotesk text-4xl font-bold text-white">{formatCurrency(stats.income)}</div>
          </div>
          
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-colors shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <span className="text-white/50 font-mono text-sm uppercase tracking-widest">Outflow</span>
              <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="font-grotesk text-4xl font-bold text-white">{formatCurrency(stats.expense)}</div>
          </div>
          
          <div className={`bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-colors shadow-lg ${stats.net >= 0 ? 'hover:border-[var(--color-neon-green)]/30' : 'hover:border-red-500/30'}`}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-white/50 font-mono text-sm uppercase tracking-widest">Net Cashflow</span>
              <div className="p-2 bg-white/5 text-white/50 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className={`font-grotesk text-4xl font-bold ${stats.net >= 0 ? 'text-[var(--color-neon-green)]' : 'text-red-500'}`}>
              {stats.net >= 0 ? '+' : ''}{formatCurrency(stats.net)}
            </div>
          </div>
        </div>

        {/* Visual Spending Breakdown */}
        {stats.categories.length > 0 && filterType !== 'income' && (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-[var(--color-neon-orange)]" />
              <h3 className="font-bold text-white font-grotesk text-lg">Outflow Distribution</h3>
            </div>
            
            {/* Multi-segmented Progress Bar */}
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex mb-4">
              {stats.categories.map((cat, i) => (
                <div 
                  key={cat.name} 
                  style={{ width: `${cat.percentage}%`, backgroundColor: `hsl(${15 + (i * 45)}, 90%, 60%)` }}
                  className="h-full border-r border-black/20 hover:opacity-80 transition-opacity cursor-help"
                  title={`${cat.name}: ${formatCurrency(cat.amount)} (${cat.percentage.toFixed(1)}%)`}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs font-mono">
              {stats.categories.slice(0, 6).map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2 text-white/60">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(${15 + (i * 45)}, 90%, 60%)` }} />
                  <span>{cat.name} <span className="text-white/30">({cat.percentage.toFixed(0)}%)</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar: Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#0a0a0a] p-4 rounded-2xl border border-white/10 shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search by category..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-neon-orange)] transition-colors"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {['all', 'income', 'expense'].map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider font-mono whitespace-nowrap transition-colors ${
                  filterType === type 
                    ? 'bg-white text-black' 
                    : 'bg-black border border-white/10 text-white/50 hover:text-white hover:border-white/30'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction View Container */}
        <div className="bento-card overflow-hidden p-0 md:p-6 bg-transparent md:bg-black border-none md:border-solid">
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-16 bg-black rounded-2xl border border-white/10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40 font-inter text-lg">No transactions found.</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[var(--color-neon-orange)] font-bold text-sm mt-4 hover:underline">
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP VIEW: Dense Data Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left font-inter text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 font-mono uppercase tracking-widest text-xs bg-black/40">
                      {['Date', 'Category', 'Type', 'Amount'].map(col => (
                        <th 
                          key={col}
                          onClick={() => requestSort(col.toLowerCase())}
                          className={`py-5 cursor-pointer hover:text-white transition-colors select-none ${col === 'Amount' ? 'text-right' : col === 'Date' ? 'pl-6' : ''}`}
                        >
                          <div className={`flex items-center gap-1 ${col === 'Amount' ? 'justify-end' : ''}`}>
                            {col}
                            {sortConfig.key === col.toLowerCase() ? (
                              sortConfig.direction === 'asc' 
                                ? <ChevronUp className="w-3 h-3 text-[var(--color-neon-orange)]" /> 
                                : <ChevronDown className="w-3 h-3 text-[var(--color-neon-orange)]" />
                            ) : (
                              <ChevronUp className="w-3 h-3 opacity-0" />
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="py-5 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence>
                      {sortedTransactions.map((tx, idx) => (
                        <motion.tr 
                          key={tx.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: (idx % 15) * 0.03 }}
                          className="hover:bg-white/5 transition-colors group"
                        >
                          <td className="py-5 pl-6 text-white/60 font-mono">{tx.date}</td>
                          <td className="py-5 text-white font-medium">{tx.category}</td>
                          <td className="py-5">
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                              tx.type === 'income' ? 'bg-[var(--color-neon-green)]/10 text-[var(--color-neon-green)]' : 'bg-white/10 text-white'
                            }`}>
                              {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {tx.type}
                            </span>
                          </td>
                          <td className={`py-5 text-right font-grotesk font-bold text-xl ${
                            tx.type === 'income' ? 'text-[var(--color-neon-green)]' : 'text-white'
                          }`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          <td className="py-5 pr-6 text-right">
                            <button 
                              onClick={() => confirmDelete(tx.id)}
                              className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors inline-block opacity-0 group-hover:opacity-100"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* MOBILE VIEW: Swipe-to-Delete Gesture List */}
              <div className="md:hidden flex flex-col gap-3">
                <AnimatePresence>
                  {sortedTransactions.map((tx) => (
                    <div key={`mobile-${tx.id}`} className="relative rounded-2xl overflow-hidden bg-red-500/20 shadow-lg">
                      {/* Red Background (Revealed on Swipe) */}
                      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-6">
                         <Trash2 className="w-6 h-6 text-red-500" />
                      </div>
                      
                      {/* Swipeable Card */}
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: -100, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                          if (offset.x < -60 || velocity.x < -500) {
                            confirmDelete(tx.id);
                          }
                        }}
                        className="relative z-10 bg-black/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex justify-between items-center"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="font-inter text-white font-medium text-base">{tx.category}</p>
                          <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">{tx.date}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className={`font-grotesk font-bold text-xl ${tx.type === 'income' ? 'text-[var(--color-neon-green)]' : 'text-white'}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase tracking-wider ${
                            tx.type === 'income' ? 'bg-[var(--color-neon-green)]/10 text-[var(--color-neon-green)]' : 'bg-white/10 text-white'
                          }`}>
                            {tx.type}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

      </div>

      <DeleteConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={executeDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This will instantly update your Net Balance and Pacing metrics. This action cannot be undone."
      />
    </main>
  );
}
