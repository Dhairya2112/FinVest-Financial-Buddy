"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClassicRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/auth/classic-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      
      if (res.ok && data.status === "success") {
        localStorage.setItem("finvest_token", data.token);
        router.push("/onboarding");
      } else {
        setError(data.message || "Registration failed.");
      }
    } catch (err) {
      setError("Network Error: " + (err.message || "Failed to connect"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
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
        setError(data.message || "Failed to authenticate with server.");
      }
    } catch (err) {
      setError("Network Error: " + (err.message || "Failed to connect"));
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
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl shadow-2xl relative overflow-hidden flex flex-col">
          
          <div className="bg-[#161616] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-600 hover:bg-red-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-gray-600 hover:bg-yellow-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-gray-600 hover:bg-green-500 transition-colors"></div>
            </div>
            <div className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">
              auth_module_v5.0_standard
            </div>
            <div className="w-12"></div>
          </div>

          <div className="p-8">
            <div className="mb-6 border-l-2 border-[var(--color-neon-green)] pl-4">
              <h1 className="text-2xl font-bold text-white mb-1 font-mono tracking-tight">
                <span className="text-[var(--color-neon-green)] mr-2">&gt;</span>
                Secure Onboarding
              </h1>
              <p className="text-gray-400 text-sm font-inter">Create your FinVest account.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <form onSubmit={handleClassicRegister} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Full Name</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#111] border border-gray-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[var(--color-neon-green)] focus:ring-1 focus:ring-[var(--color-neon-green)] transition-all disabled:opacity-50"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Email Address</label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#111] border border-gray-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[var(--color-neon-green)] focus:ring-1 focus:ring-[var(--color-neon-green)] transition-all disabled:opacity-50"
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Password</label>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#111] border border-gray-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[var(--color-neon-green)] focus:ring-1 focus:ring-[var(--color-neon-green)] transition-all disabled:opacity-50"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-neon-green)] text-black font-semibold rounded-lg px-4 py-3 hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] mt-2"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-gray-800 flex-1"></div>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">OR</span>
              <div className="h-px bg-gray-800 flex-1"></div>
            </div>

            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Login Failed.")}
                theme="filled_black"
                size="large"
                shape="rectangular"
                text="signup_with"
              />
            </div>
            
            <div className="text-center border-t border-gray-800 pt-6">
              <Link href="/login" className="text-sm text-gray-400 hover:text-[var(--color-neon-green)] transition-colors">
                Already have an account? <span className="font-semibold text-white">Login</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
