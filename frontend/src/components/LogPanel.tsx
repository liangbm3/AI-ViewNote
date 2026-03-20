import React from 'react';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  getLogColor: (type: LogEntry['type']) => string;
}

export function LogPanel({ logs, onClearLogs, getLogColor }: LogPanelProps) {
  return (
    <div className="h-40 bg-white border-t border-gray-200 flex flex-col">
      <div className="h-10 px-4 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">输出日志</span>
        <button
          onClick={onClearLogs}
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          清空
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1 bg-gray-50">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3">
            <span className="text-gray-400 flex-shrink-0">{log.timestamp}</span>
            <span className={getLogColor(log.type)}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}