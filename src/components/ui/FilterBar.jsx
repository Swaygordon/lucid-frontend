import React from 'react';

export const FilterBar = ({ filters, active, onChange }) => {
  return (
    <div className="flex flex-nowrap gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      {filters.map((filter) => {
        const isActive = active === filter.key;
        return (
          <button
            key={filter.key}
            onClick={() => onChange(filter.key)}
            className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0f1117] ${
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
