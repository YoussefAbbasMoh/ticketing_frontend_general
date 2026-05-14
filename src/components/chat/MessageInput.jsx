import React, { useState, useRef, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';

const EmojiPicker = lazy(() => import('emoji-picker-react'));
import VoiceRecorder from './VoiceRecorder';
import { useToast } from '../../contexts/ToastContext';

const MessageInput = ({
  onSend,
  onSendFile,
  disabled = false,
  replyTo = null,
  onCancelReply,
  editingMessage = null,
  onCancelEdit,
  attachmentsAllowed = true,
  onAttachmentsNotAllowed
}) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [attachMenuPosition, setAttachMenuPosition] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textareaRef = useRef(null);
  const optionsRef = useRef(null);
  const attachMenuRef = useRef(null);
  const emojiRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Handle editing message
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content || '');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else if (!replyTo) {
      // Only clear message if we are not replying (replying doesn't change text usually, unless we want to clear)
      // If we cancel edit, we want to clear message probably? 
      // Logic: specific to just editing mode switch.
      setMessage('');
    }
  }, [editingMessage]);

  // Close options/emoji when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current?.contains(event.target) || attachMenuRef.current?.contains(event.target)) {
        return;
      }
      setShowOptions(false);
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showOptions || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptions, showEmojiPicker]);

  useLayoutEffect(() => {
    if (!showOptions) {
      setAttachMenuPosition(null);
      return undefined;
    }
    const el = optionsRef.current;
    if (!el) return undefined;
    const updatePosition = () => {
      const r = el.getBoundingClientRect();
      const menuH = 200;
      let top = r.top - menuH - 8;
      if (top < 8) top = r.bottom + 8;
      let left = r.left;
      const menuW = 200;
      if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
      if (left < 8) left = 8;
      setAttachMenuPosition({ top, left });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showOptions]);

  useEffect(() => {
    if (!attachmentsAllowed) setShowOptions(false);
  }, [attachmentsAllowed]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled && !uploading) {
      onSend(message.trim());
      setMessage('');
      if (editingMessage && onCancelEdit) onCancelEdit();
      if (replyTo && onCancelReply) onCancelReply();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileSelect = async (type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!attachmentsAllowed) {
      e.target.value = '';
      onAttachmentsNotAllowed?.();
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast('File size must be less than 50MB', { severity: 'warning' });
      e.target.value = '';
      return;
    }

    // Validate file types
    const validations = {
      image: {
        types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        message: 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
      },
      video: {
        types: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
        message: 'Please select a valid video file (MP4, WebM, OGG, MOV)'
      }
    };

    if (validations[type] && !validations[type].types.includes(file.type)) {
      toast(validations[type].message, { severity: 'warning' });
      e.target.value = '';
      return;
    }

    // Validate video duration
    if (type === 'video') {
      setUploading(true);
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = async () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;

        if (duration > 300) { // 5 minutes max
          toast('Video must be shorter than 5 minutes', { severity: 'warning' });
          setUploading(false);
          e.target.value = '';
          return;
        }

        await sendFile(type, file);
      };

      video.onerror = () => {
        toast('Failed to load video file', { severity: 'error' });
        setUploading(false);
        e.target.value = '';
      };

      video.src = URL.createObjectURL(file);
    } else {
      await sendFile(type, file);
    }

    // Reset input
    e.target.value = '';
  };

  const sendFile = async (type, file) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress (replace with actual progress tracking)
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      await onSendFile(type, file);

      clearInterval(interval);
      setUploadProgress(100);

      // Reset after short delay
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('File upload error:', error);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVoiceRecorded = async (audioBlob) => {
    if (!attachmentsAllowed) {
      onAttachmentsNotAllowed?.();
      return;
    }
    try {
      await onSendFile('voice', audioBlob);
    } catch (error) {
      console.error('Voice send error:', error);
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative z-10 flex-shrink-0 border-t border-app-divider bg-app-surface shadow-[0_-4px_12px_rgba(8,9,54,0.08)]">
      {/* Context Banner (Reply/Edit) */}
      {(replyTo || editingMessage) && (
        <div className="flex animate-slideUp items-center justify-between border-b border-app-divider bg-app-background px-4 py-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-1 flex-shrink-0 rounded-full bg-orange"></div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-semibold text-orange">
                {editingMessage ? 'Editing Message' : `Replying to ${replyTo.senderName || replyTo.sender?.name || 'User'}`}
              </span>
              <span className="truncate text-sm text-app-text-secondary">
                {editingMessage
                  ? editingMessage.content
                  : (replyTo.type === 'text' ? replyTo.content : `[${replyTo.type}]`)
                }
              </span>
            </div>
          </div>
          <button
            onClick={editingMessage ? onCancelEdit : onCancelReply}
            className="rounded-full p-1 text-app-text-secondary transition-colors hover:bg-app-surface-variant"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-app-border">
                <div
                  className="h-full bg-orange transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium text-app-text-secondary">
              {uploadProgress}%
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3 sm:p-4">
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* File Options Button */}
          <div className="relative" ref={optionsRef}>
            <button
              type="button"
              onClick={() => {
                if (!attachmentsAllowed) {
                  onAttachmentsNotAllowed?.();
                  return;
                }
                setShowOptions(!showOptions);
              }}
              disabled={disabled || uploading || recording || editingMessage}
              className={`flex-shrink-0 rounded-lg p-2 transition-all sm:p-2.5 ${showOptions
                  ? 'bg-orange/10 text-orange'
                  : 'text-app-text-secondary hover:bg-app-surface-variant hover:text-orange'
                } disabled:cursor-not-allowed disabled:opacity-50 ${!attachmentsAllowed ? 'opacity-60' : ''}`}
              title={attachmentsAllowed ? 'Attach file' : 'File attachments require a paid plan'}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {showOptions && attachMenuPosition && typeof document !== 'undefined'
            ? createPortal(
                <div
                  ref={attachMenuRef}
                  role="menu"
                  className="fixed z-[10000] min-w-[180px] animate-slideUp rounded-app-input border border-app-divider bg-app-surface py-2 shadow-app-card"
                  style={{ top: attachMenuPosition.top, left: attachMenuPosition.left }}
                >
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        imageInputRef.current?.click();
                        setShowOptions(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-app-surface-variant"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange/10">
                        <svg className="h-5 w-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-app-text">Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        videoInputRef.current?.click();
                        setShowOptions(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-app-surface-variant"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-primary/10">
                        <svg className="h-5 w-5 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-app-text">Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowOptions(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-app-surface-variant"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-surface-variant">
                        <svg className="h-5 w-5 text-app-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-app-text">Document</span>
                    </button>
                  </div>
                </div>,
                document.body
              )
            : null}

          {/* Emoji Button */}
          <div className="relative" ref={emojiRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex-shrink-0 rounded-lg p-2 text-app-text-secondary transition-colors hover:bg-app-surface-variant hover:text-orange sm:p-2.5"
              disabled={disabled || uploading || recording}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 z-50 mb-2 h-[400px] w-[300px]">
                <Suspense
                  fallback={
                    <div
                      className="h-full w-full animate-pulse rounded-lg bg-app-surface-variant"
                      aria-hidden
                    />
                  }
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width={300}
                    height={400}
                    searchDisabled={false}
                  />
                </Suspense>
              </div>
            )}
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect('image', e)}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFileSelect('video', e)}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => handleFileSelect('file', e)}
            className="hidden"
          />

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={recording ? "Recording voice message..." : (editingMessage ? "Edit your message..." : "Type a message...")}
              disabled={disabled || uploading || recording}
              rows={1}
              className="w-full resize-none rounded-app-input border border-app-border bg-white px-3 py-2 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange disabled:cursor-not-allowed disabled:bg-app-background sm:px-4 sm:py-2.5 sm:text-base"
              style={{
                minHeight: '44px',
                maxHeight: '120px'
              }}
            />

            {/* Character count (optional) */}
            {message.length > 500 && (
              <div className="absolute bottom-1 right-2 text-xs text-app-text-tertiary">
                {message.length}/1000
              </div>
            )}
          </div>

          {/* Voice Recorder or Send Button */}
          {message.trim() ? (
            <button
              type="submit"
              disabled={disabled || uploading}
              className="flex-shrink-0 transform rounded-app-input bg-orange p-2 text-white shadow-app-soft transition-all hover:bg-orange-dark hover:shadow-app-card active:scale-95 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2.5"
              title={editingMessage ? "Save Changes" : "Send message"}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          ) : (
            <VoiceRecorder
              onRecorded={handleVoiceRecorded}
              recording={recording}
              setRecording={setRecording}
              disabled={disabled || uploading}
              recordingBlocked={!attachmentsAllowed}
              onRecordingBlocked={onAttachmentsNotAllowed}
            />
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        {message.length === 0 && !recording && (
          <div className="mt-2 flex items-center gap-4 text-xs text-app-text-tertiary">
            <span className="hidden sm:inline">
              <kbd className="rounded border border-app-border bg-app-surface-variant px-1.5 py-0.5 text-app-text-secondary">Enter</kbd> to send
            </span>
            <span className="hidden sm:inline">
              <kbd className="rounded border border-app-border bg-app-surface-variant px-1.5 py-0.5 text-app-text-secondary">Shift</kbd> +
              <kbd className="ml-1 rounded border border-app-border bg-app-surface-variant px-1.5 py-0.5 text-app-text-secondary">Enter</kbd> for new line
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default MessageInput;