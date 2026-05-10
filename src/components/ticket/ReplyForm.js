import React, { useState } from 'react';
import { ticketAPI, uploadTicketImagesViaBunny } from '../../services/api';
import { useBunnyUpload } from '../../hooks/useBunnyUpload';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { ButtonBusyDots } from '../ui/LoadingSkeletons';

const ReplyForm = ({ ticketId, onReplyAdded }) => {
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { uploadFile } = useBunnyUpload();

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('Comment is required');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      let imageUrls = [];

      // Upload images if any
      if (images.length > 0) {
        setUploading(true);
        imageUrls = await uploadTicketImagesViaBunny(images, uploadFile);
        if (!Array.isArray(imageUrls)) {
          imageUrls = [];
        }
        setUploading(false);
      }

      // Add reply
      await ticketAPI.addReply(ticketId, {
        comment: comment.trim(),
        images: imageUrls.length > 0 ? imageUrls : undefined,
      });

      setSuccess(true);
      setComment('');
      setImages([]);
      
      if (onReplyAdded) {
        onReplyAdded();
      }

      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add reply. Please try again.');
      console.error('Reply error:', err);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Add Reply
      </h3>

      {error && (
        <div className="mb-4">
          <Alert variant="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert variant="success">
            Reply added successfully!
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Type your reply here..."
            rows={4}
            required
            className="w-full px-4 py-2.5 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent hover:border-gray-400 transition-all duration-200 resize-none"
          />
        </div>

        <div className="mb-4">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20"
          />
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((file, index) => (
                <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {file.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="secondary"
            disabled={submitting || uploading || !comment.trim()}
            icon={uploading || submitting ? <ButtonBusyDots className="text-white" /> : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          >
            {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Add Reply'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReplyForm;

