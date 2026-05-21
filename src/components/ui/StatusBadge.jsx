import React from 'react';

const STATUS_CONFIG = {
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-400 animate-pulse-dot',
    label: 'Pending',
  },
  confirmed: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'Confirmed',
  },
  'in-progress': {
    bg: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500 animate-pulse-dot',
    label: 'In Progress',
  },
  completed: {
    bg: 'bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700',
    text: 'text-gray-600 dark:text-slate-400',
    dot: 'bg-gray-400 dark:bg-slate-500',
    label: 'Completed',
  },
  cancelled: {
    bg: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-400',
    label: 'Cancelled',
  },
  paid: {
    bg: 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/40',
    text: 'text-purple-700 dark:text-purple-400',
    dot: 'bg-purple-500',
    label: 'Paid',
  },
};

const URGENCY_CONFIG = {
  normal: {
    bg: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-400',
    label: 'Normal',
  },
  urgent: {
    bg: 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/40',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-400 animate-pulse-dot',
    label: 'Urgent',
  },
  emergency: {
    bg: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500 animate-pulse-dot',
    label: 'Emergency',
  },
};

export const StatusBadge = ({ status, urgency, className = '' }) => {
  const config = urgency ? URGENCY_CONFIG[urgency] : STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap
        ${config.bg} ${config.text} ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
};
