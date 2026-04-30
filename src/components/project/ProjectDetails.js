import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, ticketAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
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
  const { isAdmin } = useAuth();
  const { getProjectConversation } = useChat();
  const [project, setProject] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
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
    fetchProjectDetails();
    fetchTickets();
  }, [projectId]);

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  const fetchProjectDetails = async () => {
    try {
      const response = await projectAPI.getProject(projectId);
      setProject(response.data.project || response.data);
      console.log('Project data:', response.data);
    } catch (error) {
      setError(tx('failedProjectDetails'));
      console.error('Error fetching project:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await ticketAPI.getMyTickets(projectId);
      const ticketData = response.data.tickets || response.data || [];
      setTickets(Array.isArray(ticketData) ? ticketData : []);
      console.log('Tickets data:', ticketData);
    } catch (error) {
      setError(tx('failedTickets'));
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return tx('na');
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return tx('na');
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
    if (days < 0) return 'text-red-600 bg-red-50';
    if (days <= 7) return 'text-orange-600 bg-orange-50';
    if (days <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
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
    } catch (error) {
      setError(error.response?.data?.message || tx('failedStatusUpdate'));
      console.error('Error updating status:', error);
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
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <Spinner size="xl" color="secondary" />
        <p className="text-gray-600">{tx('loadingProjectDetails')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 text-gray-600 hover:text-primary"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }
          >
            {tx('backToProjects')}
          </Button>

          <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary-700 bg-clip-text text-transparent">
                  {project?.project_name}
                </h1>
                <Badge variant={getStatusColor(project?.status)} size="lg">
                  {project?.status || tx('unknown')}
                </Badge>
              </div>
              <p className="text-gray-600 mb-3">{tx('projectOverview')}</p>
              
              {/* Status Changer - Admin Only */}
              {isAdmin() && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">{tx('changeStatus')}</label>
                  <div className="relative">
                    <select
                      value={project?.status || ''}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={updatingStatus}
                      className={`px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent hover:border-gray-400 transition-all duration-200 text-sm font-medium ${
                        updatingStatus ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'
                      }`}
                    >
                      <option value="active">{tx('active')}</option>
                      <option value="completed">{tx('completed')}</option>
                      <option value="on_hold">{tx('onHold')}</option>
                      <option value="cancelled">{tx('cancelled')}</option>
                    </select>
                    {updatingStatus && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Spinner size="sm" color="secondary" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={async () => {
                  try {
                    await getProjectConversation(projectId);
                    navigate('/chat');
                  } catch (error) {
                    console.error('Error opening project chat:', error);
                    alert(tx('openProjectChatError'));
                  }
                }}
                className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
              >
                {tx('openProjectChat')}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate(`/project/${projectId}/new-ticket`)}
                className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Timeline Card */}
          <Card hover>
            <Card.Content className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{tx('timeline')}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{tx('startDate')}</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(project?.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{tx('endDate')}</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(project?.estimated_end_date)}</p>
                </div>
                {remainingDays !== null && (
                  <div className={`p-2 rounded-lg ${daysColor}`}>
                    <p className="text-xs font-semibold">{daysText}</p>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Team Members Card */}
          <Card hover>
            <Card.Content className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{tx('team')}</h3>
              </div>
              <p className="text-3xl font-bold text-primary mb-1">{project?.assigned_users?.length || 0}</p>
              <p className="text-xs text-gray-500 mb-3">{tx('activeMembers')}</p>
              {project?.assigned_users && project.assigned_users.length > 0 && (
                <div className="flex -space-x-2">
                  {project.assigned_users.slice(0, 5).map((user, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                      title={user.name}
                    >
                      {getInitials(user.name)}
                    </div>
                  ))}
                  {project.assigned_users.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold border-2 border-white">
                      +{project.assigned_users.length - 5}
                    </div>
                  )}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Total Tickets Card */}
          <Card hover>
            <Card.Content className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{tx('tickets')}</h3>
              </div>
              <p className="text-3xl font-bold text-primary mb-1">{stats.total}</p>
              <p className="text-xs text-gray-500">{tx('totalTickets')}</p>
            </Card.Content>
          </Card>

          {/* Open Tickets Card */}
          <Card hover>
            <Card.Content className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{tx('open')}</h3>
              </div>
              <p className="text-3xl font-bold text-green-600 mb-1">{stats.open}</p>
              <p className="text-xs text-gray-500">{tx('openTickets')}</p>
            </Card.Content>
          </Card>
        </div>

        {/* Tickets Table */}
        <Card>
          <Card.Content className="p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-800">{tx('allTickets')} ({filteredTickets.length})</h2>
            </div>

            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={tx('searchByTicketId')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent hover:border-gray-400 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    filter === 'all'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tx('all')}
                </button>
                <button
                  onClick={() => setFilter('open')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    filter === 'open'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tx('open')} ({stats.open})
                </button>
                <button
                  onClick={() => setFilter('in_progress')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    filter === 'in_progress'
                      ? 'bg-yellow-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tx('inProgress')} ({stats.inProgress})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    filter === 'pending'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tx('pending')} ({stats.pending})
                </button>
                <button
                  onClick={() => setFilter('resolved')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    filter === 'resolved'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tx('resolved')} ({stats.resolved})
                </button>
              </div>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{tx('noTicketsFound')}</h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'all'
                    ? tx('createFirstTicketHint')
                    : tx('noTicketsWithStatus', { status: filter })
                  }
                </p>
                {filter === 'all' && (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => navigate(`/project/${projectId}/new-ticket`)}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    }
                  >
                    {tx('createFirstTicket')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{tx('ticketId')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{tx('status')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-48 min-w-48">{tx('priority')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{tx('sender')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{tx('receiver')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{tx('description')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{tx('cc')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{tx('created')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{tx('endDate')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{tx('comments')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{tx('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTickets.map((ticket) => (
                      <tr 
                        key={ticket._id} 
                        onClick={() => navigate(`/ticket/${ticket._id}/edit`)}
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-gray-900">{ticket.ticket || tx('na')}</p>
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
                            <span className="text-xs text-gray-400 italic">{tx('notSet')}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-900">{ticket.requested_from || tx('na')}</p>
                          <p className="text-xs text-gray-500">{ticket.requested_from_email || ''}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-900">{ticket.requested_to || tx('na')}</p>
                          <p className="text-xs text-gray-500">{ticket.requested_to_email || ''}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-xs">
                            {ticket.description ? (
                              <div>
                                <p className={`text-sm text-gray-700 ${!expandedDescriptions[ticket._id] ? 'line-clamp-2' : ''}`}>
                                  {ticket.description}
                                </p>
                                {ticket.description.length > 100 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDescription(ticket._id);
                                    }}
                                    className="mt-1 text-xs text-secondary hover:text-secondary-700 font-medium flex items-center gap-1"
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
                              <span className="text-sm text-gray-400 italic">{tx('noDescription')}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {ticket.cc && ticket.cc.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {ticket.cc.slice(0, 2).map((email, index) => (
                                <span key={index} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                  {email}
                                </span>
                              ))}
                              {ticket.cc.length > 2 && (
                                <span className="text-xs text-gray-500">+{ticket.cc.length - 2} {tx('more')}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">{tx('none')}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-700">{formatDate(ticket.date)}</p>
                          <p className="text-xs text-gray-500">{ticket.time || ''}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-700">{ticket.end_date ? formatDate(ticket.end_date) : tx('notSet')}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const replyCount = ticket.replies?.length || 0;
                              const hasLegacyComment = !!ticket.comment;
                              const totalComments = replyCount + (hasLegacyComment ? 1 : 0);
                              
                              return totalComments > 0 ? (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-gray-700">
                                    {totalComments} {totalComments === 1 ? tx('commentSingle') : tx('commentPlural')}
                                  </span>
                                  {hasLegacyComment && (
                                    <Badge variant="default" className="text-xs">
                                      {tx('legacy')}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 italic">{tx('noComments')}</span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/ticket/${ticket._id}/edit`);
                            }}
                            className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                            title={tx('editTicket')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
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
