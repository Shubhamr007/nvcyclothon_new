import { useState, useRef, useCallback, useEffect } from "react";
import { uploadImage, uploadMultipleImages, isCloudinaryConfigured } from "./cloudinary";

/**
 * React hook for uploading images directly to Cloudinary using unsigned upload.
 *
 * @param {Object} [defaultOptions] - Default upload options (folder, tags, etc.)
 * @returns {{
 *   upload: (file: File|Blob|string, options?: Object) => Promise<Object>,
 *   uploadMultiple: (files: FileList|File[], options?: Object) => Promise<Array<Object>>,
 *   isUploading: boolean,
 *   progress: number, // 0 to 100
 *   error: string | null,
 *   result: Object | null,
 *   results: Array<Object>,
 *   cancel: () => void,
 *   reset: () => void,
 *   isConfigured: boolean,
 * }}
 */
export function useCloudinaryUpload(defaultOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);

  const abortControllerRef = useRef(null);

  // Check if credentials exist
  const { configured: isConfigured } = isCloudinaryConfigured(defaultOptions);

  // Cancel any ongoing upload
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setProgress(0);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    cancel();
    setError(null);
    setResult(null);
    setResults([]);
    setProgress(0);
  }, [cancel]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Single file upload
  const upload = useCallback(
    async (file, options = {}) => {
      cancel();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const mergedOptions = {
          ...defaultOptions,
          ...options,
          signal: controller.signal,
          onProgress: (p) => {
            setProgress(p.percent);
            if (typeof options.onProgress === "function") {
              options.onProgress(p);
            }
          },
        };

        const res = await uploadImage(file, mergedOptions);
        setResult(res);
        setIsUploading(false);
        setProgress(100);
        return res;
      } catch (err) {
        if (err.name === "AbortError") {
          setIsUploading(false);
          return null;
        }
        const errorMsg = err.message || "Failed to upload image.";
        setError(errorMsg);
        setIsUploading(false);
        throw err;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [defaultOptions, cancel]
  );

  // Multiple files upload
  const uploadMultiple = useCallback(
    async (files, options = {}) => {
      cancel();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const mergedOptions = {
          ...defaultOptions,
          ...options,
          signal: controller.signal,
          onOverallProgress: (p) => {
            setProgress(p.percent);
            if (typeof options.onOverallProgress === "function") {
              options.onOverallProgress(p);
            }
          },
        };

        const resList = await uploadMultipleImages(files, mergedOptions);
        setResults(resList);
        setIsUploading(false);
        setProgress(100);
        return resList;
      } catch (err) {
        if (err.name === "AbortError") {
          setIsUploading(false);
          return [];
        }
        const errorMsg = err.message || "Failed to upload images.";
        setError(errorMsg);
        setIsUploading(false);
        throw err;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [defaultOptions, cancel]
  );

  return {
    upload,
    uploadMultiple,
    isUploading,
    progress,
    error,
    result,
    results,
    cancel,
    reset,
    isConfigured,
  };
}

export default useCloudinaryUpload;
