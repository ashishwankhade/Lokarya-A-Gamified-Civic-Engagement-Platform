import { motion } from "framer-motion";
import { X } from "lucide-react";

// 1. The Animation Wrapper (Backdrop + Modal Container)
export const ModalWrapper = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 font-sans p-8 sm:p-10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors z-10 cursor-pointer"
        >
          <X size={20} />
        </button>
        {children}
      </motion.div>
    </div>
  );
};

// 2. Reusable Input Field (Keeps your exact styling)
export const AuthInput = ({ label, icon: Icon, children, ...props }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-gray-500 uppercase ml-1">{label}</label>
    <div className="relative group">
      {Icon && (
        <Icon 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0f4c75] transition-colors" 
          size={18} 
        />
      )}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0f4c75]/20 focus:border-[#0f4c75] outline-none transition-all font-medium text-gray-700 placeholder-gray-400`}
      />
      {children} {/* For things like the Eye icon inside password fields */}
    </div>
  </div>
);

// 3. Status Message Component
export const StatusMessage = ({ status }) => {
  if (status.error) return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-100">
      {status.error}
    </motion.div>
  );
  if (status.success) return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-bold text-center border border-green-100">
      {status.success}
    </motion.div>
  );
  return null;
};

// 4. Social Login Divider & Button
export const SocialLogin = ({ onGoogleClick }) => (
  <>
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
      <div className="relative flex justify-center text-xs uppercase"><span className="px-2 bg-white text-gray-400 font-bold">Or continue with</span></div>
    </div>
    <button
      type="button"
      onClick={onGoogleClick}
      className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer"
    >
      <img src="https://www.material-tailwind.com/logos/logo-google.png" alt="google" className="h-5 w-5" />
      Google
    </button>
  </>
);