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
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { projectAPI, userAPI } from '../../services/api';

const AddProjectDialog = ({ open, onClose, onProjectAdded }) => {
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
      console.log('Fetched users:', response.data.users);
      setUsers(Array.isArray(response.data.users) ? response.data.users : []);
      // setUsers(response.data.users);
      console.log('Users:', users);
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
    const colors = {
      admin: '#e91e63',
      manager: '#2196f3',
      developer: '#4caf50',
      designer: '#ff9800',
    };
    return colors[role?.toLowerCase()] || '#9e9e9e';
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
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        {/* Header */}
        <DialogTitle 
          sx={{ 
            pb: 2,
            pt: 3,
            px: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  width: 40,
                  height: 40,
                }}
              >
                <GroupIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  Create New Project
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Set up your project details and team
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={onClose}
              disabled={loading}
              sx={{ 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 3, py: 3 }}>
          {error && (
            <Fade in={Boolean(error)}>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(211,47,47,0.15)',
                }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {success && (
            <Fade in={success}>
              <Alert 
                icon={<CheckIcon />}
                severity="success" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(46,125,50,0.15)',
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
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2.5, 
                    bgcolor: '#f8f9fa',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ mb: 1.5, fontWeight: 600 }}
                  >
                    Project Information
                  </Typography>
                  <TextField
                    fullWidth
                    label="Project Name"
                    name="project_name"
                    value={formData.project_name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Mobile App Development"
                    sx={{
                      bgcolor: 'white',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Paper>
              </Grid>

              {/* Dates */}
              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2.5, 
                    bgcolor: '#f8f9fa',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <CalendarIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Project Timeline
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Start Date"
                        value={formData.start_date}
                        onChange={(date) => handleDateChange('start_date', date)}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            fullWidth 
                            required 
                            sx={{
                              bgcolor: 'white',
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              }
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Estimated End Date"
                        value={formData.estimated_end_date}
                        onChange={(date) => handleDateChange('estimated_end_date', date)}
                        minDate={formData.start_date}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            fullWidth 
                            required 
                            sx={{
                              bgcolor: 'white',
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              }
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Team Members */}
              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2.5, 
                    bgcolor: '#f8f9fa',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Team Members
                    </Typography>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Assign Users</InputLabel>
                    <Select
                      multiple
                      value={formData.assigned_users}
                      onChange={handleUserChange}
                      label="Assign Users"
                      sx={{
                        bgcolor: 'white',
                        borderRadius: 2,
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
                      bgcolor="rgba(103, 126, 234, 0.08)" 
                      borderRadius={2}
                    >
                      <Typography variant="body2" color="primary" fontWeight={500}>
                        <GroupIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {formData.assigned_users.length} team member{formData.assigned_users.length !== 1 ? 's' : ''} selected
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
          <Button 
            onClick={onClose} 
            disabled={loading}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || success}
            sx={{ 
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(103, 126, 234, 0.4)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(103, 126, 234, 0.5)',
              }
            }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Creating...' : success ? 'Created!' : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddProjectDialog;

