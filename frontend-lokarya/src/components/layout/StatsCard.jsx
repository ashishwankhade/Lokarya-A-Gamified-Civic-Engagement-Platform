import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color }) => {
  // Dynamic color mapping based on your design palette
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  const activeColor = colors[color] || colors.blue;

  return (
    <div className={`p-6 rounded-2xl border ${activeColor.split(" ")[2]} bg-white shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]`}>
      <div className={`p-4 rounded-xl ${activeColor}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">{title}</p>
        <h3 className="text-2xl font-black text-gray-800">{value}</h3>
      </div>
    </div>
  );
};

export default StatsCard;