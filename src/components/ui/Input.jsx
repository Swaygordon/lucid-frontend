import React, { useId } from 'react';

export const Input = ({
  label,
  error,
  helperText,
  required = false,
  endIcon,
  className = '',
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="label font-medium text-gray-700 dark:text-slate-300">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          aria-label={!label ? props.placeholder || props.name : undefined}
          className={`
            w-full px-4 py-2.5 border-2 rounded-xl text-gray-700 dark:text-slate-200
            transition-all duration-200
            bg-white dark:bg-[#252b3b] focus:outline-none focus:ring-2
            disabled:bg-gray-100 dark:disabled:bg-[#1a1f2e] disabled:cursor-not-allowed
            dark:placeholder-slate-500
            ${error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-gray-300 dark:border-[#2d3748] focus:border-primary focus:ring-blue-100 dark:focus:ring-blue-900/40'}
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
      {helperText && !error && <span className="text-gray-600 dark:text-slate-400 text-sm">{helperText}</span>}
    </div>
  );
};