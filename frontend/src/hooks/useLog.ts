import { useState, useCallback } from 'react';
import { LogEntry } from '../types';

export function useLog() {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      message: '应用程序已启动',
      type: 'info',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
    },
    {
      id: '2',
      message: '等待用户操作...',
      type: 'info',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
    }
  ]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const getLogColor = useCallback((type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  }, []);

  return {
    logs,
    addLog,
    clearLogs,
    getLogColor
  };
}