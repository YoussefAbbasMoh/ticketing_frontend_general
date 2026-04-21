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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-slideUp overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-secondary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                New Conversation
              </h2>
              <p className="text-sm text-gray-500 mt-1">Select a user to start chatting</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
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
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            <div className="mt-2 text-xs text-gray-500">
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
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" color="secondary" />
              <p className="mt-3 text-sm text-gray-500">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              {searchQuery ? (
                <>
                  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="font-medium text-gray-600 mb-1">No users found</p>
                  <p className="text-sm text-gray-500">Try searching with a different keyword</p>
                </>
              ) : (
                <>
                  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="font-medium text-gray-600 mb-1">No users available</p>
                  <p className="text-sm text-gray-500">There are no users to start a conversation with</p>
                </>
              )}
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedUsers).map(([group, groupUsers]) => (
                <div key={group} className="mb-4">
                  {/* Group Header (only show if there are actual groups) */}
                  {Object.keys(groupedUsers).length > 1 && (
                    <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                        className="w-full p-3 hover:bg-gray-50 rounded-xl transition-all text-left flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-secondary-700 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          {user.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {user.name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          {user.title && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{user.title}</p>
                          )}
                        </div>

                        {/* Arrow Icon */}
                        <svg 
                          className="w-5 h-5 text-gray-400 group-hover:text-secondary transition-colors flex-shrink-0" 
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
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-600">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewConversationDialog;