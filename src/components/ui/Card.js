import React from 'react';

const Card = ({ children, className = '', hover = false, onClick }) => {
  const hoverClasses = hover ? 'hover:-translate-y-2 hover:shadow-xl cursor-pointer' : '';
  
  return (
    <div 
      className={`rounded-app border border-app-divider bg-app-surface shadow-app-soft transition-all duration-300 ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`border-b border-app-divider px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`border-t border-app-divider px-6 py-4 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
