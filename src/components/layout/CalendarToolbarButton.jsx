import React from 'react';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import { useNavigate } from 'react-router-dom';
import { getStoredLanguage, t } from '../../i18n';

/**
 * Opens attendance (Flutter: Me → My Attendance uses Icons.access_time_rounded;
 * same 42×42 surface + shadow treatment as WelcomeSection notification chip).
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
      <AccessTimeRounded sx={{ fontSize: 20 }} aria-hidden />
    </button>
  );
};

export default CalendarToolbarButton;
