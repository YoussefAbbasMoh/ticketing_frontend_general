import React from 'react';

const Input = ({ 
  label, 
  type = 'text', 
  error, 
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  className = '',
  icon,
  ...props 
}) => {
  const inputClasses = `
    w-full rounded-app-input border px-4 py-[14px] text-[14px] text-app-text
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-[#080936]/20 focus:border-app-primary
    disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-app-surface-variant
    ${error ? 'border-app-error' : 'border-app-border bg-app-surface hover:border-app-text-tertiary'}
    ${icon ? 'pl-11' : ''}
    ${className}
  `;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="mb-s8 block text-[13px] font-semibold text-app-text-secondary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-secondary">
            {icon}
          </div>
        )}
        <input
          type={type}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-[13px] ${error ? 'text-app-error' : 'text-app-text-secondary'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
