// Fallback file handling utilities
// This provides simple base64 encoding as a fallback when Google Drive fails

// Convert file to base64 data URL
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Simple file validation
export const validateFile = (file, maxSize = 10 * 1024 * 1024) => {
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  return true;
};

// Generate a unique filename
export const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${random}.${extension}`;
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
