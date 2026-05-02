import React from 'react';

/**
 * Pulse block for loading placeholders (replaces circular spinners where layout is known).
 */
const Skeleton = ({ className = '', ...rest }) => (
  <div
    role="presentation"
    aria-hidden
    className={`animate-pulse rounded-md bg-app-surface-variant ${className}`}
    {...rest}
  />
);

export default Skeleton;
