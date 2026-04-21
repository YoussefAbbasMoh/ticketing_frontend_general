import React, { useState, useRef, useEffect } from 'react';
import { getImageUrl } from '../../services/api';

const MessageBubble = ({ message, isOwn, onReply, onEdit, onDelete, onReact, onReplyInThread }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [imageError, setImageError] = useState(false);
  const audioRef = useRef(null);

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef(null);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculate smart positioning to keep menu visible
    const menuWidth = 180; // Approximate menu width
    const menuHeight = 200; // Approximate menu height
    const padding = 10;

    let x = e.pageX;
    let y = e.pageY;

    // Adjust if menu would go off right edge
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - padding;
    }

    // Adjust if menu would go off bottom edge
    if (y + menuHeight > window.innerHeight + window.scrollY) {
      y = window.innerHeight + window.scrollY - menuHeight - padding;
    }

    // Ensure minimum padding from edges
    x = Math.max(padding, x);
    y = Math.max(padding, y);

    setContextMenuPos({ x, y });
    setShowContextMenu(true);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatAudioTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio player controls
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const seekTime = (e.target.value / 100) * duration;
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const renderMessageContent = () => {
    // Pre-calculate URLs outside switch to avoid scoping issues
    const imageUrl = message.type === 'image' && message.fileUrl ? getImageUrl(message.fileUrl) : '';
    const videoUrl = message.type === 'video' && message.fileUrl ? getImageUrl(message.fileUrl) : '';
    const voiceUrl = message.type === 'voice' && message.fileUrl ? getImageUrl(message.fileUrl) : '';
    const fileUrl = message.type === 'file' && message.fileUrl ? getImageUrl(message.fileUrl) : '';

    switch (message.type) {
      case 'text':
        return (
          <p className={`whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-gray-800'}`}>
            {message.content}
          </p>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={message.fileName || 'Image'}
                className="max-w-xs md:max-w-md rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                onClick={() => window.open(imageUrl, '_blank')}
                onError={() => {
                  console.error('Image load error:', imageUrl);
                  setImageError(true);
                }}
                loading="lazy"
              />
            ) : (
              <div className="max-w-xs md:max-w-md rounded-lg bg-gray-100 p-8 flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Image unavailable</p>
              </div>
            )}
            {message.content && (
              <p className={`mt-2 ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                {message.content}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="max-w-xs md:max-w-md rounded-lg shadow-md"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="max-w-xs md:max-w-md rounded-lg bg-gray-100 p-8 flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Video unavailable</p>
              </div>
            )}
            {message.content && (
              <p className={`mt-2 ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                {message.content}
              </p>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="min-w-[180px] sm:min-w-[200px] max-w-xs">
            {/* Hidden audio element */}
            {voiceUrl ? (
              <audio
                ref={audioRef}
                src={voiceUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                preload="metadata"
                onError={(e) => {
                  console.error('Voice message load error:', voiceUrl, e);
                }}
              />
            ) : (
              <div className="text-xs text-red-500 p-2 mb-2">Voice message URL missing</div>
            )}

            {/* Custom audio player UI */}
            <div className={`flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-lg ${isOwn ? 'bg-white/10' : 'bg-gray-50'
              }`}>
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${isOwn
                  ? 'bg-white text-secondary hover:bg-white/90'
                  : 'bg-secondary text-white hover:bg-secondary-700'
                  }`}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Waveform/Progress */}
              <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={duration ? (currentTime / duration) * 100 : 0}
                  onChange={handleSeek}
                  className={`w-full h-1 sm:h-1.5 rounded-full appearance-none cursor-pointer ${isOwn
                    ? 'bg-white/30 [&::-webkit-slider-thumb]:bg-white'
                    : 'bg-gray-300 [&::-webkit-slider-thumb]:bg-secondary'
                    } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 sm:[&::-webkit-slider-thumb]:w-3 sm:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer`}
                />
                <div className="flex justify-between text-xs">
                  <span className={isOwn ? 'text-white/80' : 'text-gray-600'}>
                    {formatAudioTime(currentTime)}
                  </span>
                  <span className={isOwn ? 'text-white/80' : 'text-gray-600'}>
                    {formatAudioTime(duration || message.duration)}
                  </span>
                </div>
              </div>

              {/* Microphone Icon */}
              <div className="flex-shrink-0 hidden sm:block">
                <svg
                  className={`w-4 h-4 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
          </div>
        );

      case 'file':
        return (
          <div className={`flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-lg min-w-[180px] sm:min-w-[200px] max-w-xs ${isOwn ? 'bg-white/10' : 'bg-gray-50'
            }`}>
            <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${isOwn ? 'bg-white/20' : 'bg-secondary/10'
              }`}>
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 ${isOwn ? 'text-white' : 'text-secondary'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm sm:text-base font-medium truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                {message.fileName || 'File'}
              </p>
              <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                {formatFileSize(message.fileSize)}
              </p>
            </div>
            {fileUrl ? (
              <a
                href={fileUrl}
                download={message.fileName}
                className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-colors ${isOwn
                  ? 'hover:bg-white/20 text-white'
                  : 'hover:bg-gray-200 text-secondary'
                  }`}
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            ) : (
              <div className="text-xs text-red-500">URL missing</div>
            )}
          </div>
        );

      default:
        return (
          <p className={isOwn ? 'text-white' : 'text-gray-800'}>
            {message.content || 'Message'}
          </p>
        );
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 w-full px-1 group`}>
      <div className={`flex flex-col max-w-[85%] sm:max-w-md md:max-w-lg ${isOwn ? 'items-end' : 'items-start'}`}>


        {/* Reply Preview - Enhanced Thread UI */}
        {message.replyTo && (
          <div
            className={`mb-2 px-3 py-2 rounded-lg text-xs border-l-4 cursor-pointer transition-all hover:bg-opacity-90 ${isOwn
              ? 'bg-secondary/10 border-secondary-400 hover:bg-secondary/20'
              : 'bg-gray-100 border-gray-400 hover:bg-gray-200'
              } max-w-full`}
            onClick={(e) => {
              e.stopPropagation();
              // Scroll to the replied message
              const replyElement = document.getElementById(`message-${message.replyTo._id}`);
              if (replyElement) {
                replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight briefly
                replyElement.classList.add('ring-2', 'ring-secondary', 'ring-opacity-50');
                setTimeout(() => {
                  replyElement.classList.remove('ring-2', 'ring-secondary', 'ring-opacity-50');
                }, 2000);
              }
            }}
            title="Click to view original message"
          >
            <div className="flex items-start gap-2">
              <svg className="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-secondary truncate">
                  {message.replyTo.senderName || message.replyTo.sender?.name || 'User'}
                </div>
                <div className="text-gray-600 truncate mt-0.5">
                  {message.replyTo.type === 'text'
                    ? message.replyTo.content
                    : `[${message.replyTo.type.charAt(0).toUpperCase() + message.replyTo.type.slice(1)}]`
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Bubble Container with Context Menu Handler */}
        <div
          id={`message-${message._id}`}
          ref={bubbleRef}
          onContextMenu={handleContextMenu}
          className="relative transition-all duration-300"
        >
          <div
            className={`rounded-2xl ${message.type === 'text' ? 'px-3 sm:px-4 py-2' : 'p-2 sm:p-3'
              } ${isOwn
                ? 'bg-gradient-to-br from-secondary to-secondary-700 text-white shadow-md'
                : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
              } transition-all hover:shadow-lg`}
          >
            {renderMessageContent()}

            {/* Timestamp and Status */}
            <div className={`flex items-center gap-1 mt-1.5 ${message.type === 'text' ? '' : 'px-1'
              }`}>
              <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                {formatTime(message.createdAt)}
              </span>

              {message.isEdited && (
                <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                  (edited)
                </span>
              )}

              {/* Read receipts (for sent messages) */}
              {isOwn && (
                <span className="ml-1">
                  {message.readBy && message.readBy.some(r => r.user !== message.sender) ? (
                    // Double Check (Blue/White)
                    <svg className="w-3.5 h-3.5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 13l4 4L19 7" />
                      {/* Simple double check approximation or just keep generic check */}
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13l4 4L22 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              )}
            </div>
          </div>


          {/* Context Menu with Backdrop */}
          {showContextMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowContextMenu(false)}
              />

              {/* Menu */}
              <div
                className="fixed bg-white border-2 border-gray-300 rounded-xl shadow-2xl z-50 py-2 min-w-[160px] overflow-hidden"
                style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
              >
                <button
                  onClick={() => { onReply && onReply(); setShowContextMenu(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-secondary/10 text-sm text-gray-700 flex items-center gap-3 transition-colors"
                >
                  <span className="text-base">↩️</span>
                  <span className="font-medium">Reply</span>
                </button>
                <button
                  onClick={() => { onReplyInThread && onReplyInThread(); setShowContextMenu(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-secondary/10 text-sm text-gray-700 flex items-center gap-3 transition-colors"
                >
                  <span className="text-base">💬</span>
                  <span className="font-medium">Reply in Thread</span>
                </button>
                {isOwn && message.type === 'text' && (
                  <button
                    onClick={() => { onEdit && onEdit(); setShowContextMenu(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-secondary/10 text-sm text-gray-700 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-base">✏️</span>
                    <span className="font-medium">Edit</span>
                  </button>
                )}
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => { onReact && onReact(message, '👍'); setShowContextMenu(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-secondary/10 text-sm text-gray-700 flex items-center gap-3 transition-colors"
                >
                  <span className="text-base">👍</span>
                  <span className="font-medium">Like</span>
                </button>
                <button
                  onClick={() => { onReact && onReact(message, '❤️'); setShowContextMenu(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-secondary/10 text-sm text-gray-700 flex items-center gap-3 transition-colors"
                >
                  <span className="text-base">❤️</span>
                  <span className="font-medium">Love</span>
                </button>
                {isOwn && (
                  <>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => { onDelete && onDelete(); setShowContextMenu(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 flex items-center gap-3 transition-colors"
                    >
                      <span className="text-base">🗑️</span>
                      <span className="font-medium">Delete</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex -space-x-1 mt-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
            {message.reactions.map((r, i) => (
              <div key={i} className="bg-white border rounded-full px-1 text-xs shadow-sm flex items-center justify-center z-10" title={r.user?.name || 'User'}>
                {r.emoji}
              </div>
            ))}
          </div>
        )}

        {/* Thread Count Indicator */}
        {message.threadCount > 0 && (
          <button
            onClick={() => onReplyInThread && onReplyInThread()}
            className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:bg-secondary/10 ${isOwn ? 'ml-auto' : 'mr-auto'
              } text-secondary border border-secondary/30 hover:border-secondary/50`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{message.threadCount} {message.threadCount === 1 ? 'reply' : 'replies'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;