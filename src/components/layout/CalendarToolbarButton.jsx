import React from 'react';
import CalendarTodayRounded from '@mui/icons-material/CalendarTodayRounded';
import { useNavigate } from 'react-router-dom';
import { getStoredLanguage, t } from '../../i18n';

/**
 * Workspace calendar — same as Flutter `WorkspaceCalendarScreen` (projects + attendance markers).
 */
const CalendarToolbarButton = ({ lang: propLang }) => {
  const navigate = useNavigate();
  const lang = propLang || getStoredLanguage();
  const label = t(lang, 'workspaceCalendarTitle');

  return (
    <button
      type="button"
      onClick={() => navigate('/workspace-calendar')}
      className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-app-input bg-app-surface text-app-text shadow-app-soft transition-colors hover:bg-app-surface-variant hover:text-app-primary"
      aria-label={label}
      title={label}
    >
      <CalendarTodayRounded sx={{ fontSize: 20 }} aria-hidden />
    </button>
  );
};

export default CalendarToolbarButton;
