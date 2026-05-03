import React, { useState, useEffect } from 'react';
import AddRounded from '@mui/icons-material/AddRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import ChatRounded from '@mui/icons-material/ChatRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import EditRounded from '@mui/icons-material/EditRounded';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import { CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, ticketAPI, getAxiosErrorMessage } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import ProjectDetailsSkeleton from './ProjectDetailsSkeleton';
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
    untitledProject: 'Untitled Project'
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
    untitledProject: 'مشروع بدون اسم'
  }
};

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
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
  const tx = (key, vars = {}) => {
    const template = TEXT[lang]?.[key] || TEXT.en[key] || key;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      template
    );
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
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

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
      // Show success message briefly
      const successMsg = tx('statusUpdated', { status: newStatus });
      setError(''); // Clear any errors
      // You could add a success state here if needed
    } catch (err) {
      setError(err.response?.data?.message || tx('failedStatusUpdate'));
    } finally {
      setUpdatingStatus(false);
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
          <Button variant="ghost" className="mt-6" onClick={() => navigate('/')} icon={<ArrowBackRounded sx={{ fontSize: 22 }} />}>
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
            icon={<ArrowBackRounded sx={{ fontSize: 22 }} />}
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
                  {(project?.status || tx('unknown')).replace(/_/g, ' ')}
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
                      className={`rounded-app-input border border-app-border bg-app-surface py-2.5 pl-4 pr-10 text-sm font-semibold text-app-text shadow-app-soft transition-colors focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20 ${
                        updatingStatus ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-app-text-tertiary'
                      }`}
                    >
                      <option value="active">{tx('active')}</option>
                      <option value="completed">{tx('completed')}</option>
                      <option value="on_hold">{tx('onHold')}</option>
                      <option value="cancelled">{tx('cancelled')}</option>
                    </select>
                    {updatingStatus && (
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <CircularProgress size={18} sx={{ color: '#080936' }} />
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
                  {project.assigned_users.slice(0, 5).map((user, index) => (
                    <div
                      key={index}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-app-surface bg-app-primary text-xs font-bold text-white"
                      title={user.name}
                    >
                      {getInitials(user.name)}
                    </div>
                  ))}
                  {project.assigned_users.length > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-app-surface bg-app-surface-variant text-xs font-bold text-app-text">
                      +{project.assigned_users.length - 5}
                    </div>
                  )}
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

        {/* Tickets table */}
        <Card className="shadow-app-card">
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
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-tertiary">
                  <SearchRounded sx={{ fontSize: 22 }} />
                </div>
                <input
                  type="search"
                  placeholder={tx('searchByTicketId')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={tx('searchByTicketId')}
                  className="w-full rounded-app-input border border-app-border bg-app-surface py-2.5 pl-10 pr-10 text-sm font-medium text-app-text shadow-app-soft transition-colors hover:border-app-text-tertiary focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-tertiary hover:text-app-text"
                    aria-label="Clear search"
                  >
                    <CloseRounded sx={{ fontSize: 22 }} />
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
                            {ticket.status || tx('unknown')}
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
      </div>
    </div>
  );
};

export default ProjectDetails;
