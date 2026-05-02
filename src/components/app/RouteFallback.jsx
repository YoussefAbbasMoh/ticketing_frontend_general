import React from 'react';

/**
 * Minimal full-viewport shell for lazy route chunks — stable height reduces CLS while Suspense loads.
 */
export default function RouteFallback() {
  return (
    <div
      className="min-h-screen w-full bg-[#f4f5f9]"
      style={{ minHeight: '100vh' }}
      aria-busy="true"
      aria-label="Loading"
    />
  );
}
