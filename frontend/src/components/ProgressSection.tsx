import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConversionStatus } from '../types';

interface ProgressSectionProps {
  conversionStatus: ConversionStatus;
  progress: number;
}

export function ProgressSection({ conversionStatus, progress }: ProgressSectionProps) {
  return (
    <AnimatePresence>
      {conversionStatus !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">转换进度</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-700">
                {conversionStatus === 'converting' ? '正在转换...' : '转换完成'}
              </span>
              <span className="text-sm font-medium text-gray-900">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
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