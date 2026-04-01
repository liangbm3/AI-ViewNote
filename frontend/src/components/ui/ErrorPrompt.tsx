import React from 'react';
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Task } from '../../types';
import { Button } from './Button';

interface ErrorPromptProps {
  task: Task;
  onRetry?: () => void;
  onBack?: () => void;
}

export function ErrorPrompt({ task, onRetry, onBack }: ErrorPromptProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full flex flex-col min-h-0 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-red-50/50 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">转换失败</h2>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              任务处理失败
            </h3>
            <p className="text-sm text-gray-600">
              很抱歉，处理文件 "{task.fileName}" 时出现了错误。
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h4 className="text-sm font-medium text-gray-900 mb-2">任务详情</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>文件名:</span>
                <span className="font-mono">{task.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span>时间:</span>
                <span>{task.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span>状态:</span>
                <span className="text-red-600">
                  {task.errorStage === 'ExtractingAudioFailed' ? '提取音频失败' :
                   task.errorStage === 'ExtractingTextFailed' ? '提取文本失败' :
                   task.errorStage === 'GeneratingMarkdownFailed' ? '生成Markdown失败' :
                   task.errorStage === 'InterruptedFailed' ? '任务中断失败' :
                   task.errorStage === 'ProcessingScreenshotsFailed' ? '处理截图失败' : '失败'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            {/* 重试按钮暂时隐藏
            {onRetry && (
              <Button
                variant="primary"
                size="sm"
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重试
              </Button>
            )} */}
            {onBack && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回列表
              </Button>
            )}
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p>请查看输出日志以获取更多信息。或在 Github issues 中报告问题。</p>
          </div>
        </div>
      </div>
    </div>
  );
}