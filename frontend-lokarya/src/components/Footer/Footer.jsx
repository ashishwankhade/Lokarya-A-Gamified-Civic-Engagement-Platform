import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

// --- IMPORT YOUR LOGO HERE ---
import footerLogo from '../../assets/main-icon.png';

const Footer = () => {
  // Helper function to scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Use 'auto' for instant jump
    });
  };

  return (
    <footer className="bg-[#F9F9F9] border-t border-gray-200 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        
        {/* Main Layout */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-10 md:gap-8 mb-12 text-center md:text-left">

          {/* 1. Brand Section */}
          <div className="flex flex-col items-center md:items-start">
            <Link to="/" onClick={scrollToTop} className="mb-4 inline-block">
                <img 
                  src={footerLogo} 
                  alt="Lokarya Logo" 
                  className="h-16 md:h-20 w-auto object-contain hover:scale-105 transition-transform duration-200" 
                />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto md:mx-0">
              Building better communities through transparency, gamified engagement, and rapid grievance redressal.
            </p>
          </div>

          {/* 2. Navigation Links */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-black font-bold uppercase tracking-wider mb-4 text-sm">
              Quick Navigation
            </h3>
            <ul className="space-y-3">
              {[
                { name: 'Home', path: '/' },
                { name: 'Missions', path: '/activities' },
                { name: 'Complaints', path: '/report-issue' },
                { name: 'Rewards Hub', path: '/rewards' },
                { name: 'Leaderboard', path: '/leaderboard' }
              ].map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.path} 
                    onClick={scrollToTop} // <--- SCROLL TRIGGER
                    className="text-gray-600 hover:text-[#F47C20] transition-colors duration-200 font-medium text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Social & Connect */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-black font-bold uppercase tracking-wider mb-4 text-sm">
              Connect With Us
            </h3>
            <div className="flex space-x-4 md:space-x-3 mb-6">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                <a 
                  key={index} 
                  href="#" 
                  className="bg-white p-3 md:p-2.5 rounded-full shadow-sm text-gray-500 hover:text-white hover:bg-[#F47C20] hover:shadow-md transition-all border border-gray-100 group"
                >
                  <Icon size={20} className="md:w-[18px] md:h-[18px] group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-400 max-w-xs mx-auto md:mx-0">
              Follow us for updates on new missions, rewards, and community success stories.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 mt-4 flex flex-col-reverse md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-xs text-gray-500 font-medium">
                &copy; {new Date().getFullYear()} Lokarya Foundation. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs text-gray-400 font-bold">
               <Link to="/privacy" onClick={scrollToTop} className="hover:text-gray-600">Privacy Policy</Link>
               <span className="hidden md:inline">•</span>
               <Link to="/terms" onClick={scrollToTop} className="hover:text-gray-600">Terms of Service</Link>
               <span className="hidden md:inline">•</span>
               <a href="#" className="hover:text-gray-600">Sitemap</a>
            </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;