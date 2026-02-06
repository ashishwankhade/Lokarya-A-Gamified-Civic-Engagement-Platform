import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff } from "lucide-react";
import api from "../../api/axios";
import logo from "../../assets/icon22.png"; 

export default function LoginModal({ isOpen, onClose }) {
  const [passwordShown, setPasswordShown] = useState(false);
  const togglePasswordVisiblity = () => setPasswordShown((cur) => !cur);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    try {
      const response = await api.post("/auth/login", formData);
      setStatus({ loading: false, error: "", success: "Login Successful!" });

      // 1. Get Token safely
      const token =
        response.data.token ||
        response.data.accessToken ||
        response.data.data?.token ||
        response.data.user?.token;

      if (token) {
        // 2. Save Token AND User Info (Critical for Dashboards)
        localStorage.setItem("token", token);
        
        // We save the whole response data (which contains role, name, email)
        localStorage.setItem("userInfo", JSON.stringify(response.data));

        // 3. Smart Redirection based on Role
        const role = response.data.role; // Backend sends "super_admin", "ngo_admin", etc.
        
        console.log("Login Success. Role detected:", role); // Debugging log

        if (role === 'super_admin') {
          window.location.href = "/dashboard/super-admin";
        } else if (role === 'ngo_admin') {
          window.location.href = "/dashboard/ngo";
        } else if (role === 'local_authority') {
          window.location.href = "/dashboard/authority";
        } else {
          // Regular users go to Home
          window.location.href = "/";
        }

      } else {
        setStatus({
          loading: false,
          success: "",
          error: "Server did not send a token.",
        });
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Invalid email or password.";
      setStatus({ loading: false, success: "", error: errorMsg });
    }
  };

  // Prevent closing when clicking inside the modal
  const handleModalClick = (e) => e.stopPropagation();

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          onClick={onClose} // Close modal when clicking outside
        >
          {/* Dark Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={handleModalClick}
            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 font-sans"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors z-10 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="p-8 sm:p-10">
              
              {/* Logo & Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <img src={logo} alt="Lokarya Logo" className="h-16 w-auto object-contain" />
                </div>
                <h2 className="text-2xl font-black text-[#0f4c75] tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sign in to continue to Lokarya
                </p>
              </div>

              {/* Error/Success Messages */}
              {status.error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-100">
                  {status.error}
                </motion.div>
              )}
              {status.success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-bold text-center border border-green-100">
                  {status.success}
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase ml-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0f4c75]/20 focus:border-[#0f4c75] outline-none transition-all font-medium text-gray-700 placeholder-gray-400"
                    placeholder="name@example.com"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={passwordShown ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0f4c75]/20 focus:border-[#0f4c75] outline-none transition-all font-medium text-gray-700 placeholder-gray-400"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisiblity}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0f4c75] transition-colors cursor-pointer"
                    >
                      {passwordShown ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                   <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-[#0f4c75] focus:ring-[#0f4c75] border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-xs font-bold text-[#F47C20] hover:text-[#d86916] transition-colors">
                    Forgot password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status.loading}
                  className="w-full bg-[#0f4c75] hover:bg-[#0b3a5b] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-900/10 hover:shadow-xl transform active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm"
                >
                  {status.loading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-white text-gray-400 font-bold">Or continue with</span>
                </div>
              </div>

              {/* Google Button */}
              <div className="mt-4">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                >
                  <img
                    src="https://www.material-tailwind.com/logos/logo-google.png"
                    alt="google"
                    className="h-5 w-5"
                  />
                  Google
                </button>
              </div>

              {/* Footer */}
              <p className="mt-8 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#0f4c75] hover:text-[#F47C20] transition-colors"
                  onClick={onClose}
                >
                  Create Account
                </Link>
              </p>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}