export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', { hour12: false });
};

export const formatProgress = (progress: number): string => {
  return `${Math.round(progress)}%`;
};