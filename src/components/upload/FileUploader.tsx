import React, { DragEvent, useMemo, useState } from 'react';
import { useBunnyUpload } from '../../hooks/useBunnyUpload';
import type { UploadResult } from '../../types/upload';

type FileUploaderProps = {
  onUploadComplete: (result: UploadResult) => void;
  accept?: string;
  destinationPath?: string;
};

const isVideoByTypeOrName = (file: File): boolean => {
  if ((file.type || '').startsWith('video/')) return true;
  return /\.(mp4|webm|mov|mkv|avi|m4v|ogg)$/i.test(file.name);
};

const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  accept = 'image/*,video/*',
  destinationPath = 'uploads',
}) => {
  const { uploadFile, uploadVideo, uploading, progress, error, clearError } = useBunnyUpload();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsVideo, setPreviewIsVideo] = useState(false);

  const acceptedKindsText = useMemo(() => {
    if (accept.includes('image') && accept.includes('video')) return 'images or videos';
    if (accept.includes('video')) return 'videos';
    if (accept.includes('image')) return 'images';
    return 'files';
  }, [accept]);

  const uploadSelectedFile = async (file: File): Promise<void> => {
    try {
      clearError();

      // Route to Bunny Stream for videos, Bunny Storage for all other files.
      const result = isVideoByTypeOrName(file)
        ? await uploadVideo(file)
        : await uploadFile(file, destinationPath);

      setPreviewUrl(result.url);
      setPreviewIsVideo(result.isVideo);
      onUploadComplete(result);
    } catch {
      // Error state is already managed in useBunnyUpload.
    }
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadSelectedFile(file);
    event.target.value = '';
  };

  const onDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await uploadSelectedFile(file);
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag-and-drop + click zone for selecting local files. */}
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={[
          'flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50',
          uploading ? 'pointer-events-none opacity-70' : '',
        ].join(' ')}
      >
        <input
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={handleFileInput}
          className="hidden"
        />
        <p className="text-base font-semibold text-gray-800">Drag and drop {acceptedKindsText}</p>
        <p className="mt-1 text-sm text-gray-500">or click to browse your device</p>
      </label>

      {/* Upload progress shown while binary bytes are transferred. */}
      {uploading && (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">Uploading...</span>
            <span className="font-semibold text-gray-800">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Friendly server-side/client-side error output. */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success preview: image thumbnail or embedded Bunny video iframe. */}
      {previewUrl && (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="mb-2 text-sm font-medium text-gray-700">Uploaded preview</p>
          {previewIsVideo ? (
            <div className="aspect-video w-full overflow-hidden rounded-md border border-gray-200">
              <iframe
                src={previewUrl}
                title="Uploaded video"
                className="h-full w-full"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            </div>
          ) : (
            <img
              src={previewUrl}
              alt="Uploaded file preview"
              className="max-h-72 w-full rounded-md border border-gray-200 object-contain"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;

