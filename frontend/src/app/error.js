"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("FinVest Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center p-6 font-inter relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 max-w-md w-full bg-[#111113] border border-white/10 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="font-grotesk text-2xl font-bold mb-3 tracking-tight">System Exception</h2>
        
        <p className="text-white/50 text-sm mb-8">
          The FinVest terminal encountered an unexpected runtime error. Your session data remains encrypted and secure.
        </p>
        
        <div className="w-full p-4 bg-black border border-white/5 rounded-lg mb-8 text-left overflow-hidden">
          <p className="font-mono text-xs text-red-400 truncate">
            {error.message || "Unknown Exception"}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="w-full py-3 px-4 bg-white text-black font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all"
        >
          <RefreshCcw className="w-4 h-4" /> Reboot Terminal
        </button>
      </div>
    </div>
  );
}
