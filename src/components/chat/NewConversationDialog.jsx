import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/api';
import { useChat } from '../../contexts/ChatContext';
import Spinner from '../ui/Spinner';

const NewConversationDialog = ({ onClose, onSelect }) => {
  const { getOrCreateConversation } = useChat();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    loadUsers();
    // Auto-focus search input
    searchInputRef.current?.focus();

    // Handle escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Add a small delay to prevent immediate closing
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
    } catch (error) {
      console.error('Load users error:', error);
      setError('Failed to load users. Please try again.');
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
    } catch (error) {
      console.error('Create conversation error:', error);
      setError('Failed to create conversation. Please try again.');
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group users by role/department (if available)
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const group = user.role || user.department || 'Others';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(user);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div 
        ref={dialogRef}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-app-surface shadow-app-card animate-slideUp"
      >
        {/* Header */}
        <div className="border-b border-app-divider bg-gradient-to-r from-orange/5 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-app-text">
                <svg className="h-6 w-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                New Conversation
              </h2>
              <p className="mt-1 text-sm text-app-text-secondary">Select a user to start chatting</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-app-input p-2 transition-colors hover:bg-app-surface-variant"
              aria-label="Close dialog"
            >
              <svg className="h-6 w-6 text-app-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-app-divider bg-app-background p-4">
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-app-text-tertiary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, email, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-app-input border border-app-border bg-white py-2.5 pl-10 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 transform text-app-text-tertiary hover:text-app-text-secondary"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Results count */}
          {!loading && (
            <div className="mt-2 text-xs text-app-text-secondary">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} 
              {searchQuery && ' found'}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={loadUsers}
                className="text-xs text-red-600 hover:text-red-700 underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-app-border">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" color="primary" />
              <p className="mt-3 text-sm text-app-text-secondary">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-app-text-secondary">
              {searchQuery ? (
                <>
                  <svg className="mb-4 h-16 w-16 text-app-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="mb-1 font-medium text-app-text">No users found</p>
                  <p className="text-sm text-app-text-secondary">Try searching with a different keyword</p>
                </>
              ) : (
                <>
                  <svg className="mb-4 h-16 w-16 text-app-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="mb-1 font-medium text-app-text">No users available</p>
                  <p className="text-sm text-app-text-secondary">There are no users to start a conversation with</p>
                </>
              )}
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedUsers).map(([group, groupUsers]) => (
                <div key={group} className="mb-4">
                  {/* Group Header (only show if there are actual groups) */}
                  {Object.keys(groupedUsers).length > 1 && (
                    <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-app-text-tertiary">
                      {group}
                    </h3>
                  )}
                  
                  {/* Users in Group */}
                  <div className="space-y-1">
                    {groupUsers.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleSelectUser(user)}
                        disabled={creating}
                        className="group flex w-full items-center gap-3 rounded-app-input p-3 text-left transition-all hover:bg-app-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange to-orange-dark text-lg font-bold text-white shadow-app-soft transition-shadow group-hover:shadow-app-card">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          {user.isOnline && (
                            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-app-success"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="truncate font-semibold text-app-text">
                            {user.name || 'Unknown User'}
                          </h3>
                          <p className="truncate text-sm text-app-text-secondary">{user.email}</p>
                          {user.title && (
                            <p className="mt-0.5 truncate text-xs text-app-text-tertiary">{user.title}</p>
                          )}
                        </div>

                        {/* Arrow Icon */}
                        <svg 
                          className="h-5 w-5 flex-shrink-0 text-app-text-tertiary transition-colors group-hover:text-orange" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
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

        {/* Footer (optional - show keyboard shortcuts) */}
        <div className="border-t border-app-divider bg-app-background p-4">
          <p className="text-center text-xs text-app-text-secondary">
            Press <kbd className="rounded border border-app-border bg-app-surface px-2 py-1 text-app-text-secondary">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewConversationDialog;