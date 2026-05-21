import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export const PageHeader = ({ title, subtitle, onBack, rightContent }) => {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white dark:bg-[#1a1f2e] shadow-sm dark:shadow-[0_1px_0_0_#1e293b] sticky top-0 z-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-slate-300" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{title}</h1>
              {subtitle && <p className="text-gray-600 dark:text-slate-400 mt-1">{subtitle}</p>}
            </div>
          </div>
          {rightContent && (
            <div className="flex-shrink-0">{rightContent}</div>
          )}
        </div>
      </div>
    </motion.header>
  );
};
