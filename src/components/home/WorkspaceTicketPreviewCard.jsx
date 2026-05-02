import React from 'react';
import ConfirmationNumberRounded from '@mui/icons-material/ConfirmationNumberRounded';
import Badge from '../ui/Badge';

const palette = ['text-app-info', 'text-app-primary'];

const formatStatusLabel = (raw) => {
  const value = (raw || '').trim().toLowerCase();
  if (!value) return 'Open';
  if (value === 'open' || value === 'resolved' || value === 'closed') {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return value
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length === 1 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
};

const getTicketStatusVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'success';
    case 'in_progress':
      return 'warning';
    case 'pending':
      return 'orange';
    case 'resolved':
      return 'info';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Horizontal preview card — mirrors Flutter WorkspaceTicketCard density.
 */
const WorkspaceTicketPreviewCard = ({ ticket, onClick }) => {
  const title = (ticket.ticket || '').trim() || ticket.description?.slice(0, 40) || 'Ticket';
  const desc = (ticket.description || '').trim();
  const projectName = ticket.project?.project_name?.trim() || '';
  const colorIdx = Math.abs((projectName || title).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 2;
  const accent = palette[colorIdx];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-[172px] w-[260px] shrink-0 flex-col rounded-app border border-app-divider bg-app-surface p-4 text-left shadow-app-soft transition-all hover:-translate-y-0.5 hover:border-app-primary hover:shadow-app-card sm:w-[280px]"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-surface-variant ${accent}`}>
          <ConfirmationNumberRounded sx={{ fontSize: 22, color: 'inherit' }} />
        </div>
        <Badge variant={getTicketStatusVariant(ticket.status)} size="sm" className="shrink-0">
          {formatStatusLabel(ticket.status)}
        </Badge>
      </div>
      <h3 className="mb-1 line-clamp-2 text-sm font-bold text-app-text group-hover:text-app-primary">{title}</h3>
      {projectName && (
        <p className="mb-1 truncate text-xs font-semibold text-app-text-secondary">{projectName}</p>
      )}
      {desc && <p className="line-clamp-2 text-xs leading-relaxed text-app-text-secondary">{desc}</p>}
    </button>
  );
};

export default WorkspaceTicketPreviewCard;
