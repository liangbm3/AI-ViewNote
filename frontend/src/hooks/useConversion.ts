import { useState, useCallback } from 'react';
import { Task, ConversionStatus, LogEntry } from '../types';
import { toast } from 'sonner';

export function useConversion(addLog: (message: string, type?: LogEntry['type']) => void) {
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);

  const startConversion = useCallback((selectedFile: File, selectedFormats: Array<{id: string, extension: string}>) => {
    if (!selectedFile) {
      addLog('错误: 未选择文件', 'error');
      toast.error('请先选择文件');
      return;
    }

    if (selectedFormats.length === 0) {
      addLog('错误: 未选择输出格式', 'error');
      toast.error('请选择输出格式');
      return;
    }

    addLog(`开始转换: ${selectedFile.name}`, 'info');
    addLog(`输出格式: ${selectedFormats[0].extension.toUpperCase()}`, 'info');
    setConversionStatus('converting');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setConversionStatus('completed');
          addLog(`转换完成: ${selectedFile.name}`, 'success');
          toast.success('转换完成');
          return 100;
        }
        if (prev % 25 === 0) {
          addLog(`处理进度: ${prev}%`, 'info');
        }
        return prev + 2;
      });
    }, 80);
  }, [addLog]);

  const reset = useCallback(() => {
    setConversionStatus('idle');
    setProgress(0);
    addLog('已重置转换状态', 'info');
  }, [addLog]);

  const downloadFile = useCallback(() => {
    addLog('开始下载文件', 'success');
    toast.success('开始下载');
  }, [addLog]);

  return {
    conversionStatus,
    progress,
    startConversion,
    reset,
    downloadFile
  };
}