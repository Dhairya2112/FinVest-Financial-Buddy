"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-red-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 text-red-500">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="font-grotesk text-xl font-bold text-white">{title || "Confirm Deletion"}</h3>
              </div>
              <button onClick={onClose} className="p-1 text-white/40 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="font-inter text-white/60 mb-8">{message || "Are you sure you want to delete this item? This action cannot be undone."}</p>
            
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all font-bold"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
