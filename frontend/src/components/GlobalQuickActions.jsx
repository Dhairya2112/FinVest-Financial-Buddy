"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowDownRight, ArrowUpRight, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { parseCurrency, getCurrencySymbol } from "@/utils/currency";

export default function GlobalQuickActions() {
  const pathname = usePathname();
  const isAuthOrLanding = pathname === "/" || pathname === "/login" || pathname === "/register";

  const [isOpen, setIsOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle ESC key to close and Custom Event to open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    const handleOpenEvent = () => setIsOpen(true);
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open_quick_log", handleOpenEvent);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open_quick_log", handleOpenEvent);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("finvest_token");
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/transactions/add", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseCurrency(amount),
          type: transactionType,
          category: category,
          date: document.getElementById('qa-date').value,
          description: "Logged via Quick Actions"
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        // Save to recent categories
        try {
          let recent = JSON.parse(localStorage.getItem('finvest_recent_categories') || '["Food", "Transport", "Subscriptions"]');
          if (!recent.includes(category)) {
            recent = [category, ...recent].slice(0, 5); // Keep top 5
            localStorage.setItem('finvest_recent_categories', JSON.stringify(recent));
          }
        } catch (e) {}

        setIsOpen(false);
        setAmount("");
        setCategory("");
        // Typically trigger a SWR revalidate or refresh here, for now just reload
        window.location.reload(); 
      } else {
        alert(data.message || "Failed to add transaction");
      }
    } catch (err) {
      alert("Failed to reach server");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthOrLanding) return null;

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-[var(--color-neon-green)] text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(127,255,0,0.3)] z-50 hover:shadow-[0_0_30px_rgba(127,255,0,0.5)] transition-shadow"
      >
        <Plus className="w-6 h-6" strokeWidth={3} />
      </motion.button>

      {/* The Quick Action Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bento-card border-white/10 shadow-2xl z-10"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <h2 className="font-grotesk text-2xl font-bold text-white mb-2">Quick Log</h2>
                <p className="font-inter text-sm text-white/50">Log a transaction instantly from anywhere.</p>
              </div>

              {/* Type Toggle */}
              <div className="flex gap-2 p-1 bg-black/40 rounded-xl mb-6 border border-white/5">
                <button
                  onClick={() => setTransactionType("expense")}
                  className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    transactionType === "expense" 
                      ? "bg-[var(--color-neon-orange)] text-black" 
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" /> Expense
                </button>
                <button
                  onClick={() => setTransactionType("income")}
                  className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    transactionType === "income" 
                      ? "bg-[var(--color-neon-green)] text-black" 
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" /> Income
                </button>
              </div>

              {/* Form Stub */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-mono text-xs text-white/40 uppercase tracking-widest mb-2 block">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-white/40">{getCurrencySymbol()}</span>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 font-grotesk text-2xl font-bold text-white outline-none focus:border-[var(--color-neon-green)] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-mono text-xs text-white/40 uppercase tracking-widest mb-2 block">Category</label>
                  <input 
                    type="text" 
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Groceries, Salary..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 font-inter text-white outline-none focus:border-white/30 transition-colors"
                  />
                  {/* Smart Categorization Pills */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(() => {
                      try {
                        const saved = JSON.parse(localStorage.getItem('finvest_recent_categories') || '["Food", "Transport", "Subscriptions"]');
                        return saved.slice(0, 4).map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className="px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-mono text-white/60 transition-colors"
                          >
                            {cat}
                          </button>
                        ));
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                </div>
                <div>
                  <label className="font-mono text-xs text-white/40 uppercase tracking-widest mb-2 block">Date</label>
                  <input 
                    type="date" 
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    id="qa-date"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 font-inter text-white outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 mt-4 bg-white text-black font-grotesk font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" /> {loading ? "Adding..." : "Add Record"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
