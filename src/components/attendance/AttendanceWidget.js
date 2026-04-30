import React, { useState, useEffect, useRef, useCallback } from 'react';
import { attendanceAPI } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
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

const AttendanceWidget = () => {
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

    const formatTime = (dateStr) => {
        if (!dateStr) return '--:--';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

    const showDurationBlock = attendance || lastClosedToday;

    if (!hasLoadedOnce) {
        return (
            <Card className="mb-6">
                <Card.Content className="flex justify-center p-6">
                    <Spinner size="md" color="primary" />
                </Card.Content>
            </Card>
        );
    }

    const todayDate = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    return (
        <Card className="mb-8 shadow-lg border-l-4 border-l-indigo-500 overflow-hidden">
            <Card.Content className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    {/* Left Side: Date and Status */}
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium">{todayDate}</p>
                            <h3 className="text-xl font-bold text-gray-800">
                                {attendance
                                    ? tx('checkedIn')
                                    : hasCompletedSessionToday
                                        ? tx('checkedOut')
                                        : tx('notCheckedIn')}
                            </h3>
                        </div>
                    </div>

                    {/* Middle: live duration while checked in; last session length after checkout */}
                    {showDurationBlock && (
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-mono font-bold text-indigo-600 tracking-wider">
                                {calculateDuration()}
                            </span>
                            <span className="text-xs text-gray-400 uppercase tracking-wide">
                                {attendance ? tx('duration') : tx('lastSession')}
                            </span>
                        </div>
                    )}

                    {/* Right Side: Action Button */}
                    <div className="flex flex-col items-end gap-2">
                        {attendance ? (
                            <Button
                                onClick={handleCheckOut}
                                disabled={loading}
                                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md transform hover:-translate-y-0.5"
                            >
                                {tx('checkOut')}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleCheckIn}
                                disabled={loading}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md transform hover:-translate-y-0.5"
                            >
                                {hasCompletedSessionToday ? tx('checkInAgain') : tx('checkInNow')}
                            </Button>
                        )}
                    </div>
                </div>

                {(attendance || lastClosedToday) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-600">
                        <div>
                            <span className="font-semibold mr-2">{tx('in')}</span>
                            {formatTime(
                                attendance
                                    ? attendance.continuousCheckIn || attendance.checkIn
                                    : lastClosedToday.checkIn
                            )}
                        </div>
                        {(attendance || lastClosedToday).checkOut && (
                            <div>
                                <span className="font-semibold mr-2">{tx('out')}</span>
                                {formatTime((attendance || lastClosedToday).checkOut)}
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-4">
                        <Alert variant="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    </div>
                )}
            </Card.Content>
        </Card>
    );
};

export default AttendanceWidget;
