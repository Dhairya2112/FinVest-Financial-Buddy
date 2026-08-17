"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, ArrowRight, Receipt, Loader2, CheckCircle2, DollarSign, UserPlus, X, Percent, Plus, Minus, Scan } from "lucide-react";
import { getCurrencySymbol } from "@/utils/currency";

export default function Splitter() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Camera States
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Data States
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);

  // Operator & Fraction States
  const [operators, setOperators] = useState(["Me"]);
  const [newOperator, setNewOperator] = useState("");
  // itemShares: { itemIndex: { operatorName: fraction (0 to 1) } }
  const [itemShares, setItemShares] = useState({});

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Camera access denied or unavailable.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], "scanned-receipt.jpg", { type: "image/jpeg" });
          setFile(newFile);
          stopCamera();
        }
      }, "image/jpeg", 0.9);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setReceiptData(null);
    
    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const token = localStorage.getItem("finvest_token");
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/splitter/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const json = await res.json();
      if (res.ok && json.status === "success") {
        setReceiptData(json.data);
        
        // Initialize shares (Default everything to 'Me' if total_price is claimed)
        const initialShares = {};
        json.data.items?.forEach((item, idx) => {
          const qty = item.qty || 1;
          initialShares[idx] = { "Me": qty };
        });
        setItemShares(initialShares);
      } else {
        setError(json.message || "Failed to process receipt.");
      }
    } catch (err) {
      setError("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const addOperator = (e) => {
    e.preventDefault();
    const op = newOperator.trim();
    if (op && !operators.includes(op)) {
      setOperators([...operators, op]);
      setNewOperator("");
    }
  };

  const removeOperator = (op) => {
    if (op === "Me") return;
    setOperators(operators.filter(o => o !== op));
    
    // Clean up shares
    const newShares = { ...itemShares };
    Object.keys(newShares).forEach(idx => {
      if (newShares[idx][op] !== undefined) {
        delete newShares[idx][op];
      }
    });
    setItemShares(newShares);
  };

  const setShare = (itemIdx, op, val) => {
    const newShares = { ...itemShares };
    if (!newShares[itemIdx]) newShares[itemIdx] = {};
    if (val <= 0) {
      delete newShares[itemIdx][op];
    } else {
      newShares[itemIdx][op] = val;
    }
    setItemShares(newShares);
  };

  // Math Engine
  const breakdown = useMemo(() => {
    if (!receiptData) return null;

    const totals = {};
    operators.forEach(op => totals[op] = { subtotal: 0, tax: 0, tip: 0, total: 0, items: [] });

    let globalSubtotal = 0;

    receiptData.items?.forEach((item, idx) => {
      // Handle legacy 'price' or new 'total_price'
      const totalPrice = parseFloat(item.total_price) || parseFloat(item.price) || 0;
      const qty = parseFloat(item.qty) || 1;
      const unitPrice = totalPrice / qty;
      globalSubtotal += totalPrice;
      
      const shares = itemShares[idx] || {};
      
      // Calculate total quantity claimed for this item
      let totalClaimed = 0;
      Object.values(shares).forEach(val => totalClaimed += val);
      
      if (totalClaimed === 0) {
        // Equal split
        const splitAmount = totalPrice / operators.length;
        operators.forEach(op => {
          totals[op].subtotal += splitAmount;
          totals[op].items.push(`${item.item} (Equal Split)`);
        });
      } else {
        // Distribute claimed exactly
        Object.entries(shares).forEach(([op, claimedQty]) => {
          if (claimedQty > 0) {
            const cost = claimedQty * unitPrice;
            totals[op].subtotal += cost;
            totals[op].items.push(`${claimedQty}x ${item.item}`);
          }
        });

        // Any leftover quantity split equally?
        if (totalClaimed < qty) {
           const leftoverQty = qty - totalClaimed;
           const leftoverCost = leftoverQty * unitPrice;
           const splitAmount = leftoverCost / operators.length;
           operators.forEach(op => {
             totals[op].subtotal += splitAmount;
           });
        }
      }
    });

    const tax = parseFloat(receiptData.tax) || 0;
    const tip = parseFloat(receiptData.tip) || 0;

    operators.forEach(op => {
      // Split tax and tip equally regardless of subtotal
      const equalTax = tax / operators.length;
      const equalTip = tip / operators.length;
      
      totals[op].tax = equalTax;
      totals[op].tip = equalTip;
      totals[op].total = totals[op].subtotal + equalTax + equalTip;
    });

    return { totals, globalSubtotal, globalTotal: globalSubtotal + tax + tip };
  }, [receiptData, operators, itemShares]);

  const resetAll = () => {
    setFile(null);
    setReceiptData(null);
    setError(null);
    setItemShares({});
    setShowCamera(false);
  };

  const formatFraction = (val) => {
    if (!val) return "0%";
    if (val === 0.25) return "25%";
    if (val === 0.5) return "50%";
    if (val === 0.75) return "75%";
    if (val === 1.0) return "100%";
    return `${(val * 100).toFixed(0)}%`;
  };

  return (
    <main className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="font-grotesk text-4xl md:text-5xl font-bold text-white tracking-tight mb-2 flex items-center gap-4">
              AI Bill Splitter <span className="px-3 py-1 bg-[var(--color-neon-orange)]/10 text-[var(--color-neon-orange)] text-sm font-mono rounded-full border border-[var(--color-neon-orange)]/30">Fractional Math</span>
            </h1>
            <p className="font-inter text-white/50">Upload a receipt, add friends, and tap to allocate percentages.</p>
          </div>
          {receiptData && (
            <button 
              onClick={resetAll}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors font-mono uppercase tracking-widest text-xs"
            >
              Reset Scanner
            </button>
          )}
        </header>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium mb-6">
            {error}
          </motion.div>
        )}

        {!receiptData ? (
          showCamera ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0a0a0a] border border-[var(--color-neon-orange)]/50 rounded-3xl p-6 flex flex-col items-center max-w-2xl mx-auto overflow-hidden relative shadow-[0_0_50px_rgba(255,100,0,0.15)]"
            >
              <div className="absolute top-4 right-4 z-10">
                <button onClick={stopCamera} className="p-2 bg-black/50 text-white/50 hover:text-white rounded-full transition-colors border border-white/10 backdrop-blur-md">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="font-grotesk text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Scan className="w-5 h-5 text-[var(--color-neon-orange)]" /> Live Receipt Scanner
              </h3>
              
              <div className="relative w-full aspect-[3/4] sm:aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 mb-6 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                
                {/* Tactical Overlay */}
                <div className="absolute inset-0 pointer-events-none border-2 border-[var(--color-neon-orange)]/20 m-4 rounded-xl flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--color-neon-orange)]" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--color-neon-orange)]" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--color-neon-orange)]" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--color-neon-orange)]" />
                  <div className="w-full h-[1px] bg-[var(--color-neon-orange)]/30 shadow-[0_0_10px_rgba(255,100,0,0.8)] animate-pulse" />
                </div>
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              <button 
                onClick={captureFrame} 
                className="w-full sm:w-auto px-12 py-4 bg-[var(--color-neon-orange)] text-black font-bold rounded-full hover:bg-white transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Camera className="w-6 h-6" /> Capture Target
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group max-w-2xl mx-auto"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-white/60 group-hover:text-[var(--color-neon-orange)] transition-colors" />
              </div>
              
              <h3 className="font-grotesk text-2xl font-bold text-white mb-2">Initialize Scanner</h3>
              <p className="font-inter text-white/50 mb-8 max-w-sm">
                Drag and drop your receipt image here, or click to browse.
              </p>
  
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={startCamera} className="px-8 py-4 bg-[var(--color-neon-orange)] text-black font-bold rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2">
                  <Scan className="w-5 h-5" /> Launch Scanner
                </button>
  
                <input type="file" id="receipt-upload" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
                <label htmlFor="receipt-upload" className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 border border-white/20 transition-colors cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" /> Upload Image
                </label>
              </div>
  
              {file && (
                <div className="mt-8 w-full max-w-sm">
                  <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl border border-white/20 mb-4">
                    <Receipt className="w-5 h-5 text-[var(--color-neon-orange)]" />
                    <span className="text-sm text-white font-mono truncate">{file.name}</span>
                  </div>
                  <button onClick={handleUpload} disabled={loading} className="w-full py-3 bg-[var(--color-neon-orange)] text-black font-bold rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Extracting Data...</> : <><ArrowRight className="w-5 h-5" /> Execute Vision AI</>}
                  </button>
                </div>
              )}
            </motion.div>
          )
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Column: Line Items & Allocation */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8">
                
                {/* Operators Management */}
                <div className="mb-8 p-6 bg-black/50 border border-white/5 rounded-2xl">
                  <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Who is splitting?
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <AnimatePresence>
                      {operators.map(op => (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} key={op} className="flex items-center gap-2 bg-[var(--color-neon-orange)]/10 text-[var(--color-neon-orange)] px-4 py-2 rounded-xl border border-[var(--color-neon-orange)]/20">
                          <span className="font-bold">{op}</span>
                          {op !== "Me" && (
                            <button onClick={() => removeOperator(op)} className="hover:text-white transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <form onSubmit={addOperator} className="flex gap-2 max-w-sm">
                    <input type="text" value={newOperator} onChange={(e) => setNewOperator(e.target.value)} placeholder="Add a friend..." className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-neon-orange)]" />
                    <button type="submit" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">Add</button>
                  </form>
                </div>

                {/* Items Allocation Table */}
                <h3 className="font-grotesk text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-[var(--color-neon-orange)]" /> Fractional Assignment
                </h3>
                <p className="text-white/50 text-sm mb-6">Select how many of each item each person had. Leftover unassigned quantity is automatically split equally.</p>
                
                <div className="space-y-4">
                  {receiptData.items?.map((item, idx) => {
                    const qty = parseFloat(item.qty) || 1;
                    const totalPrice = parseFloat(item.total_price) || parseFloat(item.price) || 0;
                    
                    // Generate dropdown options based on quantity
                    const options = [];
                    for (let i = 0; i <= qty; i += 0.25) {
                      options.push(i);
                    }

                    return (
                    <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                        <span className="text-white font-bold text-lg">{qty}x {item.item}</span>
                        <span className="text-[var(--color-neon-orange)] font-mono font-bold text-xl">{getCurrencySymbol()}{totalPrice.toFixed(2)}</span>
                      </div>
                      
                      {/* Interactive Operator Allocation Row */}
                      <div className="flex flex-wrap gap-4">
                        {operators.map(op => {
                          const currentShare = (itemShares[idx] && itemShares[idx][op]) || 0;
                          return (
                            <div key={op} className="flex flex-col gap-1">
                              <label className="text-[10px] font-mono text-white/40 uppercase truncate px-1 text-center">{op}</label>
                              <div className={`flex items-center justify-between w-28 bg-black/60 border rounded-lg p-1 transition-colors ${
                                  currentShare > 0 
                                    ? 'border-[var(--color-neon-orange)] text-[var(--color-neon-orange)]' 
                                    : 'border-white/10 text-white/50 hover:border-white/30'
                                }`}
                              >
                                <button 
                                  onClick={() => setShare(idx, op, Math.max(0, currentShare - 0.25))}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-md transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-mono text-sm font-bold w-8 text-center">{currentShare}</span>
                                <button 
                                  onClick={() => setShare(idx, op, Math.min(qty, currentShare + 0.25))}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-md transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )})}
                </div>

              </div>
            </div>

            {/* Right Column: Real-time Readout */}
            <div className="space-y-6">
              <div className="bg-[#0a0a0a] border border-[var(--color-neon-orange)]/30 rounded-3xl p-6 relative overflow-hidden sticky top-28">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-neon-orange)] opacity-5 blur-[80px]" />
                
                <h3 className="font-grotesk text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[var(--color-neon-orange)]" /> Live Tactical Readout
                </h3>

                <div className="space-y-6">
                  {breakdown && operators.map(op => {
                    const data = breakdown.totals[op];
                    return (
                      <div key={op} className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/5">
                          <span className="text-white font-bold">{op}</span>
                          <span className="text-[var(--color-neon-orange)] font-mono font-bold text-xl">
                            {getCurrencySymbol()}{data.total.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="space-y-1 mb-3">
                          {data.items.length === 0 ? (
                            <p className="text-xs font-mono text-white/30 italic">No items assigned</p>
                          ) : (
                            data.items.map((desc, i) => (
                              <p key={i} className="text-xs font-mono text-white/60 truncate">• {desc}</p>
                            ))
                          )}
                        </div>

                        <div className="flex gap-4 text-[10px] font-mono text-white/40 pt-3 border-t border-white/5 uppercase tracking-widest">
                          <span>Tax (Eq): {getCurrencySymbol()}{data.tax.toFixed(2)}</span>
                          <span>Tip (Eq): {getCurrencySymbol()}{data.tip.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--color-neon-orange)]/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/50 text-sm">Receipt Subtotal</span>
                    <span className="text-white font-mono text-sm">{getCurrencySymbol()}{breakdown?.globalSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white/50 text-sm">Tax & Tip</span>
                    <span className="text-white font-mono text-sm">{getCurrencySymbol()}{((parseFloat(receiptData.tax)||0) + (parseFloat(receiptData.tip)||0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Grand Total</span>
                    <span className="text-white font-mono font-bold text-2xl">{getCurrencySymbol()}{breakdown?.globalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
