import React from 'react';
import Button from '../../../ui/Button';

export default function AdminPagination({ page, totalPages, total, onChange, disabled }) {
  if (totalPages <= 1 && !total) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-divider bg-app-surface-variant/40 px-4 py-3 sm:px-6">
      <span className="text-[13px] tabular-nums text-app-text-secondary">
        <span className="font-medium text-app-text">Page {page}</span>
        <span className="mx-1 text-app-text-tertiary">/</span>
        {totalPages}
        {typeof total === 'number' ? (
          <>
            <span className="mx-2 text-app-text-tertiary">·</span>
            <span>{total} total</span>
          </>
        ) : null}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
          className="min-h-[40px] min-w-[40px] px-3"
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="min-h-[40px] min-w-[40px] px-3"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
