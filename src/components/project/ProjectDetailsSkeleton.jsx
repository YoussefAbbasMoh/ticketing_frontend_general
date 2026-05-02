import React from 'react';
import Skeleton from '../ui/Skeleton';

/**
 * Layout-stable loading shell for project details (replaces full-page spinner).
 */
const ProjectDetailsSkeleton = () => (
  <div className="min-h-screen bg-app-background pb-12 font-cairo">
    <div className="container mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
      <Skeleton className="mb-6 h-10 w-40 max-w-full rounded-app-input" />

      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-64 max-w-full rounded-md" />
            <Skeleton className="h-8 w-24 shrink-0 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-10 w-56 max-w-full rounded-app-input" />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Skeleton className="h-12 w-44 rounded-app-btn" />
          <Skeleton className="h-12 w-36 rounded-app-btn" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-app border border-app-divider bg-app-surface p-6 shadow-app-soft"
          >
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="rounded-app border border-app-divider bg-app-surface p-6 shadow-app-card">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-10 w-full max-w-md rounded-app-input" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-lg" />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  </div>
);

export default ProjectDetailsSkeleton;
