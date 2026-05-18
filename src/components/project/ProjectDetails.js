import React, { useState, useEffect, useCallback } from 'react';
import AddRounded from '@mui/icons-material/AddRounded';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import ChatRounded from '@mui/icons-material/ChatRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import EditRounded from '@mui/icons-material/EditRounded';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import StickyNote2Outlined from '@mui/icons-material/StickyNote2Outlined';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined';
import { CommentListSkeleton, InlineSkeletonPulse } from '../ui/LoadingSkeletons';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, ticketAPI, getAxiosErrorMessage } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../ui/Button';
import NavBackIcon from '../ui/NavBackIcon';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import ProjectDetailsSkeleton from './ProjectDetailsSkeleton';
import Modal from '../ui/Modal';
import AssignUsersDialog from '../admin/AssignUsersDialog';
import { getStoredLanguage } from '../../i18n';

const TEXT = {
  en: {
    failedProjectDetails: 'Failed to fetch project details.',
    failedTickets: 'Failed to fetch tickets.',
    na: 'N/A',
    daysOverdue: '{{days}} days overdue',
    dueToday: 'Due today',
    oneDayLeft: '1 day left',
    daysLeft: '{{days}} days left',
    statusUpdated: 'Project status updated to "{{status}}"',
    failedStatusUpdate: 'Failed to update project status.',
    loadingProjectDetails: 'Loading project details...',
    backToProjects: 'Back to Projects',
    unknown: 'Unknown',
    projectOverview: 'Project overview and ticket management',
    changeStatus: 'Change Status:',
    active: 'Active',
    completed: 'Completed',
    onHold: 'On Hold',
    cancelled: 'Cancelled',
    openProjectChat: 'Open Project Chat',
    newTicket: 'New Ticket',
    openProjectChatError: 'Error opening project chat. Please try again.',
    timeline: 'Timeline',
    startDate: 'Start Date',
    endDate: 'End Date',
    team: 'Team',
    activeMembers: 'Active members',
    tickets: 'Tickets',
    totalTickets: 'Total tickets',
    open: 'Open',
    openTickets: 'Open tickets',
    allTickets: 'All Tickets',
    searchByTicketId: 'Search by Ticket ID...',
    all: 'All',
    inProgress: 'In Progress',
    pending: 'Pending',
    resolved: 'Resolved',
    closed: 'Closed',
    noTicketsFound: 'No tickets found',
    createFirstTicketHint: 'Create your first ticket to get started',
    noTicketsWithStatus: 'No tickets with status "{{status}}"',
    createFirstTicket: 'Create First Ticket',
    ticketId: 'Ticket ID',
    status: 'Status',
    priority: 'Priority',
    sender: 'Sender',
    receiver: 'Receiver',
    description: 'Description',
    cc: 'CC',
    created: 'Created',
    comments: 'Comments',
    actions: 'Actions',
    priorityAsap: 'As soon as possible',
    priority12Days: '1-2 days',
    priority35Days: 'Take your time 3-5 days',
    notSet: 'Not set',
    showMore: 'Show more',
    showLess: 'Show less',
    noDescription: 'No description',
    more: 'more',
    none: 'None',
    commentSingle: 'comment',
    commentPlural: 'comments',
    legacy: 'Legacy',
    noComments: 'No comments',
    editTicket: 'Edit Ticket',
    assignUsers: 'Assign Users',
    manageProjectTeam: 'Manage team',
    untitledProject: 'Untitled Project',
    personalNotesTitle: 'Personal notes',
    personalNotesPrivacy: 'Only you can see these notes.',
    personalNotesLoadFailed: 'Could not load notes.',
    personalNotesNewPlaceholder: 'Write a private note…',
    personalNotesAdd: 'Add note',
    personalNotesSave: 'Save',
    personalNotesCancel: 'Cancel',
    personalNotesEdit: 'Edit',
    personalNotesDelete: 'Delete',
    personalNotesDeleteConfirm: 'Delete this note?',
    personalNotesEmpty: 'No notes yet. Add one above.',
    personalNotesSaving: 'Saving…',
    personalNotesOpenPanel: 'Personal notes',
    personalNotesClosePanel: 'Close notes',
    deleteProject: 'Delete project',
    deleteProjectZoneTitle: 'Danger zone',
    deleteProjectConfirmTitle: 'Delete this project?',
    deleteProjectConfirmBody:
      'This permanently deletes the project, all tickets, chat, and notes. This cannot be undone.',
    deleteProjectConfirm: 'Delete permanently',
    deleteProjectCancel: 'Cancel',
    deleteProjectSuccess: 'Project deleted.',
    deleteProjectFailed: 'Could not delete the project.',
    deleteProjectDeleting: 'Deleting…',
    deleteProjectHint: 'Removes all tickets, chat, and notes for this project.',
    modalClose: 'Close',
  },
  ar: {
    failedProjectDetails: 'فشل في جلب تفاصيل المشروع.',
    failedTickets: 'فشل في جلب التذاكر.',
    na: 'غير متاح',
    daysOverdue: 'متأخر {{days}} يوم',
    dueToday: 'مستحق اليوم',
    oneDayLeft: 'يوم واحد متبقٍ',
    daysLeft: 'متبقي {{days}} يوم',
    statusUpdated: 'تم تحديث حالة المشروع إلى "{{status}}"',
    failedStatusUpdate: 'فشل تحديث حالة المشروع.',
    loadingProjectDetails: 'جارٍ تحميل تفاصيل المشروع...',
    backToProjects: 'العودة للمشاريع',
    unknown: 'غير معروف',
    projectOverview: 'نظرة عامة على المشروع وإدارة التذاكر',
    changeStatus: 'تغيير الحالة:',
    active: 'نشط',
    completed: 'مكتمل',
    onHold: 'معلق',
    cancelled: 'ملغي',
    openProjectChat: 'فتح دردشة المشروع',
    newTicket: 'تذكرة جديدة',
    openProjectChatError: 'حدث خطأ أثناء فتح دردشة المشروع. حاول مرة أخرى.',
    timeline: 'الجدول الزمني',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء',
    team: 'الفريق',
    activeMembers: 'أعضاء نشطون',
    tickets: 'التذاكر',
    totalTickets: 'إجمالي التذاكر',
    open: 'مفتوحة',
    openTickets: 'تذاكر مفتوحة',
    allTickets: 'كل التذاكر',
    searchByTicketId: 'ابحث برقم التذكرة...',
    all: 'الكل',
    inProgress: 'قيد التنفيذ',
    pending: 'معلقة',
    resolved: 'تم الحل',
    closed: 'مغلقة',
    noTicketsFound: 'لا توجد تذاكر',
    createFirstTicketHint: 'ابدأ بإنشاء أول تذكرة',
    noTicketsWithStatus: 'لا توجد تذاكر بحالة "{{status}}"',
    createFirstTicket: 'أنشئ أول تذكرة',
    ticketId: 'رقم التذكرة',
    status: 'الحالة',
    priority: 'الأولوية',
    sender: 'المرسل',
    receiver: 'المستقبل',
    description: 'الوصف',
    cc: 'نسخة',
    created: 'تاريخ الإنشاء',
    comments: 'التعليقات',
    actions: 'إجراءات',
    priorityAsap: 'في أسرع وقت',
    priority12Days: 'خلال 1-2 يوم',
    priority35Days: 'على مهلك 3-5 أيام',
    notSet: 'غير محدد',
    showMore: 'عرض المزيد',
    showLess: 'عرض أقل',
    noDescription: 'لا يوجد وصف',
    more: 'أخرى',
    none: 'لا يوجد',
    commentSingle: 'تعليق',
    commentPlural: 'تعليقات',
    legacy: 'قديم',
    noComments: 'لا توجد تعليقات',
    editTicket: 'تعديل التذكرة',
    assignUsers: 'تعيين المستخدمين',
    manageProjectTeam: 'إدارة الفريق',
    untitledProject: 'مشروع بدون اسم',
    personalNotesTitle: 'ملاحظات شخصية',
    personalNotesPrivacy: 'أنت فقط من يمكنه رؤية هذه الملاحظات.',
    personalNotesLoadFailed: 'تعذر تحميل الملاحظات.',
    personalNotesNewPlaceholder: 'اكتب ملاحظة خاصة…',
    personalNotesAdd: 'إضافة ملاحظة',
    personalNotesSave: 'حفظ',
    personalNotesCancel: 'إلغاء',
    personalNotesEdit: 'تعديل',
    personalNotesDelete: 'حذف',
    personalNotesDeleteConfirm: 'حذف هذه الملاحظة؟',
    personalNotesEmpty: 'لا توجد ملاحظات بعد. أضف واحدة أعلاه.',
    personalNotesSaving: 'جارٍ الحفظ…',
    personalNotesOpenPanel: 'ملاحظات شخصية',
    personalNotesClosePanel: 'إغلاق الملاحظات',
    deleteProject: 'حذف المشروع',
    deleteProjectZoneTitle: 'منطقة خطرة',
    deleteProjectConfirmTitle: 'حذف هذا المشروع؟',
    deleteProjectConfirmBody:
      'سيتم حذف المشروع وجميع التذاكر والدردشة والملاحظات نهائيًا. لا يمكن التراجع عن هذا الإجراء.',
    deleteProjectConfirm: 'حذف نهائيًا',
    deleteProjectCancel: 'إلغاء',
    deleteProjectSuccess: 'تم حذف المشروع.',
    deleteProjectFailed: 'تعذر حذف المشروع.',
    deleteProjectDeleting: 'جارٍ الحذف…',
    deleteProjectHint: 'يحذف كل التذاكر والدردشة والملاحظات لهذا المشروع.',
    modalClose: 'إغلاق',
  }
};

/** Notes UI used inside the slide-over panel (tickets stay full width). */
function PersonalNotesPanelBody({
  tx,
  personalNotes,
  notesLoading,
  notesError,
  notesSaving,
  newNoteContent,
  setNewNoteContent,
  editingNoteId,
  editingContent,
  setEditingNoteId,
  setEditingContent,
  setNotesError,
  formatDate,
  handleAddPersonalNote,
  handleSavePersonalNote,
  handleDeletePersonalNote,
}) {
  return (
    <>
      <p className="mb-6 text-xs text-app-text-secondary">{tx('personalNotesPrivacy')}</p>

      {notesError && (
        <div className="mb-4">
          <Alert variant="error" onClose={() => setNotesError('')}>
            {notesError}
          </Alert>
        </div>
      )}

      <div className="mb-6">
        <textarea
          rows={3}
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder={tx('personalNotesNewPlaceholder')}
          disabled={notesLoading || notesSaving}
          className="w-full rounded-app-input border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text shadow-app-soft transition-colors focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20 disabled:opacity-60"
        />
        <div className="mt-3 flex justify-end">
          <Button
            variant="secondary"
            onClick={handleAddPersonalNote}
            disabled={notesLoading || notesSaving || !newNoteContent.trim()}
            icon={<AddRounded sx={{ fontSize: 20 }} />}
          >
            {notesSaving ? tx('personalNotesSaving') : tx('personalNotesAdd')}
          </Button>
        </div>
      </div>

      {notesLoading ? (
        <CommentListSkeleton lines={3} />
      ) : personalNotes.length === 0 ? (
        <p className="rounded-app-input border border-dashed border-app-border bg-app-background/80 py-8 text-center text-sm text-app-text-secondary">
          {tx('personalNotesEmpty')}
        </p>
      ) : (
        <ul className="space-y-3 pb-8">
          {personalNotes.map((note) => {
            const noteId = note._id || note.id;
            const updated = note.updatedAt || note.createdAt;
            const raw = (note.content || '').trim();
            const preview = raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
            const isEditing = editingNoteId === noteId;
            return (
              <li
                key={noteId}
                className="rounded-app-input border border-app-divider bg-app-background p-4"
              >
                {isEditing ? (
                  <>
                    <textarea
                      rows={4}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      disabled={notesSaving}
                      className="w-full rounded-app-input border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text shadow-app-soft focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20 disabled:opacity-60"
                    />
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        disabled={notesSaving}
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingContent('');
                        }}
                      >
                        {tx('personalNotesCancel')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        disabled={notesSaving || !editingContent.trim()}
                        onClick={() => handleSavePersonalNote(noteId)}
                      >
                        {tx('personalNotesSave')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-sm text-app-text">{preview || '—'}</p>
                    <p className="mt-2 text-xs font-semibold text-app-text-secondary">
                      {formatDate(updated)}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        disabled={notesSaving}
                        onClick={() => {
                          setEditingNoteId(noteId);
                          setEditingContent(raw);
                        }}
                        icon={<EditRounded sx={{ fontSize: 20 }} />}
                      >
                        {tx('personalNotesEdit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        disabled={notesSaving}
                        onClick={() => handleDeletePersonalNote(noteId)}
                        icon={<DeleteOutlineRounded sx={{ fontSize: 20 }} />}
                      >
                        {tx('personalNotesDelete')}
                      </Button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isCompanyOwner } = useAuth();
  const { getProjectConversation } = useChat();
  const [project, setProject] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [lang, setLang] = useState(getStoredLanguage());
  const [personalNotes, setPersonalNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [deleteProjectSubmitting, setDeleteProjectSubmitting] = useState(false);
  const [assignTeamOpen, setAssignTeamOpen] = useState(false);
  const tx = (key, vars = {}) => {
    const template = TEXT[lang]?.[key] || TEXT.en[key] || key;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      template
    );
  };

  const refreshProject = useCallback(async () => {
    try {
      const res = await projectAPI.getProject(projectId);
      const d = res?.data;
      const proj = d?.project || d;
      if (proj && (proj._id || proj.id)) {
        setProject(proj);
      }
    } catch (err) {
      console.error(err);
    }
  }, [projectId]);

  const projectStatusLabel = (statusRaw) => {
    const s = String(statusRaw || '').toLowerCase().replace(/-/g, '_');
    if (s === 'active') return tx('active');
    if (s === 'completed') return tx('completed');
    if (s === 'on_hold') return tx('onHold');
    if (s === 'cancelled' || s === 'canceled') return tx('cancelled');
    return String(statusRaw || '').replace(/_/g, ' ');
  };

  const ticketStatusLabel = (statusRaw) => {
    const s = String(statusRaw || '').toLowerCase().replace(/-/g, '_');
    if (s === 'open') return tx('open');
    if (s === 'in_progress') return tx('inProgress');
    if (s === 'pending') return tx('pending');
    if (s === 'resolved') return tx('resolved');
    if (s === 'closed') return tx('closed');
    return String(statusRaw || '').replace(/_/g, ' ') || tx('unknown');
  };

  const handleDeleteProject = async () => {
    setDeleteProjectSubmitting(true);
    try {
      await projectAPI.deleteProject(projectId);
      toast(tx('deleteProjectSuccess'), { severity: 'success' });
      setDeleteProjectModalOpen(false);
      navigate('/');
    } catch (err) {
      toast(getAxiosErrorMessage(err, tx('deleteProjectFailed')), { severity: 'error' });
    } finally {
      setDeleteProjectSubmitting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFatalError('');
      setError('');
      setProject(null);
      setTickets([]);

      const [pRes, tRes] = await Promise.allSettled([
        projectAPI.getProject(projectId),
        ticketAPI.getMyTickets(projectId),
      ]);

      if (cancelled) return;

      if (pRes.status === 'fulfilled') {
        const d = pRes.value?.data;
        const proj = d?.project || d;
        if (proj && (proj._id || proj.id)) {
          setProject(proj);
        } else {
          setFatalError(tx('failedProjectDetails'));
        }
      } else {
        setFatalError(tx('failedProjectDetails'));
      }

      if (tRes.status === 'fulfilled') {
        const d = tRes.value?.data;
        const ticketData = d?.tickets || d || [];
        setTickets(Array.isArray(ticketData) ? ticketData : []);
      } else {
        setTickets([]);
        if (pRes.status === 'fulfilled') {
          setError(tx('failedTickets'));
        }
      }

      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !project) return undefined;
    let cancelled = false;

    const loadNotes = async () => {
      setNotesLoading(true);
      setNotesError('');
      try {
        const res = await projectAPI.getProjectNotes(projectId);
        if (cancelled) return;
        const list = res?.data?.notes;
        setPersonalNotes(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) {
          setPersonalNotes([]);
          setNotesError(getAxiosErrorMessage(err, tx('personalNotesLoadFailed')));
        }
      } finally {
        if (!cancelled) setNotesLoading(false);
      }
    };

    loadNotes();
    return () => {
      cancelled = true;
    };
  }, [projectId, project]);

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  useEffect(() => {
    if (!notesPanelOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setNotesPanelOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [notesPanelOpen]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'orange';
      case 'resolved':
        return 'info';
      case 'closed':
        return 'default';
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';

  const formatDate = (dateString) => {
    if (!dateString) return tx('na');
    return new Date(dateString).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateRemainingDays = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getRemainingDaysColor = (days) => {
    if (days < 0) return 'border-red-800/30 bg-red-50 text-red-900';
    if (days <= 7) return 'border-orange/35 bg-orange-50 text-orange-950';
    if (days <= 30) return 'border-amber-800/30 bg-amber-50 text-amber-950';
    return 'border-emerald-800/25 bg-emerald-50 text-emerald-950';
  };

  const getRemainingDaysText = (days) => {
    if (days < 0) return tx('daysOverdue', { days: Math.abs(days) });
    if (days === 0) return tx('dueToday');
    if (days === 1) return tx('oneDayLeft');
    return tx('daysLeft', { days });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTicketStats = () => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status?.toLowerCase() === 'open').length;
    const inProgress = tickets.filter(t => t.status?.toLowerCase() === 'in_progress').length;
    const pending = tickets.filter(t => t.status?.toLowerCase() === 'pending').length;
    const resolved = tickets.filter(t => t.status?.toLowerCase() === 'resolved').length;
    const closed = tickets.filter(t => t.status?.toLowerCase() === 'closed').length;
    
    return { total, open, inProgress, pending, resolved, closed };
  };

  const toggleDescription = (ticketId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const toggleComment = (ticketId) => {
    setExpandedComments(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const handleStatusChange = async (newStatus) => {
    if (!project || newStatus === project.status) return;
    
    setUpdatingStatus(true);
    setError('');
    
    try {
      await projectAPI.updateProjectStatus(projectId, newStatus);
      setProject(prev => ({ ...prev, status: newStatus }));
      setError('');
      toast(tx('statusUpdated', { status: projectStatusLabel(newStatus) }), { severity: 'success' });
    } catch (err) {
      setError(err.response?.data?.message || tx('failedStatusUpdate'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const refreshPersonalNotes = async () => {
    if (!projectId) return;
    try {
      const res = await projectAPI.getProjectNotes(projectId);
      const list = res?.data?.notes;
      setPersonalNotes(Array.isArray(list) ? list : []);
      setNotesError('');
    } catch (err) {
      setNotesError(getAxiosErrorMessage(err, tx('personalNotesLoadFailed')));
    }
  };

  const handleAddPersonalNote = async () => {
    const text = newNoteContent.trim();
    if (!text || !projectId) return;
    setNotesSaving(true);
    try {
      await projectAPI.createProjectNote(projectId, text);
      setNewNoteContent('');
      await refreshPersonalNotes();
    } catch (err) {
      toast(getAxiosErrorMessage(err, tx('personalNotesLoadFailed')), {
        severity: 'error',
      });
    } finally {
      setNotesSaving(false);
    }
  };

  const handleSavePersonalNote = async (noteId) => {
    const text = editingContent.trim();
    if (!text || !projectId || !noteId) return;
    setNotesSaving(true);
    try {
      await projectAPI.updateProjectNote(projectId, noteId, text);
      setEditingNoteId(null);
      setEditingContent('');
      await refreshPersonalNotes();
    } catch (err) {
      toast(getAxiosErrorMessage(err, tx('personalNotesLoadFailed')), {
        severity: 'error',
      });
    } finally {
      setNotesSaving(false);
    }
  };

  const handleDeletePersonalNote = async (noteId) => {
    if (!projectId || !noteId) return;
    if (!window.confirm(tx('personalNotesDeleteConfirm'))) return;
    setNotesSaving(true);
    try {
      await projectAPI.deleteProjectNote(projectId, noteId);
      if (editingNoteId === noteId) {
        setEditingNoteId(null);
        setEditingContent('');
      }
      await refreshPersonalNotes();
    } catch (err) {
      toast(getAxiosErrorMessage(err, tx('personalNotesLoadFailed')), {
        severity: 'error',
      });
    } finally {
      setNotesSaving(false);
    }
  };

  const filteredTickets = tickets
    .filter(ticket => {
      // Filter by status
      const statusMatch = filter === 'all' || ticket.status?.toLowerCase() === filter;
      
      // Filter by search query (ticket ID)
      const searchMatch = searchQuery === '' || 
        ticket.ticket?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return statusMatch && searchMatch;
    })
    .sort((a, b) => {
      // Sort by creation date (newest first)
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      return dateB - dateA;
    });

  const stats = getTicketStats();
  const remainingDays = calculateRemainingDays(project?.estimated_end_date);
  const daysColor = getRemainingDaysColor(remainingDays);
  const daysText = getRemainingDaysText(remainingDays);

  if (loading) {
    return <ProjectDetailsSkeleton />;
  }

  if (fatalError || !project) {
    return (
      <div className="min-h-screen bg-app-background px-4 py-12 font-cairo">
        <div className="mx-auto max-w-lg rounded-app border border-app-divider bg-app-surface p-8 shadow-app-card">
          <Alert variant="error">{fatalError || tx('failedProjectDetails')}</Alert>
          <Button variant="ghost" className="mt-6" onClick={() => navigate('/')} icon={<NavBackIcon />}>
            {tx('backToProjects')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-background pb-12 font-cairo text-app-text">
      <div className="container mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 border-app-border text-app-text-secondary hover:bg-app-surface-variant hover:text-app-text"
            icon={<NavBackIcon />}
          >
            {tx('backToProjects')}
          </Button>

          <div className="mb-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-app-text sm:text-4xl">
                  {project?.project_name || tx('untitledProject')}
                </h1>
                <Badge variant={getStatusColor(project?.status)} size="lg">
                  {project?.status ? projectStatusLabel(project.status) : tx('unknown')}
                </Badge>
              </div>
              <p className="mb-4 text-[13px] leading-snug text-app-text-secondary">{tx('projectOverview')}</p>

              {isAdmin() && (
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="project-status-select" className="text-sm font-semibold text-app-text">
                    {tx('changeStatus')}
                  </label>
                  <div className="relative">
                    <select
                      id="project-status-select"
                      value={project?.status || ''}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={updatingStatus}
                      aria-busy={updatingStatus}
                      className={`rounded-app-input border border-app-border bg-app-surface py-2.5 ps-4 pe-10 text-sm font-semibold text-app-text shadow-app-soft transition-colors focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20 ${
                        updatingStatus ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-app-text-tertiary'
                      }`}
                    >
                      <option value="active">{tx('active')}</option>
                      <option value="completed">{tx('completed')}</option>
                      <option value="on_hold">{tx('onHold')}</option>
                      <option value="cancelled">{tx('cancelled')}</option>
                    </select>
                    {updatingStatus && (
                      <div className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2">
                        <InlineSkeletonPulse className="h-[18px] w-[18px]" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="lg"
                onClick={async () => {
                  try {
                    await getProjectConversation(projectId);
                    navigate('/chat');
                  } catch (error) {
                    toast(getAxiosErrorMessage(error, tx('openProjectChatError')), {
                      severity: 'error',
                    });
                  }
                }}
                className="border-2 border-app-primary/25 shadow-app-soft hover:bg-app-primary/[0.06]"
                icon={<ChatRounded sx={{ fontSize: 22 }} />}
              >
                {tx('openProjectChat')}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setNotesPanelOpen(true)}
                className="border-2 border-app-border shadow-app-soft hover:bg-app-surface-variant"
                icon={<StickyNote2Outlined sx={{ fontSize: 22 }} />}
              >
                {tx('personalNotesOpenPanel')}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate(`/project/${projectId}/new-ticket`)}
                className="shadow-app-soft"
                icon={<AddRounded sx={{ fontSize: 22 }} />}
              >
                {tx('newTicket')}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {/* Stats — design tokens + MUI icons */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-app-card">
            <Card.Content className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-app-input bg-app-primary/10 text-app-primary">
                  <CalendarTodayOutlined sx={{ fontSize: 26 }} />
                </div>
                <h3 className="text-base font-bold text-app-text">{tx('timeline')}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-app-text-secondary">{tx('startDate')}</p>
                  <p className="text-sm font-semibold text-app-text">{formatDate(project?.start_date)}</p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-app-text-secondary">{tx('endDate')}</p>
                  <p className="text-sm font-semibold text-app-text">{formatDate(project?.estimated_end_date)}</p>
                </div>
                {remainingDays !== null && (
                  <div className={`rounded-app-input border-2 p-2.5 ${daysColor}`}>
                    <p className="text-xs font-bold">{daysText}</p>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-app-card">
            <Card.Content className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-app-input bg-emerald-50 text-emerald-800">
                  <GroupsOutlined sx={{ fontSize: 26 }} />
                </div>
                <h3 className="text-base font-bold text-app-text">{tx('team')}</h3>
              </div>
              <p className="mb-1 text-3xl font-extrabold tabular-nums text-app-text">{project?.assigned_users?.length || 0}</p>
              <p className="mb-3 text-xs text-app-text-secondary">{tx('activeMembers')}</p>
              {project?.assigned_users && project.assigned_users.length > 0 && (
                <div className="flex -space-x-2">
                  {project.assigned_users.slice(0, 5).map((user, index) => {
                    const isStr = typeof user === 'string';
                    const displayName = isStr ? user : user?.name || '';
                    const rowKey = isStr ? user : user?._id || user?.id || `u-${index}`;
                    return (
                      <div
                        key={rowKey}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-app-surface bg-app-primary text-xs font-bold text-white"
                        title={displayName || undefined}
                      >
                        {getInitials(displayName)}
                      </div>
                    );
                  })}
                  {project.assigned_users.length > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-app-surface bg-app-surface-variant text-xs font-bold text-app-text">
                      +{project.assigned_users.length - 5}
                    </div>
                  )}
                </div>
              )}
              {isAdmin() && (
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setAssignTeamOpen(true)}
                    icon={<PersonAddOutlined sx={{ fontSize: 20 }} />}
                    className="w-full sm:w-auto"
                  >
                    {tx('manageProjectTeam')}
                  </Button>
                </div>
              )}
            </Card.Content>
          </Card>

          <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-app-card">
            <Card.Content className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-app-input bg-sky-50 text-sky-900">
                  <ConfirmationNumberOutlined sx={{ fontSize: 26 }} />
                </div>
                <h3 className="text-base font-bold text-app-text">{tx('tickets')}</h3>
              </div>
              <p className="mb-1 text-3xl font-extrabold tabular-nums text-app-text">{stats.total}</p>
              <p className="text-xs text-app-text-secondary">{tx('totalTickets')}</p>
            </Card.Content>
          </Card>

          <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-app-card">
            <Card.Content className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-app-input bg-orange/15 text-orange-dark">
                  <ScheduleRounded sx={{ fontSize: 26 }} />
                </div>
                <h3 className="text-base font-bold text-app-text">{tx('open')}</h3>
              </div>
              <p className="mb-1 text-3xl font-extrabold tabular-nums text-emerald-900">{stats.open}</p>
              <p className="text-xs text-app-text-secondary">{tx('openTickets')}</p>
            </Card.Content>
          </Card>
        </div>

        {/* Tickets table — full width; personal notes open in a slide-over panel */}
        <Card className="mb-8 shadow-app-card">
          <Card.Content className="p-5 sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-extrabold tracking-tight text-app-text">
                  {tx('allTickets')} ({filteredTickets.length})
                </h2>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md flex-1">
                <div className="pointer-events-none absolute start-3 top-1/2 z-0 -translate-y-1/2 text-app-text-tertiary">
                  <SearchRounded sx={{ fontSize: 22, display: 'block' }} />
                </div>
                <input
                  type="search"
                  placeholder={tx('searchByTicketId')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={tx('searchByTicketId')}
                  className={`w-full rounded-app-input border border-app-border bg-app-surface py-2.5 ps-10 text-sm font-medium text-app-text shadow-app-soft transition-colors hover:border-app-text-tertiary focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20 ${
                    searchQuery ? 'pe-11' : 'pe-4'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute end-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-app-input text-app-text-tertiary hover:bg-app-surface-variant hover:text-app-text"
                    aria-label="Clear search"
                  >
                    <CloseRounded sx={{ fontSize: 20, display: 'block' }} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: tx('all'), activeClass: 'bg-app-primary text-white shadow-app-soft' },
                  { key: 'open', label: `${tx('open')} (${stats.open})`, activeClass: 'bg-emerald-800 text-white shadow-app-soft' },
                  { key: 'in_progress', label: `${tx('inProgress')} (${stats.inProgress})`, activeClass: 'bg-amber-700 text-white shadow-app-soft' },
                  { key: 'pending', label: `${tx('pending')} (${stats.pending})`, activeClass: 'bg-orange-dark text-white shadow-app-soft' },
                  { key: 'resolved', label: `${tx('resolved')} (${stats.resolved})`, activeClass: 'bg-sky-800 text-white shadow-app-soft' },
                ].map(({ key, label, activeClass }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`rounded-app-input px-3 py-2 text-xs font-bold transition-colors sm:text-sm ${
                      filter === key
                        ? activeClass
                        : 'border border-app-border bg-app-surface-variant text-app-text-secondary hover:bg-app-border/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="rounded-app-input border-2 border-dashed border-app-border bg-app-background/80 py-14 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-app-primary/10 text-app-primary">
                  <DescriptionOutlined sx={{ fontSize: 36 }} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-app-text">{tx('noTicketsFound')}</h3>
                <p className="mb-6 text-sm text-app-text-secondary">
                  {filter === 'all'
                    ? tx('createFirstTicketHint')
                    : tx('noTicketsWithStatus', { status: filter.replace(/_/g, ' ') })}
                </p>
                {filter === 'all' && (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate(`/project/${projectId}/new-ticket`)}
                    icon={<AddRounded sx={{ fontSize: 22 }} />}
                  >
                    {tx('createFirstTicket')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-app-input border border-app-divider">
                <table className="w-full min-w-[920px] border-collapse">
                  <thead>
                    <tr className="border-b border-app-divider bg-app-surface-variant">
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary">
                        {tx('ticketId')}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary">
                        {tx('status')}
                      </th>
                      <th className="min-w-48 w-48 px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary">
                        {tx('priority')}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary">
                        {tx('sender')}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary">
                        {tx('receiver')}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary">
                        {tx('description')}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary">
                        {tx('cc')}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary">
                        {tx('created')}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary">
                        {tx('endDate')}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary">
                        {tx('comments')}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-app-text-secondary">
                        {tx('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-divider bg-app-surface">
                    {filteredTickets.map((ticket) => (
                      <tr 
                        key={ticket._id} 
                        onClick={() => navigate(`/ticket/${ticket._id}/edit`)}
                        className="cursor-pointer transition-colors hover:bg-app-primary/[0.04]"
                      >
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-app-text">{ticket.ticket || tx('na')}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={getStatusColor(ticket.status)} size="sm">
                            {ticketStatusLabel(ticket.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 w-48 min-w-48">
                          {ticket.priority ? (
                            <Badge 
                              variant={
                                ticket.priority === 'as_soon_as_possible' ? 'error' :
                                ticket.priority === '1-2_days' ? 'warning' : 'success'
                              }
                              size="sm"
                            >
                              {ticket.priority === 'as_soon_as_possible' ? `🔴 ${tx('priorityAsap')}` :
                               ticket.priority === '1-2_days' ? `🟡 ${tx('priority12Days')}` :
                               ticket.priority === 'take_your_time_3-5_days' ? `🟢 ${tx('priority35Days')}` :
                               ticket.priority}
                            </Badge>
                          ) : (
                            <span className="text-xs italic text-app-text-tertiary">{tx('notSet')}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-app-text">{ticket.requested_from || tx('na')}</p>
                          <p className="text-xs text-app-text-secondary">{ticket.requested_from_email || ''}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-app-text">{ticket.requested_to || tx('na')}</p>
                          <p className="text-xs text-app-text-secondary">{ticket.requested_to_email || ''}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-xs">
                            {ticket.description ? (
                              <div>
                                <p className={`text-sm text-app-text ${!expandedDescriptions[ticket._id] ? 'line-clamp-2' : ''}`}>
                                  {ticket.description}
                                </p>
                                {ticket.description.length > 100 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDescription(ticket._id);
                                    }}
                                    className="mt-1 flex items-center gap-1 text-xs font-semibold text-app-primary hover:text-app-primary-soft"
                                  >
                                    {expandedDescriptions[ticket._id] ? (
                                      <>
                                        <span>{tx('showLess')}</span>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                      </>
                                    ) : (
                                      <>
                                        <span>{tx('showMore')}</span>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm italic text-app-text-tertiary">{tx('noDescription')}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {ticket.cc && ticket.cc.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {ticket.cc.slice(0, 2).map((email, index) => (
                                <span key={index} className="rounded-md bg-app-surface-variant px-2 py-0.5 text-xs text-app-text-secondary">
                                  {email}
                                </span>
                              ))}
                              {ticket.cc.length > 2 && (
                                <span className="text-xs text-app-text-tertiary">
                                  +{ticket.cc.length - 2} {tx('more')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-app-text-tertiary">{tx('none')}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-app-text">{formatDate(ticket.date)}</p>
                          <p className="text-xs text-app-text-secondary">{ticket.time || ''}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-app-text">
                            {ticket.end_date ? formatDate(ticket.end_date) : tx('notSet')}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const replyCount = ticket.replies?.length || 0;
                              const hasLegacyComment = !!ticket.comment;
                              const totalComments = replyCount + (hasLegacyComment ? 1 : 0);
                              
                              return totalComments > 0 ? (
                                <div className="flex items-center gap-2">
                                  <ChatRounded sx={{ fontSize: 18, color: 'inherit' }} className="text-app-primary" />
                                  <span className="text-sm font-semibold text-app-text">
                                    {totalComments} {totalComments === 1 ? tx('commentSingle') : tx('commentPlural')}
                                  </span>
                                  {hasLegacyComment && (
                                    <Badge variant="default" className="text-xs">
                                      {tx('legacy')}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm italic text-app-text-tertiary">{tx('noComments')}</span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/ticket/${ticket._id}/edit`);
                            }}
                            className="rounded-app-input p-2 text-app-primary transition-colors hover:bg-app-primary/[0.08]"
                            title={tx('editTicket')}
                            aria-label={tx('editTicket')}
                          >
                            <EditRounded sx={{ fontSize: 22 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Content>
        </Card>

        {isCompanyOwner() && (
          <div
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="relative mt-10 overflow-hidden rounded-2xl border border-red-200/90 bg-gradient-to-br from-red-50/95 via-app-surface to-app-surface p-1 shadow-app-card sm:mt-12"
          >
            <div
              className="pointer-events-none absolute start-0 top-0 h-full w-1 rounded-s-lg bg-gradient-to-b from-red-500 to-red-600"
              aria-hidden
            />
            <div className="flex flex-col gap-4 px-4 py-4 ps-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md ring-2 ring-red-500/25">
                  <DeleteOutlineRounded sx={{ fontSize: 26 }} />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-extrabold tracking-tight text-red-900">{tx('deleteProjectZoneTitle')}</p>
                  <p className="max-w-2xl text-sm font-medium leading-relaxed text-red-800/90">{tx('deleteProjectHint')}</p>
                </div>
              </div>
              <Button
                variant="danger"
                size="lg"
                type="button"
                className="shrink-0 shadow-md ring-1 ring-red-600/20 transition-transform hover:-translate-y-0.5 sm:min-w-[200px]"
                onClick={() => setDeleteProjectModalOpen(true)}
                icon={<DeleteOutlineRounded sx={{ fontSize: 22 }} />}
              >
                {tx('deleteProject')}
              </Button>
            </div>
          </div>
        )}

        {notesPanelOpen && (
          <div
            className="fixed inset-0 z-[100] flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="personal-notes-panel-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label={tx('personalNotesClosePanel')}
              onClick={() => setNotesPanelOpen(false)}
            />
            <div className="relative z-10 flex h-full w-full max-w-md shrink-0 flex-col border-s border-app-divider bg-app-surface shadow-app-card">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-app-divider px-4 py-3 sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <StickyNote2Outlined sx={{ fontSize: 24 }} className="shrink-0 text-app-primary" />
                  <h2
                    id="personal-notes-panel-title"
                    className="truncate text-base font-extrabold text-app-text"
                  >
                    {tx('personalNotesTitle')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setNotesPanelOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-app-input text-app-text-secondary transition-colors hover:bg-app-surface-variant hover:text-app-text"
                  aria-label={tx('personalNotesClosePanel')}
                >
                  <CloseRounded sx={{ fontSize: 22 }} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                <PersonalNotesPanelBody
                  tx={tx}
                  personalNotes={personalNotes}
                  notesLoading={notesLoading}
                  notesError={notesError}
                  notesSaving={notesSaving}
                  newNoteContent={newNoteContent}
                  setNewNoteContent={setNewNoteContent}
                  editingNoteId={editingNoteId}
                  editingContent={editingContent}
                  setEditingNoteId={setEditingNoteId}
                  setEditingContent={setEditingContent}
                  setNotesError={setNotesError}
                  formatDate={formatDate}
                  handleAddPersonalNote={handleAddPersonalNote}
                  handleSavePersonalNote={handleSavePersonalNote}
                  handleDeletePersonalNote={handleDeletePersonalNote}
                />
              </div>
            </div>
          </div>
        )}

        <Modal
          isOpen={deleteProjectModalOpen}
          onClose={() => {
            if (!deleteProjectSubmitting) setDeleteProjectModalOpen(false);
          }}
          size="sm"
          contentDir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <Modal.Header
            onClose={() => {
              if (!deleteProjectSubmitting) setDeleteProjectModalOpen(false);
            }}
            closeAriaLabel={tx('modalClose')}
          >
            {tx('deleteProjectConfirmTitle')}
          </Modal.Header>
          <Modal.Content>
            <p className="text-sm leading-relaxed text-app-text-secondary">{tx('deleteProjectConfirmBody')}</p>
          </Modal.Content>
          <Modal.Footer>
            {lang === 'ar' ? (
              <>
                <Button
                  variant="danger"
                  type="button"
                  onClick={handleDeleteProject}
                  disabled={deleteProjectSubmitting}
                >
                  {deleteProjectSubmitting ? tx('deleteProjectDeleting') : tx('deleteProjectConfirm')}
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setDeleteProjectModalOpen(false)}
                  disabled={deleteProjectSubmitting}
                >
                  {tx('deleteProjectCancel')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setDeleteProjectModalOpen(false)}
                  disabled={deleteProjectSubmitting}
                >
                  {tx('deleteProjectCancel')}
                </Button>
                <Button
                  variant="danger"
                  type="button"
                  onClick={handleDeleteProject}
                  disabled={deleteProjectSubmitting}
                >
                  {deleteProjectSubmitting ? tx('deleteProjectDeleting') : tx('deleteProjectConfirm')}
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal>

        {isAdmin() && project && (project._id || project.id) && (
          <AssignUsersDialog
            open={assignTeamOpen}
            onClose={() => setAssignTeamOpen(false)}
            project={project}
            onUsersAssigned={() => {
              refreshProject();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
