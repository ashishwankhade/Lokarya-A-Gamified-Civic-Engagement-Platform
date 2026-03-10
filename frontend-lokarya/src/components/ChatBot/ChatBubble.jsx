import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import ChatWindow from './ChatWindow';
import chatAvatar from '../../assets/icon22.png';

const ChatBubble = () => {
  const [isHovered,   setIsHovered]   = useState(false);
  const [isOpen,      setIsOpen]      = useState(false);
  const [hasUnread,   setHasUnread]   = useState(true);  // show badge until first open
  const [showTooltip, setShowTooltip] = useState(false);

  // Show tooltip hint after 4s on page load (once per session)
  useEffect(() => {
    if (isOpen) return;
    const t = setTimeout(() => setShowTooltip(true), 4000);
    const h = setTimeout(() => setShowTooltip(false), 9000);
    return () => { clearTimeout(t); clearTimeout(h); };
  }, []);

  const toggleChat = () => {
    setIsOpen(o => !o);
    setIsHovered(false);
    setShowTooltip(false);
    if (!isOpen) setHasUnread(false); // clear badge on open
  };

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">

        {/* ── Tooltip ─────────────────────────────────────────── */}
        <AnimatePresence>
          {(showTooltip || isHovered) && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 16, scale: 0.9 }}
              animate={{ opacity: 1, x: 0,  scale: 1   }}
              exit={{    opacity: 0, x: 16, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="mb-3 mr-1 pointer-events-none"
            >
              <div className="bg-white px-4 py-2.5 rounded-2xl shadow-xl border border-gray-100">
                <p className="text-[#0f2c4a] font-black text-sm whitespace-nowrap">
                  💬 Chat with Civic Assistant
                </p>
                <p className="text-gray-400 text-xs mt-0.5 whitespace-nowrap">
                  Ask about missions, QR scan & XP
                </p>
              </div>
              {/* arrow */}
              <div className="w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 ml-auto mr-6 -mt-1.5 shadow-sm" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main bubble ─────────────────────────────────────── */}
        <motion.button
          onClick={toggleChat}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0    }}
          whileHover={{ scale: 1.08 }}
          whileTap={{   scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative cursor-pointer outline-none"
          aria-label="Open Civic Assistant"
        >
          {/* Pulse ring — only when closed and has unread */}
          {!isOpen && hasUnread && (
            <>
              <span className="absolute inset-0 rounded-full animate-ping bg-[#F47C20] opacity-20" />
              <span className="absolute inset-0 rounded-full border-2 border-[#F47C20] opacity-30" />
            </>
          )}

          {/* Circle */}
          <div
            className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-300"
            style={{
              background: isOpen
                ? 'linear-gradient(135deg,#0f2c4a,#0f4c75)'
                : 'linear-gradient(135deg,#0f2c4a,#164e63)',
            }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="close"
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{    rotate:  90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X size={26} className="text-white" />
                </motion.div>
              ) : (
                <motion.img key="avatar"
                  src={chatAvatar} alt="Civic Bot"
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  exit={{    scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="w-full h-full object-cover"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Bot badge — top right */}
          {!isOpen && (
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="absolute -top-1 -right-1 w-8 h-8 rounded-full border-[3px] border-white shadow-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#F47C20,#f59e0b)' }}
            >
              <Bot size={16} className="text-white" />
            </motion.div>
          )}

          {/* Unread dot */}
          {hasUnread && !isOpen && (
            <span className="absolute top-0 left-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
          )}

          {/* Online dot */}
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
        </motion.button>
      </div>
    </>
  );
};

export default ChatBubble;
