import React from 'react';

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className = '',
  ...props
}) => {
  const base = 'font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';

  const variants = {
    primary:   'bg-primary hover:bg-primary-hover text-white shadow-md hover:shadow-glow-blue',
    secondary: 'bg-secondary hover:bg-secondary-hover text-white shadow-md hover:shadow-glow-orange',
    outline:   'border-2 border-primary text-primary hover:bg-primary-50 hover:shadow-md',
    ghost:     'text-primary hover:bg-primary-50',
    danger:    'bg-error hover:bg-red-700 text-white shadow-md hover:shadow-glow-red',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Loading...
        </>
      ) : children}
    </button>
  );
};
