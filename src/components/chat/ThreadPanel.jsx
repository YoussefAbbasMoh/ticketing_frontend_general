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
            <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-app-surface shadow-app-card">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-app-divider bg-gradient-to-r from-orange/5 to-orange/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange/15">
                            <svg className="h-5 w-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-app-text">Thread</h2>
                            <p className="text-xs text-app-text-secondary">{threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-app-input p-2 transition-colors hover:bg-app-surface-variant"
                        aria-label="Close thread"
                    >
                        <svg className="h-6 w-6 text-app-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Original Message */}
                <div className="border-b border-app-divider bg-app-background p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange to-orange-dark text-sm font-bold text-white">
                            {parentMessage.senderName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-semibold text-app-text">{parentMessage.senderName}</span>
                                <span className="text-xs text-app-text-secondary">{formatTime(parentMessage.createdAt)}</span>
                            </div>
                            <div className="whitespace-pre-wrap break-words text-app-text">
                                {parentMessage.type === 'text'
                                    ? parentMessage.content
                                    : `[${parentMessage.type.charAt(0).toUpperCase() + parentMessage.type.slice(1)}]`
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thread Replies */}
                <div className="flex-1 space-y-2 overflow-y-auto bg-app-surface p-4">
                    {loading ? (
                        <div className="flex h-full flex-col items-center justify-center">
                            <Spinner size="lg" color="primary" />
                            <p className="mt-3 text-sm text-app-text-secondary">Loading thread...</p>
                        </div>
                    ) : threadReplies.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-app-text-secondary">
                            <svg className="mb-3 h-16 w-16 text-app-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm font-medium">No replies yet</p>
                            <p className="mt-1 text-xs text-app-text-tertiary">Be the first to reply!</p>
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
                                                    ? 'bg-gradient-to-br from-orange to-orange-dark text-white'
                                                    : 'bg-app-surface-variant text-app-text'
                                                }`}>
                                                <p className="whitespace-pre-wrap break-words">{reply.content}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-app-text-secondary'}`}>
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
                <form onSubmit={handleSendReply} className="border-t border-app-divider bg-app-surface p-4">
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
                                className="w-full resize-none rounded-app-input border border-app-border bg-white px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange disabled:cursor-not-allowed disabled:bg-app-background"
                                style={{
                                    minHeight: '44px',
                                    maxHeight: '120px'
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!replyText.trim() || sending}
                            className="flex-shrink-0 transform rounded-app-input bg-orange p-2.5 text-white shadow-app-soft transition-all hover:bg-orange-dark hover:shadow-app-card active:scale-95 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <div className="mt-2 text-xs text-app-text-tertiary">
                        <kbd className="rounded border border-app-border bg-app-surface-variant px-1.5 py-0.5 text-app-text-secondary">Enter</kbd> to send •
                        <kbd className="ml-1 rounded border border-app-border bg-app-surface-variant px-1.5 py-0.5 text-app-text-secondary">Shift+Enter</kbd> for new line
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ThreadPanel;
