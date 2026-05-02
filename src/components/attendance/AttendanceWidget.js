import React, { useState, useEffect, useRef, useCallback } from 'react';
import { attendanceAPI } from '../../services/api';
import Spinner from '../ui/Spinner';
import { getStoredLanguage } from '../../i18n';

const TEXT = {
    en: {
        failedCheckIn: 'Failed to check in',
        failedCheckOut: 'Failed to check out',
        checkedIn: 'Checked In',
        checkedOut: 'Checked out',
        notCheckedIn: 'Not Checked In',
        duration: 'Duration',
        lastSession: 'Last session',
        checkOut: 'Check Out',
        checkInAgain: 'Check In Again',
        checkInNow: 'Check In Now',
        in: 'In:',
        out: 'Out:',
        hour: 'h',
        minute: 'm',
        todaysAttendance: "TODAY'S ATTENDANCE",
        currentlyWorking: 'Currently Working',
        dayComplete: 'Day Complete',
        notStarted: 'Not Started',
        live: 'Live',
        done: 'Done',
        idle: 'Idle',
        elapsedTime: 'elapsed time',
        totalWorkedToday: 'total worked today',
        checkInChip: 'Check In',
        checkOutChip: 'Check Out',
        greatWork: 'Great work today! See you tomorrow 🎉',
    },
    ar: {
        failedCheckIn: 'فشل تسجيل الحضور',
        failedCheckOut: 'فشل تسجيل الانصراف',
        checkedIn: 'تم تسجيل الحضور',
        checkedOut: 'تم تسجيل الانصراف',
        notCheckedIn: 'لم يتم تسجيل الحضور',
        duration: 'المدة',
        lastSession: 'آخر جلسة',
        checkOut: 'تسجيل انصراف',
        checkInAgain: 'تسجيل حضور مرة أخرى',
        checkInNow: 'تسجيل حضور الآن',
        in: 'دخول:',
        out: 'خروج:',
        hour: 'س',
        minute: 'د',
        todaysAttendance: 'حضور اليوم',
        currentlyWorking: 'قيد العمل الآن',
        dayComplete: 'اكتمل اليوم',
        notStarted: 'لم يبدأ',
        live: 'مباشر',
        done: 'تم',
        idle: 'خامل',
        elapsedTime: 'الوقت المنقضي',
        totalWorkedToday: 'إجمالي العمل اليوم',
        checkInChip: 'تسجيل دخول',
        checkOutChip: 'تسجيل خروج',
        greatWork: 'عمل رائع اليوم! نراك غدًا 🎉',
    },
};

/** Sessions whose check-in falls on the user's local calendar day (matches the date shown in the UI). */
const getLocalDayBounds = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
};

const filterLogsForLocalToday = (logs) => {
    const { start, end } = getLocalDayBounds();
    const utcStr = new Date().toISOString().split('T')[0];
    const pad = (n) => String(n).padStart(2, '0');
    const localStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    return logs.filter((log) => {
        if (log.checkIn) {
            const t = new Date(log.checkIn);
            if (!Number.isNaN(t.getTime())) {
                return t >= start && t <= end;
            }
        }
        if (log.date) {
            return log.date === utcStr || log.date === localStr;
        }
        return false;
    });
};

const AttendanceWidget = ({ onAttendanceKindChange }) => {
    const [loading, setLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [attendance, setAttendance] = useState(null);
    /** Last closed session today (shown after checkout until next check-in) */
    const [lastClosedToday, setLastClosedToday] = useState(null);
    /** At least one closed session today (enables another check-in on the same day) */
    const [hasCompletedSessionToday, setHasCompletedSessionToday] = useState(false);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lang, setLang] = useState(getStoredLanguage());
    const tx = (key) => TEXT[lang]?.[key] || TEXT.en[key] || key;

    /** Ignore out-of-order responses when multiple fetches overlap (Strict Mode, refresh, bfcache). */
    const fetchGenRef = useRef(0);

    const fetchStatus = useCallback(async () => {
        const gen = ++fetchGenRef.current;
        setLoading(true);
        try {
            const response = await attendanceAPI.getMyAttendance(200);
            if (gen !== fetchGenRef.current) return;

            const logs = response.data.logs || [];

            const activeSession = logs.find((log) => !log.checkOut) || null;
            const todayLogs = filterLogsForLocalToday(logs);
            const closed = todayLogs.filter((log) => log.checkOut);
            const lastClosed =
                closed.length > 0
                    ? [...closed].sort((a, b) => new Date(b.checkOut) - new Date(a.checkOut))[0]
                    : null;

            setAttendance(activeSession || null);
            setLastClosedToday(activeSession ? null : lastClosed);
            setHasCompletedSessionToday(closed.length > 0);
        } catch (err) {
            if (gen !== fetchGenRef.current) return;
            console.error('Error fetching attendance:', err);
        } finally {
            if (gen === fetchGenRef.current) {
                setLoading(false);
                setHasLoadedOnce(true);
            }
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const onPageShow = (e) => {
            if (e.persisted) fetchStatus();
        };
        window.addEventListener('pageshow', onPageShow);
        return () => {
            clearInterval(timer);
            window.removeEventListener('pageshow', onPageShow);
        };
    }, [fetchStatus]);

    useEffect(() => {
        const onLanguageChanged = () => setLang(getStoredLanguage());
        window.addEventListener('language-changed', onLanguageChanged);
        return () => window.removeEventListener('language-changed', onLanguageChanged);
    }, []);

    useEffect(() => {
        if (!onAttendanceKindChange) return;
        if (!hasLoadedOnce) {
            onAttendanceKindChange('loading');
            return;
        }
        const kind = attendance
            ? 'checkedIn'
            : hasCompletedSessionToday
              ? 'checkedOut'
              : 'notCheckedIn';
        onAttendanceKindChange(kind);
    }, [hasLoadedOnce, attendance, hasCompletedSessionToday, onAttendanceKindChange]);

    const handleCheckIn = async () => {
        try {
            setLoading(true);
            await attendanceAPI.checkIn();
            await fetchStatus();
        } catch (err) {
            setError(err.response?.data?.message || tx('failedCheckIn'));
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setLoading(true);
            await attendanceAPI.checkOut();
            await fetchStatus();
        } catch (err) {
            setError(err.response?.data?.message || tx('failedCheckOut'));
            setLoading(false);
        }
    };

    const formatDurationFromSession = (log, endOverride) => {
        if (!log?.checkIn) return '0h 0m';
        const start = new Date(log.continuousCheckIn || log.checkIn);
        const end = endOverride ?? (log.checkOut ? new Date(log.checkOut) : currentTime);
        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}${tx('hour')} ${mins}${tx('minute')}`;
    };

    const calculateDuration = () => {
        if (attendance) {
            return formatDurationFromSession(attendance, null);
        }
        if (lastClosedToday) {
            return formatDurationFromSession(lastClosedToday, new Date(lastClosedToday.checkOut));
        }
        return `0${tx('hour')} 0${tx('minute')}`;
    };

    const formatTimeAmpm = (dateStr) => {
        if (!dateStr) return '--:--';
        return new Date(dateStr).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const formatElapsedHMS = () => {
        if (!attendance?.checkIn) return '-- : -- : --';
        const start = new Date(attendance.continuousCheckIn || attendance.checkIn);
        const diffMs = currentTime.getTime() - start.getTime();
        const totalSec = Math.max(0, Math.floor(diffMs / 1000));
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const isLive = !!attendance;
    const isDone = !attendance && hasCompletedSessionToday;

    const mainTimerDisplay = isLive
        ? formatElapsedHMS()
        : isDone && lastClosedToday
          ? calculateDuration()
          : '-- : -- : --';

    const timerDimmed = !isLive && !isDone;

    const checkInChipTime = attendance
        ? formatTimeAmpm(attendance.continuousCheckIn || attendance.checkIn)
        : lastClosedToday
          ? formatTimeAmpm(lastClosedToday.checkIn)
          : '--:--';

    const checkOutChipTime = attendance
        ? '--:--'
        : lastClosedToday?.checkOut
          ? formatTimeAmpm(lastClosedToday.checkOut)
          : '--:--';

    const statusTitle = isLive ? tx('currentlyWorking') : isDone ? tx('dayComplete') : tx('notStarted');

    if (!hasLoadedOnce) {
        return (
            <div className="relative mb-8 overflow-hidden rounded-3xl shadow-[0_12px_30px_rgba(8,9,54,0.28)]">
                <div className="absolute inset-0 bg-gradient-to-br from-app-primary via-[#141B52] to-[#1A5278]" />
                <div className="relative flex min-h-[220px] items-center justify-center p-8">
                    <Spinner size="lg" color="white" />
                </div>
            </div>
        );
    }

    const isRtl = lang === 'ar';

    return (
        <div
            className={`relative mb-8 overflow-hidden rounded-3xl shadow-[0_12px_30px_rgba(8,9,54,0.28)] ${isRtl ? 'text-right' : 'text-left'}`}
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-app-primary via-[#141B52] to-[#1A5278]" aria-hidden />
            <div className="pointer-events-none absolute -right-5 -top-8 h-32 w-32 rounded-full bg-white/[0.05]" aria-hidden />
            <div className="pointer-events-none absolute -bottom-10 left-[4.5rem] h-40 w-40 rounded-full bg-white/[0.04] sm:h-44 sm:w-44" aria-hidden />

            <div className="relative z-10 p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">{tx('todaysAttendance')}</p>
                        <p className="mt-1 text-base font-bold text-white">{statusTitle}</p>
                    </div>
                    <div
                        className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-[11px] font-bold text-white sm:self-auto ${
                            isLive
                                ? 'border-app-success/50 bg-app-success/20'
                                : 'border-white/20 bg-white/10'
                        }`}
                    >
                        <span>{isLive ? '🟢' : isDone ? '✓' : '○'}</span>
                        <span>{isLive ? tx('live') : isDone ? tx('done') : tx('idle')}</span>
                    </div>
                </div>

                <div className="mt-6">
                    <p
                        className={`font-mono text-[34px] font-extrabold tracking-[0.08em] sm:text-[38px] ${timerDimmed ? 'text-white/35' : 'text-white'}`}
                    >
                        {mainTimerDisplay}
                    </p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">
                        {isLive ? tx('elapsedTime') : tx('totalWorkedToday')}
                    </p>
                </div>

                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                    <div className="flex flex-1 items-center gap-2 rounded-app-input border border-white/15 bg-white/10 px-3 py-2.5">
                        <svg className="h-4 w-4 shrink-0 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-white/50">{tx('checkInChip')}</p>
                            <p className="text-sm font-bold text-white">{checkInChipTime}</p>
                        </div>
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded-app-input border border-white/15 bg-white/10 px-3 py-2.5">
                        <svg className="h-4 w-4 shrink-0 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-white/50">{tx('checkOutChip')}</p>
                            <p className="text-sm font-bold text-white">{checkOutChipTime}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    {isLive ? (
                        <button
                            type="button"
                            onClick={handleCheckOut}
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2.5 rounded-app-input bg-app-error py-4 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(220,38,38,0.45)] transition hover:brightness-110 disabled:opacity-60"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {tx('checkOut')}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleCheckIn}
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2.5 rounded-app-input bg-orange py-4 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(251,101,28,0.45)] transition hover:brightness-110 disabled:opacity-60"
                        >
                            {isDone ? (
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                            )}
                            {isDone ? tx('checkInAgain') : tx('checkInNow')}
                        </button>
                    )}
                </div>

                {isDone && (
                    <div className="mt-5 rounded-app-input border border-white/20 bg-white/10 px-4 py-3.5 text-center">
                        <p className="flex flex-wrap items-center justify-center gap-2 text-[13px] font-bold text-white">
                            <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {tx('greatWork')}
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mt-5 flex items-start justify-between gap-3 rounded-app-input border border-white/25 bg-red-500/15 px-3 py-2.5 text-sm font-medium text-white">
                        <span className="min-w-0 flex-1">{error}</span>
                        <button
                            type="button"
                            onClick={() => setError('')}
                            className="shrink-0 rounded-lg px-2 py-0.5 opacity-80 hover:bg-white/10 hover:opacity-100"
                            aria-label="Dismiss"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceWidget;
