import React, { useState } from 'react';

const ROLE_ORDER = ['owner', 'admin', 'manager', 'user'];

/**
 * Pick company role: drag a chip into the dashed slot, or click a chip.
 */
const RoleDragDropSelect = ({
  value,
  onChange,
  onBlur,
  label,
  error,
  disabled,
  labelForRole,
  hintDropZone,
  hintPool,
  emptySlotLabel,
  /** Subset of ROLE_ORDER the inviter may assign (e.g. hide owner for non-owners). */
  allowedRoles = ROLE_ORDER,
  /** When disabled: main line (e.g. current role label) */
  disabledTitle,
  /** When disabled: helper under the box */
  disabledHint,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const poolRoles = ROLE_ORDER.filter((r) => allowedRoles.includes(r));

  if (disabled) {
    return (
      <div className="w-full">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
        <div className="w-full rounded-lg border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {disabledTitle}
        </div>
        {disabledHint && (
          <p className="mt-1.5 text-[13px] text-gray-600">{disabledHint}</p>
        )}
      </div>
    );
  }

  const setRole = (r) => {
    onChange(r);
    if (onBlur) onBlur({ target: { name: 'role' } });
  };

  const onDragStart = (e, role) => {
    e.dataTransfer.setData('text/role', role);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOverSlot = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const onDragLeaveSlot = () => setDragOver(false);

  const onDropSlot = (e) => {
    e.preventDefault();
    setDragOver(false);
    const r = e.dataTransfer.getData('text/role');
    if (poolRoles.includes(r)) setRole(r);
  };

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        <span className="ml-1 text-red-500">*</span>
      </label>

      <div
        role="group"
        aria-label={label}
        onDragOver={onDragOverSlot}
        onDragLeave={onDragLeaveSlot}
        onDrop={onDropSlot}
        className={`mb-3 min-h-[52px] rounded-xl border-2 border-dashed px-3 py-2.5 transition-colors ${
          dragOver
            ? 'border-secondary-500 bg-secondary-500/5'
            : error
              ? 'border-app-error bg-app-error/5'
              : 'border-gray-300 bg-gray-50/80'
        }`}
      >
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">{hintDropZone}</p>
        <div className="flex min-h-[32px] items-center">
          {value ? (
            <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
              {labelForRole(value)}
            </span>
          ) : (
            <span className="text-sm text-gray-400">{emptySlotLabel}</span>
          )}
        </div>
      </div>

      <p className="mb-2 text-[12px] text-gray-500">{hintPool}</p>
      <div className="flex flex-wrap gap-2">
        {poolRoles.map((r) => (
          <button
            key={r}
            type="button"
            draggable
            onDragStart={(e) => onDragStart(e, r)}
            onClick={() => setRole(r)}
            className={`cursor-grab active:cursor-grabbing rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all hover:shadow-md ${
              value === r
                ? 'border-secondary-500 bg-secondary-500/10 text-secondary-800'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            {labelForRole(r)}
          </button>
        ))}
      </div>
      {error && <p className="mt-1.5 text-[13px] text-app-error">{error}</p>}
    </div>
  );
};

export default RoleDragDropSelect;
export { ROLE_ORDER };
