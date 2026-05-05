import React from 'react';

function EmptyIllustration({ className }) {
  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-app-primary/[0.08] text-app-primary ${className || ''}`}
      aria-hidden
    >
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
    </div>
  );
}

export default function AdminEmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-app border border-dashed border-app-border bg-gradient-to-b from-app-surface-variant/40 to-app-surface/80 px-6 py-14 text-center shadow-inner">
      <EmptyIllustration />
      <p className="mt-5 text-base font-semibold text-app-text">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-app-text-secondary">{description}</p>
      ) : null}
    </div>
  );
}
