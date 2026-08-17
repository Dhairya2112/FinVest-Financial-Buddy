"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, Target, Camera, LayoutDashboard, ShieldCheck, Command, Lock, CheckCircle2, Activity, Terminal } from "lucide-react";

// --- HIGH PERFORMANCE INTERACTIVE BACKGROUND ---
// Completely bypasses React state and heavy Framer Motion loops for absolute 60fps smoothness.
// Uses native DOM CSS variable injection.
function GlowBackground() {
  const bgRef = useRef(null);

  useEffect(() => {
    // Set initial position to center
    if (bgRef.current) {
      bgRef.current.style.setProperty("--x", `${window.innerWidth / 2}px`);
      bgRef.current.style.setProperty("--y", `${window.innerHeight / 2}px`);
    }

    const handleMouseMove = (e) => {
      if (!bgRef.current) return;
      // Direct DOM manipulation - zero React overhead
      bgRef.current.style.setProperty("--x", `${e.clientX}px`);
      bgRef.current.style.setProperty("--y", `${e.clientY}px`);
    };
    
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={bgRef}
      className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000"
      style={{
        background: `radial-gradient(circle 800px at var(--x, 50vw) var(--y, 50vh), rgba(127,255,0,0.07), transparent 80%)`,
        backgroundColor: "#030303"
      }}
    >
      {/* Crisp Tactical Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_20%,transparent_100%)]" />
    </div>
  );
}

// --- SCROLL ANIMATED FEATURE BLOCK ---
// A reusable layout block that animates wildly on enter from both up and down scrolling.
function FeatureBlock({ title, description, badge, reverse = false, children }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 100, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-24 py-16 md:py-24 border-b border-white/5 last:border-0`}
    >
      {/* Text Content */}
      <div className="w-full lg:w-1/2 flex flex-col items-start">
        <span className="font-mono text-[10px] text-[var(--color-neon-green)] bg-[var(--color-neon-green)]/10 uppercase tracking-widest border border-[var(--color-neon-green)]/20 px-3 py-1 rounded-full mb-6">
          {badge}
        </span>
        <h2 className="font-grotesk text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
          {title}
        </h2>
        <p className="font-inter text-lg text-white/50 font-light leading-relaxed">
          {description}
        </p>
      </div>

      {/* Visual Sandbox */}
      <div className="w-full lg:w-1/2">
        {children}
      </div>
    </motion.div>
  );
}

// --- 3D INTERACTIVE HERO COMPONENT ---
// A hyper-premium, Apple/Stripe-style floating glass and metallic card array
function Interactive3DNode() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const smoothX = useSpring(mouseX, { damping: 20, stiffness: 40 });
  const smoothY = useSpring(mouseY, { damping: 20, stiffness: 40 });

  // Subtle premium tilt
  const rotateX = useTransform(smoothY, [0, 1], [15, -15]);
  const rotateY = useTransform(smoothX, [0, 1], [-15, 15]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <div 
      className="w-full h-full min-h-[400px] lg:min-h-[500px] flex items-center justify-center relative cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1500 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-72 h-72 flex items-center justify-center animate-[float_8s_ease-in-out_infinite] scale-[0.65] sm:scale-100"
      >
        {/* Ambient Premium Glow (Soft Blue/Purple) */}
        <div className="absolute w-[120%] h-[120%] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-transparent blur-[80px] rounded-full" style={{ transform: "translateZ(-150px)" }} />
        
        {/* Floating Ring - Abstract element */}
        <svg className="absolute w-96 h-96 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 animate-[spin_30s_linear_infinite]" viewBox="0 0 100 100" style={{ transform: "translateZ(-30px)", transformStyle: "preserve-3d" }}>
           <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="0.2" strokeDasharray="1 3" />
           <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="0.1" />
        </svg>

        {/* Back Layer: Blurred Frosted Glass */}
        <div 
          className="absolute w-64 h-40 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
          style={{ transform: "translateZ(-50px) rotateZ(-10deg) rotateX(10deg)" }}
        />

        {/* Middle Layer: The Main Premium 'Card' */}
        <div 
          className="absolute w-72 h-44 bg-gradient-to-br from-[#1a1a1c] to-[#050505] border border-white/10 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col justify-between p-6"
          style={{ transform: "translateZ(30px) rotateZ(5deg)" }}
        >
          {/* Subtle light sweep across the card */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_8s_infinite]" />
          
          <div className="flex justify-between items-center relative z-10">
            {/* Minimalist Chip */}
            <div className="w-10 h-8 rounded-md border border-white/20 bg-gradient-to-br from-white/10 to-transparent flex flex-col justify-evenly px-1">
              <div className="w-full h-[1px] bg-white/20" />
              <div className="w-full h-[1px] bg-white/20" />
            </div>
            <div className="font-mono text-[10px] text-white/30 tracking-widest uppercase">FinVest Black</div>
          </div>
          
          <div className="relative z-10 mt-8">
            <div className="font-mono text-lg tracking-[0.2em] text-white/80 shadow-black drop-shadow-md">**** **** **** 4092</div>
            <div className="font-inter text-[10px] text-white/40 uppercase mt-1">Authorized User</div>
          </div>
        </div>

        {/* Front Layer: Floating Data Widget */}
        <div 
          className="absolute right-[-30px] bottom-[-20px] w-52 h-24 bg-white/[0.05] backdrop-blur-lg border border-white/10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] p-4 flex flex-col justify-between"
          style={{ transform: "translateZ(100px)" }}
        >
          <div className="flex justify-between items-center">
            <span className="font-inter text-xs text-white/60">Portfolio Yield</span>
            <span className="font-mono text-[10px] text-black font-bold bg-white px-2 py-0.5 rounded-full">+14.2%</span>
          </div>
          <div className="flex items-end gap-1 w-full h-10 mt-2">
            {[4, 7, 3, 8, 6, 9, 12, 8, 14, 11, 16].map((h, i) => (
               <div key={i} className="flex-1 bg-gradient-to-t from-white/10 to-white/70 rounded-sm" style={{ height: `${h * 6}%` }} />
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-[#030303] selection:bg-[var(--color-neon-green)] selection:text-black min-h-screen font-inter text-white overflow-x-hidden">
      
      <GlowBackground />

      {/* 1. HERO SECTION (50/50 Split with 3D Component) */}
      {/* Changed alignment to center on mobile, left on desktop. Reduced extreme padding to ensure buttons fit in laptop viewports. */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start pt-32 pb-16 lg:pb-24 px-6 lg:px-12 w-full max-w-[1600px] mx-auto justify-between gap-8 lg:gap-20">
        
        {/* Left: Typography & CTA */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left pt-10"
        >
          {/* Subtle Tag */}
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-neon-green)]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
              v2.0 Early Access
            </span>
          </div>
          
          <h1 className="font-grotesk text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold tracking-tighter mb-6 leading-[1.05] text-white max-w-2xl drop-shadow-lg">
            Intelligent <br className="hidden md:block" />
            financial control.
          </h1>
          
          <p className="font-inter text-lg md:text-xl text-white/50 max-w-xl mb-12 leading-relaxed font-light">
            A production-grade financial terminal. Experience real-time AI receipt scanning, military-grade client-side encryption, and a global transaction hook for zero-friction logging.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pb-4">
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-4 bg-[var(--color-neon-green)] text-black font-bold rounded-md transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-lg shadow-[0_0_20px_rgba(127,255,0,0.15)]">
                Deploy Workspace
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-4 bg-[#111113] text-white font-medium rounded-md border border-white/10 transition-all hover:bg-white/10 active:scale-95 text-lg flex items-center justify-center">
                Access Terminal
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Right: 3D Interactive Node */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full lg:w-1/2 flex items-center justify-center"
        >
          <Interactive3DNode />
        </motion.div>
      </main>

      {/* 2. THREE COMPONENT SHOWCASE WITH SCROLL PHYSICS */}
      <section className="relative z-20 pb-32 px-6 lg:px-12 bg-black/20 backdrop-blur-md">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col">
          
          {/* COMPONENT 1: AI Vision Splitter */}
          <FeatureBlock 
            title="Optical Character Recognition."
            description="Our native vision engine scans any receipt and mathematically reconstructs line-items with 98% accuracy. It automatically segments group sub-totals and redistributes proportional tax and tips, eliminating social friction instantly."
            badge="Module // AI_Vision"
          >
            <div className="w-full aspect-square md:aspect-video rounded-3xl bg-gradient-to-br from-[#111113] to-[#050505] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex items-center justify-center p-8 group">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:32px_32px]" />
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative z-10 w-full max-w-sm bg-black border border-white/20 rounded-2xl p-6 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                   <span className="font-mono text-xs text-white/50 flex items-center gap-2">
                     <Camera className="w-4 h-4 text-white" /> Receipt.jpg
                   </span>
                   <span className="font-mono text-[9px] text-[var(--color-neon-green)] bg-[var(--color-neon-green)]/10 px-2 py-1 rounded-full animate-pulse border border-[var(--color-neon-green)]/30">
                     PROCESSING
                   </span>
                </div>
                <div className="space-y-3 font-mono text-sm text-white/80">
                  <div className="flex justify-between"><span>"Wagyu Burger"</span><span>$85.00</span></div>
                  <div className="flex justify-between"><span>"Cabernet"</span><span>$45.00</span></div>
                  <div className="w-full h-[1px] bg-white/10 my-4" />
                  <div className="flex justify-between text-[var(--color-neon-orange)] font-bold"><span>Tax + Tip</span><span>$28.60</span></div>
                </div>
                
                {/* Scanning Laser */}
                <div className="absolute top-[30%] left-0 w-full h-[2px] bg-[var(--color-neon-green)] shadow-[0_0_15px_rgba(127,255,0,0.8)] animate-[ping_3s_linear_infinite]" />
              </motion.div>
            </div>
          </FeatureBlock>

          {/* COMPONENT 2: AES-256 Vault (Reverse Layout) */}
          <FeatureBlock 
            title="Military-Grade Cipher."
            description="Your wealth data never touches our database in plaintext. Using Fernet symmetric encryption, all transaction payloads are scrambled client-side. We only store mathematical noise, guaranteeing zero-knowledge privacy."
            badge="Sys // Security"
            reverse={true}
          >
            <div className="w-full aspect-square md:aspect-video rounded-3xl bg-gradient-to-br from-[#111113] to-[#050505] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
              
              <div className="relative z-10 w-56 h-56 rounded-full border border-white/5 bg-black/50 backdrop-blur-xl flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] group">
                <div className="w-40 h-40 rounded-full border-2 border-white/20 flex items-center justify-center bg-black/80 shadow-2xl relative transition-transform duration-700 group-hover:scale-110">
                  <Lock className="w-12 h-12 text-white/90" />
                  <div className="absolute -bottom-4 bg-[#111] border border-white/20 px-3 py-1 rounded-full">
                    <span className="font-mono text-[9px] text-[var(--color-neon-green)] uppercase tracking-widest">AES-256 Valid</span>
                  </div>
                </div>
                
                {/* Rotating combination dial */}
                <svg className="absolute inset-0 w-full h-full animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.4" />
                </svg>
              </div>
            </div>
          </FeatureBlock>

          {/* COMPONENT 3: Real-Time Analytics */}
          <FeatureBlock 
            title="Surgical Telemetry."
            description="The dashboard operates as a highly responsive data engine. It visualizes your 30-day burn rate, plots absolute cashflow against your custom ledgers, and enables you to command isolated trips without corrupting global net-worth metrics."
            badge="Module // Analytics_Engine"
          >
            <div className="w-full aspect-square md:aspect-video rounded-3xl bg-gradient-to-br from-[#111113] to-[#050505] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col justify-end p-8 md:p-12">
              <div className="absolute top-8 left-8 md:top-12 md:left-12">
                <p className="font-mono text-xs text-white/50 uppercase tracking-widest mb-2">Portfolio Value</p>
                <p className="font-grotesk text-4xl md:text-5xl font-bold text-white">$142,504.00</p>
                <p className="font-mono text-xs text-[var(--color-neon-green)] uppercase tracking-widest mt-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Live Connection
                </p>
              </div>
              
              {/* Massive Graph Mockup */}
              <div className="w-full h-1/2 relative mt-20 border-b border-l border-white/20 pb-2 pl-2">
                <svg className="w-full h-full drop-shadow-[0_10px_20px_rgba(127,255,0,0.2)]" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0,100 L0,80 Q20,60 40,70 T70,30 L100,10 L100,100 Z" fill="var(--color-neon-green)" opacity="0.15" />
                  <path d="M0,80 Q20,60 40,70 T70,30 L100,10" fill="none" stroke="var(--color-neon-green)" strokeWidth="2.5" />
                </svg>
                {/* Glowing End Node */}
                <div className="absolute right-0 top-[10%] -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,1)] flex items-center justify-center">
                   <div className="w-2 h-2 bg-[var(--color-neon-green)] rounded-full animate-ping" />
                </div>
              </div>
            </div>
          </FeatureBlock>

        </div>
      </section>

      {/* 3. CTA SECTION */}
      <section className="relative z-20 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center px-4 pt-16 border-t border-white/10"
        >
          <h2 className="font-grotesk text-4xl md:text-5xl font-bold text-white mb-6 tracking-tighter">Ready to deploy?</h2>
          <p className="font-inter text-white/40 text-lg mx-auto mb-10 max-w-md font-light">Initialize your secure financial runtime today.</p>
          <Link href="/register">
            <button className="px-10 py-4 bg-[var(--color-neon-green)] text-black font-bold rounded-md transition-transform hover:scale-105 active:scale-95 text-lg shadow-[0_0_30px_rgba(127,255,0,0.2)] mx-auto flex items-center justify-center gap-2">
              <Command className="w-5 h-5" /> Initialize Account
            </button>
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
