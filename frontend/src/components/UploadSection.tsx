import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileVideo, X, Film } from 'lucide-react';
import { Button } from './ui/Button';
import { formatFileSize } from '../utils/formatUtils';
import { SelectedVideoFile } from '../types';

interface UploadSectionProps {
  selectedFile: SelectedVideoFile | null;
  dragActive: boolean;
  conversionStatus: string;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: () => void;
  onReset: () => void;
}

export function UploadSection({
  selectedFile,
  dragActive,
  conversionStatus,
  onDrag,
  onDrop,
  onFileSelect,
  onReset
}: UploadSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
        <Film className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">视频上传</h2>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onFileSelect}
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-12 transition-all duration-200
                ${dragActive
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                </div>
                <p className="text-gray-900 font-medium mb-1">点击或拖拽上传视频</p>
                <p className="text-sm text-gray-400">支持 MP4, MOV, AVI, MKV</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <FileVideo className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              {conversionStatus === 'idle' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="w-8 h-8 p-0 flex-shrink-0 ml-3"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}