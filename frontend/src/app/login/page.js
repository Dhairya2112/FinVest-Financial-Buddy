"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function Login() {
  const router = useRouter();
  
  // State: 0 = Request OTP, 1 = Verify OTP
  const [step, setStep] = useState(0);
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "login" }),
      });

      const data = await res.json();
      
      if (res.ok && data.status === "success") {
        setStep(1);
      } else {
        setError(data.message || "Failed to send verification code.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, type: "login" }),
      });

      const data = await res.json();
      
      if (res.ok && data.status === "success") {
        localStorage.setItem("finvest_token", data.token);
        
        if (data.is_new_user) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(data.message || "Invalid verification code.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 relative z-10 pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Terminal Window Wrapper */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl shadow-2xl relative overflow-hidden flex flex-col">
          
          {/* Terminal Header Bar */}
          <div className="bg-[#161616] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-600 hover:bg-red-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-gray-600 hover:bg-yellow-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-gray-600 hover:bg-green-500 transition-colors"></div>
            </div>
            <div className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">
              auth_module_v3.0_passwordless
            </div>
            <div className="w-12"></div>
          </div>

          {/* Card Body */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {step === 0 ? (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="mb-8 border-l-2 border-[var(--color-neon-green)] pl-4">
                    <h1 className="text-2xl font-bold text-white mb-1 font-mono tracking-tight">
                      <span className="text-[var(--color-neon-green)] mr-2">&gt;</span>
                      Secure Access
                    </h1>
                    <p className="text-gray-400 text-sm font-inter">Passwordless terminal entry.</p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={requestOtp} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 ml-1 font-inter">Email Address</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[var(--color-neon-green)] transition-colors">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-black/50 border border-gray-800 rounded-lg py-3 pl-11 pr-4 text-white text-sm font-mono outline-none focus:border-[var(--color-neon-green)] focus:bg-[var(--color-neon-green)]/5 transition-all placeholder:text-gray-600"
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 mt-6 bg-[var(--color-neon-green)] text-black font-bold rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-inter shadow-[0_0_15px_rgba(127,255,0,0.2)]"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Verification Code"} 
                    </button>
                  </form>

                  <div className="mt-8 text-center border-t border-gray-800 pt-6">
                    <p className="text-sm text-gray-500 font-inter">
                      New user? <Link href="/register" className="text-white hover:text-[var(--color-neon-green)] transition-colors hover:underline underline-offset-4">Create an account</Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="mb-8 border-l-2 border-[var(--color-neon-green)] pl-4">
                    <h1 className="text-2xl font-bold text-white mb-1 font-mono tracking-tight flex items-center gap-2">
                      <span className="text-[var(--color-neon-green)]">&gt;</span>
                      Awaiting Verification
                    </h1>
                    <p className="text-gray-400 text-sm font-inter leading-relaxed">
                      We sent a 6-digit cryptographic code to <br/>
                      <span className="text-white font-mono">{email}</span>
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={verifyOtp} className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-mono text-[var(--color-neon-green)] uppercase tracking-widest ml-1 flex items-center justify-between">
                        <span>Enter Sequence</span>
                        <button type="button" onClick={() => setStep(0)} className="text-gray-500 hover:text-white transition-colors">Cancel</button>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-neon-green)]">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <input 
                          type="text" 
                          required
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only digits
                          className="w-full bg-[#050505] border border-[var(--color-neon-green)]/50 rounded-lg py-4 pl-12 pr-4 text-[var(--color-neon-green)] text-2xl font-mono outline-none focus:border-[var(--color-neon-green)] focus:shadow-[0_0_20px_rgba(127,255,0,0.2)] transition-all placeholder:text-[var(--color-neon-green)]/20 tracking-[0.5em] text-center"
                          placeholder="000000"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading || otp.length < 6}
                      className="w-full py-4 mt-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-inter"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Authorize Entry <CheckCircle2 className="w-4 h-4" /></>} 
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
