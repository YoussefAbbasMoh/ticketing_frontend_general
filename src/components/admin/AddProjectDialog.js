import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Alert,
  IconButton,
  Divider,
  Avatar,
  Paper,
  Fade,
} from '@mui/material';
import { alpha, useTheme, ThemeProvider, createTheme } from '@mui/material/styles';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { startOfDay } from 'date-fns';
import { enGB } from 'date-fns/locale/en-GB';
import { ar } from 'date-fns/locale/ar';
import { projectAPI, userAPI } from '../../services/api';
import { getStoredLanguage } from '../../i18n';

/** Partial MUI X pickers strings (no ar bundle in @mui/x-date-pickers/locales). */
const AR_PICKERS_LOCALE_TEXT = {
  cancelButtonLabel: 'إلغاء',
  okButtonLabel: 'موافق',
  clearButtonLabel: 'مسح',
  todayButtonLabel: 'اليوم',
  previousMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
  startDate: 'تاريخ البدء',
  endDate: 'تاريخ الانتهاء',
  datePickerToolbarTitle: 'اختر التاريخ',
  openDatePickerDialogue: (formattedDate) =>
    formattedDate ? `اختر التاريخ، المحدد ${formattedDate}` : 'اختر التاريخ',
};

const DIALOG_TEXT = {
  en: {
    createNewProject: 'Create New Project',
    createNewProjectSubtitle: 'Set up your project details and team',
    closeAria: 'Close',
    projectNameAndScheduleTitle: 'Project name & schedule',
    projectNameAndScheduleHint:
      'The name appears on tickets and reports. Choose the start date, then the expected end date.',
    projectName: 'Project name',
    projectNamePlaceholder: 'e.g. Mobile app rollout',
    startDate: 'Start date',
    estimatedEndDate: 'Estimated end date',
    teamMembers: 'Team members',
    assignUsers: 'Assign users',
    assignUsersPlaceholder: 'Choose who can access this project…',
    teamMembersCount: '{{n}} team member(s) selected',
    cancel: 'Cancel',
    createProject: 'Create project',
    creatingEllipsis: 'Creating…',
    createdExclam: 'Created!',
    projectCreatedSuccess: 'Project created successfully!',
    projectNameRequired: 'Project name is required.',
    datesRequired: 'Please choose a start date and an estimated end date.',
    startDateInPast: 'Start date cannot be in the past.',
    endDateInPast: 'Estimated end date cannot be in the past.',
    endBeforeStart: 'Estimated end date must be on or after the start date.',
    createProjectFailed: 'Failed to create project. Please try again.',
    projectPlanLimit:
      'Your plan allows up to {{limit}} project(s). Upgrade your subscription to add more.',
    roleAdmin: 'Admin',
    roleManager: 'Manager',
    roleDeveloper: 'Developer',
    roleDesigner: 'Designer',
    roleOwner: 'Owner',
    errProjectDuplicateName: 'A project with this name already exists in your company.',
    errAssignedUsersInvalid: 'Some selected users are invalid.',
    errAssignedUsersWrongCompany: 'Assigned users must belong to your active company.',
    errActiveCompanyRequired: 'Active company required. Log in or switch company first.',
    errInsufficientPermissions: 'You do not have permission to create a project.',
    errCompanyNotFound: 'Company not found.',
    errServerShort: 'Something went wrong. Please try again.',
  },
  ar: {
    createNewProject: 'إنشاء مشروع جديد',
    createNewProjectSubtitle: 'حدد تفاصيل المشروع والفريق',
    closeAria: 'إغلاق',
    projectNameAndScheduleTitle: 'اسم المشروع والجدول الزمني',
    projectNameAndScheduleHint:
      'يظهر الاسم في التذاكر والتقارير. اختر تاريخ البدء ثم تاريخ الانتهاء المتوقع.',
    projectName: 'اسم المشروع',
    projectNamePlaceholder: 'مثال: إطلاق تطبيق الجوال',
    startDate: 'تاريخ البدء',
    estimatedEndDate: 'تاريخ الانتهاء المتوقع',
    teamMembers: 'أعضاء الفريق',
    assignUsers: 'تعيين المستخدمين',
    assignUsersPlaceholder: 'اختر من يمكنه الوصول إلى هذا المشروع…',
    teamMembersCount: 'تم اختيار {{n}} عضو/أعضاء',
    cancel: 'إلغاء',
    createProject: 'إنشاء المشروع',
    creatingEllipsis: 'جارٍ الإنشاء…',
    createdExclam: 'تم!',
    projectCreatedSuccess: 'تم إنشاء المشروع بنجاح!',
    projectNameRequired: 'اسم المشروع مطلوب.',
    datesRequired: 'يرجى اختيار تاريخ البدء وتاريخ الانتهاء المتوقع.',
    startDateInPast: 'لا يمكن اختيار تاريخ بدء في الماضي.',
    endDateInPast: 'لا يمكن اختيار تاريخ انتهاء متوقع في الماضي.',
    endBeforeStart: 'تاريخ الانتهاء المتوقع يجب أن يكون في أو بعد تاريخ البدء.',
    createProjectFailed: 'تعذر إنشاء المشروع. حاول مرة أخرى.',
    projectPlanLimit:
      'خطتك تسمح بحد أقصى {{limit}} مشروع/مشاريع. رقِّ اشتراكك لإضافة المزيد.',
    roleAdmin: 'مسؤول',
    roleManager: 'مدير',
    roleDeveloper: 'مطور',
    roleDesigner: 'مصمم',
    roleOwner: 'مالك',
    errProjectDuplicateName: 'يوجد مشروع بنفس الاسم في شركتك.',
    errAssignedUsersInvalid: 'بعض المستخدمين المختارين غير صالحين.',
    errAssignedUsersWrongCompany: 'يجب أن ينتمي المستخدمون المعيّنون إلى شركتك النشطة.',
    errActiveCompanyRequired: 'يلزم اختيار شركة نشطة. سجّل الدخول أو بدّل الشركة أولًا.',
    errInsufficientPermissions: 'ليس لديك صلاحية لإنشاء مشروع.',
    errCompanyNotFound: 'الشركة غير موجودة.',
    errServerShort: 'حدث خطأ. حاول مرة أخرى.',
  },
};

const toLocalYmd = (d) => {
  if (!d) return '';
  const z = startOfDay(d);
  const y = z.getFullYear();
  const m = String(z.getMonth() + 1).padStart(2, '0');
  const day = String(z.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const AddProjectDialog = ({ open, onClose, onProjectAdded }) => {
  const theme = useTheme();
  const [lang, setLang] = useState(getStoredLanguage());
  const [formData, setFormData] = useState({
    project_name: '',
    start_date: null,
    estimated_end_date: null,
    assigned_users: [],
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const autoAssignableRoles = ['admin', 'owner', 'manager'];

  const tx = (key, vars = {}) => {
    const template = DIALOG_TEXT[lang]?.[key] || DIALOG_TEXT.en[key] || key;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      template
    );
  };

  const formatWorkspaceRole = (roleRaw) => {
    const r = String(roleRaw || '').toLowerCase();
    const key =
      { admin: 'roleAdmin', manager: 'roleManager', developer: 'roleDeveloper', designer: 'roleDesigner', owner: 'roleOwner' }[
        r
      ];
    return key ? tx(key) : String(roleRaw || '').trim() || '—';
  };

  const assignedIdsSet = useMemo(() => new Set(formData.assigned_users), [formData.assigned_users]);

  const usersAvailableToAssign = useMemo(
    () => users.filter((u) => u._id && !assignedIdsSet.has(u._id)),
    [users, assignedIdsSet]
  );

  const todayStart = startOfDay(new Date());
  const endMinDate =
    formData.start_date &&
    startOfDay(formData.start_date).getTime() >= todayStart.getTime()
      ? startOfDay(formData.start_date)
      : todayStart;

  const getCurrentUserFromStorage = () => {
    try {
      const userRaw = localStorage.getItem('user');
      if (!userRaw) return null;
      return JSON.parse(userRaw);
    } catch (parseError) {
      console.error('Error parsing current user from storage:', parseError);
      return null;
    }
  };

  const getAutoAssignedUsers = (selectedUsers = []) => {
    const currentUser = getCurrentUserFromStorage();
    const currentUserId = currentUser?._id;
    const currentUserRole = String(currentUser?.role || '').toLowerCase();
    const shouldAutoAssignCurrentUser =
      Boolean(currentUserId) && autoAssignableRoles.includes(currentUserRole);

    if (!shouldAutoAssignCurrentUser) {
      return selectedUsers;
    }

    return Array.from(new Set([...selectedUsers, currentUserId]));
  };

  useEffect(() => {
    const onLang = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLang);
    return () => window.removeEventListener('language-changed', onLang);
  }, []);

  useEffect(() => {
    if (open) {
      setLang(getStoredLanguage());
      fetchUsers();
      setSuccess(false);
      setError('');
      setFormData({
        project_name: '',
        start_date: null,
        estimated_end_date: null,
        assigned_users: [],
      });
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(Array.isArray(response.data.users) ? response.data.users : []);
    } catch (fetchErr) {
      console.error('Error fetching users:', fetchErr);
      setUsers([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
  };

  const handleDateChange = (field, date) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: date };
      if (field === 'start_date' && date && prev.estimated_end_date) {
        if (startOfDay(prev.estimated_end_date) < startOfDay(date)) {
          next.estimated_end_date = null;
        }
      }
      return next;
    });
    setError('');
  };

  const handleUserChange = (event) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      assigned_users: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleRemoveAssignedUser = (userId) => {
    setFormData((prev) => ({
      ...prev,
      assigned_users: prev.assigned_users.filter((id) => id !== userId),
    }));
  };

  const mapSubmitError = (err) => {
    const data = err.response?.data;
    const code = data?.code;
    const msg = String(data?.message || '');
    const parseLimitFromMessage = (s) => {
      const m = String(s || '').match(/up to (\d+)\s*projects?/i);
      return m ? Number(m[1]) : NaN;
    };
    if (code === 'PROJECT_PLAN_LIMIT' || /plan allows up to \d+ projects/i.test(msg)) {
      const fromPayload = data?.limit != null ? Number(data.limit) : NaN;
      const lim = Number.isFinite(fromPayload)
        ? fromPayload
        : Number.isFinite(parseLimitFromMessage(msg))
          ? parseLimitFromMessage(msg)
          : '?';
      return tx('projectPlanLimit', { limit: lim });
    }
    if (code === 'START_DATE_IN_PAST' || /start date cannot be in the past/i.test(msg)) {
      return tx('startDateInPast');
    }
    if (code === 'END_DATE_IN_PAST' || /estimated end date cannot be in the past/i.test(msg)) {
      return tx('endDateInPast');
    }
    if (code === 'END_BEFORE_START' || /end date must be on or after the start date/i.test(msg)) {
      return tx('endBeforeStart');
    }
    if (/A project with this name already exists/i.test(msg)) {
      return tx('errProjectDuplicateName');
    }
    if (/Some assigned users are invalid/i.test(msg)) {
      return tx('errAssignedUsersInvalid');
    }
    if (/Assigned users must belong to the active company/i.test(msg)) {
      return tx('errAssignedUsersWrongCompany');
    }
    if (/Active company required/i.test(msg)) {
      return tx('errActiveCompanyRequired');
    }
    if (/Insufficient permissions/i.test(msg)) {
      return tx('errInsufficientPermissions');
    }
    if (/Company not found/i.test(msg)) {
      return tx('errCompanyNotFound');
    }
    if (/Internal server error/i.test(msg)) {
      return tx('errServerShort');
    }
    if (lang === 'en' && msg) return msg;
    return tx('createProjectFailed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!String(formData.project_name || '').trim()) {
      setError(tx('projectNameRequired'));
      setLoading(false);
      return;
    }
    if (!formData.start_date || !formData.estimated_end_date) {
      setError(tx('datesRequired'));
      setLoading(false);
      return;
    }
    const sd = startOfDay(formData.start_date);
    const ed = startOfDay(formData.estimated_end_date);
    if (sd < todayStart) {
      setError(tx('startDateInPast'));
      setLoading(false);
      return;
    }
    if (ed < todayStart) {
      setError(tx('endDateInPast'));
      setLoading(false);
      return;
    }
    if (ed < sd) {
      setError(tx('endBeforeStart'));
      setLoading(false);
      return;
    }

    try {
      const projectData = {
        ...formData,
        start_date: toLocalYmd(formData.start_date),
        estimated_end_date: toLocalYmd(formData.estimated_end_date),
        assigned_users: getAutoAssignedUsers(formData.assigned_users),
      };

      await projectAPI.addProject(projectData);
      setSuccess(true);

      setTimeout(() => {
        onProjectAdded();
        onClose();
        setFormData({
          project_name: '',
          start_date: null,
          estimated_end_date: null,
          assigned_users: [],
        });
        setSuccess(false);
      }, 1000);
    } catch (submitErr) {
      setError(mapSubmitError(submitErr));
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role) => {
    const r = role?.toLowerCase();
    const { palette } = theme;
    const map = {
      admin: palette.secondary.main,
      manager: palette.info.main,
      developer: palette.success.main,
      designer: palette.warning.main,
    };
    return map[r] || palette.text.disabled;
  };

  const sectionPaperSx = {
    p: 2.5,
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    bgcolor: 'background.default',
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: 'none',
    overflow: 'visible',
  };

  const fieldSurfaceSx = {
    bgcolor: 'background.paper',
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
    },
  };

  /** Matches MUI DatePicker text fields: outline, radius, label shrink, input alignment. */
  const outlinedFieldLikeDatePickerSx = {
    ...fieldSurfaceSx,
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: 'background.paper',
    },
    '& .MuiOutlinedInput-input': {
      textAlign: 'start',
    },
  };

  const isRtl = lang === 'ar';
  const dialogTheme = useMemo(() => createTheme({ direction: isRtl ? 'rtl' : 'ltr' }, theme), [theme, isRtl]);

  /** Keeps label floated so it never collides with the calendar icon (common RTL glitch). */
  const datePickerTextFieldSlotProps = {
    fullWidth: true,
    InputLabelProps: { shrink: true },
    sx: outlinedFieldLikeDatePickerSx,
  };

  const adapterLocale = lang === 'ar' ? ar : enGB;
  const nSel = formData.assigned_users.length;

  return (
    <ThemeProvider theme={dialogTheme}>
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={adapterLocale}
        localeText={lang === 'ar' ? AR_PICKERS_LOCALE_TEXT : undefined}
      >
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: '0 2px 12px rgba(8, 9, 54, 0.102), 0 1px 2px rgba(15, 23, 42, 0.06)',
              overflow: 'hidden',
              fontFamily: theme.typography.fontFamily,
            },
          }}
        >
        <DialogTitle
          sx={{
            pb: 2,
            pt: 2.5,
            px: 3,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
            <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.12),
                  color: 'secondary.main',
                  width: 44,
                  height: 44,
                }}
              >
                <GroupIcon sx={{ fontSize: 24 }} />
              </Avatar>
              <Box minWidth={0}>
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 800,
                    lineHeight: 1.25,
                    letterSpacing: '-0.02em',
                    color: 'text.primary',
                  }}
                >
                  {tx('createNewProject')}
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary', lineHeight: 1.4 }}>
                  {tx('createNewProjectSubtitle')}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={onClose}
              disabled={loading}
              size="small"
              sx={{
                color: 'text.secondary',
                mt: -0.5,
                '&:hover': { bgcolor: 'action.hover' },
              }}
              aria-label={tx('closeAria')}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 3, bgcolor: 'background.default', overflow: 'visible' }}>
          {error && (
            <Fade in={Boolean(error)}>
              <Alert
                severity="error"
                variant="outlined"
                sx={{ mb: 3, borderRadius: 2, borderColor: 'error.light', bgcolor: alpha(theme.palette.error.main, 0.06) }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {success && (
            <Fade in={success}>
              <Alert
                icon={<CheckCircleIcon />}
                severity="success"
                variant="outlined"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  borderColor: 'success.light',
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                }}
              >
                {tx('projectCreatedSuccess')}
              </Alert>
            </Fade>
          )}

          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%', minWidth: 0 }}>
            <Grid container spacing={3} sx={{ width: '100%', alignItems: 'stretch' }}>
              <Grid item xs={12} sx={{ display: 'flex' }}>
                <Paper
                  elevation={0}
                  sx={{
                    ...sectionPaperSx,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: 'secondary.main',
                        }}
                      >
                        <DescriptionOutlined sx={{ fontSize: 18 }} />
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                        }}
                      >
                        <CalendarTodayIcon sx={{ fontSize: 18 }} />
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                      {tx('projectNameAndScheduleTitle')}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mb: 2, color: 'text.secondary', lineHeight: 1.5 }}
                  >
                    {tx('projectNameAndScheduleHint')}
                  </Typography>
                  <Grid container spacing={2} sx={{ direction: dialogTheme.direction }}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        id="add-project-name"
                        name="project_name"
                        label={tx('projectName')}
                        value={formData.project_name}
                        onChange={handleChange}
                        required
                        fullWidth
                        placeholder={tx('projectNamePlaceholder')}
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        sx={outlinedFieldLikeDatePickerSx}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <DatePicker
                        format="dd/MM/yy"
                        label={tx('startDate')}
                        value={formData.start_date}
                        onChange={(d) => handleDateChange('start_date', d)}
                        minDate={todayStart}
                        slotProps={{
                          textField: datePickerTextFieldSlotProps,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <DatePicker
                        format="dd/MM/yy"
                        label={tx('estimatedEndDate')}
                        value={formData.estimated_end_date}
                        onChange={(d) => handleDateChange('estimated_end_date', d)}
                        minDate={endMinDate}
                        slotProps={{
                          textField: datePickerTextFieldSlotProps,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper elevation={0} sx={sectionPaperSx}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: 'info.main',
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                      {tx('teamMembers')}
                    </Typography>
                  </Box>
                  <FormControl fullWidth variant="outlined" sx={{ minWidth: 0, mt: 0.5 }}>
                    <InputLabel id="assign-users-field-label" shrink>
                      {tx('assignUsers')}
                    </InputLabel>
                    <Select
                      id="assign-users-select"
                      labelId="assign-users-field-label"
                      label={tx('assignUsers')}
                      multiple
                      displayEmpty
                      value={formData.assigned_users}
                      onChange={handleUserChange}
                      sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                        '& .MuiSelect-select': {
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          width: '100%',
                          minHeight: 48,
                          py: 1,
                          textAlign: 'start',
                        },
                      }}
                      renderValue={(selected) => {
                        if (!selected || selected.length === 0) {
                          return (
                            <Typography component="span" variant="body2" color="text.secondary">
                              {tx('assignUsersPlaceholder')}
                            </Typography>
                          );
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-start' }}>
                            {selected.map((value) => {
                              const user = users.find((u) => u._id === value);
                              return (
                                <Chip
                                  key={value}
                                  avatar={
                                    <Avatar
                                      sx={{
                                        bgcolor: user ? getRoleColor(user.role) : '#9e9e9e',
                                        width: 24,
                                        height: 24,
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      {user ? getInitials(user.name) : '?'}
                                    </Avatar>
                                  }
                                  label={user ? user.name : value}
                                  size="small"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onDelete={() => handleRemoveAssignedUser(value)}
                                  sx={{
                                    borderRadius: 2,
                                    fontWeight: 500,
                                  }}
                                />
                              );
                            })}
                          </Box>
                        );
                      }}
                    >
                      {usersAvailableToAssign.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                          <Box display="flex" alignItems="center" gap={1.5} width="100%">
                            <Avatar
                              sx={{
                                bgcolor: getRoleColor(user.role),
                                width: 32,
                                height: 32,
                                fontSize: '0.875rem',
                              }}
                            >
                              {getInitials(user.name)}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="body2" fontWeight={500}>
                                {user.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                            <Chip
                              label={formatWorkspaceRole(user.role)}
                              size="small"
                              sx={{
                                bgcolor: getRoleColor(user.role),
                                color: 'white',
                                fontWeight: 500,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {nSel > 0 && (
                    <Box
                      mt={2}
                      p={1.5}
                      sx={{
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.12),
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        <GroupIcon
                          sx={{
                            fontSize: 16,
                            marginInlineEnd: 0.5,
                            verticalAlign: 'middle',
                            opacity: 0.9,
                          }}
                        />
                        {tx('teamMembersCount', { n: nSel })}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <Divider sx={{ borderColor: 'divider' }} />

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            gap: 1.5,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            flexWrap: 'wrap',
            width: '100%',
            boxSizing: 'border-box',
            justifyContent: isRtl ? 'flex-start' : 'flex-end',
            flexDirection: isRtl ? 'row-reverse' : 'row',
          }}
        >
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outlined"
            color="inherit"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
            }}
          >
            {tx('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading || success}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none', bgcolor: 'primary.dark' },
            }}
            startIcon={loading ? undefined : null}
          >
            {loading ? tx('creatingEllipsis') : success ? tx('createdExclam') : tx('createProject')}
          </Button>
        </DialogActions>
      </Dialog>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default AddProjectDialog;
