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
  Alert,
  IconButton,
  Avatar,
  Divider,
  Paper,
  Fade,
  Checkbox,
  ListItemText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
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
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.18)',
          overflow: 'hidden',
        }
      }}
    >
      {/* Header */}
      <DialogTitle 
        sx={{ 
          pb: 2,
          pt: 2.5,
          px: 3,
          background: 'linear-gradient(135deg, #080936 0%, #18206f 100%)',
          color: '#fff',
          position: 'relative',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.16)',
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
              icon={<CheckCircleIcon />}
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
            bgcolor: '#f8fafc',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
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
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#cbd5e1',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#94a3b8',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#080936',
                  borderWidth: 2,
                },
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
                          bgcolor: '#eef2ff',
                          color: '#1e293b',
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
                  bgcolor: 'rgba(8, 9, 54, 0.06)',
                  borderRadius: 2,
                  border: '1px solid rgba(8, 9, 54, 0.16)',
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
                  bgcolor: 'rgba(148, 163, 184, 0.12)',
                  borderRadius: 2,
                  border: '1px solid rgba(148, 163, 184, 0.28)',
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
            borderColor: '#cbd5e1',
            color: '#334155',
            '&:hover': {
              borderColor: '#94a3b8',
              bgcolor: '#f8fafc',
            },
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
            background: 'linear-gradient(135deg, #080936 0%, #18206f 100%)',
            boxShadow: '0 6px 14px rgba(8, 9, 54, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #06072d 0%, #121a5f 100%)',
              boxShadow: '0 10px 20px rgba(8, 9, 54, 0.4)',
            },
            '&:disabled': {
              background: '#e0e0e0',
              boxShadow: 'none',
            }
          }}
          startIcon={loading ? undefined : <PersonAddIcon />}
        >
          {loading ? 'Assigning...' : success ? 'Assigned!' : 'Assign Users'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignUsersDialog;

