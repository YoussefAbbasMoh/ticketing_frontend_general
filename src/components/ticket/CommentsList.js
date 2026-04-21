import React, { useState, useEffect } from 'react';
import { ticketAPI, getImageUrl } from '../../services/api';
import Spinner from '../ui/Spinner';

const CommentsList = ({ ticketId, refreshTrigger }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    fetchComments();
  }, [ticketId, refreshTrigger]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketAPI.getTicketComments(ticketId);
      const commentsData = response.data.comments || response.data || [];
      
      // Normalize comments to handle both old comments and new replies
      const normalizedComments = commentsData.map((comment, idx) => {
        // Determine user name from various possible fields
        const userName = comment.userId?.name || comment.user || comment.name || 'Unknown User';
        
        return {
          ...comment,
          _id: comment._id || `comment-${idx}-${Date.now()}-${Math.random()}`,
          content: comment.comment || comment.content || '', // Backend uses 'comment', frontend expects 'content'
          name: userName,
          // Preserve userId if it's an object (populated), otherwise create user object
          user: comment.userId && typeof comment.userId === 'object' && comment.userId.name
            ? comment.userId 
            : { name: userName },
          userId: comment.userId || null,
          createdAt: comment.createdAt || comment.date || new Date(),
          images: Array.isArray(comment.images) ? comment.images : (comment.images ? [comment.images] : [])
        };
      });
      
      // Sort by date (oldest first)
      normalizedComments.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateA - dateB;
      });
      
      setComments(normalizedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (commentId, imageIndex) => {
    setImageErrors(prev => ({
      ...prev,
      [`${commentId}-${imageIndex}`]: true
    }));
  };

  const handleImageLoad = (commentId, imageIndex) => {
    // Remove error state if image loads successfully
    setImageErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${commentId}-${imageIndex}`];
      return newErrors;
    });
  };

  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;
    
    try {
      // If it's already a full URL
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }
      
      // If it's a blob URL
      if (imagePath.startsWith('blob:')) {
        return imagePath;
      }
      
      // Use the getImageUrl function
      const url = getImageUrl(imagePath);
      
      // Add cache buster for failed images
      return url;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else if (days === 0) {
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" color="secondary" />
        <p className="mt-3 text-sm text-gray-500">Loading comments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-red-800 font-medium">{error}</p>
            <button
              onClick={fetchComments}
              className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-gray-600 font-medium">No comments yet</p>
        <p className="text-sm text-gray-500 mt-1">Be the first to add a comment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Comments ({comments.length})
      </h3>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div 
            key={comment._id} 
            className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
          >
            {/* Comment Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(comment.user?.name || comment.userId?.name || comment.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {comment.user?.name || comment.userId?.name || comment.name || comment.user || 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(comment.createdAt || comment.date || new Date())}
                  </p>
                </div>
              </div>
            </div>

            {/* Comment Content */}
            <div className="ml-13 space-y-3">
              {(comment.content || comment.comment) && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {comment.content || comment.comment}
                </p>
              )}

              {/* Comment Images */}
              {comment.images && Array.isArray(comment.images) && comment.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {comment.images.map((image, index) => {
                    if (!image) return null;
                    const imageSrc = getImageSrc(image);
                    const errorKey = `${comment._id || index}-${index}`;
                    const hasError = imageErrors[errorKey];

                    if (!imageSrc) return null;

                    return (
                      <div 
                        key={index} 
                        className="relative aspect-square group"
                      >
                        {hasError ? (
                          <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-2">
                            <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-gray-500 text-center">Failed to load</p>
                            <button
                              onClick={() => {
                                setImageErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors[errorKey];
                                  return newErrors;
                                });
                              }}
                              className="mt-1 text-xs text-secondary hover:underline"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="w-full h-full cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 hover:border-secondary transition-all bg-gray-100"
                            onClick={() => setSelectedImage(imageSrc)}
                          >
                            <img
                              src={imageSrc}
                              alt={`Comment attachment ${index + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              loading="lazy"
                              onError={() => handleImageError(comment._id, index)}
                              onLoad={() => handleImageLoad(comment._id, index)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
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
              title="Close"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                console.error('Error loading full-size image');
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23ddd" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="20"%3EImage not available%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsList;