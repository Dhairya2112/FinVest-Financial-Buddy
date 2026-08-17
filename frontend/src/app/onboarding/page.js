"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ShieldCheck, Command, Camera, ArrowRight, CheckCircle2, Globe, Target, Loader2 } from "lucide-react";
import { parseCurrency } from "@/utils/currency";

const steps = [
  {
    title: "Welcome to FinVest.",
    description: "Your workspace has been successfully deployed. Let's configure your terminal for absolute financial control.",
    icon: ShieldCheck,
    color: "text-[var(--color-neon-green)]",
    bg: "bg-[var(--color-neon-green)]/10",
  },
  {
    title: "Optical Receipt Parsing",
    description: "Upload any receipt in the Splitter. Our local vision engine will extract line-items, distribute proportional tax, and calculate exact debts with 98% accuracy.",
    icon: Camera,
    color: "text-white",
    bg: "bg-white/10",
  },
  {
    title: "The Global Hook",
    description: "Friction is the enemy. No matter where you are in the application, press CTRL+K to instantly open the transaction logger. Try it once you enter the dashboard.",
    icon: Command,
    color: "text-[var(--color-neon-orange)]",
    bg: "bg-[var(--color-neon-orange)]/10",
  },
  {
    title: "Regional Configuration",
    description: "Select your base currency. This determines the formatting for your ledgers and analytics. You can change this anytime in settings.",
    icon: Globe,
    color: "text-white",
    bg: "bg-white/10",
    isCurrencySelect: true
  },
  {
    title: "Capital Allocation",
    description: "Establish your core operating monthly budget. We will use this baseline to measure your burn rate.",
    icon: Target,
    color: "text-[var(--color-neon-green)]",
    bg: "bg-[var(--color-neon-green)]/10",
    isBudgetSetup: true
  }
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" }
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const nextStep = async () => {
    // If we are on the budget step, we save it to the DB and finish onboarding
    if (steps[step].isBudgetSetup) {
      if (!budget || parseFloat(budget) <= 0) {
        alert("Please enter a valid budget amount.");
        return;
      }
      
      setLoading(true);
      try {
        const token = localStorage.getItem("finvest_token");
        // Store their chosen currency BEFORE calculating the parsed rate
        localStorage.setItem("finvest_currency", currency);
        
        const baseBudget = parseCurrency(budget);
        
        await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/budget/set", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
          },
          body: JSON.stringify({ monthly_budget: baseBudget })
        });
        
        router.push("/dashboard");
      } catch (err) {
        console.error("Failed to set budget:", err);
        setLoading(false);
      }
      return;
    }

    setStep(step + 1);
  };

  return (
    <div className="min-h-[100dvh] bg-[#030303] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[var(--color-neon-green)]/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-2xl relative z-10 pt-20 pb-10">
        <div className="flex flex-col h-full">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-center text-center px-4"
            >
              <div className={`w-20 h-20 ${steps[step].bg} rounded-3xl mx-auto flex items-center justify-center mb-8 border border-white/5`}>
                {(() => {
                  const Icon = steps[step].icon;
                  return <Icon className={`w-10 h-10 ${steps[step].color}`} />;
                })()}
              </div>

              <h1 className="font-grotesk text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                {steps[step].title}
              </h1>
              <p className={`font-inter text-white/50 text-base md:text-lg leading-relaxed max-w-md mx-auto ${steps[step].isCurrencySelect || steps[step].isBudgetSetup ? 'mb-8' : 'mb-12'}`}>
                {steps[step].description}
              </p>

              {/* Step 3: Regional Configuration (5 Currencies) */}
              {steps[step].isCurrencySelect && (
                <div className="flex flex-wrap justify-center gap-3 mb-8 w-full max-w-lg mx-auto">
                  {CURRENCIES.map((c) => (
                    <button 
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      className={`flex flex-col items-center justify-center gap-2 w-[100px] h-[100px] rounded-xl border transition-all ${
                        currency === c.code 
                          ? 'bg-[var(--color-neon-green)]/20 border-[var(--color-neon-green)] text-[var(--color-neon-green)] shadow-[0_0_15px_rgba(127,255,0,0.2)] transform scale-105' 
                          : 'bg-black/50 border-white/10 text-white/50 hover:border-white/30 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-3xl font-bold font-grotesk">{c.symbol}</span>
                      <span className="font-mono text-[10px] uppercase tracking-widest">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 4: Budget Setup */}
              {steps[step].isBudgetSetup && (
                <div className="mb-8 w-full max-w-sm mx-auto">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-[var(--color-neon-green)] transition-colors">
                      <span className="text-2xl font-bold font-grotesk">
                        {CURRENCIES.find(c => c.code === currency)?.symbol || "$"}
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={budget}
                      onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ''))} // only numbers and decimals
                      className="w-full bg-black/50 border border-white/20 rounded-xl py-6 pl-12 pr-6 text-white text-3xl font-mono outline-none focus:border-[var(--color-neon-green)] focus:shadow-[0_0_20px_rgba(127,255,0,0.2)] transition-all placeholder:text-white/10 text-center tracking-wider"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="w-full flex flex-col md:flex-row gap-6 md:gap-0 items-center justify-between mt-auto pt-8 border-t border-white/10">
                
                {/* Progress Indicators */}
                <div className="flex gap-2">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : i < step ? 'w-3 bg-white/30' : 'w-3 bg-white/10'}`}
                    />
                  ))}
                </div>

                <button 
                  onClick={nextStep}
                  disabled={loading || (steps[step].isBudgetSetup && !budget)}
                  className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2 group w-full md:w-auto justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Finalizing...</>
                  ) : step === steps.length - 1 ? (
                    <><CheckCircle2 className="w-5 h-5" /> Initialize Dashboard</>
                  ) : (
                    <>Next Step <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
