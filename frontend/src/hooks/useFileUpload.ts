import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { LogEntry } from '../types';

export function useFileUpload(addLog: (message: string, type?: LogEntry['type']) => void) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        addLog(`文件已选择: ${file.name}`, 'success');
        toast.success('文件已选择');
      } else {
        addLog('错误: 不支持的文件格式', 'error');
        toast.error('请选择视频文件');
      }
    }
  }, [addLog]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      addLog(`文件已选择: ${file.name}`, 'success');
      toast.success('文件已选择');
    }
  }, [addLog]);

  const resetFile = useCallback(() => {
    setSelectedFile(null);
    addLog('已重置文件选择', 'info');
  }, [addLog]);

  return {
    selectedFile,
    dragActive,
    handleDrag,
    handleDrop,
    handleFileSelect,
    resetFile
  };
}