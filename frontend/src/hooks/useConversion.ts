import { useState, useCallback } from 'react';
import { ConversionStatus, LogEntry, SelectedVideoFile } from '../types';
import { toast } from 'sonner';
import { NewTask } from '../../bindings/AI-ViewNote/backend/service/taskservice.js';

export function useConversion(addLog: (message: string, type?: LogEntry['type']) => void) {
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);

  const startConversion = useCallback((selectedFile: SelectedVideoFile, selectedFormats: Array<{ id: string; extension: string }>) => {
    if (!selectedFile) {
      addLog('错误: 未选择文件', 'error');
      toast.error('请先选择文件');
      return Promise.resolve(null);
    }

    if (!selectedFile.path) {
      addLog('错误: 未获取到文件绝对路径', 'error');
      toast.error('文件路径无效，请重新选择文件');
      return Promise.resolve(null);
    }

    if (selectedFormats.length === 0) {
      addLog('错误: 未选择输出格式', 'error');
      toast.error('请选择输出格式');
      return Promise.resolve(null);
    }

    const primaryFormat = selectedFormats[0];
    const filePath = selectedFile.path;
    const contentStyle = primaryFormat.id;

    addLog(`开始转换: ${selectedFile.name}`, 'info');
    addLog(`输出格式: ${primaryFormat.extension.toUpperCase()}`, 'info');

    setConversionStatus('converting');
    setProgress(0);

    return NewTask(filePath, contentStyle)
      .then((res: any) => {
        if (res && res.success) {
          addLog(res.message || '任务创建成功', 'success');
          toast.success('转换任务已创建');
          // 返回任务信息，供调用者使用
          return res.data;
        } else {
          const msg = (res && res.message) || '任务创建失败';
          addLog(`错误: ${msg}`, 'error');
          toast.error(msg);
          setConversionStatus('idle');
          setProgress(0);
          return null;
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`错误: ${msg}`, 'error');
        toast.error('调用后端转换接口失败');
        setConversionStatus('idle');
        setProgress(0);
        return null;
      });
  }, [addLog]);

  const reset = useCallback(() => {
    setConversionStatus('idle');
    setProgress(0);
    addLog('已重置转换状态', 'info');
  }, [addLog]);

  return {
    conversionStatus,
    progress,
    startConversion,
    reset
  };
}