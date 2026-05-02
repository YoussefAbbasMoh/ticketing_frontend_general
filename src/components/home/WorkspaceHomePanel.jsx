import React from 'react';

/**
 * Flutter-aligned workspace section shell: white surface, border, shadow,
 * title 18px extrabold + 12px secondary subtitle (matches TicketsSection / ProjectsSection).
 */
const WorkspaceHomePanel = ({ title, subtitle, headerRight, children, className = '', id }) => (
  <section
    id={id}
    className={`mb-8 rounded-app border border-app-divider bg-app-surface p-5 shadow-app-card sm:p-6 ${className}`}
  >
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1 px-0">
                <h2 className="text-[18px] font-extrabold leading-snug tracking-tight text-app-text">{title}</h2>
                {/* Reserve two lines so subtitle length changes (loading → counts) do not shift layout (CLS). */}
                <p className="mt-0.5 min-h-[2.75rem] text-[12px] leading-snug text-app-text-secondary">{subtitle}</p>
      </div>
      {headerRight ? <div className="flex shrink-0 items-center gap-2">{headerRight}</div> : null}
    </div>
    {children}
  </section>
);

export default WorkspaceHomePanel;
