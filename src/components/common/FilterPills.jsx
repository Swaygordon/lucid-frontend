import React from 'react';

/** Compact, keyboard-accessible single-select filters used across workspaces. */
export default function FilterPills({ items, value, onChange, label, className = '' }) {
  return (
    <div role="group" aria-label={label} className={`flex w-full flex-nowrap gap-2 overflow-x-auto py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      {items.map(item => {
        const selected = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(item.value)}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#252b3b] dark:text-slate-200 dark:hover:bg-[#30394b]'}`}
          >
            {item.label}
            {item.count !== undefined && <span className={`ml-2 text-xs ${selected ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400'}`}>{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
