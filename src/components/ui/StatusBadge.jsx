import React from 'react';

const STATUS_CONFIG = {
  pending: {
    bg: 'bg-amber-50 border border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-400 animate-pulse-dot',
    label: 'Pending',
  },
  confirmed: {
    bg: 'bg-emerald-50 border border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Confirmed',
  },
  'in-progress': {
    bg: 'bg-blue-50 border border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500 animate-pulse-dot',
    label: 'In Progress',
  },
  completed: {
    bg: 'bg-gray-100 border border-gray-200',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    label: 'Completed',
  },
  cancelled: {
    bg: 'bg-red-50 border border-red-200',
    text: 'text-red-600',
    dot: 'bg-red-400',
    label: 'Cancelled',
  },
  paid: {
    bg: 'bg-purple-50 border border-purple-200',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    label: 'Paid',
  },
};

const URGENCY_CONFIG = {
  normal: {
    bg: 'bg-blue-50 border border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
    label: 'Normal',
  },
  urgent: {
    bg: 'bg-orange-50 border border-orange-200',
    text: 'text-orange-700',
    dot: 'bg-orange-400 animate-pulse-dot',
    label: 'Urgent',
  },
  emergency: {
    bg: 'bg-red-50 border border-red-200',
    text: 'text-red-700',
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
