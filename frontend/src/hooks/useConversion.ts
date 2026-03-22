import { useState, useCallback } from 'react';
import { ConversionStatus, LogEntry } from '../types';
import { toast } from 'sonner';
import { NewTask } from '../../bindings/AI-ViewNote/backend/service/taskservice.js';

export function useConversion(addLog: (message: string, type?: LogEntry['type']) => void) {
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);

  const startConversion = useCallback((selectedFile: File, selectedFormats: Array<{ id: string; extension: string }>) => {
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

    const primaryFormat = selectedFormats[0];
    const fileWithPath = selectedFile as File & { path?: string };
    const filePath = (fileWithPath as any).path || selectedFile.name;
    // 映射前端格式ID到后端内容风格枚举值
    const formatToStyleMap: { [key: string]: string } = {
      'knowledge': 'note',
      'xiaohongshu': 'xiaohongshu',
      'mp': 'wechat',
      'summary': 'summary'
    };
    const contentStyle = formatToStyleMap[primaryFormat.id] || 'note';

    addLog(`开始转换: ${selectedFile.name}`, 'info');
    addLog(`输出格式: ${primaryFormat.extension.toUpperCase()}`, 'info');

    setConversionStatus('converting');
    setProgress(0);

    // 模拟前端进度条，在后端任务完成前推进到 95%
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        const next = prev + 5;
        if (next % 25 === 0) {
          addLog(`处理进度: ${next}%`, 'info');
        }
        return next;
      });
    }, 200);

    NewTask(filePath, contentStyle)
      .then((res: any) => {
        clearInterval(interval);

        if (res && res.success) {
          addLog(res.message || '任务创建成功', 'success');
          setProgress(100);
          setConversionStatus('completed');
          toast.success('转换任务已创建');
        } else {
          const msg = (res && res.message) || '任务创建失败';
          addLog(`错误: ${msg}`, 'error');
          toast.error(msg);
          setConversionStatus('idle');
          setProgress(0);
        }
      })
      .catch((err: unknown) => {
        clearInterval(interval);
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`错误: ${msg}`, 'error');
        toast.error('调用后端转换接口失败');
        setConversionStatus('idle');
        setProgress(0);
      });
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