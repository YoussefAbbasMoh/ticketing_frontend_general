import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI, ticketAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import AttendanceWidget from '../attendance/AttendanceWidget';
import AddProjectDialog from '../admin/AddProjectDialog';
import AssignUsersDialog from '../admin/AssignUsersDialog';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';

const Home = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [assignUsersOpen, setAssignUsersOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTickets, setActiveTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState({});
  const [ticketsSectionExpanded, setTicketsSectionExpanded] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { getProjectConversation } = useChat();

  useEffect(() => {
    fetchProjects();
    fetchActiveTickets();
  }, []);

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

  const getTicketStatusColor = (status) => {
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
    if (days < 0) return 'text-red-600 bg-red-50 border-red-200';
    if (days <= 7) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (days <= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRemainingDaysText = (days) => {
    if (days < 0) return `${Math.abs(days)} days passed`;
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const getRemainingDaysBadge = (days) => {
    if (days < 0) return { text: 'Overdue', color: 'error' };
    if (days <= 7) return { text: 'Urgent', color: 'warning' };
    return { text: 'On Track', color: 'success' };
  };

  const getProjectStats = () => {
    const total = filteredProjects.length;
    const active = filteredProjects.filter(p => p.status?.toLowerCase() === 'active').length;
    const completed = filteredProjects.filter(p => p.status?.toLowerCase() === 'completed').length;
    const onHold = filteredProjects.filter(p => p.status?.toLowerCase() === 'on_hold').length;

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

  const toggleTicketExpansion = (ticketId, e) => {
    e.stopPropagation();
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const toggleTicketsSection = () => {
    setTicketsSectionExpanded(prev => !prev);
  };

  // Filter projects by search query
  const filteredProjects = projects.filter(project => {
    if (searchQuery === '') return true;
    return project.project_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const stats = getProjectStats();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <Spinner size="xl" color="secondary" />
        <p className="text-gray-600">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-16">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary-700 bg-clip-text text-transparent mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-xl text-gray-600">
                Here's what's happening with your projects today
              </p>
            </div>
            {isAdmin() && (
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => navigate('/chat')}
                  className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all border-2 border-secondary"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  }
                >
                  Chat
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleAddProject}
                  className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                >
                  New Project
                </Button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {/* Attendance Widget */}
        <AttendanceWidget />

        {/* Active Tickets Box - Collapsible */}
        <Card className="mb-8 shadow-xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 overflow-hidden">
          {/* Header - Always Visible */}
          <div
            className="p-4 sm:p-6 md:p-8 cursor-pointer hover:bg-gray-50/50 transition-colors"
            onClick={toggleTicketsSection}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                    Active Tickets
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1 font-medium">
                    Tickets that require your attention
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                {activeTickets.length > 0 && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full shadow-lg">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span className="font-bold text-base sm:text-lg">
                      {activeTickets.length}
                    </span>
                  </div>
                )}

                {/* Expand/Collapse Button */}
                <button
                  className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 transition-all duration-300 shadow-md hover:shadow-lg flex-shrink-0"
                  title={ticketsSectionExpanded ? "Collapse" : "Expand"}
                >
                  <svg
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-blue-600 transition-transform duration-300 ${ticketsSectionExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Content */}
          <div
            className={`transition-all duration-500 ease-in-out ${ticketsSectionExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              } overflow-hidden`}
          >
            <Card.Content className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 pt-0">
              {loadingTickets ? (
                <div className="flex justify-center items-center py-12 sm:py-16">
                  <div className="text-center">
                    <Spinner size="xl" color="secondary" />
                    <p className="text-gray-600 mt-4 font-medium text-sm sm:text-base">Loading tickets...</p>
                  </div>
                </div>
              ) : activeTickets.length === 0 ? (
                <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl border-2 border-dashed border-blue-300 mx-2 sm:mx-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">All Clear!</h3>
                  <p className="text-gray-600 text-base sm:text-lg px-4">You have no active tickets at the moment</p>
                  <p className="text-gray-500 mt-2 text-sm sm:text-base">Great job staying on top of things! 🎉</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 mt-2 sm:mt-4">
                  {activeTickets.map((ticket, index) => {
                    const isExpanded = expandedTickets[ticket._id];
                    return (
                      <div
                        key={ticket._id}
                        onClick={() => navigate(`/ticket/${ticket._id}/edit`)}
                        className="group relative p-4 sm:p-6 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Priority Indicator */}
                        <div className="absolute top-0 left-0 w-1 sm:w-2 h-full bg-gradient-to-b from-blue-500 to-purple-600 rounded-l-xl sm:rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-4 gap-3">
                          <div className="flex-1 pl-1 sm:pl-2 w-full min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
                              <button
                                onClick={(e) => toggleTicketExpansion(ticket._id, e)}
                                className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 transition-colors hover:scale-110 flex-shrink-0"
                                title={isExpanded ? "Collapse" : "Expand"}
                              >
                                <svg
                                  className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                                  {ticket.ticket}
                                </h3>
                              </div>
                              <Badge variant={getTicketStatusColor(ticket.status)} size="sm" className="shadow-sm flex-shrink-0">
                                {ticket.status || 'Unknown'}
                              </Badge>
                            </div>

                            {ticket.project && (
                              <div className="flex items-center gap-2 mb-2 sm:mb-3 ml-8 sm:ml-14">
                                <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                  </svg>
                                  <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-blue-700 truncate">
                                    {ticket.project.project_name}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="ml-8 sm:ml-14 mb-3 sm:mb-4">
                              <p className={`text-xs sm:text-sm text-gray-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {ticket.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 sm:pt-4 border-t-2 border-gray-100 ml-1 sm:ml-2 gap-3 sm:gap-0">
                          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm flex-shrink-0">
                                <span className="text-white text-xs font-bold">
                                  {ticket.requested_from?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-medium">From</p>
                                <p className="text-xs sm:text-sm text-gray-800 font-semibold truncate max-w-[100px] sm:max-w-none">{ticket.requested_from}</p>
                              </div>
                            </div>

                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>

                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-sm flex-shrink-0">
                                <span className="text-white text-xs font-bold">
                                  {ticket.requested_to?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-medium">To</p>
                                <p className="text-xs sm:text-sm text-gray-800 font-semibold truncate max-w-[100px] sm:max-w-none">{ticket.requested_to}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-gray-500 ml-auto sm:ml-0">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs sm:text-sm font-medium">
                              {formatDate(ticket.date)}
                              {ticket.time && (
                                <span className="text-xs ml-1 hidden sm:inline">• {ticket.time}</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Hover Arrow */}
                        <div className="absolute top-1/2 right-4 sm:right-6 -translate-y-1/2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 hidden sm:block">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Content>
          </div>
        </Card>

        {/* Stats Cards */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Projects */}
            <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-lg">
              <Card.Content className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-purple-100 text-sm mb-2">Total Projects</p>
                    <p className="text-4xl font-bold">{stats.total}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Active Projects */}
            <Card className="border-2 border-green-500 shadow-md hover:shadow-lg transition-shadow">
              <Card.Content className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Active</p>
                    <p className="text-4xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Completed Projects */}
            <Card className="border-2 border-blue-500 shadow-md hover:shadow-lg transition-shadow">
              <Card.Content className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Completed</p>
                    <p className="text-4xl font-bold text-blue-600">{stats.completed}</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* On Hold Projects */}
            <Card className="border-2 border-orange-500 shadow-md hover:shadow-lg transition-shadow">
              <Card.Content className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm mb-2">On Hold</p>
                    <p className="text-4xl font-bold text-orange-600">{stats.onHold}</p>
                  </div>
                  <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        )}

        {/* Search Bar */}
        {projects.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search projects by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent hover:border-gray-400 transition-all duration-200 text-base"
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
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600">
                Found {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </p>
            )}
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? `No projects match "${searchQuery}". Try a different search term.`
                : isAdmin()
                  ? "Get started by creating your first project"
                  : "You don't have any assigned projects yet"}
            </p>
            {isAdmin() && !searchQuery && (
              <Button
                variant="secondary"
                size="lg"
                onClick={handleAddProject}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Create Your First Project
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
                        {project.status || 'Unknown'}
                      </Badge>
                      {isAdmin() && (
                        <button
                          onClick={(e) => handleAssignUsers(project, e)}
                          className="p-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-600 transition-colors"
                          title="Assign Users"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Project Name */}
                    <h3 className="text-xl font-bold text-gray-800 mb-4 line-clamp-2 min-h-[3.5rem]">
                      {project.project_name || 'Untitled Project'}
                    </h3>

                    <div className="h-px bg-gray-200 mb-4"></div>

                    {/* Dates */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
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
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
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
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <div className="flex -space-x-2">
                          {project.assigned_users.slice(0, 4).map((user, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                              title={user.name}
                            >
                              {getInitials(user.name)}
                            </div>
                          ))}
                          {project.assigned_users.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold border-2 border-white">
                              +{project.assigned_users.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          {project.assigned_users.length} member{project.assigned_users.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </Card.Content>

                  <Card.Footer className="bg-gray-50 p-4">
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
                            alert('Error opening project chat. Please try again.');
                          }
                        }}
                        className="shadow-none hover:shadow-md border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        }
                      >
                        Chat
                      </Button>
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/project/${project._id}`);
                        }}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        }
                        className="shadow-none hover:shadow-md"
                      >
                        Details
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              );
            })}
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
            className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-secondary to-secondary-700 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
            title="Add New Project"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Home;