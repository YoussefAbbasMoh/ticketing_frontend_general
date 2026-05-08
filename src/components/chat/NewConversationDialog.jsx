import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import { getStoredLanguage } from '../../i18n';
import { ChatConversationListSkeleton } from '../ui/LoadingSkeletons';

const TEXT = {
  en: {
    title: 'New conversation',
    subtitle: 'Select a user to start chatting',
    closeDialog: 'Close dialog',
    searchPlaceholder: 'Search by name, email, or title…',
    clearSearch: 'Clear search',
    loadUsersError: 'Failed to load users. Please try again.',
    createConversationError: 'Failed to create conversation. Please try again.',
    tryAgain: 'Try again',
    loadingUsers: 'Loading users…',
    userSingular: 'user',
    usersPlural: 'users',
    found: 'found',
    noUsersFound: 'No users found',
    tryDifferentKeyword: 'Try searching with a different keyword',
    noUsersAvailable: 'No users available',
    noUsersToChat: 'There are no users to start a conversation with',
    unknownUser: 'Unknown user',
    othersGroup: 'Others',
    pressEscToCloseBefore: 'Press ',
    pressEscToCloseAfter: ' to close',
    escKey: 'Esc',
  },
  ar: {
    title: 'محادثة جديدة',
    subtitle: 'اختر مستخدمًا لبدء الدردشة',
    closeDialog: 'إغلاق النافذة',
    searchPlaceholder: 'ابحث بالاسم أو البريد أو المسمى الوظيفي…',
    clearSearch: 'مسح البحث',
    loadUsersError: 'تعذر تحميل المستخدمين. حاول مرة أخرى.',
    createConversationError: 'تعذر إنشاء المحادثة. حاول مرة أخرى.',
    tryAgain: 'إعادة المحاولة',
    loadingUsers: 'جارٍ تحميل المستخدمين…',
    userSingular: 'مستخدم',
    usersPlural: 'مستخدمين',
    found: 'تم العثور عليهم',
    noUsersFound: 'لا يوجد مستخدمون مطابقون',
    tryDifferentKeyword: 'جرّب كلمة بحث مختلفة',
    noUsersAvailable: 'لا يوجد مستخدمون متاحون',
    noUsersToChat: 'لا يوجد مستخدمون لبدء محادثة معهم',
    unknownUser: 'مستخدم غير معروف',
    othersGroup: 'آخرون',
    pressEscToCloseBefore: 'اضغط ',
    pressEscToCloseAfter: ' للإغلاق',
    escKey: 'Esc',
  },
};

const NewConversationDialog = ({ onClose, onSelect }) => {
  const { getOrCreateConversation } = useChat();
  const [lang, setLang] = useState(getStoredLanguage());
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);
  const dialogRef = useRef(null);

  const isRtl = String(lang || 'en').toLowerCase().startsWith('ar');

  const tx = (key, vars = {}) => {
    const template = TEXT[lang]?.[key] || TEXT.en[key] || key;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
      template
    );
  };

  const rtlMirror = isRtl ? '-scale-x-100' : '';

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  useEffect(() => {
    loadUsers();
    searchInputRef.current?.focus();

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatAPI.getUsers();
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Load users error:', err);
      setError(tx('loadUsersError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    if (creating) return;

    try {
      setCreating(true);
      const conversation = await getOrCreateConversation(user._id);
      onSelect(conversation);
      onClose();
    } catch (err) {
      console.error('Create conversation error:', err);
      setError(tx('createConversationError'));
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const group = user.role || user.department || tx('othersGroup');
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(user);
    return acc;
  }, {});

  const userCountLine = () => {
    const n = filteredUsers.length;
    const unit = n === 1 ? tx('userSingular') : tx('usersPlural');
    if (searchQuery) {
      return `${n} ${unit} ${tx('found')}`;
    }
    return `${n} ${unit}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={isRtl ? 'ar' : 'en'}
        className="animate-slideUp flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-app-surface font-cairo shadow-app-card"
      >
        <div
          className={`border-b border-app-divider p-6 ${
            isRtl ? 'bg-gradient-to-l from-orange/5 to-transparent' : 'bg-gradient-to-r from-orange/5 to-transparent'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-app-text">
                <svg
                  className={`h-6 w-6 shrink-0 text-orange ${rtlMirror}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {tx('title')}
              </h2>
              <p className="mt-1 text-sm text-app-text-secondary">{tx('subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-app-input p-2 transition-colors hover:bg-app-surface-variant"
              aria-label={tx('closeDialog')}
            >
              <svg className="h-6 w-6 text-app-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="border-b border-app-divider bg-app-background p-4">
          <div className="relative">
            <svg
              className={`pointer-events-none absolute start-3 top-1/2 z-0 h-5 w-5 -translate-y-1/2 text-app-text-tertiary ${rtlMirror}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={tx('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-app-input border border-app-border bg-white py-2.5 ps-10 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange ${
                searchQuery ? 'pe-11' : 'pe-4'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute end-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-app-input text-app-text-tertiary hover:bg-app-surface-variant hover:text-app-text-secondary"
                aria-label={tx('clearSearch')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {!loading && (
            <div className="mt-2 text-xs text-app-text-secondary">{userCountLine()}</div>
          )}
        </div>

        {error && (
          <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-red-800">{error}</p>
              <button
                type="button"
                onClick={loadUsers}
                className="mt-1 text-xs text-red-600 underline hover:text-red-700"
              >
                {tx('tryAgain')}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-app-border">
          {loading ? (
            <ChatConversationListSkeleton rows={6} />
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-app-text-secondary">
              {searchQuery ? (
                <>
                  <svg
                    className={`mb-4 h-16 w-16 text-app-border ${rtlMirror}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="mb-1 font-medium text-app-text">{tx('noUsersFound')}</p>
                  <p className="text-sm text-app-text-secondary">{tx('tryDifferentKeyword')}</p>
                </>
              ) : (
                <>
                  <svg className="mb-4 h-16 w-16 text-app-border" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="mb-1 font-medium text-app-text">{tx('noUsersAvailable')}</p>
                  <p className="text-sm text-app-text-secondary">{tx('noUsersToChat')}</p>
                </>
              )}
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedUsers).map(([group, groupUsers]) => (
                <div key={group} className="mb-4">
                  {Object.keys(groupedUsers).length > 1 && (
                    <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-app-text-tertiary">
                      {group}
                    </h3>
                  )}

                  <div className="space-y-1">
                    {groupUsers.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        disabled={creating}
                        className="group flex w-full items-center gap-3 rounded-app-input p-3 text-start transition-all hover:bg-app-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange to-orange-dark text-lg font-bold text-white shadow-app-soft transition-shadow group-hover:shadow-app-card">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          {user.isOnline && (
                            <div className="absolute bottom-0 end-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-app-success" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-app-text">
                            {user.name || tx('unknownUser')}
                          </h3>
                          <p className="truncate text-sm text-app-text-secondary">{user.email}</p>
                          {user.title && (
                            <p className="mt-0.5 truncate text-xs text-app-text-tertiary">{user.title}</p>
                          )}
                        </div>

                        <svg
                          className={`h-5 w-5 flex-shrink-0 text-app-text-tertiary transition-colors group-hover:text-orange ${rtlMirror}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-app-divider bg-app-background p-4">
          <p className="text-center text-xs text-app-text-secondary">
            {tx('pressEscToCloseBefore')}
            <kbd className="mx-1 rounded border border-app-border bg-app-surface px-2 py-1 font-cairo text-app-text-secondary">
              {tx('escKey')}
            </kbd>
            {tx('pressEscToCloseAfter')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewConversationDialog;
