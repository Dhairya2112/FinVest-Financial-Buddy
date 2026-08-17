"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Activity, Trash2, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { formatCurrency, parseCurrency, getCurrencySymbol } from "@/utils/currency";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function EventDetails() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Add Tx State
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [transactionType, setTransactionType] = useState("expense");

  useEffect(() => {
    fetchEventTxs();
  }, [eventId]);

  const fetchEventTxs = async () => {
    try {
      const token = localStorage.getItem("finvest_token");
      if (!token) return router.push("/login");

      const res = await fetch(`http://localhost:5000/api/events/${eventId}/transactions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === "success") {
        setTransactions(json.data);
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError("Failed to fetch event transactions.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTx = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("finvest_token");
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/transactions/add`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseCurrency(amount),
          type: transactionType,
          category,
          date: new Date().toISOString().split('T')[0],
          description: "Event Transaction"
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setIsAdding(false);
        setAmount("");
        setCategory("");
        fetchEventTxs();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Error adding event transaction.");
    }
  };

  // We reuse global delete endpoint for simplicity if the backend handles it globally,
  // or hide delete if isolated backend doesn't support deleting isolated txs.
  // Wait, let's just let it be append-only for now unless they want delete.
  // Actually, we can use the global delete endpoint `DELETE /api/transactions/delete/:id` 
  // since all transactions usually share the same table!
  const confirmDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    try {
      const token = localStorage.getItem("finvest_token");
      const res = await fetch(`http://localhost:5000/api/events/transactions/delete/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === "success") {
        setTransactions(transactions.filter(t => t.id !== id && t.ID !== id));
      }
    } catch (err) {
      alert("Failed to delete transaction.");
    }
    setItemToDelete(null);
  };

  if (loading) return (
      <div className="max-w-5xl mx-auto pt-24 pb-12 px-6 animate-pulse space-y-8">
        <div className="space-y-4">
          <div className="w-16 h-4 bg-white/5 rounded-full mb-6" />
          <div className="w-72 h-12 bg-white/5 rounded-xl" />
          <div className="w-48 h-4 bg-white/5 rounded-full" />
        </div>
        <div className="w-full h-[400px] bg-white/5 rounded-3xl" />
      </div>
  );

  return (
    <main className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button onClick={() => router.push('/events')} className="text-white/40 hover:text-white flex items-center gap-2 mb-4 font-mono text-xs uppercase tracking-widest transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </button>
            <h1 className="font-grotesk text-4xl md:text-5xl font-bold text-white tracking-tight mb-2 flex items-center gap-4">
              Isolated Ledger <span className="px-3 py-1 bg-[var(--color-neon-yellow)]/10 text-[var(--color-neon-yellow)] text-sm font-mono rounded-full border border-[var(--color-neon-yellow)]/30">ISOLATED</span>
            </h1>
            <p className="font-inter text-white/50">These logs will NOT affect your main budget or global net-worth.</p>
          </div>
          <button 
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                setAmount("");
                setCategory("");
                setTransactionType("expense");
              } else {
                setIsAdding(true);
              }
            }}
            className="px-6 py-3 bg-[var(--color-neon-yellow)] text-black font-grotesk font-bold rounded-full hover:bg-opacity-80 transition-colors flex items-center gap-2 self-start md:self-auto"
          >
            {isAdding ? "Cancel" : <><Plus className="w-5 h-5" /> Log Event Cost</>}
          </button>
        </header>

        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bento-card border-[var(--color-neon-yellow)]/30 mb-8 max-w-lg">
                <h3 className="font-mono text-xs text-white/40 uppercase tracking-widest mb-4">Add Isolated Record</h3>
                
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl mb-6 border border-white/5">
                  <button onClick={() => setTransactionType("expense")} className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${transactionType === "expense" ? "bg-[var(--color-neon-orange)] text-black" : "text-white/40 hover:text-white"}`}>
                    <ArrowDownRight className="w-4 h-4" /> Expense
                  </button>
                  <button onClick={() => setTransactionType("income")} className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${transactionType === "income" ? "bg-[var(--color-neon-green)] text-black" : "text-white/40 hover:text-white"}`}>
                    <ArrowUpRight className="w-4 h-4" /> Refund
                  </button>
                </div>

                <form onSubmit={handleAddTx} className="space-y-4">
                  <div>
                    <label className="text-xs font-mono text-white/40 uppercase mb-1 block">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-white/40">{getCurrencySymbol()}</span>
                      <input required type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[var(--color-neon-yellow)]" placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-white/40 uppercase mb-1 block">Category</label>
                    <input required type="text" value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[var(--color-neon-yellow)]" placeholder="e.g. Flight, Hotel, Drinks..." />
                  </div>
                  <button type="submit" className="w-full py-3 bg-[var(--color-neon-yellow)] text-black font-bold rounded-xl hover:bg-opacity-80 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Submit
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bento-card overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-[var(--color-neon-yellow)]" />
              </div>
              <p className="text-white/40 font-inter">No transactions logged for this event.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-inter text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 font-mono uppercase tracking-widest text-xs">
                    <th className="py-4 pl-4">Date</th>
                    <th className="py-4">Category</th>
                    <th className="py-4">Type</th>
                    <th className="py-4 text-right">Amount</th>
                    <th className="py-4 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx, idx) => {
                    const id = tx.id || tx.ID;
                    return (
                    <motion.tr 
                      key={id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 pl-4 text-white/60 font-mono">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="py-4 text-white font-medium">{tx.category}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                          tx.type === 'income' ? 'bg-[var(--color-neon-green)]/10 text-[var(--color-neon-green)]' : 'bg-white/10 text-white'
                        }`}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className={`py-4 text-right font-grotesk font-bold text-lg ${
                        tx.type === 'income' ? 'text-[var(--color-neon-green)]' : 'text-white'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <button onClick={() => confirmDelete(id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors inline-block">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  )})}
                </tbody>
              </table>
            </div>
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
        message="Are you sure you want to delete this event transaction? This action cannot be undone."
      />
    </main>
  );
}
