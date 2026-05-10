import Skeleton from './Skeleton';

/** Full-page shell while auth / workspace loads (replaces centered circular spinner). */
export function WorkspaceShellSkeleton({ compact = false }) {
  return (
    <div
      className="min-h-screen bg-app-background font-cairo"
      aria-busy="true"
      aria-label="Loading"
    >
      {!compact && (
        <div className="border-b border-app-divider bg-app-surface px-4 py-3 shadow-app-soft">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <Skeleton className="h-5 flex-1 max-w-md rounded-md" />
            <Skeleton className="h-10 w-28 shrink-0 rounded-app-input" />
            <Skeleton className="h-10 w-10 shrink-0 rounded-full md:hidden" />
          </div>
        </div>
      )}
      <div className={`mx-auto max-w-7xl space-y-6 px-4 ${compact ? 'py-16' : 'py-10'}`}>
        <Skeleton className="h-8 w-52 max-w-full rounded-md" />
        <Skeleton className="h-4 w-72 max-w-full rounded-md" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-app border border-app-divider" />
          <Skeleton className="h-36 rounded-app border border-app-divider" />
        </div>
        <Skeleton className="h-48 w-full rounded-app border border-app-divider" />
      </div>
    </div>
  );
}

/** Chat sidebar conversation rows while list loads. */
export function ChatConversationListSkeleton({ rows = 8 }) {
  return (
    <div
      className="divide-y divide-app-divider px-2 pb-4 pt-1 sm:px-4"
      aria-busy="true"
      aria-label="Loading conversations"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3 p-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-[55%] max-w-[200px] rounded-md" />
            <Skeleton className="h-3 w-[85%] max-w-[260px] rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Chat message column placeholders while messages load. */
export function ChatMessagesAreaSkeleton({ bubbles = 7 }) {
  return (
    <div className="space-y-4 p-3 sm:p-4" aria-busy="true" aria-label="Loading messages">
      {Array.from({ length: bubbles }, (_, i) => {
        const own = i % 3 === 1;
        return (
          <div key={i} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[78%] flex-col gap-2 ${own ? 'items-end' : 'items-start'}`}>
              <Skeleton className={`h-11 rounded-2xl ${own ? 'w-52' : 'w-56'}`} />
              <Skeleton className="h-3 w-14 rounded-md" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Small pulsing block for toolbar / inline loading (replaces tiny CircularProgress). */
export function InlineSkeletonPulse({ className = '' }) {
  return (
    <Skeleton
      className={`inline-block shrink-0 rounded-md ${className}`}
      aria-hidden
    />
  );
}

/** Non-circular busy indicator for buttons (three dots pulse). */
export function ButtonBusyDots({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-sm bg-current opacity-80"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </span>
  );
}

/** Stacked lines for comment/note lists loading. */
export function CommentListSkeleton({ lines = 4 }) {
  return (
    <div className="space-y-4 py-4" aria-busy="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="rounded-app-input border border-app-divider bg-app-background p-4">
          <Skeleton className="mb-3 h-4 w-32 rounded-md" />
          <Skeleton className="mb-2 h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-[90%] rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Subscription / billing page layout while plans load. */
export function SubscriptionPageSkeleton() {
  return (
    <div className="w-full bg-gradient-to-br from-app-background to-app-surface-variant">
      <div className="container mx-auto max-w-6xl px-3 pt-3 pb-16 sm:px-4 sm:pt-4 lg:px-6">
        <Skeleton className="mb-3 h-10 w-56 max-w-[85%] rounded-lg" />
        <Skeleton className="mb-8 h-5 w-72 max-w-full rounded-md" />
        <Skeleton className="mb-6 h-56 w-full rounded-app border border-app-divider shadow-app-soft" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 rounded-app border border-app-divider" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Compact thread panel message placeholders. */
export function ChatThreadSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <Skeleton className="h-16 w-[72%] max-w-xs rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

/** Platform admin list/detail style loading shell. */
export function AdminPageSkeleton({ rows = 10 }) {
  return (
    <div className="min-h-screen bg-app-background p-4 font-cairo sm:p-6" aria-busy="true">
      <Skeleton className="mb-6 h-9 w-56 max-w-full rounded-md" />
      <div className="overflow-hidden rounded-app border border-app-divider bg-app-surface shadow-app-soft">
        <div className="flex gap-4 border-b border-app-divider p-4">
          <Skeleton className="h-8 flex-1 rounded-app-input" />
          <Skeleton className="h-8 w-28 shrink-0 rounded-app-input" />
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-4 border-b border-app-divider p-4 last:border-b-0"
          >
            <Skeleton className="h-5 min-w-[120px] flex-1 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Table body placeholder for admin directory pages (inside existing Card). */
export function AdminTableSkeleton({ rows = 10 }) {
  return (
    <div className="divide-y divide-app-divider" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-wrap items-center gap-4 px-4 py-4">
          <Skeleton className="h-5 min-w-[140px] flex-1 rounded-md" />
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Ticket edit / create style loading shell. */
export function TicketEditorSkeleton() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 px-3 py-6 sm:px-4 lg:px-6"
      aria-busy="true"
    >
      <div className="container mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-36 rounded-md" />
        <Skeleton className="h-14 w-full max-w-3xl rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
