import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI, projectAPI, uploadAPI, getImageUrl, uploadTicketImagesViaBunny } from '../../services/api';
import { resolveProjectId } from '../../utils/resolveProjectId';
import { useBunnyUpload } from '../../hooks/useBunnyUpload';
import { useIsRtl } from '../../hooks/useIsRtl';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import { TicketEditorSkeleton, ButtonBusyDots } from '../ui/LoadingSkeletons';
import ReplyForm from './ReplyForm';
import CommentsList from './CommentsList';
import { getStoredLanguage } from '../../i18n';

const TEXT = {
  en: {
    maxImagesRemove: 'Maximum {{max}} images allowed. Please remove some images first.',
    pastedInvalidType: 'Pasted image is not a valid image type.',
    pastedTooLarge: 'Pasted image is too large. Maximum size is 5MB.',
    failedFetchTicket: 'Failed to fetch ticket details.',
    maxImages: 'Maximum {{max}} images allowed.',
    invalidImageType: 'Invalid image type.',
    imageTooLarge: 'Image too large. Max 5MB.',
    failedUploadImages: 'Failed to upload images.',
    failedUpdateTicket: 'Failed to update ticket.',
    loadingTicket: 'Loading ticket details...',
    ticketNotFound: 'Ticket not found',
    goHome: 'Go to Home',
    backToProject: 'Back to Project',
    editTicket: 'Edit Ticket',
    editSubtitle: 'Update ticket status, priority, and manage comments',
    ticketUpdatedRedirect: 'Ticket updated successfully! Redirecting...',
    tabDetails: 'Ticket Details',
    tabComments: 'Comments & Replies',
    ticketInfo: 'Ticket Information',
    ticketId: 'Ticket ID',
    from: 'From',
    to: 'To',
    description: 'Description',
    createdDate: 'Created Date',
    time: 'Time',
    currentPriority: 'Current Priority',
    updateFields: 'Update Fields',
    status: 'Status',
    priority: 'Priority',
    priorityOptional: 'Select priority (optional)',
    pAsap: 'As soon as possible',
    p12: '1-2 days',
    p35: 'Take your time 3-5 days',
    endDate: 'End Date',
    attachments: 'Attachments',
    addImages: 'Add Images',
    existing: 'Existing ({{count}})',
    new: 'New ({{count}})',
    removeImage: 'Remove image',
    noImages: 'No images attached',
    addImagesHint: 'Click "Add Images" or press',
    toPaste: 'to paste',
    ccRecipients: 'CC Recipients',
    addRecipient: 'Add recipient',
    selectToAdd: 'Select to add...',
    recipients: 'Recipients ({{count}})',
    remove: 'Remove',
    noRecipients: 'No recipients',
    addFromDropdown: 'Add from dropdown above',
    uploading: 'Uploading...',
    updating: 'Updating...',
    updated: 'Updated!',
    updateTicket: 'Update Ticket',
    cancel: 'Cancel',
    addReply: 'Add Reply',
    close: 'Close',
    fullSize: 'Full size',
    sOpen: 'Open',
    sInProgress: 'In Progress',
    sPending: 'Pending',
    sResolved: 'Resolved',
    sClosed: 'Closed'
  },
  ar: {
    maxImagesRemove: 'الحد الأقصى {{max}} صور. احذف بعض الصور أولًا.',
    pastedInvalidType: 'الصورة الملصقة ليست نوعًا صالحًا.',
    pastedTooLarge: 'الصورة الملصقة كبيرة جدًا. الحد الأقصى 5MB.',
    failedFetchTicket: 'فشل في جلب تفاصيل التذكرة.',
    maxImages: 'الحد الأقصى {{max}} صور.',
    invalidImageType: 'نوع الصورة غير صالح.',
    imageTooLarge: 'الصورة كبيرة جدًا. الحد الأقصى 5MB.',
    failedUploadImages: 'فشل رفع الصور.',
    failedUpdateTicket: 'فشل تحديث التذكرة.',
    loadingTicket: 'جارٍ تحميل تفاصيل التذكرة...',
    ticketNotFound: 'التذكرة غير موجودة',
    goHome: 'الذهاب للرئيسية',
    backToProject: 'العودة للمشروع',
    editTicket: 'تعديل التذكرة',
    editSubtitle: 'تحديث الحالة والأولوية وإدارة التعليقات',
    ticketUpdatedRedirect: 'تم تحديث التذكرة بنجاح! جاري التحويل...',
    tabDetails: 'تفاصيل التذكرة',
    tabComments: 'التعليقات والردود',
    ticketInfo: 'معلومات التذكرة',
    ticketId: 'رقم التذكرة',
    from: 'من',
    to: 'إلى',
    description: 'الوصف',
    createdDate: 'تاريخ الإنشاء',
    time: 'الوقت',
    currentPriority: 'الأولوية الحالية',
    updateFields: 'تحديث البيانات',
    status: 'الحالة',
    priority: 'الأولوية',
    priorityOptional: 'اختر الأولوية (اختياري)',
    pAsap: 'في أسرع وقت',
    p12: 'خلال 1-2 يوم',
    p35: 'على مهلك 3-5 أيام',
    endDate: 'تاريخ الانتهاء',
    attachments: 'المرفقات',
    addImages: 'إضافة صور',
    existing: 'الحالية ({{count}})',
    new: 'الجديدة ({{count}})',
    removeImage: 'حذف الصورة',
    noImages: 'لا توجد صور مرفقة',
    addImagesHint: 'اضغط "إضافة صور" أو',
    toPaste: 'للصق',
    ccRecipients: 'مستلمو النسخة',
    addRecipient: 'إضافة مستلم',
    selectToAdd: 'اختر للإضافة...',
    recipients: 'المستلمون ({{count}})',
    remove: 'إزالة',
    noRecipients: 'لا يوجد مستلمون',
    addFromDropdown: 'أضف من القائمة بالأعلى',
    uploading: 'جارٍ الرفع...',
    updating: 'جارٍ التحديث...',
    updated: 'تم التحديث!',
    updateTicket: 'تحديث التذكرة',
    cancel: 'إلغاء',
    addReply: 'إضافة رد',
    close: 'إغلاق',
    fullSize: 'الحجم الكامل',
    sOpen: 'مفتوحة',
    sInProgress: 'قيد التنفيذ',
    sPending: 'معلقة',
    sResolved: 'تم الحل',
    sClosed: 'مغلقة'
  }
};

const EditTicket = () => {
  const isRtl = useIsRtl();
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    status: '',
    end_date: '',
    cc: [],
    priority: '',
  });
  
  const [ticket, setTicket] = useState(null);
  const [linkedProjectId, setLinkedProjectId] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { uploadFile } = useBunnyUpload();
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'comments'
  const [lang, setLang] = useState(getStoredLanguage());
  const tx = (key, vars = {}) => {
    const template = TEXT[lang]?.[key] || TEXT.en[key] || key;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      template
    );
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = async (e) => {
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        const maxSize = 5 * 1024 * 1024;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxImages = 10;

        if (existingImages.length - imagesToDelete.length + images.length + imageFiles.length > maxImages) {
          setError(tx('maxImagesRemove', { max: maxImages }));
          return;
        }

        const validFiles = [];
        imageFiles.forEach(file => {
          if (!allowedTypes.includes(file.type)) {
            setError(tx('pastedInvalidType'));
            return;
          }
          if (file.size > maxSize) {
            setError(tx('pastedTooLarge'));
            return;
          }
          validFiles.push(file);
        });

        if (validFiles.length > 0) {
          const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
          setImages(prev => [...prev, ...validFiles]);
          setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
          setError('');
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [images, existingImages, imagesToDelete]);

  const fetchTicketDetails = async () => {
    try {
      setFetchingData(true);
      const response = await ticketAPI.getTicket(ticketId);
      const ticketData = response.data.ticket || response.data;
      setTicket(ticketData);
      const pid = resolveProjectId(ticketData.projectId ?? ticketData.project);
      setLinkedProjectId(pid);

      setFormData({
        status: ticketData.status || 'open',
        end_date: ticketData.end_date ? ticketData.end_date.split('T')[0] : '',
        cc: ticketData.cc || [],
        priority: ticketData.priority || '',
      });

      if (ticketData.images && Array.isArray(ticketData.images)) {
        setExistingImages(ticketData.images);
      }

      if (pid) {
        try {
          const projectResponse = await projectAPI.getProject(pid);
          const project = projectResponse.data.project || projectResponse.data;
          const assignedUsers = project?.assigned_users || [];
          setUsers(Array.isArray(assignedUsers) ? assignedUsers : []);
        } catch (userError) {
          console.error('Error fetching project users:', userError);
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      setError(tx('failedFetchTicket'));
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleCCAdd = (e) => {
    const selectedEmail = e.target.value;
    if (!selectedEmail || formData.cc.includes(selectedEmail)) {
      e.target.value = '';
      return;
    }
    setFormData(prev => ({ ...prev, cc: [...prev.cc, selectedEmail] }));
    e.target.value = '';
    setError('');
  };

  const handleCCRemove = (email) => {
    setFormData(prev => ({ ...prev, cc: prev.cc.filter(e => e !== email) }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxImages = 10;

    if (existingImages.length - imagesToDelete.length + images.length + files.length > maxImages) {
      setError(tx('maxImages', { max: maxImages }));
      e.target.value = '';
      return;
    }

    const validFiles = [];
    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(tx('invalidImageType'));
        return;
      }
      if (file.size > maxSize) {
        setError(tx('imageTooLarge'));
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...validFiles]);
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
      setError('');
    }
    e.target.value = '';
  };

  const handleImageRemove = (index) => {
    if (imagePreviewUrls[index]) {
      URL.revokeObjectURL(imagePreviewUrls[index]);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    if (selectedImage === imagePreviewUrls[index]) {
      setSelectedImage(null);
    }
  };

  const handleExistingImageRemove = (index) => {
    const imageToRemove = existingImages[index];
    const isStoredOnBackendDisk =
      imageToRemove &&
      typeof imageToRemove === 'string' &&
      !/^https?:\/\//i.test(imageToRemove) &&
      imageToRemove.includes('/uploads/tickets/');
    if (isStoredOnBackendDisk) {
      const filename = imageToRemove.split('/').pop();
      if (filename) {
        setImagesToDelete((prev) => [...prev, filename]);
      }
    }
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const currentUrls = imagePreviewUrls;
    return () => {
      currentUrls.forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (imagesToDelete.length > 0) {
        setUploadingImages(true);
        try {
          await Promise.all(imagesToDelete.map(filename => uploadAPI.deleteTicketImage(filename)));
        } catch (deleteError) {
          console.error('Error deleting images:', deleteError);
        } finally {
          setUploadingImages(false);
        }
      }

      let newImageUrls = [];
      if (images.length > 0) {
        setUploadingImages(true);
        try {
          newImageUrls = await uploadTicketImagesViaBunny(images, uploadFile);
          if (!Array.isArray(newImageUrls)) {
            newImageUrls = [];
          }
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          setError(tx('failedUploadImages'));
          setUploadingImages(false);
          setLoading(false);
          return;
        } finally {
          setUploadingImages(false);
        }
      }

      const allImageUrls = [...existingImages, ...newImageUrls];
      
      const ticketData = {
        status: formData.status,
        priority: formData.priority,
        end_date: formData.end_date,
        images: allImageUrls,
        cc: Array.isArray(formData.cc) ? formData.cc : [],
      };
      
      await ticketAPI.editTicket(ticketId, ticketData);
      
      setSuccess(true);
      setTimeout(() => {
        if (linkedProjectId) navigate(`/project/${linkedProjectId}`);
        else navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error updating ticket:', error);
      setError(error.response?.data?.message || tx('failedUpdateTicket'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'success';
      case 'in_progress': return 'warning';
      case 'pending': return 'warning';
      case 'resolved': return 'info';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'open': return '🟢';
      case 'in_progress': return '🟡';
      case 'pending': return '🟠';
      case 'resolved': return '🔵';
      case 'closed': return '⚫';
      default: return '⚪';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return tx('sOpen');
      case 'in_progress': return tx('sInProgress');
      case 'pending': return tx('sPending');
      case 'resolved': return tx('sResolved');
      case 'closed': return tx('sClosed');
      default: return status?.replace('_', ' ') || '';
    }
  };

  if (fetchingData) {
    return <TicketEditorSkeleton />;
  }

  if (!ticket) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <p className="text-red-600">{tx('ticketNotFound')}</p>
        <Button variant="primary" onClick={() => navigate('/')}>
          {tx('goHome')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => (linkedProjectId ? navigate(`/project/${linkedProjectId}`) : navigate('/'))}
            className="mb-4 text-gray-600 hover:text-secondary"
            icon={
              <svg
                className={`w-5 h-5 ${isRtl ? '-scale-x-100' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }
          >
            {tx('backToProject')}
          </Button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
                {tx('editTicket')}
              </h1>
              <p className="text-gray-600">
                {tx('editSubtitle')}
              </p>
            </div>
            <div className="hidden md:block">
              <Badge variant={getStatusColor(ticket.status)} size="lg">
                {getStatusIcon(ticket.status)} {getStatusLabel(ticket.status)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="error" onClose={() => setError('')} className="mb-6">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            {tx('ticketUpdatedRedirect')}
          </Alert>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'details'
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {tx('tabDetails')}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'comments'
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {tx('tabComments')}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - Ticket Info */}
              <div className="lg:col-span-2">
                <Card>
                  <Card.Header>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {tx('ticketInfo')}
                    </h2>
                  </Card.Header>
                  <Card.Content className="space-y-6">
                    {/* Ticket ID */}
                    <div className="p-4 bg-gradient-to-r from-secondary/10 to-purple/10 rounded-xl border border-secondary/20">
                      <p className="text-xs text-gray-600 mb-1 font-medium">{tx('ticketId')}</p>
                      <p className="text-2xl font-bold text-secondary">{ticket.ticket}</p>
                    </div>

                    {/* From/To Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <p className="text-xs text-gray-600 font-medium">{tx('from')}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{ticket.requested_from}</p>
                        <p className="text-xs text-gray-500 mt-1">{ticket.requested_from_email}</p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <p className="text-xs text-gray-600 font-medium">{tx('to')}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{ticket.requested_to}</p>
                        <p className="text-xs text-gray-500 mt-1">{ticket.requested_to_email}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        <p className="text-sm text-gray-600 font-medium">{tx('description')}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs text-gray-600 font-medium">{tx('createdDate')}</p>
                        </div>
                        <p className="text-sm text-gray-700">{ticket.date}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs text-gray-600 font-medium">{tx('time')}</p>
                        </div>
                        <p className="text-sm text-gray-700">{ticket.time}</p>
                      </div>
                    </div>

                    {/* Current Priority */}
                    {ticket.priority && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-gray-600 font-medium">{tx('currentPriority')}</p>
                        </div>
                        <Badge 
                          variant={
                            ticket.priority === 'as_soon_as_possible' ? 'error' :
                            ticket.priority === '1-2_days' ? 'warning' : 'success'
                          }
                          size="lg"
                        >
                          {ticket.priority === 'as_soon_as_possible' ? `🔴 ${tx('pAsap')}` :
                           ticket.priority === '1-2_days' ? `🟡 ${tx('p12')}` :
                           `🟢 ${tx('p35')}`}
                        </Badge>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-6"></div>

                    {/* Update Fields */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {tx('updateFields')}
                      </h3>

                      <div className="space-y-5">
                        {/* Status */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {tx('status')}<span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <select
                              name="status"
                              value={formData.status}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent hover:border-gray-400 transition-all appearance-none bg-white"
                            >
                              <option value="open">🟢 {tx('sOpen')}</option>
                              <option value="in_progress">🟡 {tx('sInProgress')}</option>
                              <option value="pending">🟠 {tx('sPending')}</option>
                              <option value="resolved">🔵 {tx('sResolved')}</option>
                              <option value="closed">⚫ {tx('sClosed')}</option>
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Priority */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {tx('priority')}
                          </label>
                          <div className="relative">
                            <select
                              name="priority"
                              value={formData.priority}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent hover:border-gray-400 transition-all appearance-none bg-white"
                            >
                              <option value="">{tx('priorityOptional')}</option>
                              <option value="as_soon_as_possible">🔴 {tx('pAsap')}</option>
                              <option value="1-2_days">🟡 {tx('p12')}</option>
                              <option value="take_your_time_3-5_days">🟢 {tx('p35')}</option>
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* End Date */}
                        <Input
                          label={tx('endDate')}
                          name="end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={handleChange}
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          }
                        />

                        {/* Images Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                              {tx('attachments')}
                            </label>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              {tx('addImages')}
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Image Grid */}
                          {(existingImages.length > 0 || images.length > 0) ? (
                            <div className="space-y-4">
                              {/* Existing Images */}
                              {existingImages.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-2 font-medium">{tx('existing', { count: existingImages.length })}</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {existingImages.map((imageUrl, index) => {
                                      const imageSrc = (typeof getImageUrl === 'function' ? getImageUrl(imageUrl) : imageUrl) || imageUrl;
                                      return (
                                        <div key={index} className="relative group">
                                          <div 
                                            className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 cursor-pointer hover:border-secondary transition-all shadow-sm hover:shadow-md"
                                            onClick={() => setSelectedImage(imageSrc)}
                                          >
                                            <img
                                              src={imageSrc}
                                              alt={`Existing ${index + 1}`}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                                              }}
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleExistingImageRemove(index);
                                            }}
                                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                                            title={tx('removeImage')}
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* New Images */}
                              {images.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-2 font-medium">{tx('new', { count: images.length })}</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {images.map((image, index) => (
                                      <div key={index} className="relative group">
                                        <div 
                                          className="aspect-square rounded-xl overflow-hidden border-2 border-green-200 bg-gray-100 cursor-pointer hover:border-green-400 transition-all shadow-sm hover:shadow-md"
                                          onClick={() => setSelectedImage(imagePreviewUrls[index])}
                                        >
                                          <img
                                            src={imagePreviewUrls[index]}
                                            alt={image.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleImageRemove(index);
                                          }}
                                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                                          title={tx('removeImage')}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                        <p className="mt-1 text-xs text-gray-500 truncate" title={image.name}>
                                          {image.name}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
                              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-sm text-gray-600 mb-1">{tx('noImages')}</p>
                              <p className="text-xs text-gray-500">
                                {tx('addImagesHint')} <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Ctrl+V</kbd> {tx('toPaste')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </div>

              {/* Sidebar - CC Management */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-6 space-y-6">
                  {/* CC Card */}
                  <Card>
                    <Card.Header>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {tx('ccRecipients')}
                      </h3>
                    </Card.Header>
                    <Card.Content className="space-y-4">
                      {/* Add CC Dropdown */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-2 font-medium">
                          {tx('addRecipient')}
                        </label>
                        <div className="relative">
                          <select
                            onChange={handleCCAdd}
                            disabled={users.length === 0}
                            className="w-full py-3 ps-4 pe-10 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent hover:border-gray-400 transition-all appearance-none bg-white bg-none disabled:bg-gray-100"
                            defaultValue=""
                          >
                            <option value="" disabled>{tx('selectToAdd')}</option>
                            {users
                              .filter(u => u.email && !formData.cc.includes(u.email))
                              .map((userItem) => (
                                <option key={userItem._id || userItem.email} value={userItem.email}>
                                  {userItem.name}
                                </option>
                              ))}
                          </select>
                          <svg
                            className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10l4 4 4-4" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* CC List */}
                      {formData.cc.length > 0 ? (
                        <div>
                          <p className="text-xs text-gray-600 mb-2 font-medium">
                            {tx('recipients', { count: formData.cc.length })}
                          </p>
                          <div className="space-y-2">
                            {formData.cc.map((email, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
                              >
                                <span className="text-xs text-green-900 flex-1 truncate font-medium" title={email}>
                                  {email}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCCRemove(email)}
                                  className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-colors flex-shrink-0"
                                  title={tx('remove')}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
                          <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs text-gray-600 font-medium">{tx('noRecipients')}</p>
                          <p className="text-xs text-gray-500 mt-1">{tx('addFromDropdown')}</p>
                        </div>
                      )}
                    </Card.Content>
                  </Card>

                  {/* Action Buttons */}
                  <Card>
                    <Card.Content className="space-y-3">
                      <Button
                        type="submit"
                        variant="secondary"
                        size="lg"
                        disabled={loading || success || uploadingImages}
                        className="w-full shadow-lg hover:shadow-xl"
                        icon={(loading || uploadingImages) ? <ButtonBusyDots className="text-white" /> : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      >
                        {(loading || uploadingImages) ? (uploadingImages ? tx('uploading') : tx('updating')) : success ? tx('updated') : tx('updateTicket')}
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => (linkedProjectId ? navigate(`/project/${linkedProjectId}`) : navigate('/'))}
                        disabled={loading}
                        className="w-full"
                      >
                        {tx('cancel')}
                      </Button>
                    </Card.Content>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* Comments Tab */
          <Card>
            <Card.Content className="p-6">
              <CommentsList 
                ticketId={ticketId} 
                refreshTrigger={refreshKey}
              />
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {tx('addReply')}
                </h3>
                <ReplyForm 
                  ticketId={ticketId}
                  onReplyAdded={() => {
                    setRefreshKey(prev => prev + 1);
                    // Small delay to ensure backend has processed the reply
                    setTimeout(() => {
                      fetchTicketDetails();
                    }, 500);
                  }}
                />
              </div>
            </Card.Content>
          </Card>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              title={tx('close')}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt={tx('fullSize')}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditTicket;