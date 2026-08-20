"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Loader2 } from "lucide-react";

export default function ServerWakeupIndicator() {
  const [isWaking, setIsWaking] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timeoutId;
    const pingServer = async () => {
      // If no response in 1.5s, assume server is sleeping and show indicator
      timeoutId = setTimeout(() => {
        setIsWaking(true);
      }, 1500); 

      try {
        await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/health", {
          method: 'GET',
          cache: 'no-store'
        }).catch(() => {
          // Fallback if health endpoint doesn't exist, we still woke it up
        });
        
        clearTimeout(timeoutId);
        
        // If we showed the waking indicator, show the ready success message
        setIsWaking(waking => {
          if (waking) {
            setIsReady(true);
            setTimeout(() => setIsReady(false), 3000); 
          }
          return false;
        });
        
      } catch (err) {
        clearTimeout(timeoutId);
        setIsWaking(false);
      }
    };
    pingServer();
  }, []);

  return (
    <AnimatePresence>
      {isWaking && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          className="fixed top-6 left-0 right-0 z-[200] flex justify-center p-4 pointer-events-none"
        >
          <div className="bg-black/90 backdrop-blur-xl border border-[var(--color-neon-orange)]/50 rounded-2xl p-4 flex items-center gap-4 shadow-[0_0_30px_rgba(255,100,0,0.2)]">
            <Loader2 className="w-6 h-6 text-[var(--color-neon-orange)] animate-spin" />
            <div>
              <h4 className="font-grotesk font-bold text-white text-sm">Waking up secure backend...</h4>
              <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest">Cold start may take 30-50s</p>
            </div>
          </div>
        </motion.div>
      )}
      {isReady && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          className="fixed top-6 left-0 right-0 z-[200] flex justify-center p-4 pointer-events-none"
        >
          <div className="bg-black/90 backdrop-blur-xl border border-[var(--color-neon-green)]/50 rounded-2xl p-4 flex items-center gap-4 shadow-[0_0_30px_rgba(0,255,100,0.2)]">
            <Server className="w-6 h-6 text-[var(--color-neon-green)]" />
            <div>
              <h4 className="font-grotesk font-bold text-white text-sm">Backend is active</h4>
              <p className="font-mono text-[10px] text-[var(--color-neon-green)] uppercase tracking-widest">Ready to operate</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
