import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '',
  icon,
  ...props 
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-app-btn transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-app-background disabled:opacity-50 disabled:cursor-not-allowed font-cairo';

  const variants = {
    primary:
      'bg-app-primary text-app-on-primary hover:opacity-92 focus:ring-app-primary shadow-none min-h-[40px]',
    secondary:
      'bg-orange-dark text-white hover:opacity-92 focus:ring-orange-dark shadow-none min-h-[40px]',
    outline:
      'border-2 border-app-primary text-app-primary hover:bg-app-primary/[0.06] focus:ring-app-primary bg-transparent',
    ghost:
      'text-app-primary hover:bg-app-primary/[0.08] focus:ring-app-primary bg-transparent shadow-none',
    danger: 'bg-app-error text-white hover:opacity-92 focus:ring-app-error shadow-none min-h-[40px]',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
