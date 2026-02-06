import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react'; 
import ChatWindow from './ChatWindow'; 

// --- IMPORT YOUR IMAGE HERE ---
// Make sure the path points to your actual file in the assets folder
import chatAvatar from '../../assets/icon22.png'; 

const ChatBubble = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false); 

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsHovered(false); 
  };

  return (
    <>
      {/* 1. THE CHAT WINDOW (Popup) */}
      <AnimatePresence>
        {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      </AnimatePresence>

      {/* 2. THE FLOATING BUBBLE */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
        
        {/* Tooltip Text */}
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              className="mb-4 mr-2 bg-white px-4 py-2 rounded-xl shadow-xl border border-gray-100 pointer-events-none"
            >
              <p className="text-[#0f4c75] font-bold text-sm whitespace-nowrap">
                Chat with Civic Assistance
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Bubble Button */}
        <motion.button
          onClick={toggleChat}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative cursor-pointer group outline-none"
        >
          {/* Main Round Background */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#0f4c75] border-4 border-white shadow-2xl overflow-hidden relative flex items-center justify-center">
              
              {/* If Open: Show 'X' Icon */}
              {/* If Closed: Show Your Image from Assets */}
              {isOpen ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
              ) : (
                <img 
                  src={chatAvatar} 
                  alt="Chat Bot" 
                  className="w-full h-full object-cover" // Ensure image fills the circle
                />
              )}

          </div>

          {/* Robot Icon Badge (Top Right) - Only show when closed */}
          {!isOpen && (
            <motion.div 
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute -top-1 -right-1 w-8 h-8 md:w-9 md:h-9 bg-[#F47C20] rounded-full border-[3px] border-white shadow-md flex items-center justify-center"
            >
                 <Bot size={18} className="text-white" />
            </motion.div>
          )}

          {/* Status Indicator (Green Dot) */}
          <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </motion.button>
      </div>
    </>
  );
};

export default ChatBubble;