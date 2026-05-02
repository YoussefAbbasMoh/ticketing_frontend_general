import React from 'react';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import { useNavigate } from 'react-router-dom';
import { getStoredLanguage, t } from '../../i18n';

/**
 * Opens attendance & history (same route as calendar icon in the app shell).
 */
const CalendarToolbarButton = ({ lang: propLang }) => {
  const navigate = useNavigate();
  const lang = propLang || getStoredLanguage();
  const label = t(lang, 'attendance');

  return (
    <button
      type="button"
      onClick={() => navigate('/attendance')}
      className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-app-input bg-app-surface text-app-text shadow-app-soft transition-colors hover:bg-app-surface-variant hover:text-app-primary"
      aria-label={label}
      title={label}
    >
      <CalendarMonthRounded sx={{ fontSize: 22 }} aria-hidden />
    </button>
  );
};

export default CalendarToolbarButton;
