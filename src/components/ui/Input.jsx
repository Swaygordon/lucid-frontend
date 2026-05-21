import React from 'react';

/**
 * Input Component - Text input with validation and helper text
 * @param {string} label - Input label
 * @param {string} error - Error message
 * @param {string} helperText - Helper text below input
 * @param {boolean} required - Mark as required
 * @param {ReactNode} endIcon - Icon to display on right side
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element}
 */
export const Input = ({ 
  label, 
  error, 
  helperText,
  required = false,
  endIcon,
  className = '',
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="label font-medium text-gray-700 dark:text-slate-300">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          className={`
            w-full px-4 py-2.5 border-2 rounded-lg text-gray-700 dark:text-slate-200
            transition-all duration-200
            bg-white dark:bg-[#252b3b] focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40
            disabled:bg-gray-100 dark:disabled:bg-[#1a1f2e] disabled:cursor-not-allowed
            dark:placeholder-slate-500
            ${error ? 'border-error' : 'border-gray-300 dark:border-[#2d3748]'}
            ${endIcon ? 'pr-12' : ''}
            ${className}
          `}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {endIcon}
          </div>
        )}
      </div>
      {error && <span className="text-error text-sm">{error}</span>}
      {helperText && !error && <span className="text-gray-500 dark:text-slate-500 text-sm">{helperText}</span>}
    </div>
  );
};