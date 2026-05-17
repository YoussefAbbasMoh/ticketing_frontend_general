import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userAPI, getAxiosErrorMessage } from '../../services/api';
import { getStoredLanguage, t } from '../../i18n';
import PersonalTaskFocusDock from './PersonalTaskFocusDock';
import {
  broadcastFocusEvent,
  clearFocusSessionPayload,
  loadFocusSessionPayload,
  FOCUS_BROADCAST_CHANNEL,
} from '../../utils/personalTaskFocusWindow';

const columnLabelKey = (col) => {
  if (col === 'backlog') return 'colBacklog';
  if (col === 'this_week') return 'colThisWeek';
  if (col === 'today') return 'colToday';
  if (col === 'done') return 'colDone';
  return col;
};

export default function PersonalTaskFocusWindowPage() {
  const [searchParams] = useSearchParams();
  const [lang, setLang] = useState(getStoredLanguage());
  const [session, setSession] = useState(() => loadFocusSessionPayload());
  const [todayStats, setTodayStats] = useState({
    est: session?.todayEstMinutes ?? 0,
    done: session?.todayDoneCount ?? 0,
    total: session?.todayTotalCount ?? 0,
  });
  const [markingDone, setMarkingDone] = useState(false);
  const [error, setError] = useState('');

  const taskIdFromUrl = searchParams.get('taskId');
  const taskId = String(session?.taskId || taskIdFromUrl || '');

  const refreshTodayStats = useCallback(async () => {
    try {
      const res = await userAPI.getPersonalTasks();
      const list = Array.isArray(res?.data?.tasks) ? res.data.tasks : [];
      const todayList = list.filter((tk) => tk.column === 'today');
      const est = todayList.reduce((s, tk) => s + (Number(tk.estimated_minutes) || 0), 0);
      const done = list.filter((tk) => tk.column === 'done').length;
      setTodayStats({ est, done, total: todayList.length });
    } catch {
      /* keep last stats */
    }
  }, []);

  useEffect(() => {
    document.title = t(lang, 'tasksFocusDockTitle');
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang === 'ar' ? 'ar' : 'en');
  }, [lang]);

  useEffect(() => {
    const payload = loadFocusSessionPayload();
    if (payload) setSession(payload);
    refreshTodayStats();
  }, [refreshTodayStats, taskIdFromUrl]);

  useEffect(() => {
    const onLang = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLang);
    return () => window.removeEventListener('language-changed', onLang);
  }, []);

  useEffect(() => {
    const onUnload = () => {
      broadcastFocusEvent({ type: 'focus-window-closed', taskId });
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [taskId]);

  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel(FOCUS_BROADCAST_CHANNEL);
      bc.onmessage = (e) => {
        if (e.data?.type === 'reload-stats') refreshTodayStats();
      };
    } catch {
      /* ignore */
    }
    return () => bc?.close();
  }, [refreshTodayStats]);

  const handleClose = () => {
    broadcastFocusEvent({ type: 'focus-window-closed', taskId });
    window.close();
  };

  const handleMarkDone = async () => {
    if (!taskId || session?.column === 'done' || markingDone) return;
    setMarkingDone(true);
    setError('');
    try {
      await userAPI.updatePersonalTask(taskId, { column: 'done' });
      broadcastFocusEvent({ type: 'task-marked-done', taskId });
      clearFocusSessionPayload();
      window.close();
    } catch (e) {
      setError(getAxiosErrorMessage(e, t(lang, 'personalTasksLoadError')));
    } finally {
      setMarkingDone(false);
    }
  };

  const column = session?.column || 'backlog';
  const columnLabel = useMemo(() => t(lang, columnLabelKey(column)), [lang, column]);

  if (!taskId || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app-background p-4 font-cairo text-sm text-app-text-secondary">
        {t(lang, 'personalTasksLoadError')}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-app-background font-cairo">
      {error && (
        <p className="bg-app-error/10 px-3 py-2 text-center text-xs font-medium text-app-error">
          {error}
        </p>
      )}
      <PersonalTaskFocusDock
        variant="popup"
        taskId={taskId}
        taskTitle={session.taskTitle}
        estimatedMinutes={session.estimated_minutes ?? session.estimatedMinutes}
        column={column}
        columnLabel={columnLabel}
        lang={lang}
        todayEstMinutes={todayStats.est}
        todayDoneCount={todayStats.done}
        todayTotalCount={todayStats.total}
        autoStart={session.autoStart !== false}
        onClose={handleClose}
        onMarkDone={handleMarkDone}
        markingDone={markingDone}
      />
    </div>
  );
}

