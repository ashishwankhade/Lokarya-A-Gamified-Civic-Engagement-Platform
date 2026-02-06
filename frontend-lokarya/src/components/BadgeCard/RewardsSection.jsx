import React from 'react';
import { motion } from 'framer-motion';
import { SlideUp } from '../../utility/animation'; 

// --- Helper Component: BadgeCard ---
const BadgeCard = ({ colorTheme, title, subtitle, level, points }) => {
  const colors = {
    green: {
      border: "#22c55e",
      shadow: "shadow-green-200",
      pill: "bg-green-200 text-green-900",
    },
    blue: {
      border: "#3b82f6",
      shadow: "shadow-blue-200",
      pill: "bg-blue-100 text-blue-900",
    },
    orange: {
      border: "#f97316",
      shadow: "shadow-orange-200",
      pill: "bg-orange-100 text-orange-900",
    },
    purple: {
      border: "#a855f7",
      shadow: "shadow-purple-200",
      pill: "bg-purple-100 text-purple-900",
    },
    yellow: {
      border: "#f59e0b",
      shadow: "shadow-yellow-200",
      pill: "bg-yellow-200 text-yellow-900",
    }
  };

  const theme = colors[colorTheme] || colors.green;

  const getGradientStops = () => {
    switch (colorTheme) {
      case 'green':
        return <><stop offset="0%" stopColor="#86EFAC" /><stop offset="50%" stopColor="#22c55e" /><stop offset="100%" stopColor="#14532d" /></>;
      case 'blue':
        return <><stop offset="0%" stopColor="#93C5FD" /><stop offset="50%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1e3a8a" /></>;
      case 'orange':
        return <><stop offset="0%" stopColor="#fdba74" /><stop offset="50%" stopColor="#f97316" /><stop offset="100%" stopColor="#7c2d12" /></>;
      case 'purple':
        return <><stop offset="0%" stopColor="#d8b4fe" /><stop offset="50%" stopColor="#a855f7" /><stop offset="100%" stopColor="#581c87" /></>;
      case 'yellow':
        return <><stop offset="0%" stopColor="#FCE7A5" /><stop offset="50%" stopColor="#FBBF24" /><stop offset="100%" stopColor="#78350f" /></>;
      default: return null;
    }
  };

  const gradientId = `metallic-gradient-${colorTheme}`;

  return (
    /* Reduced w-64 to w-full and added max-width for responsive scaling */
    <div className="flex flex-col items-center w-full max-w-[180px] md:max-w-[240px] text-center group cursor-pointer">
      {/* Scaled down SVG size on mobile (w-32) vs desktop (w-44) */}
      <div className={`relative w-32 h-32 md:w-44 md:h-44 mb-4 md:mb-6 transition-transform duration-300 transform group-hover:-translate-y-2 drop-shadow-xl ${theme.shadow}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {getGradientStops()}
            </linearGradient>
          </defs>
          <path 
            d="M50 2 L95 20 L85 65 L50 98 L15 65 L5 20 Z" 
            fill={`url(#${gradientId})`} 
            stroke="white" 
            strokeWidth="3"
            strokeLinejoin="round"
            className="drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)]"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2 md:p-4">
          <h3 className="text-sm md:text-xl font-black uppercase tracking-tighter leading-tight mb-1 drop-shadow-md">
            {title}
          </h3>
          <div className="relative w-10 md:w-16 my-1">
             <div className="h-px w-full bg-white/80 shadow-sm"></div>
          </div>
          <p className="font-serif italic text-sm md:text-lg leading-none mb-1 text-white drop-shadow-sm">Lokarya</p>
          <p className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest mt-1 opacity-90 drop-shadow-sm">{subtitle}</p>
        </div>
      </div>

      <span className={`${theme.pill} px-3 md:px-6 py-1 rounded-full text-[10px] md:text-xs font-bold mb-2 md:mb-3 shadow-md uppercase tracking-wide whitespace-nowrap`}>
        {level}
      </span>

      <p className="text-gray-800 font-bold text-[11px] md:text-sm">
        {points}
      </p>
    </div>
  );
};

// --- Main Export ---
const RewardsSection = () => {
  const levelsData = [
    { theme: 'green', title: 'Civic', sub: 'Scout', level: 'Level 1', xp: '0-200 XP' },
    { theme: 'blue', title: 'Urban', sub: 'Guardian', level: 'Level 2', xp: '201-1k XP' },
    { theme: 'orange', title: 'Impact', sub: 'Maker', level: 'Level 3', xp: '1k-3k XP' },
    { theme: 'purple', title: 'City', sub: 'Champion', level: 'Level 4', xp: '3k-5k XP' },
    { theme: 'yellow', title: 'Lokarya', sub: 'Legend', level: 'Level 5', xp: '5k+ XP' },
  ];

  return (
    <section className="bg-[#fdf6ef] py-12 md:py-16 px-4 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div 
           variants={SlideUp(0.2)} initial="hidden" whileInView="visible" viewport={{ once: true }}
           className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black text-black mb-4 tracking-tight">
            Progression Tiers
          </h2>
          <p className="text-gray-600 font-medium text-sm md:text-base">Report issues and join missions to climb the ranks of Nagpur.</p>
        </motion.div>

        {/* UPDATED GRID CLASSES:
            grid-cols-2: 2 columns on small mobile
            sm:grid-cols-3: 3 columns on small tablets
            lg:grid-cols-5: 5 columns on desktop
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-10 md:gap-10 mb-16 justify-items-center">
          {levelsData.map((lvl, index) => (
            <motion.div
              key={lvl.title}
              variants={SlideUp(0.1 * (index + 3))}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="w-full flex justify-center"
            >
              <BadgeCard 
                colorTheme={lvl.theme} 
                title={lvl.title} 
                subtitle={lvl.sub}
                level={lvl.level} 
                points={lvl.xp} 
              />
            </motion.div>
          ))}
        </div>

        <motion.div 
          variants={SlideUp(0.8)} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex flex-col items-center p-4 md:p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
             <p className="text-[10px] md:text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">Earning Rates</p>
             <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-[11px] md:text-sm">
                <span className="flex items-center gap-2 font-bold text-teal-600">🌱 Report: +20 XP</span>
                <span className="flex items-center gap-2 font-bold text-blue-600">🤝 Mission: +30 XP</span>
                <span className="flex items-center gap-2 font-bold text-purple-600">✅ Resolved: +50 XP</span>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RewardsSection;