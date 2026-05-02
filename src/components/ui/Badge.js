import React from 'react';

const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variants = {
    default: 'bg-app-surface-variant text-app-text',
    primary: 'bg-app-primary/10 text-app-primary',
    secondary: 'bg-orange/15 text-orange-dark',
    success: 'bg-emerald-100 text-emerald-950',
    warning: 'bg-amber-100 text-amber-950',
    error: 'bg-red-100 text-red-900',
    info: 'bg-sky-100 text-sky-950',
    orange: 'bg-orange/15 text-orange-dark',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
