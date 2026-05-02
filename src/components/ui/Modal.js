import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, children, size = 'md', className = '' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className={`relative w-full rounded-app border border-app-divider bg-app-surface shadow-app-card ${sizes[size]} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const ModalHeader = ({ children, onClose, className = '' }) => (
  <div className={`flex items-center justify-between border-b border-app-divider px-6 py-4 ${className}`}>
    <h2 className="text-[18px] font-extrabold tracking-tight text-app-text">{children}</h2>
    {onClose && (
      <button
        onClick={onClose}
        type="button"
        className="rounded-app-input p-1 text-app-text-tertiary transition-colors hover:bg-app-surface-variant hover:text-app-text"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);

const ModalContent = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const ModalFooter = ({ children, className = '' }) => (
  <div className={`flex items-center justify-end gap-3 border-t border-app-divider px-6 py-4 ${className}`}>
    {children}
  </div>
);

Modal.Header = ModalHeader;
Modal.Content = ModalContent;
Modal.Footer = ModalFooter;

export default Modal;
