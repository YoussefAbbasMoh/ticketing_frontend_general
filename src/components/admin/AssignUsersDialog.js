import React, { useState, useEffect, useMemo } from 'react';
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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { userAPI, projectAPI } from '../../services/api';
import { getStoredLanguage } from '../../i18n';

const DIALOG_TEXT = {
  en: {
    title: 'Assign team members',
    closeAria: 'Close',
    selectSection: 'Select team members',
    assignLabel: 'Assign users',
    noTeamSelected: 'No team members selected',
    teamCountOne: '1 team member selected',
    teamCountMany: '{{n}} team members selected',
    changesAdded: '+{{n}} added',
    changesRemoved: '−{{n}} removed',
    changesSep: ' · ',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    saved: 'Saved!',
    successAlert: 'Team updated successfully.',
    errGeneric: 'Could not update the team. Please try again.',
    errInvalidUsers: 'Some selected users are not valid.',
    errWrongCompany: 'Users must belong to your active company.',
    errActiveCompany: 'Active company required. Log in or switch company first.',
    errForbidden: 'You do not have permission to change this project.',
    errNotFound: 'Project not found.',
    errArrayRequired: 'Assigned users list is required.',
    errProjectMissing: 'Project is missing. Close this dialog and try again.',
    errWrongProjectCompany: 'You can only manage projects in your active company.',
    roleAdmin: 'Admin',
    roleManager: 'Manager',
    roleDeveloper: 'Developer',
    roleDesigner: 'Designer',
    roleOwner: 'Owner',
  },
  ar: {
    title: 'تعيين أعضاء الفريق',
    closeAria: 'إغلاق',
    selectSection: 'اختر أعضاء الفريق',
    assignLabel: 'تعيين المستخدمين',
    noTeamSelected: 'لم يُختر أي عضو',
    teamCountOne: 'تم اختيار عضو واحد',
    teamCountMany: 'تم اختيار {{n}} عضوًا',
    changesAdded: '+{{n}} مضاف',
    changesRemoved: '−{{n}} مُزال',
    changesSep: ' · ',
    cancel: 'إلغاء',
    save: 'حفظ',
    saving: 'جارٍ الحفظ…',
    saved: 'تم!',
    successAlert: 'تم تحديث الفريق بنجاح.',
    errGeneric: 'تعذر تحديث الفريق. حاول مرة أخرى.',
    errInvalidUsers: 'بعض المستخدمين المختارين غير صالحين.',
    errWrongCompany: 'يجب أن ينتمي المستخدمون إلى شركتك النشطة.',
    errActiveCompany: 'يلزم اختيار شركة نشطة. سجّل الدخول أو بدّل الشركة أولًا.',
    errForbidden: 'ليس لديك صلاحية لتعديل هذا المشروع.',
    errNotFound: 'المشروع غير موجود.',
    errArrayRequired: 'قائمة المستخدمين المطلوبة.',
    errProjectMissing: 'المشروع غير متاح. أغلق النافذة وحاول مرة أخرى.',
    errWrongProjectCompany: 'يمكنك إدارة مشاريع شركتك النشطة فقط.',
    roleAdmin: 'مسؤول',
    roleManager: 'مدير',
    roleDeveloper: 'مطور',
    roleDesigner: 'مصمم',
    roleOwner: 'مالك',
  },
};

const toIdStr = (v) => {
  if (v == null || v === '') return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return String(v._id ?? v.id ?? '');
  return String(v);
};

const AssignUsersDialog = ({ open, onClose, project, onUsersAssigned }) => {
  const [users, setUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [lang, setLang] = useState(getStoredLanguage());

  const tx = (key, vars = {}) => {
    const template = DIALOG_TEXT[lang]?.[key] || DIALOG_TEXT.en[key] || key;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      template
    );
  };

  const normalizedUsers = useMemo(
    () =>
      (Array.isArray(users) ? users : [])
        .map((u) => ({ ...u, _id: toIdStr(u._id ?? u.id) }))
        .filter((u) => u._id),
    [users]
  );

  const formatWorkspaceRole = (roleRaw) => {
    const r = String(roleRaw || '').toLowerCase();
    const key = { admin: 'roleAdmin', manager: 'roleManager', developer: 'roleDeveloper', designer: 'roleDesigner', owner: 'roleOwner' }[r];
    return key ? tx(key) : String(roleRaw || '').trim() || '—';
  };

  useEffect(() => {
    const onLang = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLang);
    return () => window.removeEventListener('language-changed', onLang);
  }, []);

  useEffect(() => {
    if (open) setLang(getStoredLanguage());
  }, [open]);

  useEffect(() => {
    if (open && project) {
      fetchUsers();
      const userIds = (project.assigned_users || [])
        .map((m) => (typeof m === 'string' ? m : toIdStr(m)))
        .filter(Boolean);
      setAssignedUsers(userIds);
      setSuccess(false);
      setError('');
    }
  }, [open, project]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      const userData = response.data.users || response.data || [];
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (fetchErr) {
      console.error('Error fetching users:', fetchErr);
      setUsers([]);
    }
  };

  const handleUserChange = (event) => {
    const value = event.target.value;
    setAssignedUsers(typeof value === 'string' ? value.split(',') : value);
    setError('');
  };

  const mapAssignError = (err) => {
    const data = err.response?.data;
    const msg = String(data?.message || '');
    if (/Some assigned users are invalid/i.test(msg)) return tx('errInvalidUsers');
    if (/Assigned users must belong to the active company/i.test(msg)) return tx('errWrongCompany');
    if (/Active company required/i.test(msg)) return tx('errActiveCompany');
    if (/Insufficient permissions/i.test(msg)) return tx('errForbidden');
    if (/Project not found/i.test(msg)) return tx('errNotFound');
    if (/Assigned users array is required/i.test(msg)) return tx('errArrayRequired');
    if (/You can only manage projects in your active company/i.test(msg)) return tx('errWrongProjectCompany');
    if (lang === 'en' && msg) return msg;
    return tx('errGeneric');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const projectId = project?._id ?? project?.id;
    if (!projectId) {
      setError(tx('errProjectMissing'));
      setLoading(false);
      return;
    }

    try {
      await projectAPI.assignUsers(projectId, assignedUsers);
      setSuccess(true);

      setTimeout(() => {
        onUsersAssigned();
        onClose();
        setSuccess(false);
      }, 1000);
    } catch (submitErr) {
      setError(mapAssignError(submitErr));
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((word) => word[0])
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
      owner: '#673ab7',
    };
    return colors[role?.toLowerCase()] || '#9e9e9e';
  };

  const findUser = (id) => normalizedUsers.find((u) => u._id === String(id));

  const isUserAssigned = (userId) => assignedUsers.map(String).includes(String(userId));

  const getChangedCount = () => {
    const originalIds = (project?.assigned_users || []).map((m) => (typeof m === 'string' ? m : toIdStr(m))).filter(Boolean);
    const next = assignedUsers.map(String);
    const added = next.filter((id) => !originalIds.includes(id)).length;
    const removed = originalIds.filter((id) => !next.includes(id)).length;
    return { added, removed };
  };

  const changes = getChangedCount();

  const teamCountLabel =
    assignedUsers.length === 1 ? tx('teamCountOne') : tx('teamCountMany', { n: assignedUsers.length });

  const changesLabel =
    changes.added > 0 || changes.removed > 0
      ? [
          changes.added > 0 ? tx('changesAdded', { n: changes.added }) : '',
          changes.removed > 0 ? tx('changesRemoved', { n: changes.removed }) : '',
        ]
          .filter(Boolean)
          .join(tx('changesSep'))
      : '';

  const assignLabelId = 'assign-users-multiselect-label';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.18)',
          overflow: 'hidden',
        },
      }}
    >
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
                {tx('title')}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {project?.project_name}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={loading}
            aria-label={tx('closeAria')}
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
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
              {tx('successAlert')}
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
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {tx('selectSection')}
            </Typography>
          </Box>

          <FormControl fullWidth>
            <InputLabel id={assignLabelId}>{tx('assignLabel')}</InputLabel>
            <Select
              labelId={assignLabelId}
              multiple
              value={assignedUsers}
              onChange={handleUserChange}
              label={tx('assignLabel')}
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
                    const user = findUser(value);
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
              {normalizedUsers.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  <Checkbox
                    checked={isUserAssigned(user._id)}
                    sx={{
                      color: getRoleColor(user.role),
                      '&.Mui-checked': {
                        color: getRoleColor(user.role),
                      },
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
                      <GroupIcon
                        sx={{
                          fontSize: 16,
                          verticalAlign: 'middle',
                          marginInlineEnd: 0.5,
                        }}
                      />
                      {teamCountLabel}
                    </Typography>
                    {changesLabel ? (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {changesLabel}
                      </Typography>
                    ) : null}
                  </Box>
                  {assignedUsers.length > 0 && (
                    <Box display="flex" sx={{ marginInlineStart: 1 }}>
                      {assignedUsers.slice(0, 3).map((userId) => {
                        const user = findUser(userId);
                        return user ? (
                          <Avatar
                            key={userId}
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: '0.7rem',
                              bgcolor: getRoleColor(user.role),
                              border: '2px solid white',
                              marginInlineStart: -1,
                              '&:first-of-type': { marginInlineStart: 0 },
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
                            marginInlineStart: -1,
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
                  {tx('noTeamSelected')}
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
          {tx('cancel')}
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
            },
          }}
          startIcon={loading ? undefined : <PersonAddIcon />}
        >
          {loading ? tx('saving') : success ? tx('saved') : tx('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignUsersDialog;
