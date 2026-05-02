import React from 'react';
import FolderRounded from '@mui/icons-material/FolderRounded';

const palette = ['bg-app-info/15 text-app-info', 'bg-app-primary/12 text-app-primary', 'bg-orange/12 text-orange'];

const formatShort = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Horizontal project card — mirrors Flutter WorkspaceProjectCard (~225px).
 */
const WorkspaceProjectPreviewCard = ({ project, index, onClick }) => {
  const isDone = project.status?.toLowerCase() === 'completed';
  const label = project.status || 'Active';
  const tone = palette[index % palette.length];
  const dateRange =
    project.start_date && project.estimated_end_date
      ? `${formatShort(project.start_date)} – ${formatShort(project.estimated_end_date)}`
      : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-[150px] w-[225px] shrink-0 flex-col rounded-app border border-app-divider bg-app-surface p-4 text-left shadow-app-soft transition-all hover:-translate-y-0.5 hover:shadow-app-card"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          <FolderRounded sx={{ fontSize: 16, color: 'inherit' }} />
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
            isDone ? 'bg-sky-100 text-sky-950' : 'bg-emerald-100 text-emerald-950'
          }`}
        >
          {isDone ? label : label.replace(/_/g, ' ')}
        </span>
      </div>
      <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-bold text-app-text group-hover:text-app-primary">
        {project.project_name || '—'}
      </h3>
      {dateRange ? (
        <p className="mt-auto truncate text-xs text-app-text-secondary">{dateRange}</p>
      ) : (
        <span className="mt-auto block h-4" aria-hidden />
      )}
    </button>
  );
};

export default WorkspaceProjectPreviewCard;
