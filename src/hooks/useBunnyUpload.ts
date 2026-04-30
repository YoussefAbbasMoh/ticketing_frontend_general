import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'heic', 'heif', 'webp']);

const readEnv = (key) => String(import.meta.env?.[key] || '').trim();
const sanitizeDestinationPath = (destinationPath = '') => {
  const trimmed = String(destinationPath || '').trim();
  return trimmed ? trimmed.replace(/^\/+|\/+$/g, '') : 'uploads';
};
const getFileExtension = (fileName) => (fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '');
const getEnvValue = (keys) => {
  for (const key of keys) {
    const direct = readEnv(key);
    if (direct) return direct;
    const vite = readEnv(key.startsWith('VITE_') ? key : `VITE_${key}`);
    if (vite) return vite;
  }
  return '';
};
const toBodyString = (rawData) => {
  if (rawData == null) return '';
  if (typeof rawData === 'string') return rawData;
  try { return JSON.stringify(rawData); } catch { return String(rawData); }
};
const extractErrorMessage = (rawData) => {
  const body = toBodyString(rawData);
  if (!body.trim()) return 'No error body returned';
  try {
    const decoded = JSON.parse(body);
    return String(decoded?.Message || decoded?.message || body);
  } catch {
    return body;
  }
};
const normalizeError = (error) => {
  const raw = String(error || '');
  return raw.startsWith('Exception: ') ? raw.slice(11) : raw;
};
const buildPublicStorageUrl = ({ storageZone, path, fileName }) => {
  const configuredPublicBase = getEnvValue(['BUNNY_STORAGE_PUBLIC_BASE_URL', 'BUNNY_PULL_ZONE_URL']);
  const base = configuredPublicBase || `https://${storageZone}.b-cdn.net`;
  return `${base.replace(/\/+$/g, '')}/${path}/${fileName}`;
};
const buildStorageUploadUrl = ({ host, storageZoneName, path, fileName }) => {
  const safeHost = String(host || 'storage.bunnycdn.com').trim();
  const encodedPath = String(path || '')
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const encodedFileName = encodeURIComponent(fileName);
  return `https://${safeHost}/${storageZoneName}/${encodedPath}/${encodedFileName}`;
};
const fileToWebP = async (file) => {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('Could not initialize image canvas context');
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob((result) => resolve(result), 'image/webp', 0.85));
  if (!blob) throw new Error('Failed to convert image to WebP');
  const baseName = file.name.replace(/\.[^/.]+$/, '') || `image-${Date.now()}`;
  return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
};

export const useBunnyUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const storageApiKey = useMemo(
    () => getEnvValue(['UPLOAD_IMAGES_AND_FILES_API_KEY', 'BUNNY_STORAGE_API_KEY', 'UPLOAD_IMAGES_AND_VIDEOS_API_KEY']),
    [],
  );
  const storageZone = useMemo(
    () => getEnvValue(['BUNNY_STORAGE_ZONE_NAME', 'BUNNY_STORAGE_ZONE']),
    [],
  );
  const storageHost = useMemo(
    () => getEnvValue(['BUNNY_STORAGE_HOST']) || 'storage.bunnycdn.com',
    [],
  );
  const streamApiKey = useMemo(
    () => getEnvValue(['BUNNY_STREAM_API_KEY', 'UPLOAD_VIDEOS_API_KEY']),
    [],
  );
  const streamLibraryId = useMemo(
    () => getEnvValue(['BUNNY_STREAM_LIBRARY_ID', 'BUNNY_STORAGE_ID']),
    [],
  );

  const setProgressFromEvent = useCallback((event) => {
    if (!event.total) return;
    const percentage = Math.round((event.loaded * 100) / event.total);
    setProgress(Math.min(100, Math.max(0, percentage)));
  }, []);

  const uploadFile = useCallback(
    async (file, destinationPath = 'uploads') => {
      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        if (!storageApiKey || !storageZone) {
          throw new Error(
            'Missing Bunny Storage environment variables (expected UPLOAD_IMAGES_AND_FILES_API_KEY/BUNNY_STORAGE_API_KEY and BUNNY_STORAGE_ZONE)',
          );
        }
        if (/^\d+$/.test(storageZone)) {
          throw new Error(
            'Bunny Storage zone must be the ZONE NAME (string), not numeric ID. Set VITE_BUNNY_STORAGE_ZONE_NAME.',
          );
        }

        const originalFileName = file.name;
        const extension = getFileExtension(originalFileName);
        const isImage = IMAGE_EXTENSIONS.has(extension);
        const isAlreadyWebp = extension === 'webp';

        let uploadTarget = file;
        // Convert images to WebP before uploading to reduce payload size.
        if (isImage && !isAlreadyWebp) {
          uploadTarget = await fileToWebP(file);
        }

        const uploadFileName = uploadTarget.name;
        const sanitizedPath = sanitizeDestinationPath(destinationPath);
        const uploadUrl = buildStorageUploadUrl({
          host: storageHost,
          storageZoneName: storageZone,
          path: sanitizedPath,
          fileName: uploadFileName,
        });

        const bytes = await uploadTarget.arrayBuffer();
        const response = await axios.put(uploadUrl, bytes, {
          headers: {
            AccessKey: storageApiKey,
            'Content-Type': 'application/octet-stream',
          },
          onUploadProgress: setProgressFromEvent,
          validateStatus: () => true,
          responseType: 'text',
        });

        if (response.status !== 201) {
          const errorMessage = extractErrorMessage(response.data);
          throw new Error(`Storage upload failed (${response.status}): ${errorMessage}`);
        }

        setProgress(100);
        return {
          url: buildPublicStorageUrl({
            storageZone,
            path: sanitizedPath,
            fileName: uploadFileName,
          }),
          fileName: originalFileName,
          isVideo: false,
        };
      } catch (err) {
        const axiosErr = err;
        const extracted = axios.isAxiosError(axiosErr)
          ? extractErrorMessage(axiosErr.response?.data)
          : normalizeError(err);
        const userMessage = `BunnyUpload: ${normalizeError(extracted || err)}`;
        setError(userMessage);
        throw new Error(userMessage);
      } finally {
        setUploading(false);
      }
    },
    [setProgressFromEvent, storageApiKey, storageHost, storageZone],
  );

  const uploadVideo = useCallback(
    async (file) => {
      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        if (!streamApiKey || !streamLibraryId) {
          throw new Error(
            'Missing Bunny Stream environment variables (expected UPLOAD_VIDEOS_API_KEY/BUNNY_STREAM_API_KEY and BUNNY_STORAGE_ID/BUNNY_STREAM_LIBRARY_ID)',
          );
        }

        const fileName = file.name;

        // Step 1: Create Bunny Stream video object and read GUID.
        const createResponse = await axios.post(
          `https://video.bunnycdn.com/library/${streamLibraryId}/videos`,
          { title: fileName },
          {
            headers: {
              AccessKey: streamApiKey,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            validateStatus: () => true,
            responseType: 'json',
          },
        );

        if (createResponse.status < 200 || createResponse.status >= 300) {
          const createError = extractErrorMessage(createResponse.data);
          throw new Error(`Video create failed (${createResponse.status}): ${createError}`);
        }

        const videoId = String(createResponse.data?.guid || '').trim();
        if (!videoId) throw new Error('Video create response missing guid');

        // Step 2: Upload video binary bytes to created GUID.
        const videoBytes = await file.arrayBuffer();
        const uploadResponse = await axios.put(
          `https://video.bunnycdn.com/library/${streamLibraryId}/videos/${videoId}`,
          videoBytes,
          {
            headers: {
              AccessKey: streamApiKey,
              Accept: 'application/json',
            },
            onUploadProgress: setProgressFromEvent,
            validateStatus: () => true,
            responseType: 'json',
          },
        );

        if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
          const uploadError = extractErrorMessage(uploadResponse.data);
          throw new Error(`Video binary upload failed (${uploadResponse.status}): ${uploadError}`);
        }

        setProgress(100);
        return {
          url: `https://iframe.mediadelivery.net/play/${streamLibraryId}/${videoId}`,
          fileName,
          isVideo: true,
          videoId,
        };
      } catch (err) {
        const axiosErr = err;
        const extracted = axios.isAxiosError(axiosErr)
          ? extractErrorMessage(axiosErr.response?.data)
          : normalizeError(err);
        const userMessage = `BunnyUpload: ${normalizeError(extracted || err)}`;
        setError(userMessage);
        throw new Error(userMessage);
      } finally {
        setUploading(false);
      }
    },
    [setProgressFromEvent, streamApiKey, streamLibraryId],
  );

  return {
    uploadFile,
    uploadVideo,
    uploading,
    progress,
    error,
    clearError: () => setError(null),
  };
};

