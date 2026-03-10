import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // ← ADD THIS

// LoginGate modal — shown when a guest tries to do a protected action
export const LoginGate = ({ isOpen, onClose, onLogin, onRegister }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.92, y: 20, opacity: 0 }}
          animate={{ scale: 1,    y: 0,  opacity: 1 }}
          exit={{    scale: 0.92, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl z-10"
        >
          {/* Top accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-emerald-500 to-[#0f4c75]" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={15} className="text-gray-500" />
          </button>

          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[#0f4c75]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={30} className="text-[#0f4c75]" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Join Lokarya</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-7">
              Create a free account or log in to participate, earn XP, and make Nagpur better.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onRegister}
                className="w-full bg-[#0f4c75] hover:bg-[#0b3a5b] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg cursor-pointer"
              >
                Create Free Account <ArrowRight size={16} />
              </button>
              <button
                onClick={onLogin}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold py-3.5 rounded-xl transition-all active:scale-95 cursor-pointer border border-gray-200"
              >
                Log In
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// Hook — call requireLogin(callback) anywhere.
// If user is logged in  → run callback immediately, no modal.
// If user is a guest    → show modal, run callback after they log in.
const useLoginGate = () => {
  const { isLoggedIn, loading } = useAuth(); // ← ADD THIS
  const [isOpen,    setIsOpen]    = useState(false);
  const [pendingCb, setPendingCb] = useState(null);

  const openLogin    = () => { setIsOpen(false); window.__openLogin?.();    };
  const openRegister = () => { setIsOpen(false); window.__openRegister?.(); };

  const requireLogin = useCallback((cb) => {
    // ── THE FIX: if already logged in, skip the modal entirely ──
    if (isLoggedIn) {
      cb?.();
      return;
    }

    // Still loading auth state — wait, don't flash the modal
    if (loading) return;

    // Genuine guest — show modal
    if (cb) {
      setPendingCb(() => cb);
    }
    setIsOpen(true);
  }, [isLoggedIn, loading]); // ← depend on auth state

  const handleClose = () => {
    setIsOpen(false);
    setPendingCb(null);
  };

  const gateProps = {
    isOpen,
    onClose:    handleClose,
    onLogin:    openLogin,
    onRegister: openRegister,
  };

  return { requireLogin, gateProps };
};

export default useLoginGate;
