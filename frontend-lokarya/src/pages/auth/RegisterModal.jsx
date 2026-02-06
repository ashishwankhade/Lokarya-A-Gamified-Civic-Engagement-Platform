import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, Eye, EyeOff, User, ArrowRight } from "lucide-react";
import api from "../../api/axios"; 
import logo from "../../assets/icon22.png"; // Ensure this path matches your file structure

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const [passwordShown, setPasswordShown] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- CUSTOM BACKEND OAUTH LOGIC ---
  const handleGoogleRegister = () => {
    // Redirect to Backend API's Google Endpoint
    // Matches the route: app.use('/api/auth', authRoutes) + router.get('/google', ...)
    window.location.href = "http://localhost:5000/api/auth/google"; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    try {
      await api.post("/auth/register", formData);
      setStatus({ loading: false, error: "", success: "Account created! Please login." });
      
      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);

    } catch (err) {
      setStatus({ loading: false, success: "", error: err.response?.data?.message || "Registration failed." });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" onClick={onClose}>
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        />
        
        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }} 
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 font-sans"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors z-10 cursor-pointer">
            <X size={20} />
          </button>

          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex justify-center mb-4">
                 <img src={logo} alt="Logo" className="h-14 w-auto object-contain" />
              </div>
              <h2 className="text-2xl font-black text-[#0f4c75] tracking-tight">Create Account</h2>
              <p className="text-sm text-gray-500 mt-1">Join the community today</p>
            </div>

            {status.error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-100">{status.error}</div>}
            {status.success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-bold text-center border border-green-100">{status.success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0f4c75] transition-colors" size={18} />
                    <input name="name" type="text" required placeholder="John Doe" onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0f4c75]/20 focus:border-[#0f4c75] outline-none transition-all" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
                <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0f4c75] transition-colors" size={18} />
                    <input name="email" type="email" required placeholder="name@example.com" onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0f4c75]/20 focus:border-[#0f4c75] outline-none transition-all" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
                <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0f4c75] transition-colors" size={18} />
                    <input name="password" type={passwordShown ? "text" : "password"} required placeholder="Create Password" onChange={handleChange} className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0f4c75]/20 focus:border-[#0f4c75] outline-none transition-all" />
                    <button type="button" onClick={() => setPasswordShown(!passwordShown)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">
                    {passwordShown ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
              </div>

              <button type="submit" disabled={status.loading} className="w-full bg-[#0f4c75] hover:bg-[#0b3a5b] text-white py-3.5 rounded-xl font-bold shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer mt-2">
                {status.loading ? "Creating..." : <>Join Now <ArrowRight size={18} /></>}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="px-2 bg-white text-gray-400 font-bold">Or continue with</span></div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleRegister}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer"
            >
              <img src="https://www.material-tailwind.com/logos/logo-google.png" alt="google" className="h-5 w-5" />
              Google
            </button>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already a member?{" "}
              <button 
                onClick={onSwitchToLogin} 
                className="font-bold text-[#F47C20] hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}