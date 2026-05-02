import React, { useState, useEffect, useMemo } from 'react';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import { useNavigate } from 'react-router-dom';
import { attendanceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import AttendancePageSkeleton, { AttendanceTableSkeleton } from './AttendancePageSkeleton';
import { getStoredLanguage, t as i18nT } from '../../i18n';

/** For datetime-local inputs (browser local timezone) */
const toLocalDateTimeValue = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalDateTimeValue = (v) => {
    if (!v || !v.trim()) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
};

const TEXT = {
    en: {
        title: 'Attendance',
        subtitle: 'Track and manage attendance records',
        failedFetchHistory: 'Failed to fetch attendance history',
        failedFetchSummary: 'Failed to fetch attendance summary',
        checkInRequired: 'Check-in time is required',
        setCheckoutOrOpenSession: 'Set check-out time or enable "Open session"',
        updatedSuccessfully: 'Attendance updated successfully',
        failedUpdate: 'Failed to update attendance',
        couldNotDownload: 'Could not download report',
        failedDownload: 'Failed to download report',
        timedOut: 'Download timed out. Please try again.',
        interrupted: 'The download was interrupted. Check your connection, disable ad-blockers for this site, or try another browser.',
        myAttendance: 'My Attendance',
        attendanceSummary: 'Attendance Summary',
        generateMonthly: 'Generate Monthly Report',
        downloadForAll: 'Download Excel report for all users',
        month: 'Month',
        year: 'Year',
        downloading: 'Downloading...',
        downloadExcel: 'Download Excel',
        loadingRecords: 'Loading records...',
        noPersonalRecords: 'No personal attendance records found.',
        noRecords: 'No records found.',
        date: 'Date',
        checkIn: 'Check In',
        checkOut: 'Check Out',
        duration: 'Duration',
        status: 'Status',
        actions: 'Actions',
        active: 'Active',
        edit: 'Edit',
        user: 'User',
        role: 'Role',
        unknown: 'Unknown',
        previous: 'Previous',
        next: 'Next',
        pageOf: 'Page {{page}} of {{total}}',
        editAttendance: 'Edit attendance',
        openSession: 'Open session (no check-out yet)',
        note: 'Note',
        optionalNote: 'Optional note',
        cancel: 'Cancel',
        saving: 'Saving...',
        saveChanges: 'Save changes'
    },
    ar: {
        title: 'الحضور',
        subtitle: 'متابعة وإدارة سجلات الحضور',
        failedFetchHistory: 'فشل في جلب سجل الحضور',
        failedFetchSummary: 'فشل في جلب ملخص الحضور',
        checkInRequired: 'وقت الحضور مطلوب',
        setCheckoutOrOpenSession: 'حددي وقت الانصراف أو فعّلي خيار الجلسة المفتوحة',
        updatedSuccessfully: 'تم تحديث الحضور بنجاح',
        failedUpdate: 'فشل في تحديث الحضور',
        couldNotDownload: 'تعذر تحميل التقرير',
        failedDownload: 'فشل في تحميل التقرير',
        timedOut: 'انتهت مهلة التحميل، حاولي مرة أخرى.',
        interrupted: 'تمت مقاطعة التحميل. تحققي من الاتصال أو أوقفي مانع الإعلانات لهذا الموقع أو جربي متصفحًا آخر.',
        myAttendance: 'حضوري',
        attendanceSummary: 'ملخص الحضور',
        generateMonthly: 'إنشاء تقرير شهري',
        downloadForAll: 'تحميل تقرير Excel لجميع المستخدمين',
        month: 'الشهر',
        year: 'السنة',
        downloading: 'جارٍ التحميل...',
        downloadExcel: 'تحميل Excel',
        loadingRecords: 'جارٍ تحميل السجلات...',
        noPersonalRecords: 'لا توجد سجلات حضور شخصية.',
        noRecords: 'لا توجد سجلات.',
        date: 'التاريخ',
        checkIn: 'الحضور',
        checkOut: 'الانصراف',
        duration: 'المدة',
        status: 'الحالة',
        actions: 'الإجراءات',
        active: 'نشط',
        edit: 'تعديل',
        user: 'المستخدم',
        role: 'الدور',
        unknown: 'غير معروف',
        previous: 'السابق',
        next: 'التالي',
        pageOf: 'صفحة {{page}} من {{total}}',
        editAttendance: 'تعديل الحضور',
        openSession: 'جلسة مفتوحة (بدون انصراف حتى الآن)',
        note: 'ملاحظة',
        optionalNote: 'ملاحظة اختيارية',
        cancel: 'إلغاء',
        saving: 'جارٍ الحفظ...',
        saveChanges: 'حفظ التغييرات'
    }
};

const formatText = (template, vars = {}) =>
    Object.entries(vars).reduce(
        (acc, [key, value]) => acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value)),
        template
    );

const AttendancePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
    const [lang, setLang] = useState(getStoredLanguage());
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    const isRtl = lang === 'ar';
    const yearOptions = useMemo(() => {
        const y = new Date().getFullYear();
        return [y - 2, y - 1, y, y + 1, y + 2];
    }, []);
    const tt = (key, vars) => {
        const value = TEXT[lang]?.[key] || TEXT.en[key] || key;
        return formatText(value, vars || {});
    };

    const [activeTab, setActiveTab] = useState('my_attendance');
    const [logs, setLogs] = useState([]);
    const [allLogs, setAllLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination for All Logs
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Report state
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [downloading, setDownloading] = useState(false);

    // Admin edit attendance modal
    const [editOpen, setEditOpen] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [editCheckIn, setEditCheckIn] = useState('');
    const [editCheckOut, setEditCheckOut] = useState('');
    const [editOpenSession, setEditOpenSession] = useState(false);
    const [editStatus, setEditStatus] = useState('present');
    const [editNote, setEditNote] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (activeTab === 'my_attendance') {
            fetchMyLogs();
        } else if (activeTab === 'summary' && isManagerOrAdmin) {
            fetchAllLogs();
        }
    }, [activeTab, page, reportMonth, reportYear]);

    useEffect(() => {
        const onLanguageChanged = () => setLang(getStoredLanguage());
        window.addEventListener('language-changed', onLanguageChanged);
        return () => window.removeEventListener('language-changed', onLanguageChanged);
    }, []);

    const fetchMyLogs = async () => {
        try {
            setLoading(true);
            const response = await attendanceAPI.getMyAttendance(50);
            setLogs(response.data.logs || []);
        } catch {
            setError(tt('failedFetchHistory'));
        } finally {
            setLoading(false);
        }
    };

    const fetchAllLogs = async () => {
        try {
            setLoading(true);
            const response = await attendanceAPI.getAllAttendance(page, 20, {
                month: reportMonth,
                year: reportYear,
            });
            setAllLogs(response.data.logs || []);
            setTotalPages(response.data.pagination?.pages || 1);
        } catch (err) {
            setError(err.response?.data?.message || tt('failedFetchSummary'));
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (log) => {
        setEditRecord(log);
        setEditCheckIn(toLocalDateTimeValue(log.checkIn));
        setEditCheckOut(log.checkOut ? toLocalDateTimeValue(log.checkOut) : '');
        setEditOpenSession(!log.checkOut);
        setEditStatus(log.status || 'present');
        setEditNote(log.note || '');
        setEditOpen(true);
        setError('');
        setSuccessMsg('');
    };

    const closeEditModal = () => {
        setEditOpen(false);
        setEditRecord(null);
        setSavingEdit(false);
    };

    const handleSaveEdit = async () => {
        if (!editRecord?._id) return;
        const checkInIso = fromLocalDateTimeValue(editCheckIn);
        if (!checkInIso) {
            setError(tt('checkInRequired'));
            return;
        }
        try {
            setSavingEdit(true);
            setError('');
            const payload = {
                checkIn: checkInIso,
                status: editStatus,
                note: editNote
            };
            if (editOpenSession) {
                payload.checkOut = null;
            } else {
                const outIso = fromLocalDateTimeValue(editCheckOut);
                if (!outIso) {
                    setError(tt('setCheckoutOrOpenSession'));
                    setSavingEdit(false);
                    return;
                }
                payload.checkOut = outIso;
            }
            await attendanceAPI.adminUpdateAttendance(editRecord._id, payload);
            setSuccessMsg(tt('updatedSuccessfully'));
            closeEditModal();
            await fetchMyLogs();
            if (isManagerOrAdmin) {
                await fetchAllLogs();
            }
        } catch (err) {
            setError(err.response?.data?.message || tt('failedUpdate'));
        } finally {
            setSavingEdit(false);
        }
    };

    const parseBlobErrorMessage = async (data) => {
        if (!(data instanceof Blob)) return null;
        const text = await data.text();
        try {
            const j = JSON.parse(text);
            return j.message || j.error || null;
        } catch {
            return text?.slice(0, 200) || null;
        }
    };

    const handleDownloadReport = async () => {
        try {
            setDownloading(true);
            setError('');
            const response = await attendanceAPI.downloadReport(reportMonth, reportYear, 'xlsx');

            const ct = (response.headers['content-type'] || '').toLowerCase();
            if (ct.includes('application/json')) {
                const msg = await parseBlobErrorMessage(response.data);
                setError(msg || tt('couldNotDownload'));
                return;
            }

            const blob =
                response.data instanceof Blob
                    ? response.data
                    : new Blob([response.data], { type: 'application/vnd.ms-excel' });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const m = String(reportMonth).padStart(2, '0');
            link.setAttribute('download', `attendance_report_${reportYear}_${m}.xls`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            // Revoking the URL immediately can cancel the download in some browsers.
            window.setTimeout(() => {
                try {
                    window.URL.revokeObjectURL(url);
                } catch {
                    /* ignore */
                }
            }, 120000);
        } catch (err) {
            let msg = tt('failedDownload');
            const status = err.response?.status;
            const data = err.response?.data;

            // Prefer server JSON (401/403/500) over generic "aborted" heuristics
            if (data instanceof Blob && status) {
                try {
                    const parsed = await parseBlobErrorMessage(data);
                    if (parsed) {
                        setError(parsed);
                        return;
                    }
                } catch {
                    /* ignore */
                }
            }
            if (err.response?.data && typeof err.response.data === 'object' && err.response.data.message) {
                setError(err.response.data.message);
                return;
            }

            const code = err.code;
            const isTimeout =
                code === 'ECONNABORTED' && String(err.message || '').toLowerCase().includes('timeout');
            const isAbort =
                code === 'ERR_CANCELED' ||
                String(err.message || '') === 'Request aborted';
            if (isTimeout) {
                msg = tt('timedOut');
            } else if (isAbort) {
                msg = tt('interrupted');
            } else if (err.message) {
                msg = err.message;
            }
            setError(msg);
        } finally {
            setDownloading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    };

    const showFullPageSkeleton =
        loading &&
        activeTab === 'my_attendance' &&
        logs.length === 0 &&
        !error &&
        !successMsg;

    if (showFullPageSkeleton) {
        return <AttendancePageSkeleton />;
    }

    return (
        <div
            className="min-h-screen bg-app-background pb-12 font-cairo text-app-text"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <div className="container mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="mb-4 border-app-border text-app-text-secondary hover:bg-app-surface-variant hover:text-app-text"
                        icon={<ArrowBackRounded sx={{ fontSize: 22 }} />}
                    >
                        {i18nT(lang, 'home')}
                    </Button>
                    <h1 className="text-[22px] font-extrabold tracking-tight text-app-text sm:text-[28px]">
                        {tt('title')}
                    </h1>
                    <p className="mt-1 text-[12px] leading-snug text-app-text-secondary sm:text-[13px]">
                        {tt('subtitle')}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6">
                    <Alert variant="error" onClose={() => setError('')}>{error}</Alert>
                </div>
            )}
            {successMsg && (
                <div className="mb-6">
                    <Alert variant="success" onClose={() => setSuccessMsg('')}>{successMsg}</Alert>
                </div>
            )}

            {/* Tabs — same chip style language as project filters */}
            {isManagerOrAdmin && (
                <div className={`mb-6 flex flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <button
                        type="button"
                        className={`rounded-app-input px-4 py-2.5 text-sm font-bold transition-colors ${
                            activeTab === 'my_attendance'
                                ? 'bg-app-primary text-white shadow-app-soft'
                                : 'border border-app-border bg-app-surface-variant text-app-text-secondary hover:bg-app-border/40'
                        }`}
                        onClick={() => setActiveTab('my_attendance')}
                    >
                        {tt('myAttendance')}
                    </button>
                    <button
                        type="button"
                        className={`rounded-app-input px-4 py-2.5 text-sm font-bold transition-colors ${
                            activeTab === 'summary'
                                ? 'bg-app-primary text-white shadow-app-soft'
                                : 'border border-app-border bg-app-surface-variant text-app-text-secondary hover:bg-app-border/40'
                        }`}
                        onClick={() => {
                            setActiveTab('summary');
                            setPage(1);
                        }}
                    >
                        {tt('attendanceSummary')}
                    </button>
                </div>
            )}

            {/* Admin Report Section - Only visible in Summary Tab for Admins/Managers */}
            {isManagerOrAdmin && activeTab === 'summary' && (
                <Card className="mb-8 shadow-app-card">
                    <Card.Content className="p-5 sm:p-6">
                        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                            <div className="min-w-0">
                                <h2 className="text-[18px] font-extrabold tracking-tight text-app-text">
                                    {tt('generateMonthly')}
                                </h2>
                                <p className="mt-0.5 text-[12px] text-app-text-secondary">{tt('downloadForAll')}</p>
                            </div>
                            <div className={`flex w-full flex-wrap items-end gap-4 sm:w-auto ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                                <div>
                                    <label htmlFor="report-month" className="mb-1 block text-xs font-semibold text-app-text-secondary">
                                        {tt('month')}
                                    </label>
                                    <select
                                        id="report-month"
                                        value={reportMonth}
                                        onChange={(e) => {
                                            setReportMonth(parseInt(e.target.value, 10));
                                            setPage(1);
                                        }}
                                        className="block w-36 rounded-app-input border border-app-border bg-app-surface py-2.5 pl-3 pr-3 text-sm font-semibold text-app-text shadow-app-soft focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                            <option key={m} value={m}>
                                                {new Date(2000, m - 1, 1).toLocaleString(locale, { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="report-year" className="mb-1 block text-xs font-semibold text-app-text-secondary">
                                        {tt('year')}
                                    </label>
                                    <select
                                        id="report-year"
                                        value={reportYear}
                                        onChange={(e) => {
                                            setReportYear(parseInt(e.target.value, 10));
                                            setPage(1);
                                        }}
                                        className="block w-28 rounded-app-input border border-app-border bg-app-surface py-2.5 pl-3 pr-3 text-sm font-semibold text-app-text shadow-app-soft focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20"
                                    >
                                        {yearOptions.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={handleDownloadReport}
                                    disabled={downloading}
                                    className="w-full shadow-app-soft sm:w-auto"
                                    icon={<DownloadRounded sx={{ fontSize: 22 }} />}
                                >
                                    {downloading ? tt('downloading') : tt('downloadExcel')}
                                </Button>
                            </div>
                        </div>
                    </Card.Content>
                </Card>
            )}

            {/* Records table */}
            <Card className="shadow-app-card">
                <Card.Content className="overflow-hidden p-0">
                    {loading ? (
                        <AttendanceTableSkeleton />
                    ) : (
                        <>
                            {activeTab === 'my_attendance' ? (
                                // My Attendance Table
                                logs.length === 0 ? (
                                    <div className="p-12 text-center text-app-text-secondary">
                                        <p className="text-sm font-medium">{tt('noPersonalRecords')}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-app-input border border-app-divider">
                                        <table className="min-w-full border-collapse divide-y divide-app-divider">
                                            <thead className="bg-app-surface-variant">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('date')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('checkIn')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('checkOut')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('duration')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('status')}
                                                    </th>
                                                    {isManagerOrAdmin && (
                                                        <th className="px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                            {tt('actions')}
                                                        </th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-app-divider bg-app-surface">
                                                {logs.map((log) => (
                                                    <tr key={log._id} className="transition-colors hover:bg-app-primary/[0.04]">
                                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-app-text sm:px-6">
                                                            {formatDate(log.date)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-app-text-secondary sm:px-6">
                                                            {formatTime(log.checkIn)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-app-text-secondary sm:px-6">
                                                            {log.checkOut ? (
                                                                formatTime(log.checkOut)
                                                            ) : (
                                                                <span className="font-semibold text-emerald-800">{tt('active')}</span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-app-text-secondary sm:px-6">
                                                            {log.duration ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m` : '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                                                            <Badge variant={log.status === 'present' ? 'success' : 'warning'}>{log.status}</Badge>
                                                        </td>
                                                        {isManagerOrAdmin && (
                                                            <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={() => openEditModal({ ...log, user: log.user || user })}
                                                                >
                                                                    {tt('edit')}
                                                                </Button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            ) : (
                                // All Attendance Table (Summary)
                                allLogs.length === 0 ? (
                                    <div className="p-12 text-center text-app-text-secondary">
                                        <p className="text-sm font-medium">{tt('noRecords')}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-app-input border border-app-divider">
                                        <table className="min-w-full border-collapse divide-y divide-app-divider">
                                            <thead className="bg-app-surface-variant">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('user')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('role')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('date')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('checkIn')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('checkOut')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('duration')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('status')}
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary sm:px-6">
                                                        {tt('actions')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-app-divider bg-app-surface">
                                                {allLogs.map((log) => (
                                                    <tr key={log._id} className="transition-colors hover:bg-app-primary/[0.04]">
                                                        <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                                                            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-primary/12 text-xs font-bold text-app-primary">
                                                                    {log.user?.name ? log.user.name.slice(0, 2).toUpperCase() : '??'}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="text-sm font-semibold text-app-text">
                                                                        {log.user?.name || tt('unknown')}
                                                                    </div>
                                                                    <div className="truncate text-xs text-app-text-secondary">{log.user?.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 text-sm capitalize text-app-text-secondary sm:px-6">
                                                            {log.user?.role || '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-app-text sm:px-6">
                                                            {formatDate(log.date)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-app-text-secondary sm:px-6">
                                                            {formatTime(log.checkIn)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-app-text-secondary sm:px-6">
                                                            {log.checkOut ? (
                                                                formatTime(log.checkOut)
                                                            ) : (
                                                                <span className="font-semibold text-emerald-800">{tt('active')}</span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-app-text-secondary sm:px-6">
                                                            {log.duration ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m` : '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                                                            <Badge variant={log.status === 'present' ? 'success' : 'warning'}>{log.status}</Badge>
                                                        </td>
                                                        <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => openEditModal(log)}
                                                            >
                                                                {tt('edit')}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}
                        </>
                    )}
                </Card.Content>

                {/* Pagination for Summary Tab */}
                {activeTab === 'summary' && !loading && totalPages > 1 && (
                    <Card.Footer className="flex items-center justify-between border-t border-app-divider px-4 py-4 sm:px-6">
                        <Button
                            variant="secondary"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            size="sm"
                        >
                            {tt('previous')}
                        </Button>
                        <span className="text-sm font-medium text-app-text-secondary">
                            {tt('pageOf', { page, total: totalPages })}
                        </span>
                        <Button
                            variant="secondary"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            size="sm"
                        >
                            {tt('next')}
                        </Button>
                    </Card.Footer>
                )}
            </Card>

            <Modal isOpen={editOpen} onClose={closeEditModal} size="lg" className="font-cairo">
                <Modal.Header onClose={closeEditModal} className="border-app-divider">
                    {tt('editAttendance')}
                </Modal.Header>
                <Modal.Content>
                    {editRecord && (
                        <div className="space-y-4">
                            <p className="text-sm text-app-text-secondary">
                                <span className="font-semibold text-app-text">{editRecord.user?.name || user?.name}</span>
                                {' · '}
                                {editRecord.user?.email || user?.email}
                                {' · '}
                                {tt('date')}: <span className="font-mono text-app-text">{editRecord.date}</span>
                            </p>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-app-text" htmlFor="edit-check-in">
                                    {tt('checkIn')}
                                </label>
                                <input
                                    id="edit-check-in"
                                    type="datetime-local"
                                    value={editCheckIn}
                                    onChange={(e) => setEditCheckIn(e.target.value)}
                                    className="w-full rounded-app-input border border-app-border bg-app-surface px-3 py-2.5 text-sm text-app-text shadow-app-soft focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20"
                                />
                            </div>
                            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <input
                                    id="edit-open-session"
                                    type="checkbox"
                                    checked={editOpenSession}
                                    onChange={(e) => {
                                        setEditOpenSession(e.target.checked);
                                        if (e.target.checked) setEditCheckOut('');
                                    }}
                                    className="h-4 w-4 rounded border-app-border text-app-primary focus:ring-app-primary"
                                />
                                <label htmlFor="edit-open-session" className="text-sm text-app-text">
                                    {tt('openSession')}
                                </label>
                            </div>
                            {!editOpenSession && (
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-app-text" htmlFor="edit-check-out">
                                        {tt('checkOut')}
                                    </label>
                                    <input
                                        id="edit-check-out"
                                        type="datetime-local"
                                        value={editCheckOut}
                                        onChange={(e) => setEditCheckOut(e.target.value)}
                                        className="w-full rounded-app-input border border-app-border bg-app-surface px-3 py-2.5 text-sm text-app-text shadow-app-soft focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-app-text" htmlFor="edit-status">
                                    {tt('status')}
                                </label>
                                <select
                                    id="edit-status"
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="w-full rounded-app-input border border-app-border bg-app-surface px-3 py-2.5 text-sm font-medium text-app-text shadow-app-soft focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20"
                                >
                                    <option value="present">present</option>
                                    <option value="half-day">half-day</option>
                                    <option value="absent">absent</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-app-text" htmlFor="edit-note">
                                    {tt('note')}
                                </label>
                                <textarea
                                    id="edit-note"
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-app-input border border-app-border bg-app-surface px-3 py-2.5 text-sm text-app-text shadow-app-soft focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20"
                                    placeholder={tt('optionalNote')}
                                />
                            </div>
                        </div>
                    )}
                </Modal.Content>
                <Modal.Footer className="border-app-divider">
                    <Button type="button" variant="secondary" onClick={closeEditModal} disabled={savingEdit}>
                        {tt('cancel')}
                    </Button>
                    <Button type="button" onClick={handleSaveEdit} disabled={savingEdit}>
                        {savingEdit ? tt('saving') : tt('saveChanges')}
                    </Button>
                </Modal.Footer>
            </Modal>
            </div>
        </div>
    );
};

export default AttendancePage;
