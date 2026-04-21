import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import VoiceRecorder from './VoiceRecorder';

const MessageInput = ({
  onSend,
  onSendFile,
  disabled = false,
  replyTo = null,
  onCancelReply,
  editingMessage = null,
  onCancelEdit
}) => {
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textareaRef = useRef(null);
  const optionsRef = useRef(null);
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
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showOptions || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptions, showEmojiPicker]);

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

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
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
      alert(validations[type].message);
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
          alert('Video must be shorter than 5 minutes');
          setUploading(false);
          e.target.value = '';
          return;
        }

        await sendFile(type, file);
      };

      video.onerror = () => {
        alert('Failed to load video file');
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
      alert('Failed to send file. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVoiceRecorded = async (audioBlob) => {
    try {
      await onSendFile('voice', audioBlob);
    } catch (error) {
      console.error('Voice send error:', error);
      alert('Failed to send voice message. Please try again.');
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
    <div className="border-t border-gray-200 bg-white relative z-10 flex-shrink-0">
      {/* Context Banner (Reply/Edit) */}
      {(replyTo || editingMessage) && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between animate-slideUp">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-1 h-8 bg-secondary rounded-full flex-shrink-0"></div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-secondary truncate">
                {editingMessage ? 'Editing Message' : `Replying to ${replyTo.senderName || replyTo.sender?.name || 'User'}`}
              </span>
              <span className="text-sm text-gray-500 truncate">
                {editingMessage
                  ? editingMessage.content
                  : (replyTo.type === 'text' ? replyTo.content : `[${replyTo.type}]`)
                }
              </span>
            </div>
          </div>
          <button
            onClick={editingMessage ? onCancelEdit : onCancelReply}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
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
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-600 font-medium">
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
              onClick={() => setShowOptions(!showOptions)}
              disabled={disabled || uploading || recording || editingMessage}
              className={`p-2 sm:p-2.5 rounded-lg transition-all flex-shrink-0 ${showOptions
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-secondary'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Attach file"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* File Options Menu */}
            {showOptions && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 min-w-[160px] animate-slideUp">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      imageInputRef.current?.click();
                      setShowOptions(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      videoInputRef.current?.click();
                      setShowOptions(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowOptions(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-700">Document</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Emoji Button */}
          <div className="relative" ref={emojiRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 sm:p-2.5 text-gray-500 hover:bg-gray-100 hover:text-secondary rounded-lg transition-colors flex-shrink-0"
              disabled={disabled || uploading || recording}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-50">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={300}
                  height={400}
                  searchDisabled={false}
                />
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
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent resize-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              style={{
                minHeight: '44px',
                maxHeight: '120px'
              }}
            />

            {/* Character count (optional) */}
            {message.length > 500 && (
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {message.length}/1000
              </div>
            )}
          </div>

          {/* Voice Recorder or Send Button */}
          {message.trim() ? (
            <button
              type="submit"
              disabled={disabled || uploading}
              className="p-2 sm:p-2.5 bg-secondary text-white rounded-xl hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex-shrink-0"
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
            />
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        {message.length === 0 && !recording && (
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
            <span className="hidden sm:inline">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600">Enter</kbd> to send
            </span>
            <span className="hidden sm:inline">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600">Shift</kbd> +
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600 ml-1">Enter</kbd> for new line
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default MessageInput;