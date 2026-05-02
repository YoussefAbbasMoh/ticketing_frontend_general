import React from 'react';
import Skeleton from '../ui/Skeleton';
import WorkspaceHomePanel from './WorkspaceHomePanel';

export const TicketPreviewCardSkeleton = () => (
  <div
    className="flex h-[172px] w-[260px] shrink-0 flex-col rounded-app border border-app-divider bg-app-surface p-4 shadow-app-soft sm:w-[280px]"
    aria-hidden
  >
    <div className="mb-2 flex items-start justify-between gap-2">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      <Skeleton className="h-5 w-14 shrink-0 rounded-md" />
    </div>
    <Skeleton className="mb-2 h-4 w-[92%]" />
    <Skeleton className="mb-1 h-3 w-3/5" />
    <Skeleton className="mt-auto h-3 w-full" />
    <Skeleton className="mt-1.5 h-3 w-4/5" />
  </div>
);

export const ProjectPreviewCardSkeleton = () => (
  <div
    className="flex h-[150px] w-[225px] shrink-0 flex-col rounded-app border border-app-divider bg-app-surface p-4 shadow-app-soft"
    aria-hidden
  >
    <div className="mb-2 flex items-start justify-between gap-2">
      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      <Skeleton className="h-5 w-16 shrink-0 rounded-md" />
    </div>
    <Skeleton className="mb-2 h-4 w-full" />
    <Skeleton className="mb-2 h-4 w-[88%]" />
    <Skeleton className="mt-auto h-3 w-2/3" />
  </div>
);

const ticketRail = (
  <div className="min-h-[172px]">
    <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-app-border">
      <TicketPreviewCardSkeleton />
      <TicketPreviewCardSkeleton />
      <TicketPreviewCardSkeleton />
    </div>
  </div>
);

/**
 * Full-page shell while projects list is loading — mirrors home layout without spinners.
 */
export const HomeLoadingSkeleton = ({ tx }) => (
  <div className="min-h-screen bg-app-background pb-16 font-cairo text-app-text">
    <div className="container mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
      <div className="mb-6 rounded-app border border-app-divider bg-app-surface p-5 shadow-app-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-7 w-48 max-w-full sm:h-8 sm:w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Skeleton className="h-10 w-24 rounded-app-input" />
            <Skeleton className="h-10 w-28 rounded-app-input" />
          </div>
        </div>
      </div>

      <WorkspaceHomePanel title={tx('activeTickets')} subtitle={tx('loadingTickets')}>
        {ticketRail}
      </WorkspaceHomePanel>

      <WorkspaceHomePanel
        title={tx('projects')}
        subtitle={tx('projectsSummary', { active: 0, completed: 0 })}
        headerRight={<Skeleton className="h-8 min-w-[5.5rem] rounded-full" />}
      >
        <div className="mb-4 flex flex-wrap gap-2 sm:gap-3">
          <Skeleton className="h-9 w-[5.5rem] rounded-full" />
          <Skeleton className="h-9 w-[6.5rem] rounded-full" />
          <Skeleton className="h-9 w-[7rem] rounded-full" />
        </div>
        <div className="min-h-[150px]">
          <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-app-border">
            <ProjectPreviewCardSkeleton />
            <ProjectPreviewCardSkeleton />
            <ProjectPreviewCardSkeleton />
          </div>
        </div>
      </WorkspaceHomePanel>
    </div>
  </div>
);

export const ActiveTicketsLoadingRail = () => ticketRail;
