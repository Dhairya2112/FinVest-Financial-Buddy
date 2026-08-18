"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PieChart, Activity, Calendar, Settings, LogOut, Download } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useState, useEffect } from "react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Splitter", href: "/splitter", icon: PieChart },
  { name: "Tracker", href: "/tracker", icon: Activity },
  { name: "Budget", href: "/budget", icon: Calendar },
  { name: "Events", href: "/events", icon: Activity },
];

export default function Navigation() {
  const pathname = usePathname();
  const isAuthOrLanding = pathname === "/" || pathname === "/login" || pathname === "/register";
  const [showSettings, setShowSettings] = useState(false);
  const [currency, setCurrency] = useState("INR");

  // Load currency on mount and fetch live rates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("finvest_currency");
      if (saved) setCurrency(saved);

      // Fetch live rates globally
      fetch("https://open.er-api.com/v6/latest/USD")
        .then(res => res.json())
        .then(data => {
          if (data && data.rates) {
            localStorage.setItem("finvest_live_rates", JSON.stringify(data.rates));
          }
        })
        .catch(err => console.error("Failed to fetch live currency rates:", err));
    }
  }, []);

  const handleCurrencyChange = (newCurr) => {
    localStorage.setItem("finvest_currency", newCurr);
    setCurrency(newCurr);
    window.dispatchEvent(new Event("currency_changed")); // Optional way to notify other components
    // A quick page reload ensures all data immediately reformats
    window.location.reload();
  };

  // GLOBAL AUTH GUARD: Prevents back-button cache glitches when logged out
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthOrLanding) {
      const token = localStorage.getItem("finvest_token");
      if (!token) {
        window.location.replace("/login");
      }
    }
  }, [pathname, isAuthOrLanding]);

  const handleLogout = () => {
    localStorage.removeItem("finvest_token");
    window.location.href = "/login";
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem("finvest_token");
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/transactions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.status === "success") {
        const txs = json.data;
        if (txs.length === 0) return alert("No data to export.");
        
        // Convert to CSV
        const headers = Object.keys(txs[0]).join(",");
        const rows = txs.map(tx => Object.values(tx).join(",")).join("\n");
        const csvContent = `${headers}\n${rows}`;
        
        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "finvest_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Failed to export data.");
      }
    } catch (err) {
      alert("Error exporting data.");
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 lg:px-12 py-6 pointer-events-none">
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href={isAuthOrLanding ? "/" : "/dashboard"} className="font-grotesk text-2xl font-bold tracking-tighter text-white pointer-events-auto">
          FIN<span className="text-[var(--color-neon-green)]">VEST</span>
        </Link>

        {/* Center Nav - Targeted Glassmorphism */}
        {!isAuthOrLanding && (
          <div className="hidden md:flex items-center gap-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1 pointer-events-auto shadow-2xl">
            <LayoutGroup id="desktop-nav">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`relative px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2 ${
                    isActive ? "text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white rounded-full z-0"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </span>
                </Link>
              );
            })}
            </LayoutGroup>
          </div>
        )}

        {/* User / Settings */}
        <div className="pointer-events-auto relative">
          {!isAuthOrLanding ? (
            <>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showSettings && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-48 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col gap-1"
                  >
                    <button 
                      onClick={handleExportData}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors font-mono text-xs uppercase tracking-widest text-left"
                    >
                      <Download className="w-4 h-4" /> Export Data
                    </button>

                    <div className="h-[1px] bg-white/10 my-1" />
                    
                    <div className="px-3 py-2">
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">Display Currency</p>
                      <div className="grid grid-cols-3 gap-1">
                        {["USD", "INR", "EUR", "GBP", "JPY"].map((curr) => (
                          <button
                            key={curr}
                            onClick={() => handleCurrencyChange(curr)}
                            className={`py-1.5 rounded text-xs font-mono transition-colors ${currency === curr ? 'bg-[var(--color-neon-green)] text-black font-bold' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                          >
                            {curr}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-[1px] bg-white/10 my-1" />
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors font-mono text-xs uppercase tracking-widest text-left"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
             <div className="w-10 h-10"></div>
          )}
        </div>
      </div>
      </nav>

      {/* Mobile Bottom Tab Navigation */}
      {!isAuthOrLanding && (
        <>
          <style>{`
            @media (max-width: 767px) {
              main { padding-bottom: 6rem !important; }
            }
          `}</style>
          <div 
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060608]/95 backdrop-blur-xl border-t border-white/10 px-4 pt-3 pb-6 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pointer-events-auto"
          >
          <div className="flex items-center justify-between">
            <LayoutGroup id="mobile-nav">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                    isActive ? "text-[var(--color-neon-green)]" : "text-white/40 hover:text-white/80"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-0 bg-[var(--color-neon-green)]/10 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5 relative z-10" />
                  <span className="text-[9px] font-mono uppercase tracking-wider relative z-10">{item.name}</span>
                </Link>
              );
            })}
            </LayoutGroup>
          </div>
        </div>
        </>
      )}
    </>
  );
}
