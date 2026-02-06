import React from 'react';

const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-gray-100 pb-6">
    <div>
      <h1 className="text-2xl font-black text-[#0f4c75]">{title}</h1>
      {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
    </div>
    {/* Optional Action Button (e.g. "Create New") */}
    {action && <div>{action}</div>}
  </div>
);

export default PageHeader;