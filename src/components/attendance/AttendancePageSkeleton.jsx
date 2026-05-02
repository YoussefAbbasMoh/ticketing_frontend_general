import React from 'react';
import Skeleton from '../ui/Skeleton';

const AttendancePageSkeleton = () => (
  <div className="min-h-screen bg-app-background pb-12 font-cairo" aria-busy="true">
    <div className="container mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Skeleton className="h-10 w-48 max-w-full rounded-md" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-10 w-36 shrink-0 rounded-app-input" />
      </div>
      <Skeleton className="mb-6 h-11 w-full max-w-md rounded-app-input" />
      <div className="rounded-app border border-app-divider bg-app-surface shadow-app-card">
        <div className="border-b border-app-divider p-4 sm:p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** In-card loading — keeps page chrome (tabs, alerts) visible while refetching. */
export const AttendanceTableSkeleton = () => (
  <div className="space-y-2 p-6" aria-busy="true">
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <Skeleton key={i} className="h-11 w-full rounded-md" />
    ))}
  </div>
);

export default AttendancePageSkeleton;
