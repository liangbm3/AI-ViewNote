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
  const [dragActive, setDragActive] = useState(false);

  const selectVideoFromDialog = useCallback(async () => {
    try {
      const selectedPath = await Dialogs.OpenFile({
        Title: '选择视频文件',
        CanChooseFiles: true,
        CanChooseDirectories: false,
        AllowsMultipleSelection: false,
        Filters: [
          { DisplayName: '视频文件', Pattern: '*.mp4;*.mov;*.avi;*.mkv;*.flv;*.wmv;*.m4v;*.webm' },
        ],
      });

      if (!selectedPath || Array.isArray(selectedPath)) {
        return;
      }

      const fileSize = await GetFileSize(selectedPath);
      const pickedFile: SelectedVideoFile = {
        name: getFileNameFromPath(selectedPath),
        size: fileSize,
        path: selectedPath,
      };

      setSelectedFile(pickedFile);
      addLog(`文件已选择: ${pickedFile.name}`, 'success');
      toast.success('文件已选择');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addLog(`错误: 打开文件选择器失败 - ${msg}`, 'error');
      toast.error('打开文件选择器失败');
    }
  }, [addLog]);

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
        const fileWithPath = file as File & { path?: string };
        if (fileWithPath.path) {
          setSelectedFile({ name: file.name, size: file.size, path: fileWithPath.path });
          addLog(`文件已选择: ${file.name}`, 'success');
          toast.success('文件已选择');
          return;
        }

        addLog('拖拽文件未携带完整路径，将打开系统文件选择器以确保可处理', 'warning');
        toast.warning('请在弹窗中重新确认视频文件');
        void selectVideoFromDialog();
      } else {
        addLog('错误: 不支持的文件格式', 'error');
        toast.error('请选择视频文件');
      }
    }
  }, [addLog, selectVideoFromDialog]);

  const handleFileSelect = useCallback(() => {
    void selectVideoFromDialog();
  }, [selectVideoFromDialog]);

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
