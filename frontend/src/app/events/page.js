"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, Plus, Calendar as CalendarIcon, Trash2, ArrowRight, Plane, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  
  // Quick Log State
  const [quickLogEventId, setQuickLogEventId] = useState(null);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickDesc, setQuickDesc] = useState("");

  const getEventStatus = (start, end) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const sDate = new Date(start);
    sDate.setHours(0,0,0,0);
    const eDate = new Date(end);
    eDate.setHours(0,0,0,0);
    
    if (today < sDate) {
      const diffTime = Math.abs(sDate - today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { status: "upcoming", text: `Starts in ${diffDays} Days`, color: "text-[var(--color-neon-yellow)]", dot: "bg-[var(--color-neon-yellow)] animate-pulse" };
    } else if (today > eDate) {
      return { status: "concluded", text: "Concluded", color: "text-white/40", dot: "bg-white/20" };
    } else {
      const diffTime = Math.abs(today - sDate);
      const currentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const totalDays = Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
      return { status: "live", text: `Live / Day ${currentDay} of ${totalDays}`, color: "text-[var(--color-neon-green)]", dot: "bg-[var(--color-neon-green)] animate-[pulse_2s_infinite]" };
    }
  };

  const getGradient = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${h1}, 70%, 20%), hsl(${h2}, 70%, 10%))`;
  };

  const submitQuickLog = async (e, eventId) => {
    e.preventDefault();
    if (!quickAmount) return;
    try {
      const token = localStorage.getItem("finvest_token");
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/transactions/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(quickAmount),
          type: "expense",
          date: new Date().toISOString().split('T')[0],
          category: quickDesc || "Quick Log",
          description: quickDesc || "Quick Log"
        })
      });
      if (res.ok) {
        setQuickLogEventId(null);
        setQuickAmount("");
        setQuickDesc("");
        fetchEvents();
      }
    } catch (err) {
      alert("Failed to log transaction.");
    }
  };
  // Form State
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchEvents();
  }, [router]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("finvest_token");
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch("http://localhost:5000/api/events", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem("finvest_token");
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.status === "success") {
        setEvents(json.data);
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError("Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("finvest_token");
      const res = await fetch("http://localhost:5000/api/events/add", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          budget: parseFloat(budget),
          start_date: startDate,
          end_date: endDate
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setIsAdding(false);
        setName(""); setBudget(""); setStartDate(""); setEndDate("");
        fetchEvents();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Error adding event");
    }
  };

  const confirmDelete = (id) => {
    setEventToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!eventToDelete) return;
    const id = eventToDelete;
    try {
      const token = localStorage.getItem("finvest_token");
      const res = await fetch(`http://localhost:5000/api/events/delete/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setEvents(events.filter((e) => e.id !== id && e.ID !== id));
      }
    } catch (err) {
      alert("Error deleting event");
    }
    setEventToDelete(null);
  };

  if (loading) return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-t-[var(--color-neon-yellow)] border-white/20 rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-grotesk text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
              Event Tracker
            </h1>
            <p className="font-inter text-white/50">Manage isolated budgets for trips, projects, or special events.</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="px-6 py-3 bg-[var(--color-neon-yellow)] text-black font-grotesk font-bold rounded-full hover:bg-opacity-80 transition-colors flex items-center gap-2 self-start md:self-auto"
          >
            {isAdding ? "Cancel" : <><Plus className="w-5 h-5" /> New Event</>}
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
              <div className="bento-card border-[var(--color-neon-yellow)]/30 mb-8">
                <h3 className="font-mono text-xs text-white/40 uppercase tracking-widest mb-4">Create New Event</h3>
                <form onSubmit={handleAddEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-white/40 uppercase mb-1 block">Event Name</label>
                    <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[var(--color-neon-yellow)]" placeholder="e.g. Europe Trip" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-white/40 uppercase mb-1 block">Budget Amount</label>
                    <input required type="number" step="0.01" min="1" value={budget} onChange={e=>setBudget(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[var(--color-neon-yellow)]" placeholder="5000" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-white/40 uppercase mb-1 block">Start Date</label>
                    <input required type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[var(--color-neon-yellow)]" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-white/40 uppercase mb-1 block">End Date</label>
                    <input required type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[var(--color-neon-yellow)]" />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button type="submit" className="w-full py-3 bg-[var(--color-neon-yellow)] text-black font-bold rounded-xl hover:bg-opacity-80">Create Event</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.length === 0 && !isAdding ? (
            <div className="col-span-full text-center py-12 bento-card">
              <CalendarIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No active events.</p>
            </div>
          ) : (
            events.map((ev, idx) => {
              const id = ev.id || ev.ID;
              const statusInfo = getEventStatus(ev.start_date, ev.end_date);
              
              // Daily Pace Calc
              let dailyAllowance = null;
              if (statusInfo.status === "live") {
                const today = new Date();
                today.setHours(0,0,0,0);
                const eDate = new Date(ev.end_date);
                eDate.setHours(0,0,0,0);
                const daysLeft = Math.max(1, Math.ceil(Math.abs(eDate - today) / (1000 * 60 * 60 * 24)) + 1);
                const remainingBudget = Math.max(0, ev.budget - ev.current_amount);
                dailyAllowance = remainingBudget / daysLeft;
              }

              return (
                <motion.div 
                  key={id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bento-card group relative overflow-hidden flex flex-col shadow-lg hover:shadow-xl transition-all"
                  style={{ background: getGradient(ev.name) }}
                >
                  <div className="absolute inset-0 bg-black/60 pointer-events-none" />
                  
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>

                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Plane className="w-48 h-48 -rotate-12 translate-x-12 -translate-y-12" />
                  </div>
                  
                  <div className="flex justify-between items-start mb-6 relative z-10 pr-32">
                    <div>
                      <h3 className="font-grotesk text-3xl font-bold text-white mb-2 shadow-sm truncate">{ev.name}</h3>
                      <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest flex items-center gap-2">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(ev.start_date).toLocaleDateString()} - {new Date(ev.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 relative z-10">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">Spent</p>
                        <p className="font-grotesk text-4xl font-bold text-white leading-none">
                          ${ev.current_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-inter text-sm text-white/50">of ${ev.budget.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-3 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${ev.progress_percent > 90 ? 'bg-[var(--color-neon-orange)]' : 'bg-[var(--color-neon-yellow)]'}`}
                        style={{ width: `${Math.min(ev.progress_percent, 100)}%` }}
                      />
                    </div>
                    
                    {dailyAllowance !== null && (
                      <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-3 rounded-xl mt-4">
                        <Zap className="w-4 h-4 text-[var(--color-neon-green)]" />
                        <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest flex-1">Trip Pace Allowance</span>
                        <span className="font-mono font-bold text-[var(--color-neon-green)]">${dailyAllowance.toFixed(2)}/day</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto relative z-10 flex gap-2">
                    <button 
                      onClick={() => router.push(`/events/${id}`)} 
                      className="flex-1 py-3 bg-black/40 hover:bg-black/60 border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 backdrop-blur-md"
                    >
                      Full Logs <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    <button 
                      onClick={() => setQuickLogEventId(id)} 
                      className="w-12 py-3 bg-[var(--color-neon-yellow)] text-black rounded-xl hover:bg-white transition-colors flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
                      title="Quick Log"
                    >
                      <Plus className="w-5 h-5 font-bold" />
                    </button>

                    <button 
                      onClick={() => confirmDelete(id)} 
                      className="w-12 py-3 bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded-xl transition-colors flex items-center justify-center"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Log Overlay */}
                  <AnimatePresence>
                    {quickLogEventId === id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 p-6 flex flex-col justify-center border border-[var(--color-neon-yellow)]/30 rounded-2xl"
                      >
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-grotesk font-bold text-xl text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-[var(--color-neon-yellow)]" /> Quick Log
                          </h4>
                          <button onClick={() => setQuickLogEventId(null)} className="text-white/50 hover:text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <form onSubmit={(e) => submitQuickLog(e, id)} className="space-y-4">
                          <div>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono">$</span>
                              <input required type="number" step="0.01" min="0.01" value={quickAmount} onChange={e=>setQuickAmount(e.target.value)} placeholder="0.00" className="w-full bg-black/50 border border-white/20 rounded-xl py-3 pl-8 pr-4 font-mono font-bold text-white text-lg outline-none focus:border-[var(--color-neon-yellow)]" autoFocus />
                            </div>
                          </div>
                          <div>
                            <input type="text" required value={quickDesc} onChange={e=>setQuickDesc(e.target.value)} placeholder="e.g. Dinner, Taxi..." className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white text-sm outline-none focus:border-[var(--color-neon-yellow)]" />
                          </div>
                          <button type="submit" className="w-full py-3 bg-[var(--color-neon-yellow)] text-black font-bold rounded-xl hover:bg-white transition-colors">
                            Subtract from Budget
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          )}
        </div>

      </div>
      
      <DeleteConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setEventToDelete(null);
        }}
        onConfirm={executeDelete}
        title="Delete Event"
        message="Are you sure you want to completely erase this event and all its associated transactions? This cannot be undone."
      />
    </main>
  );
}
