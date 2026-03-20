import React, { useState } from 'react';
import { LogEntry } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LogPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  getLogColor: (type: LogEntry['type']) => string;
}

export function LogPanel({ logs, onClearLogs, getLogColor }: LogPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`bg-white border-t border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'h-10' : 'h-40'} overflow-hidden`}>
      <div className="h-10 px-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label={isCollapsed ? "展开日志" : "折叠日志"}
          >
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <span className="text-xs font-medium text-gray-700 select-none cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>输出日志</span>
        </div>
        <button
          onClick={onClearLogs}
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors px-2 py-1 hover:bg-gray-200 rounded"
        >
          清空
        </button>
      </div>
      
      <div className={`flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1 bg-gray-50/50 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
        {logs.length === 0 ? (
          <div className="text-gray-400 text-center mt-4">暂无日志输出</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3 hover:bg-gray-100/50 px-1 rounded transition-colors">
              <span className="text-gray-400 flex-shrink-0">[{log.timestamp}]</span>
              <span className={`${getLogColor(log.type)} break-all`}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}