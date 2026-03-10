import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Zap, Shield, Star } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/icon22.png";

const ROLE_REDIRECT = {
  ngo_admin:       '/dashboard/ngo',
  local_authority: '/dashboard/authority',
  super_admin:     '/dashboard/admin',
  citizen:         '/',
};

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [passwordShown, setPasswordShown] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [status,   setStatus]   = useState({ loading: false, error: "", success: "" });

  // FIX: show "account suspended" message if redirected from axios interceptor
  // e.g. user was banned mid-session and their next request returned 403
  const urlParams = new URLSearchParams(window.location.search);
  const bannedRedirect = urlParams.get('reason') === 'banned';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });
    try {
      const { data } = await api.post("/auth/login", formData);
      login(data);
      setStatus({ loading: false, error: "", success: "Welcome back! 🎉" });
      const destination = ROLE_REDIRECT[data.role] ?? '/';
      setTimeout(() => {
        onClose();
        navigate(destination, { replace: true });
      }, 400);
    } catch (err) {
      // FIX: surface the banned/suspended message clearly from the backend
      // Backend now returns 403 + "Your account has been suspended. Contact support."
      const msg = err.response?.data?.message || "Invalid email or password.";
      setStatus({ loading: false, success: "", error: msg });
    }
  };

  const handleGoogleLogin = () => {
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

              <div className="flex items-center gap-4 relative z-10">
                <img src={logo} alt="Lokarya" className="h-12 w-auto object-contain brightness-0 invert opacity-90" />
                <div>
                  <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 22, color: '#fff', lineHeight: 1.1, margin: 0 }}>
                    Welcome Back
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, margin: '3px 0 0' }}>
                    Sign in to continue to Lokarya
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 relative z-10 flex-wrap">
                {[
                  { Icon: Shield, label: 'Civic Scout',    color: '#94a3b8' },
                  { Icon: Star,   label: 'City Champion',  color: '#8b5cf6' },
                  { Icon: Zap,    label: 'Lokarya Legend', color: '#F47C20' },
                ].map(({ Icon, label, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '4px 10px' }}>
                    <Icon size={10} style={{ color }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="p-8">
              <AnimatePresence>
                {/* FIX: show banned notice if redirected with ?reason=banned */}
                {bannedRedirect && !status.error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-5 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold text-center border border-red-200">
                    ⚠️ Your account has been suspended. Contact support.
                  </motion.div>
                )}
                {status.error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-5 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-100">
                    {status.error}
                  </motion.div>
                )}
                {status.success && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-5 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-bold text-center border border-green-100">
                    {status.success}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">
                    Email Address
                  </label>
                  <input
                    id="login-email" name="email" type="email" autoComplete="email" required
                    value={formData.email} onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0f2c4a]/20 focus:border-[#0f2c4a] outline-none transition-all font-semibold text-gray-700 placeholder-gray-300 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password" name="password"
                      type={passwordShown ? "text" : "password"}
                      autoComplete="current-password" required
                      value={formData.password} onChange={handleChange}
                      placeholder="Enter your password"
                      maxLength={128}
                      className="w-full pl-4 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0f2c4a]/20 focus:border-[#0f2c4a] outline-none transition-all font-semibold text-gray-700 placeholder-gray-300 text-sm"
                    />
                    <button type="button" onClick={() => setPasswordShown(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0f2c4a] transition-colors cursor-pointer p-1">
                      {passwordShown ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer font-semibold">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 cursor-pointer accent-[#0f2c4a]" />
                    Remember me
                  </label>
                  <a href="#" className="text-xs font-black text-[#F47C20] hover:text-[#d86916] transition-colors">
                    Forgot password?
                  </a>
                </div>

                <button type="submit" disabled={status.loading}
                  className="w-full text-white py-3.5 rounded-xl font-black text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed tracking-wide cursor-pointer"
                  style={{ background: status.loading ? '#94a3b8' : 'linear-gradient(135deg,#0f2c4a,#0f4c75)', boxShadow: '0 4px 18px rgba(15,44,74,0.3)' }}>
                  {status.loading ? "Signing In…" : "Sign In"}
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

              <button type="button" onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer text-sm shadow-sm">
                <img src="https://www.material-tailwind.com/logos/logo-google.png" alt="google" className="h-5 w-5" />
                Continue with Google
              </button>

              <p className="mt-6 text-center text-sm text-gray-500 font-semibold">
                Don't have an account?{" "}
                {onSwitchToRegister ? (
                  <button onClick={onSwitchToRegister}
                    className="font-black text-[#0f2c4a] hover:text-[#F47C20] transition-colors cursor-pointer">
                    Create Account
                  </button>
                ) : (
                  <Link to="/register" onClick={onClose}
                    className="font-black text-[#0f2c4a] hover:text-[#F47C20] transition-colors">
                    Create Account
                  </Link>
                )}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
