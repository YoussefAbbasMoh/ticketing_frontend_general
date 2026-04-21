import React from 'react';

const Card = ({ children, className = '', hover = false, onClick }) => {
  const hoverClasses = hover ? 'hover:-translate-y-2 hover:shadow-xl cursor-pointer' : '';
  
  return (
    <div 
      className={`bg-white rounded-xl shadow-soft border border-gray-100 transition-all duration-300 ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-gray-100 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
