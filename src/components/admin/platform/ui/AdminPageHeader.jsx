import React from 'react';

/**
 * Consistent page title, optional eyebrow, description, and action slot (filters, refresh, etc.).
 */
export default function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-app-divider/90 pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-app-text-tertiary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-app-text sm:text-[28px] sm:leading-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-app-body text-app-text-secondary leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      ) : null}
    </header>
  );
}
