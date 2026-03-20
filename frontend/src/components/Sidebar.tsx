import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ListTodo } from 'lucide-react';
import { Task } from '../types';
import { Button } from './ui/Button';

interface SidebarProps {
  isCollapsed: boolean;
  tasks: Task[];
  onToggleCollapse: () => void;
  getStatusColor: (status: Task['status']) => string;
  getStatusText: (status: Task['status']) => string;
  onNewTask: () => void; // 新建任务回调
}

export function Sidebar({
  isCollapsed,
  tasks,
  onToggleCollapse,
  getStatusColor,
  getStatusText,
  onNewTask
}: SidebarProps) {
  return (
    <div className="relative h-full flex flex-shrink-0 z-10">
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '280px', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden"
          >
            {/* 新建任务按钮 */}
            <div className="p-3 border-b border-gray-200">
              <Button
                variant="primary"
                size="sm"
                onClick={onNewTask}
                className="w-full"
              >
                新建任务
              </Button>
            </div>

            <div className="h-12 px-4 border-b border-gray-200 flex items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-900 text-sm tracking-tight">任务列表</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-medium text-gray-900 truncate" title={task.fileName}>
                        {task.fileName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{task.timestamp}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </div>

                  {task.status === 'processing' && (
                    <div className="mb-2">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {task.formats.map((format, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮折叠/展开按钮 */}
      <div 
        className={`absolute top-1/2 -translate-y-1/2 z-50 transition-all duration-200 ${isCollapsed ? '-right-6' : '-right-3'}`}
      >
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 p-0 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
          aria-label={isCollapsed ? "展开任务列表" : "折叠任务列表"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
}