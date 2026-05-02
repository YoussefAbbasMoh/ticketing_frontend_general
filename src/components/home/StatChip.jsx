import React from 'react';
import BoltRounded from '@mui/icons-material/BoltRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';

/** Matches Flutter `projects_section.dart` StatChip icons. */
const iconSx = { fontSize: 18, color: 'inherit' };

const iconMap = {
  active: <BoltRounded sx={iconSx} />,
  completed: <CheckCircleRounded sx={iconSx} />,
  total: <FolderRounded sx={iconSx} />,
};

const toneClass = {
  success: 'border-emerald-800/25 bg-emerald-50 text-emerald-950',
  info: 'border-sky-800/25 bg-sky-50 text-sky-950',
  primary: 'border-app-primary/30 bg-app-primary/8 text-app-text',
};

/**
 * Flutter workspace StatChip: compact pill with icon, label, count.
 */
const StatChip = ({ label, count, tone = 'primary', icon = 'total' }) => (
  <div
    className={`flex min-w-0 flex-1 items-center gap-2 rounded-app-input border px-3 py-2.5 shadow-app-soft sm:min-w-[120px] ${toneClass[tone] || toneClass.primary}`}
  >
    <span className="shrink-0 text-[inherit] opacity-90">{iconMap[icon] || iconMap.total}</span>
    <div className="min-w-0">
      <p className="truncate text-[11px] font-semibold opacity-90">{label}</p>
      <p className="text-lg font-bold tabular-nums">{count}</p>
    </div>
  </div>
);

export default StatChip;
