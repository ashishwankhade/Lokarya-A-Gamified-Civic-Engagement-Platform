import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, QrCode, Target, Zap, MapPin, ScanLine, Trophy } from 'lucide-react';

const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://127.0.0.1:8000';

/* ── Quick reply chips shown on welcome ─────────────────────────── */
const QUICK_REPLIES = [
  { label: '📋 How to register for a mission?', value: 'How do I register for a mission?' },
  { label: '📱 How to scan QR at venue?',        value: 'How do I scan the QR code at the venue?' },
  { label: '⚡ How do I earn XP?',               value: 'How do I earn XP on Lokarya?' },
  { label: '🏆 What are the XP ranks?',          value: 'What are the XP ranks and levels?' },
  { label: '📍 What is GPS verification?',       value: 'What is GPS verification for attendance?' },
  { label: '🎯 What missions are available?',    value: 'What kind of missions are available?' },
];

/* ── Format bot reply — convert **bold** and newlines ───────────── */
const FormattedText = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
};

const ChatWindow = ({ onClose }) => {
  const [messages,  setMessages]  = useState([
    {
      id: 1,
      text: "Namaste! 🙏 I'm your **Lokarya Civic Assistant**.\n\nI can help you with:\n• Registering for missions\n• Scanning QR codes at events\n• Understanding XP & ranks\n• Reporting civic issues\n\nWhat would you like to know?",
      sender: 'bot',
    },
  ]);
  const [inputText,    setInputText]    = useState('');
  const [isTyping,     setIsTyping]     = useState(false);
  const [showReplies,  setShowReplies]  = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    if (!text.trim() || isTyping) return;
    setShowReplies(false);

    const userMsg = { id: Date.now(), text: text.trim(), sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch(`${AI_BACKEND_URL}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text.trim() }),
      });

      if (!response.ok) throw new Error('Backend offline');
      const data = await response.json();

      setMessages(prev => [...prev, {
        id:     Date.now() + 1,
        text:   data.reply,
        sender: 'bot',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id:     Date.now() + 1,
        text:   "I'm having trouble connecting right now. Please try again in a moment, or check if the AI backend is running.",
        sender: 'bot',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleQuickReply = (value) => {
    sendMessage(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{    opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="fixed bottom-24 right-6 z-[101] w-[92vw] md:w-[400px] h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
    >
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0f2c4a 0%, #0f4c75 100%)' }}
        className="p-4 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/25">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-black text-base leading-tight">Civic Assistant</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300" />
              </span>
              <p className="text-white/60 text-xs font-semibold">Always Active</p>
            </div>
          </div>
        </div>

        {/* feature pills */}
        <div className="hidden md:flex items-center gap-1.5 mr-2">
          {[
            { Icon: Target,   label: 'Missions' },
            { Icon: QrCode,   label: 'QR Scan'  },
            { Icon: Zap,      label: 'XP'       },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
              <Icon size={9} className="text-white/70" />
              <span className="text-white/60 text-[9px] font-bold">{label}</span>
            </div>
          ))}
        </div>

        <button onClick={onClose}
          className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all cursor-pointer ml-1">
          <X size={18} />
        </button>
      </div>

      {/* ── MESSAGES ────────────────────────────────────────────── */}
      <div className="flex-1 bg-[#F5F7FA] p-4 overflow-y-auto">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* bot avatar */}
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-[#0f2c4a] flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Bot size={13} className="text-white" />
                  </div>
                )}

                <div className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed shadow-sm rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-[#0f2c4a] text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  <FormattedText text={msg.text} />
                  <span className={`text-[10px] block mt-1.5 ${
                    msg.sender === 'user' ? 'text-white/40 text-right' : 'text-gray-300'
                  }`}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-[#0f2c4a] flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Bot size={13} className="text-white" />
                </div>
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 bg-gray-300 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Quick replies ─────────────────────────────────── */}
          <AnimatePresence>
            {showReplies && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap gap-2 pt-1"
              >
                {QUICK_REPLIES.map((r) => (
                  <button key={r.value}
                    onClick={() => handleQuickReply(r.value)}
                    className="text-xs font-700 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#F47C20] hover:text-[#F47C20] hover:bg-orange-50 transition-all cursor-pointer shadow-sm"
                    style={{ fontWeight: 700 }}
                  >
                    {r.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Feature shortcuts bar ───────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-t border-gray-50 flex-shrink-0 overflow-x-auto">
        {[
          { Icon: Target,   label: 'Missions',  href: '/activities'  },
          { Icon: ScanLine, label: 'Scan QR',   href: '/scan-qr'     },
          { Icon: Trophy,   label: 'Rewards',   href: '/rewards'     },
          { Icon: MapPin,   label: 'Report',    href: '/report-issue' },
        ].map(({ Icon, label, href }) => (
          <a key={label} href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-all flex-shrink-0 no-underline group"
          >
            <Icon size={15} className="text-gray-400 group-hover:text-[#F47C20] transition-colors" />
            <span className="text-[9px] font-800 text-gray-400 group-hover:text-[#F47C20] transition-colors whitespace-nowrap"
              style={{ fontWeight: 800 }}>
              {label}
            </span>
          </a>
        ))}
      </div>

      {/* ── INPUT ──────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-2 bg-white flex-shrink-0">
        <form onSubmit={handleSubmit}
          className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-[#F47C20]/20 focus-within:border-[#F47C20] transition-all">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask about missions, QR, XP…"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none py-1"
          />
          <button type="submit"
            disabled={!inputText.trim() || isTyping}
            className={`p-2 rounded-full transition-all flex items-center justify-center ${
              inputText.trim() && !isTyping
                ? 'bg-[#F47C20] text-white shadow-md hover:bg-[#d96a10] hover:scale-105 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            <Send size={15} />
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-300 mt-1.5" style={{ fontFamily: "'DM Sans',sans-serif" }}>
          Powered by Lokarya AI
        </p>
      </div>
    </motion.div>
  );
};

export default ChatWindow;
