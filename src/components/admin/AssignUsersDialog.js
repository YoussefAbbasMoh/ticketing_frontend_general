import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  Avatar,
  Divider,
  Paper,
  Fade,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { userAPI, projectAPI } from '../../services/api';

const AssignUsersDialog = ({ open, onClose, project, onUsersAssigned }) => {
  const [users, setUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && project) {
      fetchUsers();
      // Extract user IDs if assigned_users contains full user objects
      const userIds = (project.assigned_users || []).map(user => 
        typeof user === 'string' ? user : user._id
      );
      setAssignedUsers(userIds);
      setSuccess(false);
    }
  }, [open, project]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      // Handle different response structures
      const userData = response.data.users || response.data || [];
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const handleUserChange = (event) => {
    const value = event.target.value;
    setAssignedUsers(typeof value === 'string' ? value.split(',') : value);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await projectAPI.assignUsers(project._id, assignedUsers);
      setSuccess(true);
      
      setTimeout(() => {
        onUsersAssigned();
        onClose();
        setSuccess(false);
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to assign users. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const getRoleColor = (role) => {
    const colors = {
      admin: '#e91e63',
      manager: '#2196f3',
      developer: '#4caf50',
      designer: '#ff9800',
    };
    return colors[role?.toLowerCase()] || '#9e9e9e';
  };

  const isUserAssigned = (userId) => assignedUsers.includes(userId);

  const getChangedCount = () => {
    const originalIds = (project?.assigned_users || []).map(user => 
      typeof user === 'string' ? user : user._id
    );
    const added = assignedUsers.filter(id => !originalIds.includes(id)).length;
    const removed = originalIds.filter(id => !assignedUsers.includes(id)).length;
    return { added, removed };
  };

  const changes = getChangedCount();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
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
              <PersonAddIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Assign Team Members
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {project?.project_name}
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
              Users assigned successfully!
            </Alert>
          </Fade>
        )}

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
            <GroupIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography 
              variant="subtitle2" 
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              Select Team Members
            </Typography>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Assign Users</InputLabel>
            <Select
              multiple
              value={assignedUsers}
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
                  <Checkbox 
                    checked={isUserAssigned(user._id)} 
                    sx={{ 
                      color: getRoleColor(user.role),
                      '&.Mui-checked': {
                        color: getRoleColor(user.role),
                      }
                    }}
                  />
                  <Box display="flex" alignItems="center" gap={1.5} flex={1}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getRoleColor(user.role),
                        width: 36,
                        height: 36,
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

          {/* Summary Box */}
          <Box sx={{ mt: 2 }}>
            {assignedUsers.length > 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: 'rgba(103, 126, 234, 0.08)',
                  borderRadius: 2,
                  border: '1px solid rgba(103, 126, 234, 0.2)',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="primary" fontWeight={600}>
                      <GroupIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {assignedUsers.length} team member{assignedUsers.length !== 1 ? 's' : ''} selected
                    </Typography>
                    {(changes.added > 0 || changes.removed > 0) && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {changes.added > 0 && `+${changes.added} added`}
                        {changes.added > 0 && changes.removed > 0 && ' • '}
                        {changes.removed > 0 && `-${changes.removed} removed`}
                      </Typography>
                    )}
                  </Box>
                  {assignedUsers.length > 0 && (
                    <Box display="flex" sx={{ ml: 1 }}>
                      {assignedUsers.slice(0, 3).map((userId) => {
                        const user = users.find(u => u._id === userId);
                        return user ? (
                          <Avatar
                            key={userId}
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: '0.7rem',
                              bgcolor: getRoleColor(user.role),
                              border: '2px solid white',
                              ml: -1,
                              '&:first-of-type': { ml: 0 },
                            }}
                          >
                            {getInitials(user.name)}
                          </Avatar>
                        ) : null;
                      })}
                      {assignedUsers.length > 3 && (
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: '0.65rem',
                            bgcolor: '#9e9e9e',
                            border: '2px solid white',
                            ml: -1,
                          }}
                        >
                          +{assignedUsers.length - 3}
                        </Avatar>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: 'rgba(158, 158, 158, 0.08)',
                  borderRadius: 2,
                  border: '1px solid rgba(158, 158, 158, 0.2)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No team members selected
                </Typography>
              </Paper>
            )}
          </Box>
        </Paper>
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
          disabled={loading || success || (changes.added === 0 && changes.removed === 0)}
          sx={{ 
            borderRadius: 2,
            px: 3,
            textTransform: 'none',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 12px rgba(103, 126, 234, 0.4)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(103, 126, 234, 0.5)',
            },
            '&:disabled': {
              background: '#e0e0e0',
              boxShadow: 'none',
            }
          }}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
        >
          {loading ? 'Assigning...' : success ? 'Assigned!' : 'Assign Users'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignUsersDialog;

