import { useCallback, useEffect, useMemo, useState } from 'react';
import { userAPI, getAxiosErrorMessage } from '../../services/api';
import { getStoredLanguage, t } from '../../i18n';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { ButtonBusyDots } from '../ui/LoadingSkeletons';
import PersonalTaskTimer from './PersonalTaskTimer';
import { removeTimerState } from '../../utils/personalTaskTimerStorage';

const COLUMNS = ['backlog', 'this_week', 'today', 'done'];

const columnLabelKey = (col) => {
  if (col === 'backlog') return 'colBacklog';
  if (col === 'this_week') return 'colThisWeek';
  if (col === 'today') return 'colToday';
  if (col === 'done') return 'colDone';
  return col;
};

const taskId = (task) => String(task?._id ?? task?.id ?? '');

const PersonalTasksPage = () => {
  const [lang, setLang] = useState(getStoredLanguage());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addColumn, setAddColumn] = useState('backlog');
  const [addTitle, setAddTitle] = useState('');
  const [addMinutes, setAddMinutes] = useState(30);
  const [addSaving, setAddSaving] = useState(false);

  const [editTask, setEditTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMinutes, setEditMinutes] = useState(30);
  const [editSaving, setEditSaving] = useState(false);

  const byColumn = useMemo(() => {
    const m = Object.fromEntries(COLUMNS.map((c) => [c, []]));
    tasks.forEach((tk) => {
      const col = tk.column && m[tk.column] != null ? tk.column : 'backlog';
      m[col].push(tk);
    });
    return m;
  }, [tasks]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userAPI.getPersonalTasks();
      setTasks(Array.isArray(res?.data?.tasks) ? res.data.tasks : []);
    } catch (e) {
      setError(getAxiosErrorMessage(e, t(lang, 'personalTasksLoadError')));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const onLang = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLang);
    return () => window.removeEventListener('language-changed', onLang);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const openAdd = (column) => {
    setAddColumn(column);
    setAddTitle('');
    setAddMinutes(30);
    setAddOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const title = addTitle.trim();
    const minutes = Number(addMinutes);
    if (!title) return;
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) return;
    setAddSaving(true);
    try {
      const res = await userAPI.createPersonalTask({
        title,
        estimated_minutes: minutes,
        column: addColumn,
      });
      const created = res?.data?.task;
      if (created) setTasks((prev) => [created, ...prev]);
      setAddOpen(false);
      showToast(t(lang, 'taskCreated'));
    } catch (err) {
      setError(getAxiosErrorMessage(err, t(lang, 'personalTasksLoadError')));
    } finally {
      setAddSaving(false);
    }
  };

  const openEdit = (task) => {
    setEditTask(task);
    setEditTitle(task.title || '');
    setEditMinutes(Number(task.estimated_minutes) || 30);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editTask) return;
    const id = taskId(editTask);
    const title = editTitle.trim();
    const minutes = Number(editMinutes);
    if (!title || !Number.isFinite(minutes) || minutes < 1 || minutes > 1440) return;
    setEditSaving(true);
    try {
      const res = await userAPI.updatePersonalTask(id, {
        title,
        estimated_minutes: minutes,
      });
      const updated = res?.data?.task;
      if (updated) {
        setTasks((prev) => prev.map((x) => (taskId(x) === id ? updated : x)));
      }
      setEditTask(null);
      showToast(t(lang, 'taskUpdated'));
    } catch (err) {
      setError(getAxiosErrorMessage(err, t(lang, 'personalTasksLoadError')));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (task) => {
    const id = taskId(task);
    if (!id) return;
    if (!window.confirm(t(lang, 'deleteTask') + '?')) return;
    try {
      await userAPI.deletePersonalTask(id);
      removeTimerState(id);
      setTasks((prev) => prev.filter((x) => taskId(x) !== id));
      showToast(t(lang, 'taskDeleted'));
    } catch (err) {
      setError(getAxiosErrorMessage(err, t(lang, 'personalTasksLoadError')));
    }
  };

  const moveTaskToColumn = async (task, newColumn) => {
    const id = taskId(task);
    if (!id || task.column === newColumn) return;
    const prev = tasks;
    setTasks((p) => p.map((x) => (taskId(x) === id ? { ...x, column: newColumn } : x)));
    try {
      const res = await userAPI.updatePersonalTask(id, { column: newColumn });
      const updated = res?.data?.task;
      if (updated) {
        setTasks((p) => p.map((x) => (taskId(x) === id ? updated : x)));
      }
    } catch (err) {
      setTasks(prev);
      setError(getAxiosErrorMessage(err, t(lang, 'personalTasksLoadError')));
    }
  };

  const onDragStart = (e, task) => {
    const id = taskId(task);
    setDraggingId(id);
    e.dataTransfer.setData('application/json', JSON.stringify({ id, from: task.column }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const onDragOverCol = (e, col) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(col);
  };

  const onDragLeaveCol = () => {
    setDropTarget(null);
  };

  const onDropCol = async (e, col) => {
    e.preventDefault();
    setDropTarget(null);
    let raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const { id } = JSON.parse(raw);
      const task = tasks.find((x) => taskId(x) === id);
      if (task) await moveTaskToColumn(task, col);
    } catch {
      /* ignore */
    }
    setDraggingId(null);
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8" dir={dir}>
        <ButtonBusyDots className="text-app-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-app-background" dir={dir}>
      <div className="border-b border-app-divider bg-app-surface px-4 py-4 sm:px-6">
        <h1 className="text-xl font-bold text-app-text sm:text-2xl">{t(lang, 'personalTasks')}</h1>
        <p className="mt-1 text-sm text-app-text-secondary">{t(lang, 'personalTasksSubtitle')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {error && (
          <div className="mb-4 max-w-3xl">
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}
        {toast && (
          <div className="mb-4 max-w-3xl">
            <Alert variant="success" onClose={() => setToast('')}>
              {toast}
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <section
              key={col}
              className={`flex min-h-[260px] min-w-0 flex-col rounded-app border bg-app-surface shadow-app-soft transition-colors md:min-h-[320px] xl:min-h-[400px] ${
                dropTarget === col ? 'border-app-primary ring-2 ring-app-primary/25' : 'border-app-divider'
              }`}
              onDragOver={(e) => onDragOverCol(e, col)}
              onDragLeave={onDragLeaveCol}
              onDrop={(e) => onDropCol(e, col)}
            >
              <header className="flex items-center justify-between gap-2 border-b border-app-divider px-3 py-2.5 sm:px-4">
                <h2 className="text-sm font-bold text-app-text sm:text-base">
                  {t(lang, columnLabelKey(col))}
                  <span className="ms-2 rounded-full bg-app-surface-variant px-2 py-0.5 text-xs font-semibold text-app-text-secondary">
                    {byColumn[col].length}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => openAdd(col)}
                  className="rounded-app-input border border-app-divider bg-app-surface-variant px-2 py-1 text-xs font-semibold text-app-primary hover:bg-app-primary/[0.08] sm:px-3 sm:text-sm"
                >
                  + {t(lang, 'addTask')}
                </button>
              </header>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 sm:p-3">
                {byColumn[col].length === 0 && (
                  <p className="py-6 text-center text-xs text-app-text-tertiary sm:text-sm">
                    {t(lang, 'personalTasksEmpty')}
                  </p>
                )}
                {byColumn[col].map((task) => {
                  const id = taskId(task);
                  const isDragging = draggingId === id;
                  return (
                    <article
                      key={id}
                      draggable
                      onDragStart={(e) => onDragStart(e, task)}
                      onDragEnd={onDragEnd}
                      className={`cursor-grab rounded-app border border-app-divider bg-app-surface-variant/80 p-3 shadow-sm active:cursor-grabbing ${
                        isDragging ? 'opacity-60 ring-2 ring-app-primary/30' : ''
                      }`}
                    >
                      <p className="text-sm font-semibold leading-snug text-app-text">{task.title}</p>
                      <p className="mt-1 text-xs text-app-text-secondary">
                        ~{task.estimated_minutes} {t(lang, 'minuteAbbrev')}
                      </p>
                      <PersonalTaskTimer
                        taskId={id}
                        estimatedMinutes={task.estimated_minutes}
                        column={col}
                        lang={lang}
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-xs font-semibold text-app-primary hover:underline"
                          onClick={() => openEdit(task)}
                        >
                          {t(lang, 'editTask')}
                        </button>
                        <button
                          type="button"
                          className="text-xs font-semibold text-app-error hover:underline"
                          onClick={() => handleDelete(task)}
                        >
                          {t(lang, 'deleteTask')}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <p className="border-t border-app-divider px-3 py-2 text-center text-[11px] text-app-text-tertiary sm:text-xs">
                {t(lang, 'dropTasksHere')}
              </p>
            </section>
          ))}
        </div>
      </div>

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-app-text/40 p-4 backdrop-blur-[2px] sm:items-center"
          role="dialog"
          aria-modal
          onClick={() => !addSaving && setAddOpen(false)}
        >
          <form
            className="w-full max-w-md rounded-app border border-app-divider bg-app-surface p-5 shadow-app-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
          >
            <h3 className="text-lg font-bold text-app-text">
              {t(lang, 'addTask')} — {t(lang, columnLabelKey(addColumn))}
            </h3>
            <label className="mt-4 block text-sm font-medium text-app-text-secondary">{t(lang, 'taskTitle')}</label>
            <input
              className="mt-1 w-full rounded-app-input border border-app-border bg-app-background px-3 py-2 text-sm text-app-text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              autoFocus
              required
            />
            <label className="mt-3 block text-sm font-medium text-app-text-secondary">
              {t(lang, 'estimatedMinutes')}
            </label>
            <input
              type="number"
              min={1}
              max={1440}
              className="mt-1 w-full rounded-app-input border border-app-border bg-app-background px-3 py-2 text-sm text-app-text"
              value={addMinutes}
              onChange={(e) => setAddMinutes(e.target.value)}
            />
            <p className="mt-1 text-xs text-app-text-tertiary">{t(lang, 'minutesHint')}</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => !addSaving && setAddOpen(false)}>
                {t(lang, 'back')}
              </Button>
              <Button type="submit" variant="secondary" disabled={addSaving} icon={addSaving ? <ButtonBusyDots className="text-white" /> : null}>
                {t(lang, 'saveTask')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {editTask && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-app-text/40 p-4 backdrop-blur-[2px] sm:items-center"
          role="dialog"
          aria-modal
          onClick={() => !editSaving && setEditTask(null)}
        >
          <form
            className="w-full max-w-md rounded-app border border-app-divider bg-app-surface p-5 shadow-app-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleEditSave}
          >
            <h3 className="text-lg font-bold text-app-text">{t(lang, 'editTask')}</h3>
            <label className="mt-4 block text-sm font-medium text-app-text-secondary">{t(lang, 'taskTitle')}</label>
            <input
              className="mt-1 w-full rounded-app-input border border-app-border bg-app-background px-3 py-2 text-sm text-app-text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
            <label className="mt-3 block text-sm font-medium text-app-text-secondary">
              {t(lang, 'estimatedMinutes')}
            </label>
            <input
              type="number"
              min={1}
              max={1440}
              className="mt-1 w-full rounded-app-input border border-app-border bg-app-background px-3 py-2 text-sm text-app-text"
              value={editMinutes}
              onChange={(e) => setEditMinutes(e.target.value)}
            />
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => !editSaving && setEditTask(null)}>
                {t(lang, 'back')}
              </Button>
              <Button type="submit" variant="secondary" disabled={editSaving} icon={editSaving ? <ButtonBusyDots className="text-white" /> : null}>
                {t(lang, 'saveTask')}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PersonalTasksPage;
