import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot } from 'lucide-react';

const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Namaste! I am your Civic Assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);


  // If using Create React App: process.env.REACT_APP_AI_BACKEND_URL
  const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userText = inputText.trim();
    const userMsg = { id: Date.now(), text: userText, sender: 'user' };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // Using the environment variable URL
      const response = await fetch(`${AI_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userText })
      });

      if (!response.ok) throw new Error('Backend is offline');

      const data = await response.json();
      
      const botMsg = { 
        id: Date.now() + 1, 
        text: data.reply, 
        sender: 'bot' 
      };
      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {
      console.error("Connection Error:", error);
      const errorMsg = { 
        id: Date.now() + 1, 
        text: "I'm having trouble connecting to the server. Please ensure the AI backend is running.", 
        sender: 'bot' 
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed bottom-24 right-6 z-[101] w-[90vw] md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-teal-50 font-sans"
    >
      {/* --- HEADER --- */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-600 p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-inner">
             <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight tracking-wide">Civic Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300"></span>
              </span>
              <p className="text-teal-100 text-xs font-medium">Always Active</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200 cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* --- MESSAGES AREA --- */}
      <div className="flex-1 bg-[#F5F7FA] p-4 overflow-y-auto scroll-smooth">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-sm relative ${
                    msg.sender === 'user' 
                      ? 'bg-[#1E3A8A] text-white rounded-2xl rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none'
                  }`}
                >
                  {msg.text}
                  <span className={`text-[10px] block mt-1 opacity-70 ${msg.sender === 'user' ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex justify-start"
              >
                <div className="bg-white text-gray-400 px-4 py-2 rounded-2xl text-xs italic border border-gray-100">
                  Assistant is thinking...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* --- INPUT AREA --- */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form 
          onSubmit={handleSend} 
          className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all duration-200"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none py-1"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
              inputText.trim() && !isTyping
                ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700 hover:scale-105 active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={16} className={inputText.trim() ? "ml-0.5" : ""} />
          </button>
        </form>
        <div className="text-center mt-2">
           <p className="text-[10px] text-gray-400">Powered by Lokarya AI</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatWindow;