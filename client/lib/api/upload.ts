import apiClient, { handleApiError } from './client';

// ============================================================
// UPLOAD API SERVICES
// ============================================================

export interface UploadUrlResponse {
  upload_url: string; // Presigned URL to PUT file (expires in 5 min)
  file_url: string;   // Permanent URL to save in database
  file_key: string;
}

export interface UploadFileInfo {
  size?: number;
  type?: string;
  last_modified?: string;
  exists: boolean;
}

/**
 * Generate presigned S3 upload URL
 */
export const generateUploadUrl = async (fileType: string): Promise<UploadUrlResponse> => {
  try {
    const response = await apiClient.post('/api/upload/generate-url', {
      file_type: fileType,
    });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Upload file to S3 using presigned URL
 */
export const uploadToS3 = async (
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(new Error('Failed to upload file to S3'));
    };

    xhr.onerror = () => {
      reject(new Error('Failed to upload file to S3'));
    };

    xhr.send(file);
  });
};

/**
 * Complete upload workflow: generate URL, upload file, return permanent URL
 */
export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const { upload_url, file_url } = await generateUploadUrl(file.type);
  await uploadToS3(file, upload_url, onProgress);
  return file_url;
};

/**
 * Get uploaded file metadata
 */
export const getUploadedFileInfo = async (
  fileKey: string
): Promise<UploadFileInfo> => {
  try {
    const response = await apiClient.get('/api/upload/file', {
      params: {
        file_key: fileKey,
      },
    });
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete uploaded file metadata/blob
 */
export const deleteUploadedFile = async (fileKey: string): Promise<void> => {
  try {
    await apiClient.delete('/api/upload/file', {
      params: {
        file_key: fileKey,
      },
    });
  } catch (error) {
    throw handleApiError(error);
  }
};
