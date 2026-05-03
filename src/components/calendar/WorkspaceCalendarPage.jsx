import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded';
import FlagRounded from '@mui/icons-material/FlagRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { arEG } from 'date-fns/locale/ar-EG';
import { enUS } from 'date-fns/locale/en-US';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredLanguage, t } from '../../i18n';
import { attendanceAPI, projectAPI } from '../../services/api';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

/** @typedef {{ title: string; color: string; kind: 'projectStart' | 'projectDue' | 'attendance' }} CalendarEventItem */

const EVENT_COLORS = {
  projectStart: '#2563EB',
  projectDue: '#F59E0B',
  attendance: '#16A34A',
};

const interpolate = (template, vars) =>
  Object.entries(vars).reduce(
    (acc, [k, v]) => acc.split(`{${k}}`).join(String(v)),
    template
  );

const normalizeProjectsList = (data) => {
  if (!data) return [];
  if (Array.isArray(data.projects)) return data.projects;
  if (Array.isArray(data)) return data;
  return [];
};

const projectDisplayName = (p, fallback) =>
  String(p?.project_name ?? p?.projectName ?? '').trim() || fallback;

const parseProjectDate = (raw) => {
  if (raw == null || raw === '') return null;
  try {
    const d = typeof raw === 'string' ? parseISO(raw) : new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  } catch {
    return null;
  }
};

/** Resolve project end/due date from common API shapes (snake_case + camelCase). */
const projectEndDateRaw = (p) =>
  p?.estimated_end_date ??
  p?.estimatedEndDate ??
  p?.end_date ??
  p?.endDate ??
  p?.due_date ??
  p?.dueDate;

const attendanceStatusLabel = (status, lang) => {
  const s = String(status || '').toLowerCase();
  if (s === 'half-day') return t(lang, 'calendarAttendanceHalfDay');
  if (s === 'absent') return t(lang, 'calendarAttendanceAbsent');
  return t(lang, 'calendarAttendancePresent');
};

const surfaceCardClass =
  'rounded-2xl border border-app-border/90 bg-app-surface shadow-[0_1px_2px_rgba(8,9,54,0.04),0_12px_32px_-8px_rgba(8,9,54,0.12)]';

const WorkspaceCalendarPage = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState(getStoredLanguage());
  const isRtl = lang === 'ar';
  const locale = lang === 'ar' ? arEG : enUS;
  /** @type {Record<string, CalendarEventItem[]>} */
  const [eventsByDay, setEventsByDay] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [focusedMonth, setFocusedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const weekStartsOn = lang === 'ar' ? 6 : 0;

  useEffect(() => {
    const onLang = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLang);
    return () => window.removeEventListener('language-changed', onLang);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projectsRes, attendanceRes] = await Promise.all([
        projectAPI.getMyProjects(),
        attendanceAPI.getMyAttendance(500),
      ]);

      const projects = normalizeProjectsList(projectsRes?.data);
      const logs = attendanceRes?.data?.logs || [];
      const fallbackName = t(lang, 'calendarProjectFallback');

      /** @type {Record<string, CalendarEventItem[]>} */
      const map = {};

      const add = (key, item) => {
        if (!key) return;
        if (!map[key]) map[key] = [];
        map[key].push(item);
      };

      for (const p of projects) {
        const name = projectDisplayName(p, fallbackName);
        const start = parseProjectDate(p.start_date ?? p.startDate);
        if (start) {
          add(format(start, 'yyyy-MM-dd'), {
            title: interpolate(t(lang, 'workspaceCalendarProjectStarts'), { name }),
            color: EVENT_COLORS.projectStart,
            kind: 'projectStart',
          });
        }
        const end = parseProjectDate(projectEndDateRaw(p));
        if (end) {
          add(format(end, 'yyyy-MM-dd'), {
            title: interpolate(t(lang, 'workspaceCalendarProjectDue'), { name }),
            color: EVENT_COLORS.projectDue,
            kind: 'projectDue',
          });
        }
      }

      for (const log of logs) {
        const dayKey = log.date ? String(log.date).slice(0, 10) : '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) continue;
        const statusLabel = attendanceStatusLabel(log.status, lang);
        add(dayKey, {
          title: interpolate(t(lang, 'workspaceCalendarAttendance'), { status: statusLabel }),
          color: EVENT_COLORS.attendance,
          kind: 'attendance',
        });
      }

      setEventsByDay(map);
    } catch (e) {
      setError(e?.response?.data?.message || t(lang, 'calendarLoadError'));
      setEventsByDay({});
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(focusedMonth);
    const monthEnd = endOfMonth(focusedMonth);
    const start = startOfWeek(monthStart, { weekStartsOn });
    const end = endOfWeek(monthEnd, { weekStartsOn });
    return eachDayOfInterval({ start, end });
  }, [focusedMonth, weekStartsOn]);

  const weekdayLabels = useMemo(() => {
    const anchor = startOfWeek(new Date(), { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(anchor, i), 'EEE', { locale })
    );
  }, [locale, weekStartsOn]);

  const eventsForSelected = useMemo(() => {
    const key = format(selectedDay, 'yyyy-MM-dd');
    return eventsByDay[key] || [];
  }, [eventsByDay, selectedDay]);

  const monthStats = useMemo(() => {
    const y = focusedMonth.getFullYear();
    const m = focusedMonth.getMonth();
    let total = 0;
    let projectDates = 0;
    let attendance = 0;
    for (const [k, items] of Object.entries(eventsByDay)) {
      const d = parseISO(k);
      if (Number.isNaN(d.getTime()) || d.getMonth() !== m || d.getFullYear() !== y) continue;
      for (const it of items) {
        total += 1;
        const isProjectDate =
          it.kind === 'projectStart' ||
          it.kind === 'projectDue' ||
          (!it.kind &&
            (it.color === EVENT_COLORS.projectStart || it.color === EVENT_COLORS.projectDue));
        if (isProjectDate) projectDates += 1;
        const isAttendance =
          it.kind === 'attendance' || (!it.kind && it.color === EVENT_COLORS.attendance);
        if (isAttendance) attendance += 1;
      }
    }
    return { total, projectDates, attendance };
  }, [eventsByDay, focusedMonth]);

  const goPrevMonth = () => setFocusedMonth((mo) => subMonths(mo, 1));
  const goNextMonth = () => setFocusedMonth((mo) => addMonths(mo, 1));

  const selectedDateLabel = format(selectedDay, 'EEEE, d MMMM yyyy', { locale });

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-app-background via-app-background to-app-surface-variant/40 pb-16 font-cairo text-app-text"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {/* —— Page header (web-first) —— */}
        <header
          className={`mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between ${isRtl ? 'lg:flex-row-reverse' : ''}`}
        >
          <div className="min-w-0 flex-1">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-3 border-app-border text-app-text-secondary hover:bg-app-surface hover:text-app-text"
              icon={<ArrowBackRounded sx={{ fontSize: 22 }} />}
            >
              {t(lang, 'home')}
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-app-text lg:text-3xl">
              {t(lang, 'workspaceCalendarTitle')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-app-text-secondary lg:text-[15px]">
              {t(lang, 'calendarDashSubtitle')}
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-8">
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {/* —— Stat widgets: 3 columns on tablet+ —— */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:mb-10 lg:gap-6">
          <div
            className={`${surfaceCardClass} flex items-center gap-4 p-5 lg:gap-5 lg:p-6 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-app-primary/10 text-app-primary">
              <EventAvailableRounded sx={{ fontSize: 26 }} />
            </div>
            <div className="min-w-0 flex-1 text-start">
              <p className="text-xs font-semibold uppercase leading-snug tracking-wide text-app-text-tertiary">
                {t(lang, 'calendarStatTotalEvents')}
              </p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums leading-none text-app-text lg:text-3xl">
                {loading ? '—' : monthStats.total}
              </p>
            </div>
          </div>
          <div
            className={`${surfaceCardClass} flex items-center gap-4 p-5 lg:gap-5 lg:p-6 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]/12 text-[#2563EB]">
              <FlagRounded sx={{ fontSize: 26 }} />
            </div>
            <div className="min-w-0 flex-1 text-start">
              <p className="text-xs font-semibold uppercase leading-snug tracking-wide text-app-text-tertiary">
                {t(lang, 'calendarStatProjectDates')}
              </p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums leading-none text-app-text lg:text-3xl">
                {loading ? '—' : monthStats.projectDates}
              </p>
            </div>
          </div>
          <div
            className={`${surfaceCardClass} flex items-center gap-4 p-5 lg:gap-5 lg:p-6 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#16A34A]/12 text-[#16A34A]">
              <ScheduleRounded sx={{ fontSize: 26 }} />
            </div>
            <div className="min-w-0 flex-1 text-start">
              <p className="text-xs font-semibold uppercase leading-snug tracking-wide text-app-text-tertiary">
                {t(lang, 'calendarStatAttendance')}
              </p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums leading-none text-app-text lg:text-3xl">
                {loading ? '—' : monthStats.attendance}
              </p>
            </div>
          </div>
        </section>

        {/* —— Main: calendar (8) + detail sidebar (4) —— */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8 xl:gap-10">
          {/* Calendar column */}
          <section className="lg:col-span-8 xl:col-span-8">
            <div className={`${surfaceCardClass} p-5 sm:p-6 lg:p-8`}>
              <div
                className={`mb-6 flex items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-app-border/80 bg-app-surface-variant/50 text-app-text transition-colors hover:bg-app-surface-variant hover:border-app-border"
                  aria-label={t(lang, 'calendarPrevMonth')}
                >
                  {isRtl ? (
                    <ChevronRightRounded sx={{ fontSize: 26 }} />
                  ) : (
                    <ChevronLeftRounded sx={{ fontSize: 26 }} />
                  )}
                </button>
                <h2 className="min-w-0 flex-1 text-center text-lg font-bold text-app-text sm:text-xl lg:text-2xl">
                  {format(focusedMonth, 'MMMM yyyy', { locale })}
                </h2>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-app-border/80 bg-app-surface-variant/50 text-app-text transition-colors hover:bg-app-surface-variant hover:border-app-border"
                  aria-label={t(lang, 'calendarNextMonth')}
                >
                  {isRtl ? (
                    <ChevronLeftRounded sx={{ fontSize: 26 }} />
                  ) : (
                    <ChevronRightRounded sx={{ fontSize: 26 }} />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 border-b border-app-border/80 pb-3 text-center lg:gap-2">
                {weekdayLabels.map((w) => (
                  <div
                    key={w}
                    className="py-2 text-[11px] font-bold uppercase tracking-wider text-app-text-tertiary sm:text-xs lg:text-sm"
                  >
                    {w}
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-1.5 lg:mt-4 lg:gap-2">
                {calendarDays.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDay[key] || [];
                  const markerColors = [...new Set(dayEvents.map((e) => e.color))].slice(0, 3);
                  const inMonth = isSameMonth(day, focusedMonth);
                  const selected = isSameDay(day, selectedDay);
                  const today = isToday(day);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={[
                        'relative flex min-h-[48px] flex-col items-center justify-start rounded-xl border px-0.5 py-2 text-sm font-medium transition-all sm:min-h-[56px] lg:min-h-[72px] lg:py-3 lg:text-base',
                        !inMonth && 'border-transparent text-app-text-tertiary opacity-45',
                        inMonth && 'border-transparent text-app-text',
                        today &&
                          !selected &&
                          'bg-app-secondary/12 font-semibold text-app-text ring-1 ring-app-secondary/30',
                        selected &&
                          'border-app-secondary bg-app-secondary font-semibold text-app-on-secondary shadow-md ring-2 ring-app-secondary/35',
                        !selected && inMonth && 'hover:border-app-border hover:bg-app-surface-variant/80',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span
                        className={
                          selected ? 'font-bold text-app-on-secondary' : 'font-semibold text-inherit'
                        }
                      >
                        {format(day, 'd')}
                      </span>
                      {markerColors.length > 0 && (
                        <span className="mt-auto flex min-h-[10px] items-end justify-center gap-1 pt-1">
                          {markerColors.map((c) => (
                            <span
                              key={c}
                              className="inline-block h-2 w-2 shrink-0 rounded-full lg:h-2.5 lg:w-2.5"
                              style={{
                                backgroundColor: selected ? 'rgba(255,255,255,0.88)' : c,
                              }}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Sidebar: selected day + legend */}
          <aside
            className={`flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-6 lg:self-start xl:col-span-4 ${
              isRtl
                ? 'lg:border-r lg:border-app-border/60 lg:pr-8'
                : 'lg:border-l lg:border-app-border/60 lg:pl-8'
            }`}
          >
            <div className={`${surfaceCardClass} overflow-hidden`}>
              <div className="border-b border-app-border/80 bg-app-surface-variant px-5 py-4 lg:px-6 lg:py-5">
                <p className="text-xs font-bold uppercase tracking-wider text-app-text-tertiary">
                  {t(lang, 'calendarSelectedDay')}
                </p>
                <p className="mt-1.5 text-base font-semibold leading-snug text-app-text lg:text-lg">
                  {selectedDateLabel}
                </p>
              </div>
              <div className="p-5 lg:p-6">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <Spinner size="lg" color="secondary" />
                  </div>
                ) : eventsForSelected.length === 0 ? (
                  <p className="py-10 text-center text-sm leading-relaxed text-app-text-secondary">
                    {t(lang, 'workspaceCalendarNoEventsForDay')}
                  </p>
                ) : (
                  <div className="text-sm lg:text-[15px]">
                    <ul className="divide-y divide-app-border/40">
                      {eventsForSelected.map((ev, idx) => (
                        <li key={`${ev.title}-${idx}`}>
                          <div
                            className={`flex items-start gap-3 py-3 ${isRtl ? 'flex-row-reverse' : ''}`}
                          >
                            <span
                              className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: ev.color }}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 text-start leading-snug text-app-text">
                              {ev.title}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className={`${surfaceCardClass} p-5 lg:p-6`}>
              <h3 className="text-sm font-bold leading-snug text-app-text lg:text-base">
                {t(lang, 'calendarLegendTitle')}
              </h3>
              <ul className="mt-4 divide-y divide-app-border/60">
                <li
                  className={`flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full ring-2 ring-app-border/40 ring-offset-2 ring-offset-app-surface"
                    style={{ backgroundColor: EVENT_COLORS.projectStart }}
                  />
                  <span className="min-w-0 flex-1 text-start text-sm leading-snug text-app-text">
                    {t(lang, 'calendarLegendProjectStart')}
                  </span>
                </li>
                <li
                  className={`flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full ring-2 ring-app-border/40 ring-offset-2 ring-offset-app-surface"
                    style={{ backgroundColor: EVENT_COLORS.projectDue }}
                  />
                  <span className="min-w-0 flex-1 text-start text-sm leading-snug text-app-text">
                    {t(lang, 'calendarLegendProjectDue')}
                  </span>
                </li>
                <li
                  className={`flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full ring-2 ring-app-border/40 ring-offset-2 ring-offset-app-surface"
                    style={{ backgroundColor: EVENT_COLORS.attendance }}
                  />
                  <span className="min-w-0 flex-1 text-start text-sm leading-snug text-app-text">
                    {t(lang, 'calendarLegendAttendance')}
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCalendarPage;
