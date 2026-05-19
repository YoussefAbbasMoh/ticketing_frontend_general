import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, subscriptionAPI } from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import { ButtonBusyDots } from '../ui/LoadingSkeletons';
import Modal from '../ui/Modal';
import RoleDragDropSelect, { ROLE_ORDER } from './RoleDragDropSelect';
import { getStoredLanguage, t as i18nT } from '../../i18n';
import {
  companyNameFromMembership,
  firstOtherWorkspaceId,
  membershipCompanyId,
  normalizeCompanyRole,
  patchUserCompanyMembership,
  resolveCompanyMemberRole,
} from '../../utils/companyMembership';
import { isValidPersonFullName } from '../../utils/personNameValidation';

const ASSIGNABLE_ROLES = ROLE_ORDER;

const TEXT = {
  en: {
    settings: 'Settings',
    manageAccount: 'Manage your account and preferences',
    subscription: 'Subscription',
    plan: 'Plan',
    status: 'Status',
    expires: 'Expires',
    graceEnds: 'Grace ends',
    paymobSubscriptionId: 'Paymob Subscription ID',
    membersLimit: 'Members limit',
    membersUsage: '{{used}} / {{max}} members',
    membersCanBeAdded: '{{count}} can be added',
    membersLimitReached: 'Member limit reached',
    membersUnlimited: 'Unlimited members',
    manageSubscription: 'Manage Subscription',
    notApplicable: 'N/A',
    planFree: 'Free',
    planPro: 'Pro',
    planStarter: 'Starter',
    planBasic: 'Basic',
    planEnterprise: 'Enterprise',
    subStatusActive: 'Active',
    subStatusExpired: 'Expired',
    subStatusTrialing: 'Trialing',
    subStatusCancelled: 'Cancelled',
    subStatusPastDue: 'Past due',
    subStatusPaused: 'Paused',
    profileInfo: 'Profile Information',
    editProfile: 'Edit Profile',
    name: 'Name',
    title: 'Title',
    email: 'Email',
    role: 'Role',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    changingPassword: 'Changing Password...',
    userManagement: 'User Management',
    addUser: 'Add User',
    noUsers: 'No users found. Add your first user to get started.',
    addNewUser: 'Add New User',
    noPasswordNeeded: 'No password is needed. The user will receive an invitation email to set their password.',
    adding: 'Adding...',
    editUser: 'Edit User',
    updating: 'Updating...',
    updateUser: 'Update User',
    deleteUser: 'Delete User',
    cannotUndo: 'This action cannot be undone',
    confirmDeletePrompt: 'Are you sure you want to delete the following user account?',
    warning: 'Warning:',
    warningDeleteData: 'All data associated with this user will be permanently deleted.',
    deleting: 'Deleting...',
    profileUpdated: 'Profile updated successfully!',
    profileUpdateFailed: 'Failed to update profile.',
    passwordChanged: 'Password changed successfully!',
    passwordChangeFailed: 'Failed to change password.',
    passwordsMismatch: 'New passwords do not match.',
    passwordSameAsCurrent: 'New password must be different from current password.',
    passwordWeak: 'Password must be at least 8 characters and include uppercase, lowercase, and a special character.',
    userAdded: 'User added successfully!',
    userAddFailed: 'Failed to add user.',
    userUpdated: 'User updated successfully!',
    userUpdateFailed: 'Failed to update user.',
    userDeleteFailed: 'Failed to delete user.',
    userDeletedSuccess: 'User "{{name}}" deleted successfully!',
    nameValidation: 'Enter at least two names; each name must be at least 2 letters.',
    titleValidation: 'Title must be at least 2 characters.',
    fieldRequired: 'This field is required.',
    emailInvalid: 'Enter a valid email address.',
    roleInvalid: 'Choose owner, admin, manager, or user.',
    roleDropZone: 'Selected role',
    roleDragPool: 'Drag a role into the box above, or tap an option.',
    roleEmptySlot: 'Drop a role here',
    roleOwnerLockedTitle: 'Owner',
    roleOwnerLockedHint: 'The company owner role cannot be changed.',
    roleSelfLockedHint: 'You cannot change your own role here.',
    yourWorkspaces: 'Your workspaces',
    workspaceAddShort: 'Add workspace',
    workspaceRenamed: 'Workspace name updated.',
    workspaceDeleted: 'Workspace removed.',
    workspaceRenameAction: 'Rename',
    workspaceDeleteAction: 'Delete',
    workspaceActive: 'Active',
    workspaceSaveName: 'Save name',
    workspaceDeleteOnlyOne: 'You cannot delete your only workspace.',
    workspaceDeleteActiveHint: 'Your first workspace will become active after delete.',
    subscriptionAvailable: 'Available',
  },
  ar: {
    settings: 'الإعدادات',
    manageAccount: 'إدارة الحساب والتفضيلات',
    subscription: 'الاشتراك',
    plan: 'الخطة',
    status: 'الحالة',
    expires: 'ينتهي في',
    graceEnds: 'نهاية فترة السماح',
    paymobSubscriptionId: 'معرّف اشتراك Paymob',
    membersLimit: 'حد الأعضاء',
    membersUsage: '{{used}} / {{max}} أعضاء',
    membersCanBeAdded: 'يمكن إضافة {{count}}',
    membersLimitReached: 'تم الوصول إلى حد الأعضاء',
    membersUnlimited: 'أعضاء غير محدودين',
    manageSubscription: 'إدارة الاشتراك',
    notApplicable: 'غير متاح',
    planFree: 'مجانية',
    planPro: 'احترافية',
    planStarter: 'مبتدئة',
    planBasic: 'أساسية',
    planEnterprise: 'مؤسسات',
    subStatusActive: 'نشط',
    subStatusExpired: 'منتهٍ',
    subStatusTrialing: 'فترة تجريبية',
    subStatusCancelled: 'ملغاة',
    subStatusPastDue: 'متأخر السداد',
    subStatusPaused: 'موقوف',
    profileInfo: 'بيانات الحساب',
    editProfile: 'تعديل الحساب',
    name: 'الاسم',
    title: 'المسمى الوظيفي',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التعديلات',
    saving: 'جارٍ الحفظ...',
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmNewPassword: 'تأكيد كلمة المرور الجديدة',
    changingPassword: 'جارٍ تغيير كلمة المرور...',
    userManagement: 'إدارة المستخدمين',
    addUser: 'إضافة مستخدم',
    noUsers: 'لا يوجد مستخدمون. أضف أول مستخدم للبدء.',
    addNewUser: 'إضافة مستخدم جديد',
    noPasswordNeeded: 'لا حاجة لكلمة مرور الآن. سيصل للمستخدم بريد دعوة لتعيين كلمة المرور.',
    adding: 'جارٍ الإضافة...',
    editUser: 'تعديل المستخدم',
    updating: 'جارٍ التحديث...',
    updateUser: 'تحديث المستخدم',
    deleteUser: 'حذف المستخدم',
    cannotUndo: 'لا يمكن التراجع عن هذا الإجراء',
    confirmDeletePrompt: 'هل أنتِ متأكدة من حذف حساب المستخدم التالي؟',
    warning: 'تحذير:',
    warningDeleteData: 'سيتم حذف كل بيانات هذا المستخدم نهائيًا.',
    deleting: 'جارٍ الحذف...',
    profileUpdated: 'تم تحديث الحساب بنجاح!',
    profileUpdateFailed: 'فشل تحديث الحساب.',
    passwordChanged: 'تم تغيير كلمة المرور بنجاح!',
    passwordChangeFailed: 'فشل تغيير كلمة المرور.',
    passwordsMismatch: 'كلمتا المرور الجديدتان غير متطابقتين.',
    passwordSameAsCurrent: 'يجب أن تكون كلمة المرور الجديدة مختلفة عن الحالية.',
    passwordWeak: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورمز خاص.',
    userAdded: 'تمت إضافة المستخدم بنجاح!',
    userAddFailed: 'فشلت إضافة المستخدم.',
    userUpdated: 'تم تحديث المستخدم بنجاح!',
    userUpdateFailed: 'فشل تحديث المستخدم.',
    userDeleteFailed: 'فشل حذف المستخدم.',
    userDeletedSuccess: 'تم حذف المستخدم "{{name}}" بنجاح!',
    nameValidation: 'أدخل اسمين على الأقل؛ كل اسم حرفان على الأقل.',
    workspaceDeleteOnlyOne: 'لا يمكن حذف مساحة العمل الوحيدة.',
    workspaceDeleteActiveHint: 'بعد الحذف ستنتقل تلقائياً إلى أول مساحة عمل في القائمة.',
    subscriptionAvailable: 'متاح',
    titleValidation: 'المسمى الوظيفي لازم يكون حرفين على الأقل.',
    fieldRequired: 'هذا الحقل مطلوب.',
    emailInvalid: 'أدخل بريدًا إلكترونيًا صالحًا.',
    roleInvalid: 'اختر مالك أو مدير عام أو مدير أو مستخدم.',
    roleDropZone: 'الدور المختار',
    roleDragPool: 'اسحب أحد الأدوار إلى المربع أعلاه أو اضغط للاختيار.',
    roleEmptySlot: 'أفلت الدور هنا',
    roleOwnerLockedTitle: 'مالك',
    roleOwnerLockedHint: 'لا يمكن تغيير دور مالك الشركة.',
    roleSelfLockedHint: 'لا يمكنك تغيير دورك من هنا.',
    yourWorkspaces: 'مساحات العمل',
    workspaceAddShort: 'إضافة مساحة',
    workspaceRenamed: 'تم تحديث اسم المساحة.',
    workspaceDeleted: 'تمت إزالة المساحة.',
    workspaceRenameAction: 'تسمية',
    workspaceDeleteAction: 'حذف',
    workspaceActive: 'نشطة',
    workspaceSaveName: 'حفظ الاسم',
  }
};

const Settings = () => {
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    canManageCompanyTeam,
    canInviteUsersToCompany,
    canSeeSubscriptionNav,
    updateUser,
    switchActiveCompany,
  } = useAuth();

  const showTeamSection = () => isAdmin() || canManageCompanyTeam();

  const workspaceRoleCanRename = (entry) => {
    const r = String(entry?.companyRole || '').toLowerCase();
    return Boolean(entry?.isOwner) || r === 'owner' || r === 'admin';
  };

  const normalizeCompanyRole = (role) => String(role || '').trim().toLowerCase();

  const workspaceIsOwner = (entry) =>
    Boolean(entry?.isOwner) || normalizeCompanyRole(entry?.companyRole) === 'owner';

  const handleWorkspaceRenameOpen = (entry) => {
    const id = membershipCompanyId(entry);
    if (!id) return;
    setWsRename({ id, name: companyNameFromMembership(entry) || '' });
    setWsRenameDraft(companyNameFromMembership(entry) || '');
  };

  const handleWorkspaceRenameSave = async () => {
    if (!wsRename?.id) return;
    const name = String(wsRenameDraft || '').trim();
    if (name.length < 2) {
      setError(tx('titleValidation'));
      return;
    }
    setWsLoading(true);
    setError('');
    try {
      const res = await userAPI.updateWorkspaceName(wsRename.id, { name });
      const list = res?.data?.companies;
      if (Array.isArray(list)) updateUser({ ...user, companies: list });
      setSuccess(tx('workspaceRenamed'));
      setWsRename(null);
    } catch (e) {
      setError(e?.response?.data?.message || tx('userUpdateFailed'));
    } finally {
      setWsLoading(false);
    }
  };

  const handleWorkspaceDelete = async (companyId) => {
    if (!companyId) return;
    if (!window.confirm(i18nT(lang, 'workspaceDeleteConfirm'))) return;

    const isDeletingActive = String(user?.activeCompanyId || '') === String(companyId);
    const otherCount = (user?.companies || []).filter(
      (entry) => membershipCompanyId(entry) && membershipCompanyId(entry) !== String(companyId)
    ).length;
    if (otherCount === 0) {
      setError(tx('workspaceDeleteOnlyOne'));
      return;
    }

    setWsLoading(true);
    setError('');
    try {
      let nextActiveId = String(user?.activeCompanyId || '');

      if (isDeletingActive) {
        nextActiveId = firstOtherWorkspaceId(user?.companies, companyId);
        if (!nextActiveId) {
          setError(tx('workspaceDeleteOnlyOne'));
          return;
        }
        const switchRes = await switchActiveCompany(nextActiveId);
        nextActiveId = String(switchRes?.data?.activeCompanyId || nextActiveId);
      }

      const res = await userAPI.deleteWorkspace(companyId);
      const list = res?.data?.companies;

      if (res?.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res?.data?.activeCompanyId) {
        nextActiveId = String(res.data.activeCompanyId);
      } else if (isDeletingActive && Array.isArray(list)) {
        nextActiveId = firstOtherWorkspaceId(list, companyId) || nextActiveId;
      }

      if (Array.isArray(list)) {
        updateUser({
          ...(user || {}),
          companies: list,
          activeCompanyId: nextActiveId || membershipCompanyId(list[0]) || '',
        });
      }

      if (isDeletingActive && nextActiveId) {
        window.dispatchEvent(
          new CustomEvent('active-company-changed', {
            detail: { companyId: nextActiveId },
          })
        );
      }

      setSuccess(tx('workspaceDeleted'));
    } catch (e) {
      const apiMsg = e?.response?.data?.message || '';
      const needsSwitchRetry =
        e?.response?.status === 400 &&
        /switch to another workspace before deleting/i.test(String(apiMsg));

      if (needsSwitchRetry && isDeletingActive) {
        try {
          const fallbackId = firstOtherWorkspaceId(user?.companies, companyId);
          if (!fallbackId) {
            setError(tx('workspaceDeleteOnlyOne'));
            return;
          }
          await switchActiveCompany(fallbackId);
          const retryRes = await userAPI.deleteWorkspace(companyId);
          const list = retryRes?.data?.companies;
          let activeId = String(retryRes?.data?.activeCompanyId || fallbackId);
          if (retryRes?.data?.token) localStorage.setItem('token', retryRes.data.token);
          if (Array.isArray(list)) {
            updateUser({
              ...(user || {}),
              companies: list,
              activeCompanyId: activeId || membershipCompanyId(list[0]) || '',
            });
          }
          window.dispatchEvent(
            new CustomEvent('active-company-changed', { detail: { companyId: activeId } })
          );
          setSuccess(tx('workspaceDeleted'));
          return;
        } catch (retryErr) {
          setError(retryErr?.response?.data?.message || tx('userDeleteFailed'));
          return;
        }
      }

      setError(apiMsg || tx('userDeleteFailed'));
    } finally {
      setWsLoading(false);
    }
  };
  const [profileData, setProfileData] = useState({
    name: '',
    title: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [wsRename, setWsRename] = useState(null);
  const [wsRenameDraft, setWsRenameDraft] = useState('');
  const [wsLoading, setWsLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [lang, setLang] = useState(getStoredLanguage());
  const tx = (key, vars = {}) => {
    const template = TEXT[lang]?.[key] || TEXT.en[key] || key;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      template
    );
  };

  const memberRoleForRow = (u) => resolveCompanyMemberRole(u, user?.activeCompanyId);

  const rolesAssignableByInviter =
    user && (Boolean(user.companyIsOwner) || memberRoleForRow(user) === 'owner')
      ? ASSIGNABLE_ROLES
      : ASSIGNABLE_ROLES.filter((role) => role !== 'owner');

  const validateUserForm = (values) => {
    const errors = {};
    const nameTrim = String(values.name || '').trim();
    const titleTrim = String(values.title || '').trim();
    const emailTrim = String(values.email || '').trim();

    if (!nameTrim) {
      errors.name = tx('fieldRequired');
    } else if (!isValidPersonFullName(nameTrim)) {
      errors.name = tx('nameValidation');
    }

    if (!titleTrim) {
      errors.title = tx('fieldRequired');
    } else if (titleTrim.length < 2) {
      errors.title = tx('titleValidation');
    }

    if (!emailTrim) {
      errors.email = tx('fieldRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errors.email = tx('emailInvalid');
    }

    return errors;
  };

  const validateAddUserForm = (values) => {
    const errors = validateUserForm(values);
    const r = String(values.role || '').toLowerCase();
    if (!r) errors.role = tx('fieldRequired');
    else if (!rolesAssignableByInviter.includes(r)) errors.role = tx('roleInvalid');
    return errors;
  };

  const validateEditUserForm = (skipRoleValidation) => (values) => {
    const errors = validateUserForm(values);
    if (!skipRoleValidation) {
      const r = String(values.role || '').toLowerCase();
      if (!r) errors.role = tx('fieldRequired');
      else if (!rolesAssignableByInviter.includes(r)) errors.role = tx('roleInvalid');
    }
    return errors;
  };

  /** API forbids changing your own company role from this screen. */
  const cannotChangeCompanyRoleInEdit = (editTarget) => {
    if (!editTarget || !user) return true;
    return String(editTarget._id || editTarget.id) === String(user._id || user.id);
  };

  const pickAssignableRoleForEdit = (u) => {
    const raw = String(memberRoleForRow(u)).toLowerCase();
    return ASSIGNABLE_ROLES.includes(raw) ? raw : 'user';
  };

  const labelAssignableRole = (r) => {
    const x = String(r || '').toLowerCase();
    if (lang === 'ar') {
      if (x === 'owner') return 'مالك';
      if (x === 'admin') return 'مدير عام';
      if (x === 'manager') return 'مدير';
      if (x === 'user') return 'مستخدم';
    }
    if (x === 'owner') return 'Owner';
    if (x === 'admin') return 'Admin';
    if (x === 'manager') return 'Manager';
    if (x === 'user') return 'User';
    return String(r || '');
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        title: user.title || '',
        email: user.email || '',
      });
    }
    if (showTeamSection()) {
      fetchUsers();
    }
    fetchSubscriptionInfo();
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    userAPI
      .getProfile()
      .then((res) => {
        if (cancelled) return;
        const list = res?.data?.user?.companies;
        if (!Array.isArray(list) || !list.length) return;
        try {
          const raw = localStorage.getItem('user');
          const base = raw ? JSON.parse(raw) : user;
          if (base) {
            const activeId = base.activeCompanyId || user?.activeCompanyId;
            const activeRole = resolveCompanyMemberRole(
              { ...base, companies: list },
              activeId
            );
            updateUser(
              patchUserCompanyMembership(
                { ...base, companies: list },
                activeId,
                activeRole
              )
            );
          }
        } catch {
          if (user) {
            const activeRole = resolveCompanyMemberRole({ ...user, companies: list }, user.activeCompanyId);
            updateUser(patchUserCompanyMembership({ ...user, companies: list }, user.activeCompanyId, activeRole));
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh workspace names once on mount
  }, []);

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await subscriptionAPI.getMySubscription();
      setSubscriptionInfo(response?.data || null);
    } catch (apiError) {
      console.error('Error fetching subscription info:', apiError);
      setSubscriptionInfo(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return tx('notApplicable');
    const loc = lang === 'ar' ? 'ar-EG' : 'en-GB';
    return new Date(value).toLocaleDateString(loc, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const subscriptionPlanIdNorm = String(subscriptionInfo?.planId || 'free').toLowerCase();
  const isFreeSubscriptionPlan = subscriptionPlanIdNorm === 'free';

  const getPlanDisplayName = (planId) => {
    const p = String(planId || 'free').toLowerCase();
    if (p === 'free') return tx('planFree');
    if (p === 'pro') return tx('planPro');
    if (p === 'starter') return tx('planStarter');
    if (p === 'basic') return tx('planBasic');
    if (p === 'enterprise') return tx('planEnterprise');
    return lang === 'ar' ? p : String(planId || p).toUpperCase();
  };

  const getSubscriptionStatusDisplay = (status) => {
    const s = String(status || 'active').toLowerCase().replace(/-/g, '_');
    if (s === 'active') return tx('subStatusActive');
    if (s === 'expired') return tx('subStatusExpired');
    if (s === 'trialing') return tx('subStatusTrialing');
    if (s === 'cancelled' || s === 'canceled') return tx('subStatusCancelled');
    if (s === 'past_due') return tx('subStatusPastDue');
    if (s === 'paused') return tx('subStatusPaused');
    return String(status || 'active');
  };

  const maxMembers = Number(subscriptionInfo?.limits?.maxMembers);
  const hasMembersLimit = Number.isFinite(maxMembers) && maxMembers > 0;
  const usedMembers = users.length;
  const membersRemaining = hasMembersLimit ? Math.max(maxMembers - usedMembers, 0) : null;

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      const userData = response.data.users ?? response.data ?? [];
      const list = Array.isArray(userData) ? userData : [];
      setUsers(list);
      if (user && list.length) {
        const myId = String(user._id || user.id);
        const row = list.find((u) => String(u._id || u.id) === myId);
        if (row) {
          const nextRole = memberRoleForRow(row);
          const prevRole = memberRoleForRow(user);
          const nextOwner = Boolean(row.companyIsOwner);
          const prevOwner = Boolean(user.companyIsOwner);
          if (nextRole !== prevRole || nextOwner !== prevOwner) {
            updateUser(
              patchUserCompanyMembership(
                {
                  ...user,
                  companies: row.companies || user.companies,
                },
                user.activeCompanyId,
                nextRole
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(tx('passwordsMismatch'));
      setLoading(false);
      return;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setError(tx('passwordSameAsCurrent'));
      setLoading(false);
      return;
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(passwordData.newPassword)) {
      setError(tx('passwordWeak'));
      setLoading(false);
      return;
    }

    try {
      await userAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess(tx('passwordChanged'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setError(error.response?.data?.message || tx('passwordChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userItem) => {
    setUserToDelete(userItem);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await userAPI.deleteAccount(userToDelete._id || userToDelete.id);
      setSuccess(tx('userDeletedSuccess', { name: userToDelete.name }));
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.message || tx('userDeleteFailed'));
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteUser = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleEditUser = (userItem) => {
    setEditingUser(userItem);
    setOpenEditDialog(true);
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'owner':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role) => {
    const normalized = String(role || '').toLowerCase();
    if (lang === 'ar') {
      if (normalized === 'owner') return 'مالك';
      if (normalized === 'admin') return 'مدير عام';
      if (normalized === 'manager') return 'مدير';
      if (normalized === 'user') return 'مستخدم';
    }
    if (normalized === 'owner') return 'Owner';
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'manager') return 'Manager';
    if (normalized === 'user') return 'User';
    return role || 'N/A';
  };

  const defaultInviteRole =
    user && (Boolean(user.companyIsOwner) || memberRoleForRow(user) === 'owner') ? 'owner' : 'user';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-secondary to-secondary-700 bg-clip-text text-transparent mb-2">
            {tx('settings')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">{tx('manageAccount')}</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 animate-fade-in">
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {success && (
          <div className="mb-6 animate-fade-in">
            <Alert variant="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </div>
        )}

        <div className="mb-6">
          <Card>
            <Card.Content className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{tx('subscription')}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {tx('plan')}: <span className="font-semibold">{getPlanDisplayName(subscriptionInfo?.planId)}</span> · {tx('status')}:{' '}
                    <span className={`font-semibold ${subscriptionInfo?.status === 'expired' ? 'text-amber-600' : 'text-green-600'}`}>
                      {getSubscriptionStatusDisplay(subscriptionInfo?.status)}
                    </span>
                  </p>
                  {isFreeSubscriptionPlan ? (
                    <p className="text-xs font-medium text-emerald-700 mt-1">{tx('subscriptionAvailable')}</p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mt-1">
                        {tx('expires')}: {formatDate(subscriptionInfo?.expiresAt)} · {tx('graceEnds')}:{' '}
                        {formatDate(subscriptionInfo?.graceEndsAt)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {tx('paymobSubscriptionId')}:{' '}
                        {subscriptionInfo?.paymobSubscriptionId || tx('notApplicable')}
                      </p>
                    </>
                  )}
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700">
                      {tx('membersLimit')}:{' '}
                      {hasMembersLimit
                        ? tx('membersUsage', { used: usedMembers, max: maxMembers })
                        : tx('membersUnlimited')}
                    </p>
                    {hasMembersLimit && (
                      <p className={`text-xs mt-1 ${membersRemaining > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {membersRemaining > 0
                          ? tx('membersCanBeAdded', { count: membersRemaining })
                          : tx('membersLimitReached')}
                      </p>
                    )}
                  </div>
                  {subscriptionInfo?.notice && (
                    <p className="text-xs text-amber-700 mt-2">{subscriptionInfo.notice}</p>
                  )}
                </div>
                {canSeeSubscriptionNav() && (
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/subscription')}
                    className="w-full sm:w-auto"
                  >
                    {tx('manageSubscription')}
                  </Button>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Profile Information */}
          <Card>
            <Card.Content className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{tx('profileInfo')}</h2>
                </div>
              </div>
              
              <div className="space-y-4">
                <Input
                  label={tx('name')}
                  name="name"
                  value={profileData.name}
                  disabled
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
                <Input
                  label={tx('title')}
                  name="title"
                  value={profileData.title}
                  disabled
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <Input
                  label={tx('email')}
                  name="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tx('role')}
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRoleBadgeColor(memberRoleForRow(user))}`}>
                      {getRoleLabel(memberRoleForRow(user))}
                    </span>
                  </div>
                </div>

              </div>
            </Card.Content>
          </Card>

          {/* Change Password */}
          <Card>
            <Card.Content className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{tx('changePassword')}</h2>
              </div>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  label={tx('currentPassword')}
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
                <Input
                  label={tx('newPassword')}
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  }
                />
                <Input
                  label={tx('confirmNewPassword')}
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={loading}
                  icon={loading ? <ButtonBusyDots className="text-white" /> : null}
                >
                  {loading ? tx('changingPassword') : tx('changePassword')}
                </Button>
              </form>
            </Card.Content>
          </Card>
        </div>

        <Card className="mb-6">
          <Card.Content className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-800">{tx('yourWorkspaces')}</h2>
              <Button variant="secondary" type="button" onClick={() => navigate('/workspaces/new')}>
                {tx('workspaceAddShort')}
              </Button>
            </div>
            <div className="space-y-2">
              {(user?.companies || []).map((entry) => {
                const cid = membershipCompanyId(entry);
                if (!cid) return null;
                const label = companyNameFromMembership(entry) || cid;
                const isActive = String(user?.activeCompanyId || '') === String(cid);
                const canRen = workspaceRoleCanRename(entry);
                const canDel = workspaceIsOwner(entry);
                return (
                  <div
                    key={cid}
                    className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{label}</p>
                      {isActive && (
                        <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          {tx('workspaceActive')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canRen && (
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={wsLoading}
                          onClick={() => handleWorkspaceRenameOpen(entry)}
                        >
                          {tx('workspaceRenameAction')}
                        </Button>
                      )}
                      {canDel && (
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={wsLoading}
                          onClick={() => handleWorkspaceDelete(cid)}
                        >
                          {tx('workspaceDeleteAction')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>

        {wsRename && (
          <Modal isOpen={Boolean(wsRename)} onClose={() => !wsLoading && setWsRename(null)} size="md">
            <Modal.Header onClose={() => !wsLoading && setWsRename(null)}>{tx('workspaceRenameAction')}</Modal.Header>
            <Modal.Content>
              <Input
                label={i18nT(lang, 'workspaceNameLabel')}
                value={wsRenameDraft}
                onChange={(e) => setWsRenameDraft(e.target.value)}
                disabled={wsLoading}
              />
            </Modal.Content>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="outline" type="button" disabled={wsLoading} onClick={() => setWsRename(null)}>
                {tx('cancel')}
              </Button>
              <Button variant="primary" type="button" disabled={wsLoading} onClick={handleWorkspaceRenameSave}>
                {wsLoading ? <ButtonBusyDots className="text-white" /> : tx('workspaceSaveName')}
              </Button>
            </Modal.Footer>
          </Modal>
        )}

        {/* User Management (active company) */}
        {showTeamSection() && (
          <Card>
            <Card.Content className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{tx('userManagement')}</h2>
                </div>
                {canInviteUsersToCompany() && (
                  <Button
                    variant="secondary"
                    onClick={() => setOpenDialog(true)}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    }
                    className="w-full sm:w-auto"
                  >
                    {tx('addUser')}
                  </Button>
                )}
              </div>

              {users.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">{tx('noUsers')}</p>
                  {canInviteUsersToCompany() && (
                    <Button
                      variant="secondary"
                      onClick={() => setOpenDialog(true)}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      }
                    >
                      {tx('addUser')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {users.map((userItem) => (
                    <div
                      key={userItem._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 gap-3 sm:gap-0"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                          {userItem.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{userItem.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{userItem.title} • {userItem.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(memberRoleForRow(userItem))}`}>
                          {getRoleLabel(memberRoleForRow(userItem))}
                        </span>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleEditUser(userItem)}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={tx('editUser')}
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(userItem)}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={tx('deleteUser')}
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Add User Modal (company owner only — matches API) */}
        {canInviteUsersToCompany() && (
          <Modal isOpen={openDialog} onClose={() => setOpenDialog(false)}>
            <Formik
              enableReinitialize
              initialValues={{ name: '', title: '', email: '', role: defaultInviteRole }}
              validate={validateAddUserForm}
              validateOnChange={false}
              validateOnBlur
              onSubmit={async (values, { setStatus, resetForm, setSubmitting }) => {
                setStatus(undefined);
                setError('');
                setSuccess('');
                try {
                  await userAPI.addAccount(values);
                  setSuccess(tx('userAdded'));
                  resetForm();
                  setOpenDialog(false);
                  fetchUsers();
                } catch (err) {
                  setStatus(err.response?.data?.message || tx('userAddFailed'));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ status, isSubmitting }) => (
                <Form noValidate>
                  <Modal.Header>
                    <h2 className="text-2xl font-bold text-gray-800">{tx('addNewUser')}</h2>
                  </Modal.Header>
                  <Modal.Content>
                    {status && (
                      <div className="mb-4 rounded-app-input border border-app-error/35 bg-app-error/10 px-3 py-2.5 text-[13px] text-app-error">
                        {status}
                      </div>
                    )}
                    <div className="space-y-4">
                      <Field name="name">
                        {({ field, meta }) => (
                          <Input
                            {...field}
                            label={tx('name')}
                            required
                            error={meta.touched && meta.error ? meta.error : undefined}
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            }
                          />
                        )}
                      </Field>
                      <Field name="title">
                        {({ field, meta }) => (
                          <Input
                            {...field}
                            label={tx('title')}
                            required
                            error={meta.touched && meta.error ? meta.error : undefined}
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            }
                          />
                        )}
                      </Field>
                      <Field name="email">
                        {({ field, meta }) => (
                          <Input
                            {...field}
                            label={tx('email')}
                            type="email"
                            required
                            error={meta.touched && meta.error ? meta.error : undefined}
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            }
                          />
                        )}
                      </Field>
                      <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                        {tx('noPasswordNeeded')}
                      </p>
                      <Field name="role">
                        {({ field, form, meta }) => (
                          <RoleDragDropSelect
                            value={field.value}
                            onChange={(v) => form.setFieldValue('role', v)}
                            onBlur={field.onBlur}
                            label={tx('role')}
                            error={meta.touched && meta.error ? meta.error : undefined}
                            disabled={false}
                            labelForRole={labelAssignableRole}
                            hintDropZone={tx('roleDropZone')}
                            hintPool={tx('roleDragPool')}
                            emptySlotLabel={tx('roleEmptySlot')}
                            allowedRoles={rolesAssignableByInviter}
                          />
                        )}
                      </Field>
                    </div>
                  </Modal.Content>
                  <Modal.Footer>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpenDialog(false)}
                        fullWidth
                        className="sm:w-auto"
                      >
                        {tx('cancel')}
                      </Button>
                      <Button
                        type="submit"
                        variant="secondary"
                        disabled={isSubmitting}
                        icon={isSubmitting ? <ButtonBusyDots className="text-white" /> : null}
                        fullWidth
                        className="sm:w-auto"
                      >
                        {isSubmitting ? tx('adding') : tx('addUser')}
                      </Button>
                    </div>
                  </Modal.Footer>
                </Form>
              )}
            </Formik>
          </Modal>
        )}

        {/* Edit User Modal */}
        {showTeamSection() && editingUser && (
          <Modal
            isOpen={openEditDialog}
            onClose={() => {
              setOpenEditDialog(false);
              setEditingUser(null);
            }}
          >
            <Formik
              key={editingUser._id || editingUser.id}
              enableReinitialize
              initialValues={{
                name: editingUser.name || '',
                title: editingUser.title || '',
                email: editingUser.email || '',
                ...(cannotChangeCompanyRoleInEdit(editingUser)
                  ? {}
                  : { role: pickAssignableRoleForEdit(editingUser) }),
              }}
              validate={validateEditUserForm(cannotChangeCompanyRoleInEdit(editingUser))}
              validateOnChange={false}
              validateOnBlur
              onSubmit={async (values, { setStatus, setSubmitting }) => {
                setStatus(undefined);
                setError('');
                setSuccess('');
                const targetId = editingUser._id || editingUser.id;
                const roleLocked = cannotChangeCompanyRoleInEdit(editingUser);
                try {
                  const payload = {
                    name: values.name,
                    title: values.title,
                    email: values.email,
                  };
                  if (!roleLocked) payload.role = String(values.role || '').toLowerCase();
                  const res = await userAPI.updateUser(targetId, payload);
                  const updated = res?.data?.user;
                  const activeId = user?.activeCompanyId;
                  const appliedRole = payload.role
                    ? normalizeCompanyRole(payload.role)
                    : resolveCompanyMemberRole(updated || editingUser, activeId);
                  setUsers((prev) =>
                    prev.map((row) => {
                      const rid = String(row._id || row.id);
                      if (rid !== String(targetId)) return row;
                      const base = {
                        ...row,
                        ...(updated || {}),
                        name: payload.name ?? updated?.name ?? row.name,
                        title: payload.title ?? updated?.title ?? row.title,
                        email: payload.email ?? updated?.email ?? row.email,
                      };
                      return activeId
                        ? patchUserCompanyMembership(base, activeId, appliedRole)
                        : base;
                    })
                  );
                  setSuccess(tx('userUpdated'));
                  setOpenEditDialog(false);
                  if (String(targetId) === String(user?._id || user?.id)) {
                    const mergedUser = patchUserCompanyMembership(
                      { ...user, ...payload, ...(updated || {}) },
                      activeId,
                      appliedRole
                    );
                    setProfileData({
                      name: mergedUser.name || '',
                      title: mergedUser.title || '',
                      email: mergedUser.email || '',
                    });
                    updateUser(mergedUser);
                  }
                  setEditingUser(null);
                  await fetchUsers();
                } catch (err) {
                  setStatus(err.response?.data?.message || tx('userUpdateFailed'));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ status, isSubmitting }) => (
                <Form noValidate>
                  <Modal.Header>
                    <h2 className="text-2xl font-bold text-gray-800">{tx('editUser')}</h2>
                  </Modal.Header>
                  <Modal.Content>
                    {status && (
                      <div className="mb-4 rounded-app-input border border-app-error/35 bg-app-error/10 px-3 py-2.5 text-[13px] text-app-error">
                        {status}
                      </div>
                    )}
                    <div className="space-y-4">
                      <Field name="name">
                        {({ field, meta }) => (
                          <Input
                            {...field}
                            label={tx('name')}
                            required
                            error={meta.touched && meta.error ? meta.error : undefined}
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            }
                          />
                        )}
                      </Field>
                      <Field name="title">
                        {({ field, meta }) => (
                          <Input
                            {...field}
                            label={tx('title')}
                            required
                            error={meta.touched && meta.error ? meta.error : undefined}
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            }
                          />
                        )}
                      </Field>
                      <Field name="email">
                        {({ field, meta }) => (
                          <Input
                            {...field}
                            label={tx('email')}
                            type="email"
                            required
                            error={meta.touched && meta.error ? meta.error : undefined}
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            }
                          />
                        )}
                      </Field>
                      {cannotChangeCompanyRoleInEdit(editingUser) ? (
                        <RoleDragDropSelect
                          disabled
                          label={tx('role')}
                          disabledTitle={getRoleLabel(memberRoleForRow(editingUser))}
                          disabledHint={tx('roleSelfLockedHint')}
                        />
                      ) : (
                        <Field name="role">
                          {({ field, form, meta }) => (
                            <RoleDragDropSelect
                              value={field.value}
                              onChange={(v) => form.setFieldValue('role', v)}
                              onBlur={field.onBlur}
                              label={tx('role')}
                              error={meta.touched && meta.error ? meta.error : undefined}
                              disabled={false}
                              labelForRole={labelAssignableRole}
                              hintDropZone={tx('roleDropZone')}
                              hintPool={tx('roleDragPool')}
                              emptySlotLabel={tx('roleEmptySlot')}
                              allowedRoles={rolesAssignableByInviter}
                            />
                          )}
                        </Field>
                      )}
                    </div>
                  </Modal.Content>
                  <Modal.Footer>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setOpenEditDialog(false);
                          setEditingUser(null);
                        }}
                        fullWidth
                        className="sm:w-auto"
                      >
                        {tx('cancel')}
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting}
                        icon={isSubmitting ? <ButtonBusyDots className="text-white" /> : null}
                        fullWidth
                        className="sm:w-auto"
                      >
                        {isSubmitting ? tx('updating') : tx('updateUser')}
                      </Button>
                    </div>
                  </Modal.Footer>
                </Form>
              )}
            </Formik>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {showTeamSection() && (
          <Modal isOpen={deleteConfirmOpen} onClose={cancelDeleteUser} size="sm">
            <Modal.Header>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{tx('deleteUser')}</h2>
                  <p className="text-sm text-gray-600">{tx('cannotUndo')}</p>
                </div>
              </div>
            </Modal.Header>
            <Modal.Content>
              <div className="py-4">
                <p className="text-gray-700 mb-4">
                  {tx('confirmDeletePrompt')}
                </p>
                {userToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {userToDelete.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{userToDelete.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{userToDelete.title}</p>
                        <p className="text-sm text-gray-500 truncate">{userToDelete.email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(memberRoleForRow(userToDelete))}`}>
                        {getRoleLabel(memberRoleForRow(userToDelete))}
                      </span>
                    </div>
                  </div>
                )}
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <span className="font-semibold">{tx('warning')}</span> {tx('warningDeleteData')}
                  </p>
                </div>
              </div>
            </Modal.Content>
            <Modal.Footer>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelDeleteUser}
                  disabled={loading}
                  fullWidth
                  className="sm:w-auto"
                >
                  {tx('cancel')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={confirmDeleteUser}
                  disabled={loading}
                  icon={loading ? <ButtonBusyDots className="text-white" /> : null}
                  fullWidth
                  className="sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-500"
                >
                  {loading ? tx('deleting') : tx('deleteUser')}
                </Button>
              </div>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Settings;
