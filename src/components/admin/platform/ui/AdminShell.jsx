import React from 'react';

/** Max-width content column + responsive padding for all platform admin pages. */
export default function AdminShell({ children, className = '' }) {
  return (
    <div
      className={`mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 ${className}`}
    >
      {children}
    </div>
  );
}
