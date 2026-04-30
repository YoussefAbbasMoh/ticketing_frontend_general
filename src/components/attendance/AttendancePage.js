import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import { getStoredLanguage } from '../../i18n';

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
    const { user } = useAuth();
    const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
    const [lang, setLang] = useState(getStoredLanguage());
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
        } catch (err) {
            console.error('Error fetching logs:', err);
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
            console.error('Error fetching all logs:', err);
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
            console.error('Save attendance edit:', err);
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
            console.error('Error downloading report:', err);
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
        return new Date(dateStr).toLocaleDateString();
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="container mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{tt('title')}</h1>
                <p className="text-sm sm:text-base text-gray-600">{tt('subtitle')}</p>
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

            {/* Tabs */}
            {isManagerOrAdmin && (
                <div className="flex border-b border-gray-200 mb-5 sm:mb-6">
                    <button
                        className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'my_attendance' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('my_attendance')}
                    >
                        {tt('myAttendance')}
                    </button>
                    <button
                        className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'summary' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => { setActiveTab('summary'); setPage(1); }}
                    >
                        {tt('attendanceSummary')}
                    </button>
                </div>
            )}

            {/* Admin Report Section - Only visible in Summary Tab for Admins/Managers */}
            {isManagerOrAdmin && activeTab === 'summary' && (
                <Card className="mb-8 border-l-4 border-purple-500">
                    <Card.Content className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{tt('generateMonthly')}</h2>
                                <p className="text-sm text-gray-600">{tt('downloadForAll')}</p>
                            </div>
                            <div className="flex flex-wrap items-end gap-4 w-full sm:w-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{tt('month')}</label>
                                    <select
                                        value={reportMonth}
                                        onChange={(e) => {
                                            setReportMonth(parseInt(e.target.value, 10));
                                            setPage(1);
                                        }}
                                        className="block w-32 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{tt('year')}</label>
                                    <select
                                        value={reportYear}
                                        onChange={(e) => {
                                            setReportYear(parseInt(e.target.value, 10));
                                            setPage(1);
                                        }}
                                        className="block w-24 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"
                                    >
                                        {[2024, 2025, 2026, 2027].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button
                                    onClick={handleDownloadReport}
                                    disabled={downloading}
                                    className="w-full sm:w-auto"
                                    icon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    }
                                >
                                    {downloading ? tt('downloading') : tt('downloadExcel')}
                                </Button>
                            </div>
                        </div>
                    </Card.Content>
                </Card>
            )}

            {/* List Content */}
            <Card>
                <Card.Content className="p-0 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <Spinner size="lg" color="primary" />
                            <p className="mt-4 text-gray-500">{tt('loadingRecords')}</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'my_attendance' ? (
                                // My Attendance Table
                                logs.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <p>{tt('noPersonalRecords')}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('date')}</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('checkIn')}</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('checkOut')}</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('duration')}</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('status')}</th>
                                                    {isManagerOrAdmin && (
                                                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('actions')}</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {logs.map((log) => (
                                                    <tr key={log._id} className="hover:bg-gray-50">
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(log.date)}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(log.checkIn)}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.checkOut ? formatTime(log.checkOut) : <span className="text-green-600 font-medium">{tt('active')}</span>}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.duration ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m` : '-'}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap"><Badge variant={log.status === 'present' ? 'success' : 'warning'}>{log.status}</Badge></td>
                                                        {isManagerOrAdmin && (
                                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
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
                                    <div className="p-12 text-center text-gray-500">
                                        <p>{tt('noRecords')}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('user')}</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('role')}</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('date')}</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('checkIn')}</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('checkOut')}</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('duration')}</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('status')}</th>
                                                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{tt('actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {allLogs.map((log) => (
                                                    <tr key={log._id} className="hover:bg-gray-50">
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                                    {log.user?.name ? log.user.name.slice(0, 2).toUpperCase() : '??'}
                                                                </div>
                                                                <div className="ms-3">
                                                                    <div className="text-sm font-medium text-gray-900">{log.user?.name || tt('unknown')}</div>
                                                                    <div className="text-xs text-gray-500">{log.user?.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{log.user?.role || '-'}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(log.date)}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTime(log.checkIn)}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.checkOut ? formatTime(log.checkOut) : <span className="text-green-600 font-medium">{tt('active')}</span>}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.duration ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m` : '-'}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap"><Badge variant={log.status === 'present' ? 'success' : 'warning'}>{log.status}</Badge></td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
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
                    <Card.Footer className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <Button
                            variant="secondary"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            size="sm"
                        >
                            {tt('previous')}
                        </Button>
                        <span className="text-sm text-gray-600">
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

            <Modal isOpen={editOpen} onClose={closeEditModal} size="lg">
                <Modal.Header onClose={closeEditModal}>{tt('editAttendance')}</Modal.Header>
                <Modal.Content>
                    {editRecord && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium text-gray-800">{editRecord.user?.name || user?.name}</span>
                                {' · '}
                                {editRecord.user?.email || user?.email}
                                {' · '}
                                {tt('date')}: <span className="font-mono">{editRecord.date}</span>
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{tt('checkIn')}</label>
                                <input
                                    type="datetime-local"
                                    value={editCheckIn}
                                    onChange={(e) => setEditCheckIn(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    id="edit-open-session"
                                    type="checkbox"
                                    checked={editOpenSession}
                                    onChange={(e) => {
                                        setEditOpenSession(e.target.checked);
                                        if (e.target.checked) setEditCheckOut('');
                                    }}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="edit-open-session" className="text-sm text-gray-700">
                                    {tt('openSession')}
                                </label>
                            </div>
                            {!editOpenSession && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{tt('checkOut')}</label>
                                    <input
                                        type="datetime-local"
                                        value={editCheckOut}
                                        onChange={(e) => setEditCheckOut(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{tt('status')}</label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="present">present</option>
                                    <option value="half-day">half-day</option>
                                    <option value="absent">absent</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{tt('note')}</label>
                                <textarea
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder={tt('optionalNote')}
                                />
                            </div>
                        </div>
                    )}
                </Modal.Content>
                <Modal.Footer>
                    <Button type="button" variant="secondary" onClick={closeEditModal} disabled={savingEdit}>
                        {tt('cancel')}
                    </Button>
                    <Button type="button" onClick={handleSaveEdit} disabled={savingEdit}>
                        {savingEdit ? tt('saving') : tt('saveChanges')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AttendancePage;
