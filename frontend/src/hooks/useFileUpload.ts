import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Dialogs } from '@wailsio/runtime';
import { LogEntry, SelectedVideoFile } from '../types';
import { GetFileSize } from '../../bindings/AI-ViewNote/backend/service/taskservice.js';

function getFileNameFromPath(filePath: string): string {
  const segments = filePath.split(/[\\/]/);
  return segments[segments.length - 1] || filePath;
}

export function useFileUpload(addLog: (message: string, type?: LogEntry['type']) => void) {
  const [selectedFile, setSelectedFile] = useState<SelectedVideoFile | null>(null);
  const [dragActive] = useState(false);

  const selectVideoFromDialog = useCallback(async () => {
    try {
      const selectedPath = await Dialogs.OpenFile({
        Title: 'Select video file',
        CanChooseFiles: true,
        CanChooseDirectories: false,
        AllowsMultipleSelection: false,
        Filters: [
          { DisplayName: 'Video files', Pattern: '*.mp4;*.mov;*.avi;*.mkv;*.flv;*.wmv;*.m4v;*.webm' },
        ],
      });

      if (!selectedPath || Array.isArray(selectedPath)) {
        return;
      }

      let fileSize = 0;
      try {
        fileSize = await GetFileSize(selectedPath);
      } catch {
        fileSize = 0;
      }

      const pickedFile: SelectedVideoFile = {
        name: getFileNameFromPath(selectedPath),
        size: fileSize,
        path: selectedPath,
      };

      setSelectedFile(pickedFile);
      addLog(`File selected: ${pickedFile.name}`, 'success');
      toast.success('File selected');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addLog(`Error: failed to open file picker - ${msg}`, 'error');
      toast.error('Failed to open file picker');
    }
  }, [addLog]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addLog('Drag-and-drop upload is disabled. Please click to select a file.', 'info');
    toast.info('请点击选择文件');
  }, [addLog]);

  const handleFileSelect = useCallback(() => {
    void selectVideoFromDialog();
  }, [selectVideoFromDialog]);

  const resetFile = useCallback(() => {
    setSelectedFile(null);
    addLog('File selection has been reset', 'info');
  }, [addLog]);

  return {
    selectedFile,
    dragActive,
    handleDrag,
    handleDrop,
    handleFileSelect,
    resetFile,
  };
}