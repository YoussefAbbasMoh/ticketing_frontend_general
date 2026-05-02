import React from 'react';

/** Semantic alerts — matches AppColors success / error / warning / info */
const Alert = ({ children, variant = 'info', onClose, className = '' }) => {
  const variants = {
    success: 'border-app-success/35 bg-app-success/10 text-app-success',
    error: 'border-app-error/35 bg-app-error/10 text-app-error',
    warning: 'border-app-warning/35 bg-app-warning/10 text-app-warning',
    info: 'border-app-info/35 bg-app-info/10 text-app-info',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`flex items-start rounded-app-input border-2 p-4 font-cairo ${variants[variant]} ${className}`}>
      <span className="mr-3 text-xl">{icons[variant]}</span>
      <div className="flex-1 text-[14px] leading-snug">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-3 opacity-70 transition-opacity hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
