import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Trophy, Target, AlertTriangle, Home } from 'lucide-react';

// --- IMPORT YOUR LOGO ---
import navbarLogo from '../../assets/main-icon.png'; 

// --- IMPORT THE MODALS ---
import LoginModal from '../../pages/auth/LoginModal';
import RegisterModal from '../../pages/auth/RegisterModal';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  const menuRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const switchToRegister = () => {
    setIsLoginOpen(false);
    setTimeout(() => setIsRegisterOpen(true), 200); 
  };

  const switchToLogin = () => {
    setIsRegisterOpen(false);
    setTimeout(() => setIsLoginOpen(true), 200);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`sticky top-0 w-full font-sans z-50 transition-all duration-300 border-b ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-md border-gray-100 shadow-sm' 
            : 'bg-white border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Left Side: Logo */}
            <div className="flex items-center shrink-0">
               <Link to="/" className="cursor-pointer">
                  <img 
                    src={navbarLogo} 
                    alt="Lokarya Logo" 
                    className="h-12 md:h-14 w-auto object-contain hover:scale-105 transition-transform duration-200" 
                  />
               </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 sm:gap-4 relative" ref={menuRef}>
              
              {/* AUTH BUTTONS (Hidden on mobile) */}
              <div className="hidden sm:flex items-center gap-4">
                <button 
                  onClick={() => setIsLoginOpen(true)}
                  className="px-4 py-2 text-blue-900 font-semibold border border-transparent hover:border-blue-900 rounded transition-colors cursor-pointer"
                >
                  LOGIN
                </button>

                <button 
                  onClick={() => setIsRegisterOpen(true)}
                  className="bg-[#0f4c75] hover:bg-[#0b3a5b] text-white font-bold px-6 py-2 rounded transition-colors text-sm uppercase tracking-wide cursor-pointer shadow-md active:scale-95"
                >
                  JOIN NOW
                </button>
              </div>

              {/* Hamburger Button */}
              <button 
                onClick={toggleMenu}
                className="flex items-center justify-center w-10 h-10 border border-gray-800 rounded bg-white hover:bg-gray-50 focus:outline-none z-50 cursor-pointer transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* --- DROPDOWN MENU (Right Aligned Card) --- */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60]"
                  >
                    <div className="flex flex-col p-2">
                      <MenuLink to="/" icon={<Home size={18} />} label="Home" sub="Landing Page" onClick={() => setIsMenuOpen(false)} />
                      <MenuLink to="/rewards" icon={<Trophy size={18} className="text-yellow-500" />} label="Rewards Hub" sub="XP & Vouchers" onClick={() => setIsMenuOpen(false)} />
                      <MenuLink to="/activities" icon={<Target size={18} className="text-blue-500" />} label="Mission Board" sub="Social Tasks" onClick={() => setIsMenuOpen(false)} />
                      <MenuLink to="/report-issue" icon={<AlertTriangle size={18} className="text-orange-500" />} label="Complaints" sub="Report Issues" onClick={() => setIsMenuOpen(false)} />
                      
                      {/* Mobile Auth (Only shows in dropdown on small screens) */}
                      <div className="sm:hidden mt-2 pt-2 border-t border-gray-100 flex flex-col gap-2">
                        <button onClick={() => { setIsMenuOpen(false); setIsLoginOpen(true); }} className="w-full py-3 text-sm font-bold text-blue-900 hover:bg-gray-50 rounded-xl transition-colors">Login</button>
                        <button onClick={() => { setIsMenuOpen(false); setIsRegisterOpen(true); }} className="w-full py-3 text-sm font-bold text-white bg-[#0f4c75] rounded-xl transition-all">Join Now</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Modals */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSwitchToRegister={switchToRegister} />
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} onSwitchToLogin={switchToLogin} />
    </>
  );
};

// Simple reusable link component for the menu
const MenuLink = ({ to, icon, label, sub, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick} 
    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all group"
  >
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white shadow-sm transition-colors">
      {icon}
    </div>
    <div>
      <p className="text-sm font-bold text-gray-800 leading-tight">{label}</p>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{sub}</p>
    </div>
  </Link>
);

export default Navbar;