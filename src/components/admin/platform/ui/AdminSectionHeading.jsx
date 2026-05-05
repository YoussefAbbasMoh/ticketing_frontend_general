import React from 'react';

/** Small uppercase section label for grouping charts / tables. */
export default function AdminSectionHeading({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-app-text-tertiary">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-app-text-secondary leading-snug">{description}</p>
      ) : null}
    </div>
  );
}
