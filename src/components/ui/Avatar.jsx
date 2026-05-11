import React from 'react';

/**
 * Avatar Component - User profile image with initials fallback
 * @param {string} src - Image source URL
 * @param {string} name - User name for initials
 * @param {string} size - Avatar size (sm, md, lg, xl)
 * @param {string} fallback - Custom fallback text
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element}
 */
export const Avatar = ({ 
  src, 
  name = '', 
  size = 'md',
  fallback,
  className = '',
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div 
      className={`
        ${sizes[size]} 
        rounded-full overflow-hidden 
        bg-gradient-to-br from-primary to-purple-600 
        flex items-center justify-center 
        text-white font-bold 
        ${className}
      `}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className='font-medium'>{fallback || getInitials(name)}</span>
      )}
    </div>
  );
};