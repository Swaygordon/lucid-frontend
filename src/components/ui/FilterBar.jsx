import React from 'react';

export const FilterBar = ({ filters, active, onChange }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {filters.map((filter) => {
        const isActive = active === filter.key;
        return (
          <button
            key={filter.key}
            onClick={() => onChange(filter.key)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isActive
                ? 'bg-primary text-white shadow-md'
                : 'bg-white dark:bg-[#1a1f2e] text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#252b3b] border-2 border-gray-200 dark:border-[#2d3748]'
            }`}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-[#252b3b] dark:text-slate-400'
                }`}
              >
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
