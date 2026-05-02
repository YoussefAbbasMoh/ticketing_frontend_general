import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI, projectAPI, getImageUrl, uploadTicketImagesViaBunny } from '../../services/api';
import { useBunnyUpload } from '../../hooks/useBunnyUpload';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import { getStoredLanguage } from '../../i18n';

const TEXT = {
  en: {
    failedTeamMembers: 'Failed to fetch project team members.',
    maxImages: 'Maximum {{max}} images allowed. Please remove some images first.',
    invalidImageType: 'File {{name}} is not a valid image type. Please use JPEG, PNG, GIF, or WebP.',
    fileTooLarge: 'File {{name}} is too large. Maximum size is 5MB.',
    failedUploadImages: 'Failed to upload images. Please try again.',
    failedCreateTicket: 'Failed to create ticket. Please try again.',
    backToProject: 'Back to Project',
    createNewTicket: 'Create New Ticket',
    createTicketSubtitle: 'Fill in the details below to create a support ticket',
    ticketCreatedRedirecting: 'Ticket created successfully! Redirecting...',
    ticketDetails: 'Ticket Details',
    ticketIdAuto: 'Ticket ID (Auto-generated)',
    requestedFrom: 'Requested From',
    requestedFromEmail: 'Requested From Email',
    assignToProjectTeam: 'Assign To (Project Team)',
    loadingTeamMembers: 'Loading team members...',
    noTeamAssigned: 'No team members assigned',
    selectTeamMember: 'Select a team member...',
    noTeamMembersWarning: 'No team members assigned to this project. Please contact an admin to assign users.',
    assignedToEmail: 'Assigned To Email',
    autoFilledEmail: 'Auto-filled from assigned user',
    date: 'Date',
    time: 'Time',
    description: 'Description',
    descriptionPlaceholder: 'Provide a detailed description of the issue or request...',
    priority: 'Priority',
    priorityOptional: 'Select priority (optional)',
    pAsap: 'As soon as possible',
    p12: '1-2 days',
    p35: 'Take your time 3-5 days',
    imagesOptional: 'Images (Optional)',
    uploadingImages: 'Uploading images...',
    clickUploadImages: 'Click to upload images (Max 5MB each, up to 10 images)',
    removeImage: 'Remove image',
    imagesSelected: '{{count}} image{{s}} selected',
    ticketStatus: 'Ticket Status',
    sOpen: 'Open',
    sInProgress: 'In Progress',
    sPending: 'Pending',
    sResolved: 'Resolved',
    sClosed: 'Closed',
    supportHandlers: 'Support Handlers',
    addSupportHandlers: 'Add support handlers',
    loading: 'Loading...',
    noTeamMembers: 'No team members',
    selectHandlerToAdd: 'Select a handler to add...',
    selectedHandlers: 'Selected Handlers ({{count}})',
    removeHandler: 'Remove handler',
    ccEmails: 'CC Emails ({{count}})',
    noHandlersSelected: 'No handlers selected',
    useDropdownHandlers: 'Use dropdown above to add handlers',
    quickInfo: 'Quick Info',
    qi1: 'Notification email sent to contact address',
    qi2: "Handlers will be CC'd on all emails",
    qi3: 'Ticket ID is auto-generated',
    qi4: 'Add multiple handlers via dropdown',
    cancel: 'Cancel',
    creating: 'Creating...',
    created: 'Created!',
    createTicket: 'Create Ticket',
    close: 'Close',
    fullSize: 'Full size'
  },
  ar: {
    failedTeamMembers: 'فشل في جلب أعضاء فريق المشروع.',
    maxImages: 'الحد الأقصى {{max}} صور. احذف بعض الصور أولًا.',
    invalidImageType: 'الملف {{name}} ليس نوع صورة صالحًا. استخدم JPEG أو PNG أو GIF أو WebP.',
    fileTooLarge: 'الملف {{name}} كبير جدًا. الحد الأقصى 5MB.',
    failedUploadImages: 'فشل رفع الصور. حاول مرة أخرى.',
    failedCreateTicket: 'فشل إنشاء التذكرة. حاول مرة أخرى.',
    backToProject: 'العودة للمشروع',
    createNewTicket: 'إنشاء تذكرة جديدة',
    createTicketSubtitle: 'املأ البيانات التالية لإنشاء تذكرة دعم',
    ticketCreatedRedirecting: 'تم إنشاء التذكرة بنجاح! جاري التحويل...',
    ticketDetails: 'تفاصيل التذكرة',
    ticketIdAuto: 'رقم التذكرة (تلقائي)',
    requestedFrom: 'المرسل',
    requestedFromEmail: 'بريد المرسل',
    assignToProjectTeam: 'تعيين إلى (فريق المشروع)',
    loadingTeamMembers: 'جارٍ تحميل أعضاء الفريق...',
    noTeamAssigned: 'لا يوجد أعضاء بالفريق',
    selectTeamMember: 'اختر عضوًا من الفريق...',
    noTeamMembersWarning: 'لا يوجد أعضاء معينون لهذا المشروع. يرجى التواصل مع المدير لتعيين مستخدمين.',
    assignedToEmail: 'بريد المستقبل',
    autoFilledEmail: 'يتم تعبئته تلقائيًا من المستخدم المعين',
    date: 'التاريخ',
    time: 'الوقت',
    description: 'الوصف',
    descriptionPlaceholder: 'اكتب وصفًا تفصيليًا للمشكلة أو الطلب...',
    priority: 'الأولوية',
    priorityOptional: 'اختر الأولوية (اختياري)',
    pAsap: 'في أسرع وقت',
    p12: 'خلال 1-2 يوم',
    p35: 'على مهلك 3-5 أيام',
    imagesOptional: 'الصور (اختياري)',
    uploadingImages: 'جارٍ رفع الصور...',
    clickUploadImages: 'اضغط لرفع الصور (بحد أقصى 5MB للصورة، حتى 10 صور)',
    removeImage: 'حذف الصورة',
    imagesSelected: 'تم اختيار {{count}} صورة{{s}}',
    ticketStatus: 'حالة التذكرة',
    sOpen: 'مفتوحة',
    sInProgress: 'قيد التنفيذ',
    sPending: 'معلقة',
    sResolved: 'تم الحل',
    sClosed: 'مغلقة',
    supportHandlers: 'المعالجون',
    addSupportHandlers: 'إضافة معالجين',
    loading: 'جارٍ التحميل...',
    noTeamMembers: 'لا يوجد أعضاء',
    selectHandlerToAdd: 'اختر معالجًا للإضافة...',
    selectedHandlers: 'المعالجون المختارون ({{count}})',
    removeHandler: 'إزالة المعالج',
    ccEmails: 'بريد النسخة ({{count}})',
    noHandlersSelected: 'لا يوجد معالجون محددون',
    useDropdownHandlers: 'استخدم القائمة أعلاه لإضافة معالجين',
    quickInfo: 'معلومات سريعة',
    qi1: 'يتم إرسال إشعار بريدي لعنوان التواصل',
    qi2: 'سيتم إضافة المعالجين في نسخة جميع الرسائل',
    qi3: 'رقم التذكرة يتم توليده تلقائيًا',
    qi4: 'يمكن إضافة أكثر من معالج من القائمة',
    cancel: 'إلغاء',
    creating: 'جارٍ الإنشاء...',
    created: 'تم الإنشاء!',
    createTicket: 'إنشاء التذكرة',
    close: 'إغلاق',
    fullSize: 'الحجم الكامل'
  }
};

const NewTicket = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    ticket: '',
    requested_from: user?.name || '',
    requested_from_email: user?.email || '',
    requested_to: '',
    requested_to_email: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    description: '',
    handler: [],
    cc: [],
    status: 'open',
    priority: '',
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [images, setImages] = useState([]); // Array of File objects
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { uploadFile } = useBunnyUpload();
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]); // Object URLs for preview
  const [lang, setLang] = useState(getStoredLanguage());
  const tx = (key, vars = {}) => {
    const template = TEXT[lang]?.[key] || TEXT.en[key] || key;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      template
    );
  };

  useEffect(() => {
    fetchProjectUsers();
    generateTicketId();
  }, [projectId]);

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  const generateTicketId = async () => {
    try {
      // Fetch all tickets for this project to get the count
      const response = await ticketAPI.getMyTickets(projectId);
      const tickets = Array.isArray(response.data.tickets) ? response.data.tickets : [];
      const ticketCount = tickets.length + 1;
      
      // Generate ticket ID with leading zeros (e.g., TKT-001, TKT-002, etc.)
      const ticketId = `TKT-${String(ticketCount).padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, ticket: ticketId }));
    } catch (error) {
      console.error('Error generating ticket ID:', error);
      // Fallback to timestamp-based ID if fetching fails
      const timestamp = Date.now();
      const ticketId = `TKT-${timestamp}`;
      setFormData(prev => ({ ...prev, ticket: ticketId }));
    }
  };

  const fetchProjectUsers = async () => {
    try {
      setFetchingData(true);
      // Fetch project details to get assigned users
      const response = await projectAPI.getProject(projectId);
      const project = response.data.project;
      
      // Get assigned users from the project
      const assignedUsers = project?.assigned_users || [];
      
      // If assigned_users contains user objects, use them directly
      // If it contains user IDs, we might need to fetch full user details
      setUsers(Array.isArray(assignedUsers) ? assignedUsers : []);
    } catch (error) {
      console.error('Error fetching project users:', error);
      setError(tx('failedTeamMembers'));
      setUsers([]);
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Auto-fill requested_to_email when requested_to changes
    if (name === 'requested_to') {
      const selectedUser = users.find(u => u.name === value);
      if (selectedUser) {
        setFormData(prev => ({
          ...prev,
          requested_to: value,
          requested_to_email: selectedUser.email || '',
        }));
      }
    }
    
    setError('');
  };

  const handleHandlerAdd = (e) => {
    const selectedName = e.target.value;
    if (!selectedName) return;
    
    // Check if handler is already added
    if (formData.handler.includes(selectedName)) {
      e.target.value = '';
      return;
    }
    
    // Find the user and get their email
    const selectedUser = users.find(u => u.name === selectedName);
    const newHandlers = [...formData.handler, selectedName];
    const newCcEmails = selectedUser && selectedUser.email 
      ? [...formData.cc, selectedUser.email]
      : formData.cc;
    
    setFormData(prev => ({
      ...prev,
      handler: newHandlers,
      cc: newCcEmails,
    }));
    
    // Reset dropdown
    e.target.value = '';
    setError('');
  };

  const handleHandlerRemove = (handlerName) => {
    // Find the user's email to remove from CC
    const selectedUser = users.find(u => u.name === handlerName);
    const emailToRemove = selectedUser?.email;
    
    setFormData(prev => ({
      ...prev,
      handler: prev.handler.filter(h => h !== handlerName),
      cc: emailToRemove ? prev.cc.filter(email => email !== emailToRemove) : prev.cc,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxImages = 10;

    // Check total image count
    if (images.length + files.length > maxImages) {
      setError(tx('maxImages', { max: maxImages }));
      e.target.value = '';
      return;
    }

    const validFiles = [];
    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(tx('invalidImageType', { name: file.name }));
        return;
      }
      
      if (file.size > maxSize) {
        setError(tx('fileTooLarge', { name: file.name }));
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      // Create object URLs for preview
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...validFiles]);
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
      setError('');
    }

    // Reset input
    e.target.value = '';
  };

  const handleImageRemove = (index) => {
    // Revoke object URL to free memory
    if (imagePreviewUrls[index]) {
      URL.revokeObjectURL(imagePreviewUrls[index]);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    // Clear selected image if it was the removed one
    if (selectedImage === imagePreviewUrls[index]) {
      setSelectedImage(null);
    }
  };

  // Cleanup object URLs on unmount (safety net - individual URLs are cleaned up in handleImageRemove)
  useEffect(() => {
    const currentUrls = imagePreviewUrls;
    return () => {
      currentUrls.forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Upload images first if there are any
      let imageUrls = [];
      if (images.length > 0) {
        setUploadingImages(true);
        try {
          imageUrls = await uploadTicketImagesViaBunny(images, uploadFile);
          if (!Array.isArray(imageUrls)) {
            imageUrls = [];
          }
          console.log('Images uploaded successfully:', imageUrls);
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          setError(uploadError.response?.data?.message || tx('failedUploadImages'));
          setUploadingImages(false);
          setLoading(false);
          return;
        } finally {
          setUploadingImages(false);
        }
      }

      const ticketData = {
        ...formData,
        project: projectId,
        images: imageUrls, // Array of image URLs (strings)
      };

      console.log('Submitting ticket:', {
        ...ticketData,
        images: `${ticketData.images.length} image(s)`,
        hasImages: ticketData.images.length > 0,
      });
      
      await ticketAPI.addTicket(ticketData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/project/${projectId}`);
      }, 1500);
    } catch (error) {
      console.error('Error submitting ticket:', error);
      setError(error.response?.data?.message || tx('failedCreateTicket'));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/project/${projectId}`)}
            className="mb-6 text-gray-600 hover:text-primary"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }
          >
            {tx('backToProject')}
          </Button>

          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-secondary-700 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-secondary-700 bg-clip-text text-transparent">
                {tx('createNewTicket')}
              </h1>
              <p className="text-gray-600 mt-1">
                {tx('createTicketSubtitle')}
              </p>
            </div>
          </div>
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
            <Alert variant="success">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{tx('ticketCreatedRedirecting')}</span>
              </div>
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Ticket Information */}
            <div className="lg:col-span-2">
              <Card>
                <Card.Content className="p-6">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">{tx('ticketDetails')}</h2>
                  </div>

                  <div className="space-y-5">
                    {/* Ticket ID Display */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-secondary/5 to-secondary/10 border-2 border-secondary/20">
                      <p className="text-xs font-medium text-gray-600 mb-1">{tx('ticketIdAuto')}</p>
                      <p className="text-lg font-bold text-secondary">{formData.ticket}</p>
                    </div>

                    {/* Requested From Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        label={tx('requestedFrom')}
                        name="requested_from"
                        value={formData.requested_from}
                        onChange={handleChange}
                        required
                        disabled
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        }
                      />

                      <Input
                        label={tx('requestedFromEmail')}
                        name="requested_from_email"
                        type="email"
                        value={formData.requested_from_email}
                        onChange={handleChange}
                        required
                        disabled
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        }
                      />
                    </div>

                    {/* Assigned To Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Requested To */}
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {tx('assignToProjectTeam')}<span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            {fetchingData ? (
                              <Spinner size="sm" color="secondary" />
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            )}
                          </div>
                          <select
                            name="requested_to"
                            value={formData.requested_to}
                            onChange={handleChange}
                            required
                            disabled={fetchingData}
                            className="w-full pl-11 pr-4 py-2.5 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent hover:border-gray-400 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">
                              {fetchingData ? tx('loadingTeamMembers') : users.length === 0 ? tx('noTeamAssigned') : tx('selectTeamMember')}
                            </option>
                            {users.map((userItem) => (
                              <option key={userItem._id || userItem.name} value={userItem.name}>
                                {userItem.name}{userItem.email ? ` (${userItem.email})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        {users.length === 0 && !fetchingData && (
                          <p className="mt-1.5 text-xs text-amber-600">
                            ⚠️ {tx('noTeamMembersWarning')}
                          </p>
                        )}
                      </div>

                      {/* Assigned To Email */}
                      <Input
                        label={tx('assignedToEmail')}
                        name="requested_to_email"
                        type="email"
                        value={formData.requested_to_email}
                        onChange={handleChange}
                        disabled
                        required
                        placeholder={tx('autoFilledEmail')}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        }
                      />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        label={tx('date')}
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                        disabled
                        required
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        }
                      />

                      <Input
                        label={tx('time')}
                        name="time"
                        type="time"
                        value={formData.time}
                        onChange={handleChange}
                        disabled
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      />
                    </div>

                    {/* Description */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {tx('description')}<span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-4 text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                        </div>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          required
                          rows={6}
                          placeholder={tx('descriptionPlaceholder')}
                          className="w-full pl-11 pr-4 py-2.5 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent hover:border-gray-400 transition-all duration-200 resize-none"
                        />
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tx('priority')}
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-2.5 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent hover:border-gray-400 transition-all duration-200"
                        >
                          <option value="">{tx('priorityOptional')}</option>
                          <option value="as_soon_as_possible">🔴 {tx('pAsap')}</option>
                          <option value="1-2_days">🟡 {tx('p12')}</option>
                          <option value="take_your_time_3-5_days">🟢 {tx('p35')}</option>
                        </select>
                      </div>
                    </div>

                    {/* Images Upload */}
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tx('imagesOptional')}
                      </label>
                      <div className="space-y-3">
                        {/* File Input */}
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-secondary-400 hover:bg-gray-50 transition-all duration-200"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-gray-600 font-medium">
                              {uploadingImages ? tx('uploadingImages') : tx('clickUploadImages')}
                            </span>
                          </label>
                        </div>

                        {/* Image Previews */}
                        {images.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {images.map((image, index) => (
                              <div key={index} className="relative group">
                                <div 
                                  className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 cursor-pointer hover:border-secondary-400 transition-all"
                                  onClick={() => setSelectedImage(imagePreviewUrls[index])}
                                >
                                  <img
                                    src={imagePreviewUrls[index]}
                                    alt={image.name}
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
                                    handleImageRemove(index);
                                  }}
                                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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
                        )}
                      </div>
                      {images.length > 0 && (
                        <p className="mt-2 text-xs text-gray-500">
                          {tx('imagesSelected', { count: images.length, s: images.length !== 1 ? 's' : '' })}
                        </p>
                      )}
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Status Card */}
                <Card>
                  <Card.Content className="p-5">
                    <p className="text-sm font-medium text-gray-600 mb-3">{tx('ticketStatus')}</p>
                    <div className="w-full">
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent hover:border-gray-400 transition-all duration-200"
                      >
                        <option value="open">🟢 {tx('sOpen')}</option>
                        <option value="in_progress">🟡 {tx('sInProgress')}</option>
                        <option value="pending">🟠 {tx('sPending')}</option>
                        <option value="resolved">🔵 {tx('sResolved')}</option>
                        <option value="closed">⚫ {tx('sClosed')}</option>
                      </select>
                    </div>
                    <div className="mt-3">
                      {formData.status === 'open' && <Badge variant="success" className="w-full justify-center">{tx('sOpen')}</Badge>}
                      {formData.status === 'in_progress' && <Badge variant="warning" className="w-full justify-center">{tx('sInProgress')}</Badge>}
                      {formData.status === 'pending' && <Badge variant="orange" className="w-full justify-center">{tx('sPending')}</Badge>}
                      {formData.status === 'resolved' && <Badge variant="info" className="w-full justify-center">{tx('sResolved')}</Badge>}
                      {formData.status === 'closed' && <Badge variant="default" className="w-full justify-center">{tx('sClosed')}</Badge>}
                    </div>
                  </Card.Content>
                </Card>

                {/* Handler Card */}
                <Card>
                  <Card.Content className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-600">{tx('supportHandlers')}</p>
                    </div>
                    
                    {/* Add Handler Dropdown */}
                    <div className="w-full mb-3">
                      <label className="block text-xs text-gray-500 mb-2">
                        {tx('addSupportHandlers')}
                      </label>
                      <select
                        onChange={handleHandlerAdd}
                        disabled={fetchingData || users.length === 0}
                        className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent hover:border-gray-400 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          {fetchingData ? tx('loading') : users.length === 0 ? tx('noTeamMembers') : tx('selectHandlerToAdd')}
                        </option>
                        {users
                          .filter(u => !formData.handler.includes(u.name))
                          .map((userItem) => (
                            <option 
                              key={userItem._id || userItem.name} 
                              value={userItem.name}
                            >
                              {userItem.name}{userItem.email ? ` (${userItem.email})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    {/* Selected Handlers Display with Remove Buttons */}
                    {formData.handler.length > 0 ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-blue-900">
                              {tx('selectedHandlers', { count: formData.handler.length })}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {formData.handler.map((handlerName, index) => {
                              const handler = users.find(u => u.name === handlerName);
                              return (
                                <div
                                  key={index}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border-2 border-blue-300 shadow-sm group hover:border-blue-400 transition-all"
                                >
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                    {handlerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                  </div>
                                  <span className="text-xs font-medium text-gray-700">
                                    {handlerName}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleHandlerRemove(handlerName)}
                                    className="ml-1 w-4 h-4 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 hover:text-red-700 transition-colors"
                                    title={tx('removeHandler')}
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* CC Emails Display */}
                        {formData.cc.length > 0 && (
                          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                            <p className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {tx('ccEmails', { count: formData.cc.length })}
                            </p>
                            <div className="space-y-1">
                              {formData.cc.map((email, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs text-green-800 bg-white px-2 py-1 rounded">
                                  <span className="text-green-600">✓</span>
                                  <span className="font-medium">{email}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                        <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-xs text-gray-500">{tx('noHandlersSelected')}</p>
                        <p className="text-xs text-gray-400 mt-1">{tx('useDropdownHandlers')}</p>
                      </div>
                    )}
                  </Card.Content>
                </Card>

                {/* Quick Info */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-secondary/5 to-secondary/10 border-2 border-secondary/20">
                  <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>📋</span> {tx('quickInfo')}
                  </p>
                  <ul className="space-y-2">
                    <li className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>{tx('qi1')}</span>
                    </li>
                    <li className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>{tx('qi2')}</span>
                    </li>
                    <li className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>{tx('qi3')}</span>
                    </li>
                    <li className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>{tx('qi4')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:col-span-3">
              <Card>
                <Card.Content className="p-5">
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => navigate(`/project/${projectId}`)}
                      disabled={loading}
                      className="px-8"
                    >
                      {tx('cancel')}
                    </Button>
                    <Button
                      type="submit"
                      variant="secondary"
                      size="lg"
                      disabled={loading || success || uploadingImages}
                      className="px-8 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                      icon={(loading || uploadingImages) ? <Spinner size="sm" color="white" /> : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                      )}
                    >
                      {loading ? tx('creating') : success ? tx('created') : tx('createTicket')}
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            </div>
          </div>
        </form>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                title={tx('close')}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={selectedImage}
                alt={tx('fullSize')}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewTicket;
