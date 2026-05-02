import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Avatar,
  Paper,
  Fade,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { projectAPI, userAPI } from '../../services/api';

const AddProjectDialog = ({ open, onClose, onProjectAdded }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    project_name: '',
    start_date: new Date(),
    estimated_end_date: new Date(),
    assigned_users: [],
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const autoAssignableRoles = ['admin', 'owner', 'manager'];

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
    if (open) {
      fetchUsers();
      setSuccess(false);
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(Array.isArray(response.data.users) ? response.data.users : []);
    } catch (error) {
      console.error('Error fetching users:', error);
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
    setFormData({
      ...formData,
      [field]: date,
    });
  };

  const handleUserChange = (event) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      assigned_users: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const projectData = {
        ...formData,
        start_date: formData.start_date.toISOString().split('T')[0],
        estimated_end_date: formData.estimated_end_date.toISOString().split('T')[0],
        assigned_users: getAutoAssignedUsers(formData.assigned_users),
      };

      await projectAPI.addProject(projectData);
      setSuccess(true);
      
      setTimeout(() => {
        onProjectAdded();
        onClose();
        setFormData({
          project_name: '',
          start_date: new Date(),
          estimated_end_date: new Date(),
          assigned_users: [],
        });
        setSuccess(false);
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
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
    bgcolor: 'background.default',
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: 'none',
  };

  const fieldSurfaceSx = {
    bgcolor: 'background.paper',
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                  Create New Project
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary', lineHeight: 1.4 }}>
                  Set up your project details and team
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
              aria-label="Close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 3, bgcolor: 'background.default' }}>
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
                Project created successfully!
              </Alert>
            </Fade>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Project Name */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={sectionPaperSx}>
                  <Typography sx={{ mb: 1.5, fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                    Project information
                  </Typography>
                  <TextField
                    fullWidth
                    label="Project name"
                    name="project_name"
                    value={formData.project_name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Mobile app rollout"
                    sx={fieldSurfaceSx}
                  />
                </Paper>
              </Grid>

              {/* Dates */}
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
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: 'primary.main',
                      }}
                    >
                      <CalendarTodayIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                      Project timeline
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Start date"
                        value={formData.start_date}
                        onChange={(date) => handleDateChange('start_date', date)}
                        renderInput={(params) => (
                          <TextField {...params} fullWidth required sx={fieldSurfaceSx} />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Estimated end date"
                        value={formData.estimated_end_date}
                        onChange={(date) => handleDateChange('estimated_end_date', date)}
                        minDate={formData.start_date}
                        renderInput={(params) => (
                          <TextField {...params} fullWidth required sx={fieldSurfaceSx} />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Team Members */}
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
                      Team members
                    </Typography>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel id="assign-users-label">Assign users</InputLabel>
                    <Select
                      multiple
                      labelId="assign-users-label"
                      value={formData.assigned_users}
                      onChange={handleUserChange}
                      label="Assign users"
                      sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                      }}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selected.map((value) => {
                            const user = users.find(u => u._id === value);
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
                                sx={{ 
                                  borderRadius: 2,
                                  fontWeight: 500,
                                }}
                              />
                            );
                          })}
                        </Box>
                      )}
                    > 
                      {users.map((user) => (
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
                              label={user.role} 
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

                  {formData.assigned_users.length > 0 && (
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
                        <GroupIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', opacity: 0.9 }} />
                        {formData.assigned_users.length} team member
                        {formData.assigned_users.length !== 1 ? 's' : ''} selected
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
            Cancel
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
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Creating…' : success ? 'Created!' : 'Create project'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddProjectDialog;

