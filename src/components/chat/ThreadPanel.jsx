import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble from './MessageBubble';
import Spinner from '../ui/Spinner';

const ThreadPanel = ({ parentMessage, onClose }) => {
    const { user } = useAuth();
    const [threadReplies, setThreadReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        loadThreadReplies();
    }, [parentMessage._id]);

    useEffect(() => {
        scrollToBottom();
    }, [threadReplies]);

    const loadThreadReplies = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getThreadReplies(parentMessage._id);
            setThreadReplies(response.data.threadReplies || []);
        } catch (error) {
            console.error('Load thread replies error:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || sending) return;

        try {
            setSending(true);
            const response = await chatAPI.createThreadReply(parentMessage._id, replyText.trim());
            setThreadReplies(prev => [...prev, response.data.message]);
            setReplyText('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch (error) {
            console.error('Send thread reply error:', error);
            alert('Failed to send reply. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendReply(e);
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [replyText]);

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-secondary/5 to-secondary/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Thread</h2>
                            <p className="text-xs text-gray-500">{threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close thread"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Original Message */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {parentMessage.senderName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{parentMessage.senderName}</span>
                                <span className="text-xs text-gray-500">{formatTime(parentMessage.createdAt)}</span>
                            </div>
                            <div className="text-gray-700 whitespace-pre-wrap break-words">
                                {parentMessage.type === 'text'
                                    ? parentMessage.content
                                    : `[${parentMessage.type.charAt(0).toUpperCase() + parentMessage.type.slice(1)}]`
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thread Replies */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Spinner size="lg" color="secondary" />
                            <p className="mt-3 text-sm text-gray-500">Loading thread...</p>
                        </div>
                    ) : threadReplies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm font-medium">No replies yet</p>
                            <p className="text-xs text-gray-400 mt-1">Be the first to reply!</p>
                        </div>
                    ) : (
                        <>
                            {threadReplies.map((reply) => {
                                const isOwn = (reply.sender?._id?.toString() || reply.sender?.toString()) ===
                                    (user?._id?.toString() || user?.id?.toString());

                                return (
                                    <div key={reply._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
                                        <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                            <div className={`rounded-2xl px-4 py-2 ${isOwn
                                                    ? 'bg-gradient-to-br from-secondary to-secondary-700 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                <p className="whitespace-pre-wrap break-words">{reply.content}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                                                        {formatTime(reply.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Reply Input */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-end gap-2">
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Reply to thread..."
                                disabled={sending}
                                rows={1}
                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent resize-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                                style={{
                                    minHeight: '44px',
                                    maxHeight: '120px'
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!replyText.trim() || sending}
                            className="p-2.5 bg-secondary text-white rounded-xl hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex-shrink-0"
                            title="Send reply"
                        >
                            {sending ? (
                                <Spinner size="sm" color="white" />
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600">Enter</kbd> to send •
                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600 ml-1">Shift+Enter</kbd> for new line
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ThreadPanel;
