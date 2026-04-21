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
    w-full px-4 py-2.5 text-base
    border-2 rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'}
    ${icon ? 'pl-11' : ''}
    ${className}
  `;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
        <p className={`mt-1.5 text-sm ${error ? 'text-red-500' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
