import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity } from 'lucide-react';
import { ConversionStatus, Task } from '../types';

interface ProgressSectionProps {
  conversionStatus: ConversionStatus;
  progress: number;
  selectedTask?: Task | null;
}

export function ProgressSection({ conversionStatus, progress, selectedTask }: ProgressSectionProps) {
  return (
    <AnimatePresence>
      {conversionStatus !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">转换进度</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-700">
                {selectedTask ? getStatusText(selectedTask.status) : (conversionStatus === 'converting' ? '正在转换...' : '转换完成')}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {selectedTask ? selectedTask.progress : progress}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${selectedTask ? selectedTask.progress : progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gray-900 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getStatusText(status: Task['status']): string {
  switch (status) {
    case 'completed': return '转换完成';
    case 'processing': return '正在转换...';
    case 'error': return '转换失败';
    default: return '等待中';
  }
}