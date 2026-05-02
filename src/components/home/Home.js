import React, { useState, useEffect } from 'react';
import AddRounded from '@mui/icons-material/AddRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import ChatRounded from '@mui/icons-material/ChatRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import FolderOffOutlined from '@mui/icons-material/FolderOffOutlined';
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SupportAgentOutlined from '@mui/icons-material/SupportAgentOutlined';
import { useNavigate } from 'react-router-dom';
import { projectAPI, ticketAPI, subscriptionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import AttendanceWidget from '../attendance/AttendanceWidget';
import AddProjectDialog from '../admin/AddProjectDialog';
import AssignUsersDialog from '../admin/AssignUsersDialog';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import WorkspaceWelcome from './WorkspaceWelcome';
import WorkspaceTicketPreviewCard from './WorkspaceTicketPreviewCard';
import WorkspaceProjectPreviewCard from './WorkspaceProjectPreviewCard';
import StatChip from './StatChip';
import WorkspaceHomePanel from './WorkspaceHomePanel';
import { HomeLoadingSkeleton, ActiveTicketsLoadingRail } from './HomeSkeletons';
import { getStoredLanguage } from '../../i18n';

const TEXT = {
  en: {
    welcomeBack: 'Welcome back',
    welcomeFallback: 'there',
    happeningToday: "Here's what's happening with your projects today",
    chat: 'Chat',
    newProject: 'New Project',
    loadingProjects: 'Loading your projects...',
    activeTickets: 'Active Tickets',
    ticketsNeedAttention: 'Tickets that require your attention',
    collapse: 'Collapse',
    expand: 'Expand',
    loadingTickets: 'Loading tickets...',
    allClear: 'All Clear!',
    noActiveTickets: 'You have no active tickets at the moment',
    greatJob: 'Great job staying on top of things!',
    from: 'From',
    to: 'To',
    totalProjects: 'Total Projects',
    active: 'Active',
    completed: 'Completed',
    onHold: 'On Hold',
    searchProjectsPlaceholder: 'Search projects by name...',
    foundProjects: 'Found {{count}} {{label}} matching "{{query}}"',
    projectSingle: 'project',
    projectPlural: 'projects',
    noProjectsFound: 'No projects found',
    noProjectsYet: 'No projects yet',
    noProjectsMatch: 'No projects match "{{query}}". Try a different search term.',
    createFirstProjectHint: 'Get started by creating your first project',
    noAssignedProjects: "You don't have any assigned projects yet",
    createFirstProject: 'Create Your First Project',
    unknown: 'Unknown',
    untitledProject: 'Untitled Project',
    overdue: 'Overdue',
    urgent: 'Urgent',
    onTrack: 'On Track',
    dueToday: 'Due today',
    oneDayLeft: '1 day left',
    daysLeft: '{{days}} days left',
    daysPassed: '{{days}} days passed',
    membersSuffix: 'member',
    membersSuffixPlural: 'members',
    details: 'Details',
    assignUsers: 'Assign Users',
    openProjectChatError: 'Error opening project chat. Please try again.',
    addNewProject: 'Add New Project',
    projects: 'Projects',
    viewAll: 'View All',
    projectsSummary: '{{active}} active · {{completed}} completed',
    noActiveTicketsLine: 'No active tickets',
    ticketsRequireAttention: '{{count}} tickets requiring attention',
  },
  ar: {
    welcomeBack: 'مرحبًا بعودتك',
    welcomeFallback: 'صديقي',
    happeningToday: 'إليك ما يحدث في مشاريعك اليوم',
    chat: 'الدردشة',
    newProject: 'مشروع جديد',
    loadingProjects: 'جارٍ تحميل المشاريع...',
    activeTickets: 'التذاكر النشطة',
    ticketsNeedAttention: 'تذاكر تحتاج انتباهك',
    collapse: 'طي',
    expand: 'توسيع',
    loadingTickets: 'جارٍ تحميل التذاكر...',
    allClear: 'ممتاز!',
    noActiveTickets: 'لا توجد تذاكر نشطة حاليًا',
    greatJob: 'رائع! أنت متابع الأمور بشكل ممتاز',
    from: 'من',
    to: 'إلى',
    totalProjects: 'إجمالي المشاريع',
    active: 'نشط',
    completed: 'مكتمل',
    onHold: 'معلّق',
    searchProjectsPlaceholder: 'ابحث عن مشروع بالاسم...',
    foundProjects: 'تم العثور على {{count}} {{label}} مطابق لـ "{{query}}"',
    projectSingle: 'مشروع',
    projectPlural: 'مشاريع',
    noProjectsFound: 'لا توجد مشاريع مطابقة',
    noProjectsYet: 'لا توجد مشاريع بعد',
    noProjectsMatch: 'لا توجد مشاريع مطابقة لـ "{{query}}". جرب عبارة أخرى.',
    createFirstProjectHint: 'ابدأ بإنشاء أول مشروع لك',
    noAssignedProjects: 'لا توجد مشاريع مسندة إليك حاليًا',
    createFirstProject: 'أنشئ مشروعك الأول',
    unknown: 'غير معروف',
    untitledProject: 'مشروع بدون اسم',
    overdue: 'متأخر',
    urgent: 'عاجل',
    onTrack: 'ضمن الخطة',
    dueToday: 'مستحق اليوم',
    oneDayLeft: 'يوم واحد متبقٍ',
    daysLeft: 'متبقي {{days}} يوم',
    daysPassed: 'مرّ {{days}} يوم',
    membersSuffix: 'عضو',
    membersSuffixPlural: 'أعضاء',
    details: 'التفاصيل',
    assignUsers: 'تعيين المستخدمين',
    openProjectChatError: 'حدث خطأ أثناء فتح دردشة المشروع. حاول مرة أخرى.',
    addNewProject: 'إضافة مشروع جديد',
    projects: 'المشاريع',
    viewAll: 'عرض الكل',
    projectsSummary: '{{active}} نشط · {{completed}} مكتمل',
    noActiveTicketsLine: 'لا توجد تذاكر نشطة',
    ticketsRequireAttention: '{{count}} تذكرة تحتاج انتباهك',
  }
};

const Home = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [assignUsersOpen, setAssignUsersOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTickets, setActiveTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [attendanceKind, setAttendanceKind] = useState('loading');
  const [subscriptionNotice, setSubscriptionNotice] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [lang, setLang] = useState(getStoredLanguage());
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { getProjectConversation } = useChat();
  const activeCompanyId = user?.activeCompanyId ? String(user.activeCompanyId) : '';
  const activeCompanyName =
    (user?.companies || []).find((entry) => {
      const raw = entry?.companyId ?? entry?.company?._id ?? entry?.company;
      return raw != null && String(raw) === activeCompanyId;
    })?.company?.name || '';
  const tx = (key, vars = {}) => {
    const template = TEXT[lang]?.[key] || TEXT.en[key] || key;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      template
    );
  };
  const welcomeCompanySuffix = activeCompanyName ? ` @ ${activeCompanyName}` : '';

  useEffect(() => {
    fetchProjects();
    fetchActiveTickets();
    fetchSubscriptionNotice();
  }, []);

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  const fetchSubscriptionNotice = async () => {
    try {
      const response = await subscriptionAPI.getMySubscription();
      const notice = response?.data?.notice || '';
      const status = response?.data?.status || '';
      setSubscriptionNotice(notice);
      setSubscriptionStatus(status);
    } catch (apiError) {
      console.error('Error fetching subscription notice:', apiError);
      setSubscriptionNotice('');
      setSubscriptionStatus('');
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await projectAPI.getMyProjects();

      // Handle different response structures
      let projectData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          projectData = response.data.projects;
        } else if (response.data.projects && Array.isArray(response.data.projects)) {
          projectData = response.data.projects;
        } else if (typeof response.data === 'object') {
          projectData = [response.data];
        }
      }

      setProjects(projectData);
      console.log('Fetched projects:', projectData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error.response?.data?.message || 'Failed to fetch projects. Please try again.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTickets = async () => {
    try {
      setLoadingTickets(true);
      const response = await ticketAPI.getMyActiveTickets();

      // Handle response structure
      let ticketData = [];
      if (response && response.data) {
        if (response.data.tickets && Array.isArray(response.data.tickets)) {
          ticketData = response.data.tickets;
        } else if (Array.isArray(response.data)) {
          ticketData = response.data;
        }
      }

      setActiveTickets(ticketData);
      console.log('Fetched active tickets:', ticketData);
    } catch (error) {
      console.error('Error fetching active tickets:', error);
      setActiveTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'on_hold':
        return 'warning';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
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
    if (days < 0) return tx('daysPassed', { days: Math.abs(days) });
    if (days === 0) return tx('dueToday');
    if (days === 1) return tx('oneDayLeft');
    return tx('daysLeft', { days });
  };

  const getRemainingDaysBadge = (days) => {
    if (days < 0) return { text: tx('overdue'), color: 'error' };
    if (days <= 7) return { text: tx('urgent'), color: 'warning' };
    return { text: tx('onTrack'), color: 'success' };
  };

  const getProjectStats = () => {
    const total = projects.length;
    const active = projects.filter((p) => p.status?.toLowerCase() === 'active').length;
    const completed = projects.filter((p) => p.status?.toLowerCase() === 'completed').length;
    const onHold = projects.filter((p) => p.status?.toLowerCase() === 'on_hold').length;

    return { total, active, completed, onHold };
  };

  const handleAddProject = () => {
    setAddProjectOpen(true);
  };

  const handleProjectAdded = () => {
    fetchProjects();
  };

  const handleAssignUsers = (project, e) => {
    e.stopPropagation();
    setSelectedProject(project);
    setAssignUsersOpen(true);
  };

  const handleUsersAssigned = () => {
    fetchProjects();
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

  // Filter projects by search query
  const filteredProjects = projects.filter(project => {
    if (searchQuery === '') return true;
    return project.project_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const stats = getProjectStats();
  const isRtl = lang === 'ar';

  if (loading) {
    return <HomeLoadingSkeleton tx={tx} />;
  }

  return (
    <div className="min-h-screen bg-app-background pb-16 font-cairo text-app-text">
      <div className="container mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
        <WorkspaceWelcome
          lang={lang}
          userName={user?.name}
          welcomeFallback={tx('welcomeFallback')}
          companySuffix={activeCompanyName ? ` @ ${activeCompanyName}` : ''}
          attendanceKind={attendanceKind}
          isAdmin={isAdmin()}
          onChat={() => navigate('/chat')}
          onNewProject={handleAddProject}
          isRtl={isRtl}
        />

        {error && (
          <div className="mb-6">
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {subscriptionNotice && (
          <div className="mb-6">
            <Alert variant={subscriptionStatus === 'expired' ? 'warning' : 'info'}>
              {subscriptionNotice}
            </Alert>
          </div>
        )}

        <AttendanceWidget onAttendanceKindChange={setAttendanceKind} />

        {/* Active Tickets — Flutter TicketsSection: card shell + ~172px horizontal rail */}
        <WorkspaceHomePanel
          id="workspace-active-tickets"
          title={tx('activeTickets')}
          subtitle={
            loadingTickets
              ? tx('loadingTickets')
              : activeTickets.length === 0
                ? tx('noActiveTicketsLine')
                : tx('ticketsRequireAttention', { count: activeTickets.length })
          }
        >
          {loadingTickets ? (
            <ActiveTicketsLoadingRail />
          ) : activeTickets.length === 0 ? (
            <div className="flex h-[172px] flex-col items-center justify-center overflow-hidden rounded-app-input border border-dashed border-app-border bg-app-background/60 px-4 py-4 text-center">
              <div className="mx-auto mb-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-success/15 shadow-app-soft text-emerald-800">
                <SupportAgentOutlined sx={{ fontSize: 30 }} />
              </div>
              <h3 className="text-sm font-bold text-app-text">{tx('allClear')}</h3>
              <p className="mt-0.5 line-clamp-2 max-w-md text-xs text-app-text-secondary">{tx('noActiveTickets')}</p>
              <p className="mt-1 line-clamp-1 text-[11px] text-app-text-secondary">{tx('greatJob')} 🎉</p>
            </div>
          ) : (
            <div className="min-h-[172px]">
              <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-app-border">
                {activeTickets.map((ticket) => (
                  <WorkspaceTicketPreviewCard
                    key={ticket._id}
                    ticket={ticket}
                    onClick={() => navigate(`/ticket/${ticket._id}/edit`)}
                  />
                ))}
              </div>
            </div>
          )}
        </WorkspaceHomePanel>

        {/* Projects — Flutter ProjectsSection: same card shell, chips + ~150px rail */}
        <WorkspaceHomePanel
          id="workspace-projects-intro"
          title={tx('projects')}
          subtitle={tx('projectsSummary', { active: stats.active, completed: stats.completed })}
          headerRight={
            projects.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="rounded-full bg-app-primary/10 px-3.5 py-1.5 text-xs font-bold text-app-primary transition-colors hover:bg-app-primary/15"
              >
                {tx('viewAll')}
              </button>
            ) : null
          }
        >
          <div className="mb-4 flex flex-wrap gap-2 sm:gap-3">
            <StatChip label={tx('active')} count={stats.active} tone="success" icon="active" />
            <StatChip label={tx('completed')} count={stats.completed} tone="info" icon="completed" />
            <StatChip label={tx('totalProjects')} count={stats.total} tone="primary" icon="total" />
          </div>
          {projects.length === 0 ? (
            <div className="flex min-h-[150px] flex-col items-center justify-center rounded-app-input border border-dashed border-app-border bg-app-background/60 px-4 py-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-app-primary/10 text-app-primary">
                <FolderOffOutlined sx={{ fontSize: 36 }} />
              </div>
              <h3 className="text-base font-bold text-app-text">{tx('noProjectsYet')}</h3>
              <p className="mt-1 max-w-md text-sm text-app-text-secondary">
                {isAdmin() ? tx('createFirstProjectHint') : tx('noAssignedProjects')}
              </p>
              {isAdmin() && (
                <Button variant="secondary" size="md" className="mt-5" onClick={handleAddProject}>
                  {tx('createFirstProject')}
                </Button>
              )}
            </div>
          ) : (
            <div className="min-h-[150px]">
              <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-app-border">
                {filteredProjects.slice(0, 10).map((project, index) => (
                  <WorkspaceProjectPreviewCard
                    key={project._id}
                    project={project}
                    index={index}
                    onClick={() => navigate(`/project/${project._id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </WorkspaceHomePanel>

        {projects.length > 0 && (
          <div id="projects-section" className="scroll-mt-24">
            <div className="mb-6">
              <div className="relative max-w-md">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-tertiary">
                  <SearchRounded sx={{ fontSize: 22 }} />
                </div>
                <input
                  type="text"
                  placeholder={tx('searchProjectsPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-app-input border border-app-border bg-app-surface py-3 pl-10 pr-4 text-base text-app-text transition-all duration-200 hover:border-app-text-tertiary focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-[#080936]/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-tertiary hover:text-app-text"
                  >
                    <CloseRounded sx={{ fontSize: 22 }} />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-app-text-secondary">
                  {tx('foundProjects', {
                    count: filteredProjects.length,
                    label: filteredProjects.length === 1 ? tx('projectSingle') : tx('projectPlural'),
                    query: searchQuery,
                  })}
                </p>
              )}
            </div>

        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-app-border bg-app-surface py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-app-primary/10 text-app-primary">
              <FolderOffOutlined sx={{ fontSize: 44 }} />
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-app-text">
              {searchQuery ? tx('noProjectsFound') : tx('noProjectsYet')}
            </h3>
            <p className="mb-6 text-app-text-secondary">
              {searchQuery
                ? tx('noProjectsMatch', { query: searchQuery })
                : isAdmin()
                  ? tx('createFirstProjectHint')
                  : tx('noAssignedProjects')}
            </p>
            {isAdmin() && !searchQuery && (
              <Button
                variant="secondary"
                size="lg"
                onClick={handleAddProject}
                icon={<AddRounded sx={{ fontSize: 22 }} />}
              >
                {tx('createFirstProject')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const remainingDays = calculateRemainingDays(project.estimated_end_date);
              const daysColor = getRemainingDaysColor(remainingDays);
              const daysText = getRemainingDaysText(remainingDays);
              const daysBadge = getRemainingDaysBadge(remainingDays);

              return (
                <Card
                  key={project._id}
                  hover
                  onClick={() => navigate(`/project/${project._id}`)}
                  className="cursor-pointer"
                >
                  <Card.Content className="p-6">
                    {/* Header with Status and Admin Actions */}
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant={getStatusColor(project.status)} size="md">
                        {project.status || tx('unknown')}
                      </Badge>
                      {isAdmin() && (
                        <button
                          onClick={(e) => handleAssignUsers(project, e)}
                          className="rounded-lg bg-app-info/12 p-2 text-app-info transition-colors hover:bg-app-info/20"
                          title={tx('assignUsers') || 'Assign Users'}
                        >
                          <PersonAddOutlined sx={{ fontSize: 18 }} />
                        </button>
                      )}
                    </div>

                    {/* Project Name */}
                    <h3 className="mb-4 line-clamp-2 min-h-[3.5rem] text-xl font-bold text-app-text">
                      {project.project_name || tx('untitledProject')}
                    </h3>

                    <div className="mb-4 h-px bg-app-divider" />

                    {/* Dates */}
                    <div className="mb-4">
                      <div className="mb-3 flex items-center gap-2 text-sm text-app-text-secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(project.start_date)} - {formatDate(project.estimated_end_date)}</span>
                      </div>

                      {/* Remaining Days */}
                      {remainingDays !== null && (
                        <div className={`p-3 rounded-lg border-2 ${daysColor}`}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <ScheduleRounded sx={{ fontSize: 22 }} />
                              <span className="text-sm font-semibold">{daysText}</span>
                            </div>
                            <Badge variant={daysBadge.color} size="sm">
                              {daysBadge.text}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Team Members */}
                    {project.assigned_users && project.assigned_users.length > 0 && (
                      <div className="flex items-center gap-3 border-t border-app-divider pt-4">
                        <div className="flex -space-x-2">
                          {project.assigned_users.slice(0, 4).map((user, index) => (
                            <div
                              key={index}
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-app-primary text-xs font-bold text-white"
                              title={user.name}
                            >
                              {getInitials(user.name)}
                            </div>
                          ))}
                          {project.assigned_users.length > 4 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-app-surface-variant text-xs font-bold text-app-text">
                              +{project.assigned_users.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-app-text-secondary">
                          {project.assigned_users.length} {project.assigned_users.length !== 1 ? tx('membersSuffixPlural') : tx('membersSuffix')}
                        </span>
                      </div>
                    )}
                  </Card.Content>

                  <Card.Footer className="bg-app-surface-variant p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        fullWidth
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await getProjectConversation(project._id);
                            navigate('/chat');
                          } catch (error) {
                            console.error('Error opening project chat:', error);
                            alert(tx('openProjectChatError'));
                          }
                        }}
                        className="border-2 border-app-info text-app-info shadow-none hover:bg-app-info/10 hover:shadow-app-soft"
                        icon={<ChatRounded sx={{ fontSize: 22 }} />}
                      >
                        {tx('chat')}
                      </Button>
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/project/${project._id}`);
                        }}
                        icon={<ArrowForwardRounded sx={{ fontSize: 22 }} />}
                        className="shadow-none hover:shadow-md"
                      >
                        {tx('details')}
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              );
            })}
          </div>
        )}
          </div>
        )}

        {/* Dialogs - Admin Only */}
        {isAdmin() && (
          <>
            <AddProjectDialog
              open={addProjectOpen}
              onClose={() => setAddProjectOpen(false)}
              onProjectAdded={handleProjectAdded}
            />

            <AssignUsersDialog
              open={assignUsersOpen}
              onClose={() => setAssignUsersOpen(false)}
              project={selectedProject}
              onUsersAssigned={handleUsersAssigned}
            />
          </>
        )}

        {/* Floating Action Button for Admin */}
        {isAdmin() && projects.length > 0 && (
          <button
            onClick={handleAddProject}
            className="fixed bottom-8 right-8 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange to-orange-dark text-white shadow-app-card transition-all duration-300 hover:scale-110 hover:shadow-lg"
            title={tx('addNewProject')}
          >
            <AddRounded sx={{ fontSize: 36 }} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Home;