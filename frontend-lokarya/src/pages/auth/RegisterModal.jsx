import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, Eye, EyeOff, User, ArrowRight, Target, QrCode, Zap } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/icon22.png";

// FIX: password rules now match the updated backend validateMiddleware
// min 8, max 128, uppercase, lowercase, number, special character
const PASSWORD_RULES = [
  { label: 'At least 8 characters',   test: (p) => p.length >= 8              },
  { label: 'One uppercase letter',     test: (p) => /[A-Z]/.test(p)           },
  { label: 'One lowercase letter',     test: (p) => /[a-z]/.test(p)           },
  { label: 'One number',               test: (p) => /\d/.test(p)              },
  { label: 'One special character',    test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const { login } = useAuth();

  const [passwordShown,  setPasswordShown]  = useState(false);
  const [showPwRules,    setShowPwRules]    = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [status,   setStatus]   = useState({ loading: false, error: "", success: "" });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // FIX: client-side guard — all 5 rules must pass before hitting the server
    const allPassing = PASSWORD_RULES.every(r => r.test(formData.password));
    if (!allPassing) {
      setStatus({ loading: false, success: "", error: "Password doesn't meet all requirements." });
      setShowPwRules(true);
      return;
    }

    setStatus({ loading: true, error: "", success: "" });
    try {
      const { data } = await api.post("/auth/register", formData);
      login(data);
      setStatus({ loading: false, error: "", success: "Account created! Welcome to Lokarya 🎉" });
      setTimeout(() => onClose(), 800);
    } catch (err) {
      // FIX: show field-level errors from express-validator if present
      const res = err.response?.data;
      const msg = res?.errors?.[0]?.message   // express-validator format
               || res?.message                 // general error
               || "Registration failed. Please try again.";
      setStatus({ loading: false, success: "", error: msg });
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `${import.meta.env.VITE_API_URL.replace('/api', '')}/api/auth/google`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
          onClick={onClose}
        >
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=DM+Sans:wght@400;600;700;800;900&display=swap');`}</style>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            onClick={e => e.stopPropagation()}
            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          >
            <button onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20 cursor-pointer">
              <X size={18} />
            </button>

            {/* Dark header */}
            <div style={{ background: 'linear-gradient(135deg,#0a1f35 0%,#0f2c4a 60%,#0c2644 100%)', padding: '28px 32px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(244,124,32,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(20,184,166,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />

              <div className="flex items-center gap-4 relative z-10">
                <img src={logo} alt="Lokarya" className="h-12 w-auto object-contain brightness-0 invert opacity-90" />
                <div>
                  <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 22, color: '#fff', lineHeight: 1.1, margin: 0 }}>
                    Join Lokarya
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, margin: '3px 0 0' }}>
                    Start as Civic Scout — climb to Lokarya Legend
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 relative z-10 flex-wrap">
                {[
                  { Icon: Target, label: 'Join Missions' },
                  { Icon: QrCode, label: 'Scan QR'       },
                  { Icon: Zap,    label: 'Earn XP'       },
                ].map(({ Icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(244,124,32,0.12)', border: '1px solid rgba(244,124,32,0.2)', borderRadius: 999, padding: '4px 10px' }}>
                    <Icon size={10} style={{ color: '#F47C20' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form body */}
            <div className="p-8">
              <AnimatePresence>
                {status.error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-100">
                    {status.error}
                  </motion.div>
                )}
                {status.success && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-bold text-center border border-green-100">
                    {status.success}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0f2c4a] transition-colors" size={17} />
                    <input name="name" type="text" required placeholder="Rahul Deshmukh"
                      value={formData.name} onChange={handleChange}
                      maxLength={50}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0f2c4a]/20 focus:border-[#0f2c4a] outline-none transition-all font-semibold text-gray-700 placeholder-gray-300 text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0f2c4a] transition-colors" size={17} />
                    <input name="email" type="email" required placeholder="name@example.com"
                      value={formData.email} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0f2c4a]/20 focus:border-[#0f2c4a] outline-none transition-all font-semibold text-gray-700 placeholder-gray-300 text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0f2c4a] transition-colors" size={17} />
                    <input name="password"
                      type={passwordShown ? "text" : "password"} required
                      placeholder="Min 8 chars, uppercase, number, symbol"
                      value={formData.password} onChange={handleChange}
                      onFocus={() => setShowPwRules(true)}
                      maxLength={128}
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0f2c4a]/20 focus:border-[#0f2c4a] outline-none transition-all font-semibold text-gray-700 placeholder-gray-300 text-sm"
                    />
                    <button type="button" onClick={() => setPasswordShown(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0f2c4a] transition-colors cursor-pointer p-1">
                      {passwordShown ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  {/* FIX: live password rule checklist — appears on focus */}
                  <AnimatePresence>
                    {showPwRules && formData.password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1"
                      >
                        {PASSWORD_RULES.map(rule => {
                          const passing = rule.test(formData.password);
                          return (
                            <div key={rule.label} className="flex items-center gap-2">
                              <span style={{ color: passing ? '#16a34a' : '#9ca3af', fontSize: 13 }}>
                                {passing ? '✓' : '○'}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: passing ? '#16a34a' : '#9ca3af' }}>
                                {rule.label}
                              </span>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* XP start hint */}
                <div style={{ background: '#fffbf5', border: '1.5px solid #fde8c8', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#F47C20,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap size={14} fill="#fff" color="#fff" />
                  </div>
                  <p style={{ fontSize: 11, color: '#92400e', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
                    You'll start as <strong>Civic Scout</strong> and earn XP by joining missions, scanning QR codes, and reporting issues.
                  </p>
                </div>

                {/* Submit */}
                <button type="submit" disabled={status.loading}
                  className="w-full text-white py-3.5 rounded-xl font-black text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-1"
                  style={{ background: status.loading ? '#94a3b8' : 'linear-gradient(135deg,#F47C20,#f59e0b)', boxShadow: '0 4px 18px rgba(244,124,32,0.35)' }}>
                  {status.loading
                    ? "Creating account…"
                    : <><span>Create Free Account</span><ArrowRight size={16} /></>
                  }
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-3 bg-white text-gray-300 font-black tracking-wider">Or continue with</span>
                </div>
              </div>

              <button type="button" onClick={handleGoogleRegister}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer text-sm shadow-sm">
                <img src="https://www.material-tailwind.com/logos/logo-google.png" alt="google" className="h-5 w-5" />
                Continue with Google
              </button>

              <p className="mt-5 text-center text-sm text-gray-500 font-semibold">
                Already a member?{" "}
                <button onClick={onSwitchToLogin}
                  className="font-black text-[#F47C20] hover:text-[#d86916] transition-colors cursor-pointer">
                  Sign In
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
