import { useState, useCallback, useEffect } from 'react';
import { LogEntry } from '../types';
import { Events } from '@wailsio/runtime';

type BackendLogMessage = {
  level: 'info' | 'warning' | 'error';
  message: string;
};

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

  let logIdCounter = 3; // 从3开始，避免与初始日志冲突

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${logIdCounter++}`,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  // 订阅后端log事件
  useEffect(() => {
    const handleBackendLog = (event: any) => {
      const backendLog = event?.data as BackendLogMessage;
      if (backendLog && backendLog.message) {
        // 映射后端日志级别到前端类型
        let frontendType: LogEntry['type'] = 'info';
        switch (backendLog.level) {
          case 'info':
            frontendType = 'info';
            break;
          case 'warning':
            frontendType = 'warning';
            break;
          case 'error':
            frontendType = 'error';
            break;
          default:
            frontendType = 'info';
        }

        addLog(backendLog.message, frontendType);
      }
    };

    // 监听后端log事件
    const off = Events.On('log', handleBackendLog);

    // 清理函数
    return () => {
      if (typeof off === 'function') {
        off();
      }
    };
  }, [addLog]);

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