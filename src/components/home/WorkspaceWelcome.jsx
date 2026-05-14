import React, { useMemo } from 'react';
import AddRounded from '@mui/icons-material/AddRounded';
import ChatRounded from '@mui/icons-material/ChatRounded';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import Button from '../ui/Button';
import { t } from '../../i18n';

const TEXT = {
  en: {
    goodMorning: 'Good Morning ☀️',
    goodAfternoon: 'Good Afternoon 🌤️',
    goodEvening: 'Good Evening 🌙',
    notCheckedIn: 'Not Checked In',
    working: 'Working',
    doneForToday: 'Done for Today',
    chat: 'Chat',
    newProject: 'New Project',
  },
  ar: {
    goodMorning: 'صباح الخير ☀️',
    goodAfternoon: 'مساء الخير 🌤️',
    goodEvening: 'مساء الخير 🌙',
    notCheckedIn: 'لم يُسجَّل الحضور',
    working: 'جاري العمل',
    doneForToday: 'انتهى اليوم',
    chat: 'الدردشة',
    newProject: 'مشروع جديد',
  },
};

const formatWorkspaceDate = (lang) => {
  const now = new Date();
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(now);
};

const greetingForHour = (hour, lang) => {
  const t = TEXT[lang] || TEXT.en;
  if (hour < 12) return t.goodMorning;
  if (hour < 17) return t.goodAfternoon;
  return t.goodEvening;
};

/**
 * Flutter-aligned welcome row: time greeting, first name, date, attendance pill, admin actions.
 */
const WorkspaceWelcome = ({
  lang,
  userName,
  welcomeFallback = '',
  companySuffix = '',
  attendanceKind = 'loading',
  isAdmin,
  onChat,
  onNewProject,
  onNewWorkspace,
  isRtl,
}) => {
  const tx = (key) => TEXT[lang]?.[key] || TEXT.en[key] || key;
  const hour = useMemo(() => new Date().getHours(), []);
  const greeting = greetingForHour(hour, lang);
  const dateLine = formatWorkspaceDate(lang);
  const firstName = (userName || '').trim().split(/\s+/)[0] || '';
  const displayName = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : '';

  const pillClass =
    attendanceKind === 'notCheckedIn'
      ? 'bg-app-error/12 text-app-error'
      : attendanceKind === 'checkedIn'
        ? 'bg-app-success/12 text-app-success'
        : attendanceKind === 'checkedOut'
          ? 'bg-app-info/12 text-app-info'
          : 'bg-app-surface-variant text-app-text-tertiary';

  const pillLabel =
    attendanceKind === 'notCheckedIn'
      ? tx('notCheckedIn')
      : attendanceKind === 'checkedIn'
        ? tx('working')
        : attendanceKind === 'checkedOut'
          ? tx('doneForToday')
          : '…';

  return (
    <div
      className={`mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between ${isRtl ? 'sm:flex-row-reverse' : ''}`}
    >
      <div className={isRtl ? 'text-right' : 'text-left'}>
        <p className="text-[13px] font-semibold text-app-text-secondary">{greeting}</p>
        <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight text-app-text">
          <span className="text-orange-dark">{displayName || welcomeFallback}</span>
          {companySuffix ? (
            <span className="font-semibold text-app-text-secondary">{companySuffix}</span>
          ) : null}
        </h1>
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-app-text-secondary">
          {dateLine}
        </p>

        <div className="mt-3">
          <div
            className={`inline-flex min-h-[30px] items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold ${pillClass} ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            {attendanceKind === 'loading' && (
              <span className="h-2 w-16 animate-pulse rounded-full bg-current/30" />
            )}
            {attendanceKind === 'checkedIn' && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-app-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-app-success" />
              </span>
            )}
            {attendanceKind === 'checkedOut' && (
              <CheckCircleOutlineRounded sx={{ fontSize: 14 }} className="shrink-0" />
            )}
            {attendanceKind === 'notCheckedIn' && (
              <RadioButtonUncheckedRounded sx={{ fontSize: 14 }} className="shrink-0" />
            )}
            {attendanceKind !== 'loading' && <span>{pillLabel}</span>}
          </div>
        </div>
      </div>

      <div className={`flex flex-col items-stretch gap-3 sm:items-end ${isRtl ? 'sm:items-start' : ''}`}>
        <div className={`flex flex-wrap gap-2 sm:justify-end ${isRtl ? 'sm:justify-start' : ''}`}>
          {typeof onNewWorkspace === 'function' && (
            <Button
              variant="outline"
              size="lg"
              onClick={onNewWorkspace}
              className="border-2 border-app-primary text-app-primary shadow-app-soft transition-transform hover:-translate-y-0.5 hover:bg-app-primary/5"
              icon={<BusinessOutlined sx={{ fontSize: 22 }} />}
            >
              {t(lang, 'newWorkspace')}
            </Button>
          )}
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="lg"
                onClick={onChat}
                className="border-2 border-orange-dark text-orange-dark shadow-app-soft transition-transform hover:-translate-y-0.5 hover:bg-orange-dark/5 hover:shadow-app-card"
                icon={<ChatRounded sx={{ fontSize: 22 }} />}
              >
                {tx('chat')}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={onNewProject}
                className="bg-orange-dark shadow-app-soft transition-transform hover:-translate-y-0.5 hover:opacity-95 hover:shadow-app-card"
                icon={<AddRounded sx={{ fontSize: 22 }} />}
              >
                {tx('newProject')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceWelcome;
