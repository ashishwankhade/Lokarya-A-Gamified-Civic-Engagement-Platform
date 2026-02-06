import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, MessageSquare, Gift, ArrowRight } from "lucide-react";
import { SlideUp, SlideRight } from "../../utility/animation"; 

const AboutProgram = () => {
  return (
    <section className="bg-gradient-to-b from-[#f8f9fa] to-white py-20 md:py-32 overflow-hidden relative font-sans">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-40 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-100 rounded-full blur-[80px] opacity-30 -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* LEFT: Image Area */}
          <motion.div 
            variants={SlideRight(0.2)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main Image Container with offset border */}
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.0.3"
                alt="Lokarya Community Action"
                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f4c75]/80 via-transparent to-transparent opacity-60"></div>
            </div>

            {/* Back Decoration Box */}
            <div className="absolute top-10 -left-6 w-full h-full border-2 border-[#F47C20]/20 rounded-[2.5rem] -z-10"></div>
            
            {/* REMOVED: Floating Impact Card (15K+ Issues) */}

          </motion.div>

          {/* RIGHT: Content */}
          <div className="flex flex-col space-y-8">
            
            {/* Heading Group */}
            <div>
              <motion.div 
                variants={SlideUp(0.1)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="inline-block px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-4"
              >
                <span className="bg-gradient-to-r from-[#F47C20] to-[#e06b15] bg-clip-text text-transparent font-black tracking-wider uppercase text-xs">
                  Initiative for Societal Betterment
                </span>
              </motion.div>
              
              <motion.h2
                variants={SlideUp(0.2)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-extrabold text-[#0f4c75] leading-[1.1] tracking-tight"
              >
                Welcome to <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f4c75] to-[#2a7eb5]">Lokarya.</span>
              </motion.h2>
            </div>

            {/* Description */}
            <motion.p 
              variants={SlideUp(0.3)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-lg text-gray-600 leading-relaxed border-l-4 border-gray-200 pl-6"
            >
              A comprehensive digital solution transforming how citizens engage with communities. We serve as the bridge connecting <span className="font-semibold text-gray-900">Citizens, NGOs, and Authorities</span> to drive transparency.
            </motion.p>

            {/* Feature List (Modern Cards) */}
            <div className="grid gap-5">
               {/* Feature 1 */}
               <motion.div variants={SlideUp(0.4)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex items-start gap-4">
                  <div className="mt-1 w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Report Civic Issues</h4>
                    <p className="text-sm text-gray-500">Easily report garbage, traffic, or potholes directly to authorities.</p>
                  </div>
               </motion.div>

               {/* Feature 2 */}
               <motion.div variants={SlideUp(0.5)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex items-start gap-4">
                  <div className="mt-1 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">AI Guidance Chatbot</h4>
                    <p className="text-sm text-gray-500">Get instant guidance on government schemes via our smart assistant.</p>
                  </div>
               </motion.div>

               {/* Feature 3 */}
               <motion.div variants={SlideUp(0.6)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex items-start gap-4">
                  <div className="mt-1 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                    <Gift size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Earn Rewards</h4>
                    <p className="text-sm text-gray-500">Gain points for every contribution and redeem them for exciting rewards.</p>
                  </div>
               </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div
              variants={SlideUp(0.8)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="pt-6 flex flex-wrap gap-4"
            >
              {/* Primary: Join */}
              <button className="group relative w-full sm:w-auto justify-center px-8 py-3.5 bg-[#0f4c75] text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex items-center">
                <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 origin-left"></div>
                <span className="relative flex items-center gap-2">
                  Join the Cause <ArrowRight size={18} />
                </span>
              </button>

              {/* Secondary: Report */}
              <button className="w-full sm:w-auto justify-center px-8 py-3.5 bg-white border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 hover:border-red-200 transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md">
                 <AlertTriangle size={18} />
                 Report an Issue
              </button>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutProgram;