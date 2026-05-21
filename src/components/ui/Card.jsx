import React from 'react';

export const Card = ({
  children,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-[#1a1f2e] rounded-2xl p-6 shadow-md border border-gray-100 dark:border-[#1e293b]
        ${hoverable ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
