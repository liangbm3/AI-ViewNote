import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <>
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '280px', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white border-r border-gray-200 flex flex-col overflow-hidden"
          >
            <div className="h-12 px-4 border-b border-gray-200 flex items-center justify-between">
              <span className="font-medium text-gray-900 text-sm">任务列表</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="w-7 h-7 p-0"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
              </Button>
            </div>

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

      {isCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-10 h-10 p-0 bg-white border-r border-gray-200 hover:bg-gray-50 rounded-none"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
        </Button>
      )}
    </>
  );
}